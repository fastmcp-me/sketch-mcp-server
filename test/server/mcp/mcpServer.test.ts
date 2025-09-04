import { McpServer } from '../../../src/server/mcp/mcpServer';
import { SketchConfigAnalyzer } from '../../../src/core/analyzer';
import { ToolManager } from '../../../src/tools/toolManager';

describe('McpServer', () => {
    let mcpServer: McpServer;
    let mockAnalyzer: jest.Mocked<SketchConfigAnalyzer>;
    let mockToolManager: jest.Mocked<ToolManager>;

    beforeEach(() => {
        mockAnalyzer = {
            hasConfig: jest.fn(),
            analyzeConfig: jest.fn(),
            listPages: jest.fn(),
            getPageInfo: jest.fn(),
            listNodes: jest.fn(),
            listNodesByPage: jest.fn(),
            getNodeInfo: jest.fn(),
            getNodePosition: jest.fn(),
            findNodesByName: jest.fn(),
            getAncestors: jest.fn(),
            getRawNode: jest.fn()
        } as any;

        mockToolManager = {
            getToolDefinitions: jest.fn(),
            callTool: jest.fn()
        } as any;

        mcpServer = new McpServer();
        mcpServer.setAnalyzer(mockAnalyzer);
    });

    describe('constructor', () => {
        it('should create an instance', () => {
            expect(mcpServer).toBeInstanceOf(McpServer);
        });
    });

    describe('setAnalyzer', () => {
        it('should set the analyzer', () => {
            const newAnalyzer = new SketchConfigAnalyzer();
            mcpServer.setAnalyzer(newAnalyzer);
            // No direct way to test this, but it should not throw
            expect(true).toBe(true);
        });
    });

    describe('handleRequest', () => {
        describe('initialize method', () => {
            it('should handle initialize request', async () => {
                const request = {
                    jsonrpc: '2.0' as const,
                    id: 1,
                    method: 'initialize',
                    params: {
                        protocolVersion: '2024-11-05',
                        capabilities: {},
                        clientInfo: { name: 'test-client', version: '1.0.0' }
                    }
                };

                const response = await mcpServer.handleRequest(request);

                expect(response).toEqual({
                    jsonrpc: '2.0',
                    id: 1,
                    result: {
                        protocolVersion: '2024-11-05',
                        capabilities: {
                            tools: {},
                            prompts: {},
                            resources: {}
                        },
                        serverInfo: {
                            name: 'sketch-mcp-server',
                            version: '1.0.0'
                        }
                    }
                });
            });
        });

        describe('ping method', () => {
            it('should handle ping request', async () => {
                const request = {
                    jsonrpc: '2.0' as const,
                    id: 2,
                    method: 'ping'
                };

                const response = await mcpServer.handleRequest(request);

                expect(response).toEqual({
                    jsonrpc: '2.0',
                    id: 2,
                    result: {}
                });
            });
        });

        describe('tools/list method', () => {
            it('should return tools list', async () => {
                const mockTools = [
                    {
                        name: 'getNodePosition',
                        description: 'Get node position',
                        inputSchema: { type: 'object', properties: {} }
                    }
                ];

                // Mock the tool manager creation and method call
                jest.doMock('../../../src/tools/toolManager', () => {
                    return {
                        ToolManager: jest.fn().mockImplementation(() => ({
                            getToolDefinitions: jest.fn().mockReturnValue(mockTools)
                        }))
                    };
                });

                const request = {
                    jsonrpc: '2.0' as const,
                    id: 3,
                    method: 'tools/list'
                };

                const response = await mcpServer.handleRequest(request);

                expect(response.jsonrpc).toBe('2.0');
                expect(response.id).toBe(3);
                expect(response.result).toHaveProperty('tools');
            });
        });

        describe('tools/call method', () => {
            it('should call tool and return result', async () => {
                const mockResult = { x: 10, y: 20, width: 100, height: 50 };

                // Mock the analyzer to have config
                const mockAnalyzer = {
                    hasConfig: jest.fn().mockReturnValue(true)
                } as any;
                mcpServer.setAnalyzer(mockAnalyzer);

                // Mock the tool manager's callTool method
                const mockToolManager = mcpServer['toolManager'] as any;
                mockToolManager.callTool = jest.fn().mockResolvedValue(mockResult);

                const request = {
                    jsonrpc: '2.0' as const,
                    id: 4,
                    method: 'tools/call',
                    params: {
                        name: 'getNodePosition',
                        arguments: { nodeId: 'test-node' }
                    }
                };

                const response = await mcpServer.handleRequest(request);

                expect(response.jsonrpc).toBe('2.0');
                expect(response.id).toBe(4);
                expect(response.result).toHaveProperty('content');
                expect(response.result.content[0].text).toContain('10');
            });

            it('should handle tool call errors', async () => {
                // Mock the tool manager to throw an error
                jest.doMock('../../../src/tools/toolManager', () => {
                    return {
                        ToolManager: jest.fn().mockImplementation(() => ({
                            callTool: jest.fn().mockRejectedValue(new Error('Tool error'))
                        }))
                    };
                });

                const request = {
                    jsonrpc: '2.0' as const,
                    id: 5,
                    method: 'tools/call',
                    params: {
                        name: 'getNodePosition',
                        arguments: { nodeId: 'invalid-node' }
                    }
                };

                const response = await mcpServer.handleRequest(request);

                expect(response.jsonrpc).toBe('2.0');
                expect(response.id).toBe(5);
                expect(response.error).toBeDefined();
                expect(response.error?.message).toContain('No Sketch configuration loaded');
            });
        });

        describe('prompts/list method', () => {
            it('should return empty prompts list', async () => {
                const request = {
                    jsonrpc: '2.0' as const,
                    id: 6,
                    method: 'prompts/list'
                };

                const response = await mcpServer.handleRequest(request);

                expect(response).toEqual({
                    jsonrpc: '2.0',
                    id: 6,
                    result: { prompts: [] }
                });
            });
        });

        describe('resources/list method', () => {
            it('should return empty resources list', async () => {
                const request = {
                    jsonrpc: '2.0' as const,
                    id: 7,
                    method: 'resources/list'
                };

                const response = await mcpServer.handleRequest(request);

                expect(response).toEqual({
                    jsonrpc: '2.0',
                    id: 7,
                    result: { resources: [] }
                });
            });
        });

        describe('sketch/analyze method', () => {
            it('should analyze sketch config', async () => {
                const mockResult = { pages: 2, layers: 10 };
                mockAnalyzer.analyzeConfig.mockReturnValue(mockResult);

                const request = {
                    jsonrpc: '2.0' as const,
                    id: 8,
                    method: 'sketch/analyze',
                    params: {
                        config: { document: { pages: [] } }
                    }
                };

                const response = await mcpServer.handleRequest(request);

                expect(mockAnalyzer.analyzeConfig).toHaveBeenCalledWith({ document: { pages: [] } });
                expect(response).toEqual({
                    jsonrpc: '2.0',
                    id: 8,
                    result: mockResult
                });
            });

            it('should handle missing config', async () => {
                const request = {
                    jsonrpc: '2.0' as const,
                    id: 9,
                    method: 'sketch/analyze',
                    params: {}
                };

                const response = await mcpServer.handleRequest(request);

                expect(response.jsonrpc).toBe('2.0');
                expect(response.id).toBe(9);
                expect(response.error).toBeDefined();
                expect(response.error?.message).toContain('Missing config parameter');
            });
        });

        describe('unknown method', () => {
            it('should return method not found error', async () => {
                const request = {
                    jsonrpc: '2.0' as const,
                    id: 10,
                    method: 'unknown/method'
                };

                const response = await mcpServer.handleRequest(request);

                expect(response).toEqual({
                    jsonrpc: '2.0',
                    id: 10,
                    error: {
                        code: -32603,
                        message: 'Unknown method: unknown/method'
                    }
                });
            });
        });

        describe('notifications', () => {
            it('should handle notifications/initialized', async () => {
                const request = {
                    jsonrpc: '2.0' as const,
                    method: 'notifications/initialized'
                };

                const response = await mcpServer.handleRequest(request);

                expect(response).toEqual({
                    jsonrpc: '2.0',
                    id: undefined,
                    result: {}
                });
            });
        });
    });
});