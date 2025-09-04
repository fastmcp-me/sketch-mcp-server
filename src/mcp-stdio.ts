#!/usr/bin/env node

import { McpServer } from './server/mcp/mcpServer';
import { SketchConfigAnalyzer } from './core/analyzer';
import { JsonRpcRequest, JsonRpcResponse } from './core/types';

/**
 * MCP stdio服务器入口
 * 用于Cursor和Trae等IDE的MCP集成
 */
class StdioMcpServer {
  private mcpServer: McpServer;
  private analyzer: SketchConfigAnalyzer;

  constructor() {
    this.analyzer = new SketchConfigAnalyzer();
    this.mcpServer = new McpServer();
    this.mcpServer.setAnalyzer(this.analyzer);
  }

  /**
   * 启动stdio服务器
   */
  start() {
    console.error('[MCP] Sketch MCP Server starting in stdio mode...');
    
    // 监听stdin输入
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', async (data: string) => {
      const lines = data.trim().split('\n');
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const request: JsonRpcRequest = JSON.parse(line);
            const response = await this.mcpServer.handleRequest(request);
            
            // 输出响应到stdout
            process.stdout.write(JSON.stringify(response) + '\n');
          } catch (error) {
            console.error('[MCP] Error processing request:', error);
            
            // 发送错误响应
            const errorResponse: JsonRpcResponse = {
              jsonrpc: '2.0',
              id: null,
              error: {
                code: -32700,
                message: 'Parse error',
                data: error instanceof Error ? error.message : 'Unknown error'
              }
            };
            
            process.stdout.write(JSON.stringify(errorResponse) + '\n');
          }
        }
      }
    });

    // 处理进程退出
    process.on('SIGINT', () => {
      console.error('[MCP] Server shutting down...');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.error('[MCP] Server shutting down...');
      process.exit(0);
    });

    // 保持进程运行
    process.stdin.resume();
    
    console.error('[MCP] Server ready and listening on stdio');
  }
}

// 如果直接运行此文件，启动服务器
if (require.main === module) {
  const server = new StdioMcpServer();
  server.start();
}

export { StdioMcpServer };