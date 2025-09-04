import express from 'express'
import { HttpServer } from './server/http'
import { McpServer } from './server/mcp'
import { SketchConfigAnalyzer } from './core/analyzer'

// 创建服务器实例
const httpServer = new HttpServer()
const mcpServer = new McpServer()
const app = httpServer.getApp()
const port = process.env.PORT || 3000

// SSE 客户端管理
type SSEClient = { id: string; res: any }
const sseClients: SSEClient[] = []

const addSseClient = (id: string, res: any) => {
  sseClients.push({ id, res })
  console.log(`[SSE] Client ${id} connected. Total: ${sseClients.length}`)
}

const removeSseClient = (res: any) => {
  const index = sseClients.findIndex(client => client.res === res)
  if (index !== -1) {
    const client = sseClients[index]
    sseClients.splice(index, 1)
    console.log(`[SSE] Client ${client.id} disconnected. Total: ${sseClients.length}`)
  }
}

const broadcastSse = (payload: any) => {
  const data = JSON.stringify(payload)
  console.log(`[SSE] Broadcasting to ${sseClients.length} clients:`, data.slice(0, 200))
  
  sseClients.forEach(client => {
    try {
      client.res.write(`data: ${data}\n\n`)
    } catch (error) {
      console.error(`[SSE] Error sending to client ${client.id}:`, error)
      removeSseClient(client.res)
    }
  })
}

// 初始化分析器
const sketchConfigAnalyzer = new SketchConfigAnalyzer()
mcpServer.setAnalyzer(sketchConfigAnalyzer)

// MCP 健康检查端点
app.get('/mcp/health', (_req, res) => res.json({ ok: true }))

// SSE 流端点
app.get('/sse', (req, res) => {
  const clientId = req.query.id as string || `client-${Date.now()}`
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  })
  
  addSseClient(clientId, res)
  
  req.on('close', () => removeSseClient(res))
  req.on('end', () => removeSseClient(res))
})

// MCP JSON-RPC 端点
app.post('/mcp', async (req, res) => {
  try {
    const response = await mcpServer.handleRequest(req.body)
    res.json(response)
  } catch (error) {
    console.error('[MCP] Error handling request:', error)
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body?.id || null,
      error: {
        code: -32000,
        message: 'Internal server error'
      }
    })
  }
})

// SSE JSON-RPC POST: 接受 JSON-RPC 请求并通过 SSE 流推送响应
app.post('/sse', async (req, res) => {
  // 立即确认 HTTP 请求以防止客户端超时
  res.json({ ok: true })
  
  // 异步处理 JSON-RPC 请求并通过 SSE 广播
  setImmediate(async () => {
    try {
      const response = await mcpServer.handleRequest(req.body)
      broadcastSse(response)
    } catch (error) {
      console.error('[SSE] Error handling request:', error)
      broadcastSse({
        jsonrpc: '2.0',
        id: req.body?.id || null,
        error: {
          code: -32000,
          message: 'Internal server error'
        }
      })
    }
  })
})

// 启动服务器
app.listen(port, () => {
  console.log(`🚀 Sketch MCP Server running on port ${port}`)
  console.log(`📡 HTTP API: http://localhost:${port}`)
  console.log(`🔄 SSE Stream: http://localhost:${port}/sse`)
  console.log(`🔧 MCP Endpoint: http://localhost:${port}/mcp`)
})
