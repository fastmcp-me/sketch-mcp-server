import express from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { SketchConfigAnalyzer } from '../../core/analyzer';
import { ToolManager } from '../../tools';
import { SseClient } from '../../core/types';
import { loadSketchConfigFromPath } from '../../core/file';

/**
 * HTTP服务器实现
 */
export class HttpServer {
  private app: express.Application;
  private analyzer: SketchConfigAnalyzer;
  private toolManager: ToolManager;
  private sseClients: Set<SseClient> = new Set();

  constructor() {
    this.app = express();
    this.analyzer = new SketchConfigAnalyzer();
    this.toolManager = new ToolManager(this.analyzer);
    this.setupMiddleware();
    this.setupRoutes();
    this.ensureUploadDir();
  }

  /**
   * 设置中间件
   */
  private setupMiddleware(): void {
    // 手动设置CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.static('public'));
  }

  /**
   * 设置路由
   */
  private setupRoutes(): void {
    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // 分析配置
    this.app.post('/analyze', async (req, res) => {
      try {
        const { config } = req.body;
        if (!config) {
          return res.status(400).json({ error: 'Missing config parameter' });
        }
        const result = this.analyzer.analyzeConfig(config);
        res.json(result);
      } catch (error) {
        res.status(500).json({ 
          error: error instanceof Error ? error.message : 'Internal server error' 
        });
      }
    });

    // 分析文件路径
    this.app.post('/analyze-path', async (req, res) => {
      try {
        const { path } = req.body;
        if (!path) {
          return res.status(400).json({ error: 'Missing path parameter' });
        }
        const config = await loadSketchConfigFromPath(path);
        const result = this.analyzer.analyzeConfig(config);
        res.json(result);
      } catch (error) {
        res.status(500).json({ 
          error: error instanceof Error ? error.message : 'Failed to analyze path' 
        });
      }
    });

    // 工具调用
    this.app.post('/tools/:toolName', async (req, res) => {
      try {
        const { toolName } = req.params;
        const args = req.body || {};
        const result = await this.toolManager.callTool(toolName, args);
        res.json(result);
      } catch (error) {
        res.status(500).json({ 
          error: error instanceof Error ? error.message : 'Tool execution failed' 
        });
      }
    });

    // 获取工具列表
    this.app.get('/tools', (req, res) => {
      const tools = this.toolManager.getToolDefinitions();
      res.json({ tools });
    });

    // 文件上传
    const storage = multer.diskStorage({
      destination: 'uploads/',
      filename: (req: express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        // 保留原始文件扩展名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
      }
    });
    
    const upload = multer({ 
      storage: storage,
      fileFilter: (req: express.Request, file: Express.Multer.File, cb: FileFilterCallback) => {
        if (file.originalname.endsWith('.sketch')) {
          cb(null, true);
        } else {
          cb(new Error('只支持 .sketch 文件'));
        }
      },
      limits: {
        fileSize: 100 * 1024 * 1024 // 100MB
      }
    });

    this.app.post('/upload', upload.single('file'), (req: express.Request, res: express.Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: '没有上传文件' });
        }

        const uploadedPath = req.file.path;
        const originalName = req.file.originalname;
        
        res.json({
          message: '文件上传成功',
          path: uploadedPath,
          originalName: originalName,
          size: req.file.size
        });
      } catch (error) {
        res.status(500).json({ 
          error: error instanceof Error ? error.message : '文件上传失败' 
        });
      }
    });

    // SSE事件流
    this.app.get('/events', (req, res) => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      const client: SseClient = {
        id: Date.now().toString(),
        response: res
      };

      this.sseClients.add(client);

      // 发送连接确认
      res.write(`data: ${JSON.stringify({ type: 'connected', clientId: client.id })}\n\n`);

      // 处理客户端断开连接
      req.on('close', () => {
        this.sseClients.delete(client);
      });
    });
  }

  /**
   * 广播事件到所有SSE客户端
   */
  private broadcastEvent(event: any): void {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of this.sseClients) {
      try {
        client.response.write(data);
      } catch (error) {
        // 移除无效的客户端连接
        this.sseClients.delete(client);
      }
    }
  }

  /**
   * 启动服务器
   */
  listen(port: number = 3000): void {
    this.app.listen(port, () => {
      console.log(`HTTP server running on port ${port}`);
      this.broadcastEvent({ 
        type: 'server_started', 
        port, 
        timestamp: new Date().toISOString() 
      });
    });
  }

  /**
   * 确保上传目录存在
   */
  private ensureUploadDir(): void {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  }

  /**
   * 获取Express应用实例
   */
  getApp(): express.Application {
    return this.app;
  }
}