/**
 * 定义服务器相关的类型
 */

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: any;
  id?: string | number | null;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id?: string | number | null;
  result?: any;
  error?: { code: number; message: string; data?: any };
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: any;
}

export interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    required?: string[];
    properties: Record<string, any>;
  };
}

export interface SseClient {
  id: string;
  response: any; // Express Response object
}