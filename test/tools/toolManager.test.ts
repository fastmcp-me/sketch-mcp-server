import { ToolManager } from '../../src/tools/toolManager';
import { SketchConfigAnalyzer } from '../../src/core/analyzer';

describe('ToolManager', () => {
    let toolManager: ToolManager;
    let mockAnalyzer: jest.Mocked<SketchConfigAnalyzer>;

    beforeEach(() => {
        mockAnalyzer = {
            hasConfig: jest.fn().mockReturnValue(true),
            getNodeInfo: jest.fn(),
            getNodePosition: jest.fn(),
            findNodesByName: jest.fn(),
            listPages: jest.fn(),
            listNodes: jest.fn(),
            listNodesByPage: jest.fn(),
            analyzeConfig: jest.fn(),
            getPageInfo: jest.fn(),
            getAncestors: jest.fn(),
            getRawNode: jest.fn()
        } as any;
        
        toolManager = new ToolManager(mockAnalyzer);
    });

    describe('constructor', () => {
        it('should create an instance', () => {
            expect(toolManager).toBeInstanceOf(ToolManager);
        });
    });

    describe('getToolDefinitions', () => {
        it('should return list of available tools', () => {
            const tools = toolManager.getToolDefinitions();
            expect(Array.isArray(tools)).toBe(true);
            expect(tools.length).toBeGreaterThan(0);
            
            // Check that each tool has required properties
            tools.forEach(tool => {
                expect(tool).toHaveProperty('name');
                expect(tool).toHaveProperty('description');
                expect(tool).toHaveProperty('inputSchema');
            });
        });

        it('should include expected tools', () => {
            const tools = toolManager.getToolDefinitions();
            const toolNames = tools.map(tool => tool.name);
            
            expect(toolNames).toContain('getNodePosition');
            expect(toolNames).toContain('getNodeInfo');
            expect(toolNames).toContain('findNodesByName');
            expect(toolNames).toContain('listPages');
            expect(toolNames).toContain('listNodes');
            expect(toolNames).toContain('listNodesByPage');
        });
    });

    describe('callTool', () => {
        describe('getNodePosition', () => {
            it('should call analyzer.getNodePosition with correct arguments', async () => {
                const mockPosition = { x: 10, y: 20, width: 100, height: 50 };
                mockAnalyzer.getNodePosition.mockReturnValue(mockPosition);

                const result = await toolManager.callTool('getNodePosition', { nodeId: 'test-node' });

                expect(mockAnalyzer.getNodePosition).toHaveBeenCalledWith('test-node');
                expect(result).toEqual(mockPosition);
            });

            it('should handle missing nodeId', async () => {
                mockAnalyzer.getNodePosition.mockReturnValue(null);
                const result = await toolManager.callTool('getNodePosition', {});
                expect(result).toBeNull();
            });
        });

        describe('getNodeInfo', () => {
            it('should call analyzer.getNodeInfo with correct arguments', async () => {
                const mockInfo = { 
                    id: 'test-node', 
                    name: 'Test Node', 
                    position: { x: 10, y: 20 }, 
                    size: { width: 100, height: 50 } 
                };
                mockAnalyzer.getNodeInfo.mockReturnValue(mockInfo);

                const result = await toolManager.callTool('getNodeInfo', { nodeId: 'test-node' });

                expect(mockAnalyzer.getNodeInfo).toHaveBeenCalledWith('test-node');
                expect(result).toEqual(mockInfo);
            });

            it('should handle missing nodeId', async () => {
                mockAnalyzer.getNodeInfo.mockReturnValue(null);
                const result = await toolManager.callTool('getNodeInfo', {});
                expect(result).toBeNull();
            });
        });

        describe('findNodesByName', () => {
            it('should call analyzer.findNodesByName with correct arguments', async () => {
                const mockNodes = [
                    { id: 'node1', name: 'Test Node 1', type: 'rectangle' },
                    { id: 'node2', name: 'Test Node 2', type: 'text' }
                ];
                mockAnalyzer.findNodesByName.mockReturnValue(mockNodes);

                const result = await toolManager.callTool('findNodesByName', { name: 'Button' });

                expect(mockAnalyzer.findNodesByName).toHaveBeenCalledWith('Button');
                expect(result).toEqual(mockNodes);
            });

            it('should handle missing name', async () => {
                mockAnalyzer.findNodesByName.mockReturnValue([]);
                const result = await toolManager.callTool('findNodesByName', {});
                expect(result).toEqual([]);
            });
        });

        describe('listPages', () => {
            it('should call analyzer.listPages', async () => {
                const mockPages = [{ id: 'page1', name: 'Page 1', layerCount: 5 }];
                mockAnalyzer.listPages.mockReturnValue(mockPages);

                const result = await toolManager.callTool('listPages', {});

                expect(mockAnalyzer.listPages).toHaveBeenCalled();
                expect(result).toEqual(mockPages);
            });
        });

        describe('listNodes', () => {
            it('should call analyzer.listNodes with default parameters', async () => {
                const mockNodes = [{ id: 'node1', name: 'Node 1' }];
                mockAnalyzer.listNodes.mockReturnValue(mockNodes);

                const result = await toolManager.callTool('listNodes', {});

                expect(mockAnalyzer.listNodes).toHaveBeenCalledWith(undefined, undefined, undefined);
                expect(result).toEqual(mockNodes);
            });

            it('should call analyzer.listNodes with custom parameters', async () => {
                const mockNodes = [{ id: 'node1', name: 'Node 1' }];
                mockAnalyzer.listNodes.mockReturnValue(mockNodes);

                const result = await toolManager.callTool('listNodes', {
                    limit: 10,
                    type: 'rectangle',
                    nameContains: 'Button',
                    offset: 5
                });

                expect(mockAnalyzer.listNodes).toHaveBeenCalledWith('rectangle', 10, 5);
                expect(result).toEqual(mockNodes);
            });
        });

        describe('listNodesByPage', () => {
            it('should call analyzer.listNodesByPage with required pageId', async () => {
                const mockResult = [
                    { id: 'node1', name: 'Node 1' },
                    { id: 'node2', name: 'Node 2' }
                ];
                mockAnalyzer.listNodesByPage.mockReturnValue(mockResult);
                mockAnalyzer.getPageInfo.mockReturnValue(null);

                const result = await toolManager.callTool('listNodesByPage', { pageId: 'page1' });

                expect(mockAnalyzer.listNodesByPage).toHaveBeenCalledWith('page1', 50, undefined, undefined, 0);
                expect(result).toEqual({
                    page: null,
                    nodes: mockResult,
                    total: mockResult.length,
                    limit: 50,
                    offset: 0
                });
            });

            it('should handle missing pageId', async () => {
                mockAnalyzer.listNodesByPage.mockReturnValue([]);
                mockAnalyzer.getPageInfo.mockReturnValue(null);

                const result = await toolManager.callTool('listNodesByPage', {});
                
                expect(result).toEqual({
                    page: null,
                    nodes: [],
                    total: 0,
                    limit: 50,
                    offset: 0
                });
            });

            it('should call analyzer.listNodesByPage with custom parameters', async () => {
                const mockResult = [
                    { id: 'node1', name: 'Node 1' },
                    { id: 'node2', name: 'Node 2' }
                ];
                const mockPageInfo = { id: 'page1', name: 'Page 1', totalNodeCount: 1 };
                mockAnalyzer.listNodesByPage.mockReturnValue(mockResult);
                mockAnalyzer.getPageInfo.mockReturnValue(mockPageInfo);

                const result = await toolManager.callTool('listNodesByPage', {
                    pageId: 'page1',
                    limit: 20,
                    type: 'text',
                    nameContains: 'Label',
                    offset: 10
                });

                expect(mockAnalyzer.listNodesByPage).toHaveBeenCalledWith('page1', 20, 'text', 'Label', 10);
                expect(result).toEqual({
                    page: mockPageInfo,
                    nodes: mockResult,
                    total: mockResult.length,
                    limit: 20,
                    offset: 10
                });
            });
        });

        describe('unknown tool', () => {
            it('should throw error for unknown tool', async () => {
                await expect(toolManager.callTool('unknownTool', {}))
                    .rejects.toThrow('Unknown tool: unknownTool');
            });
        });
    });
});