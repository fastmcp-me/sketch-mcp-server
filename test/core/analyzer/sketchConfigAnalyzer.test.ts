import { SketchConfigAnalyzer } from '../../../src/core/analyzer';
import { loadSketchConfigFromPath } from '../../../src/core/file';
import path from 'path';

describe('SketchConfigAnalyzer', () => {
    let analyzer: SketchConfigAnalyzer;
    let testSketchPath: string;

    beforeAll(async () => {
        analyzer = new SketchConfigAnalyzer();
        testSketchPath = path.join(__dirname, '../../test.sketch');
        
        // 加载真实的Sketch文件
        try {
            const config = await loadSketchConfigFromPath(testSketchPath);
            analyzer.analyzeConfig(config);
        } catch (error) {
            console.warn('Failed to load test sketch file:', error);
        }
    });

    describe('基本功能测试', () => {
        it('应该能够检查配置是否已加载', () => {
            expect(analyzer.hasConfig()).toBe(true);
        });

        it('应该能够列出页面', () => {
            const pages = analyzer.listPages();
            expect(Array.isArray(pages)).toBe(true);
            if (pages.length > 0) {
                expect(pages[0]).toHaveProperty('id');
                expect(pages[0]).toHaveProperty('name');
            }
        });

        it('应该能够获取页面信息', () => {
            const pages = analyzer.listPages();
            if (pages.length > 0) {
                const pageInfo = analyzer.getPageInfo(pages[0].id);
                if (pageInfo) {
                    expect(pageInfo).toHaveProperty('id');
                    expect(pageInfo).toHaveProperty('name');
                    expect(pageInfo).toHaveProperty('layerCount');
                }
            }
        });
    });

    describe('节点操作测试', () => {
        let testPageId: string;

        beforeAll(() => {
            const pages = analyzer.listPages();
            if (pages.length > 0) {
                testPageId = pages[0].id;
            }
        });

        it('应该能够列出节点', () => {
            if (testPageId) {
                const result = analyzer.listNodesByPage(testPageId, 10);
                expect(Array.isArray(result)).toBe(true);
                expect(result.length).toBeGreaterThanOrEqual(0);
            }
        });

        it('应该能够按类型过滤节点', () => {
            if (testPageId) {
                const allNodes = analyzer.listNodesByPage(testPageId, 100);
                if (allNodes.length > 0) {
                    // 获取第一个节点的类型
                    const firstNodeType = allNodes[0].type;
                    if (firstNodeType) {
                        const filteredResult = analyzer.listNodesByPage(testPageId, 100, firstNodeType);
                        expect(filteredResult.every((node: any) => node.type === firstNodeType)).toBe(true);
                    }
                }
            }
        });

        it('应该能够按名称搜索节点', () => {
            if (testPageId) {
                const allNodes = analyzer.listNodesByPage(testPageId, 100);
                if (allNodes.length > 0) {
                    // 获取第一个有名称的节点
                    const nodeWithName = allNodes.find(node => node.name && node.name.length > 0);
                    if (nodeWithName && nodeWithName.name) {
                        const nameToSearch = nodeWithName.name.substring(0, 3); // 取前3个字符
                        const filteredResult = analyzer.listNodesByPage(testPageId, 100, undefined, nameToSearch);
                        expect(filteredResult.every((node: any) => 
                            node.name && node.name.toLowerCase().includes(nameToSearch.toLowerCase())
                        )).toBe(true);
                    }
                }
            }
        });

        it('应该能够获取节点位置信息', () => {
            if (testPageId) {
                const result = analyzer.listNodesByPage(testPageId, 10);
                if (result.length > 0) {
                    const nodeId = result[0].id;
                    const position = analyzer.getNodePosition(nodeId);
                    if (position) {
                        expect(position).toHaveProperty('x');
                        expect(position).toHaveProperty('y');
                        expect(typeof position.x).toBe('number');
                        expect(typeof position.y).toBe('number');
                    }
                }
            }
        });

        it('应该能够获取节点详细信息', () => {
            if (testPageId) {
                const result = analyzer.listNodesByPage(testPageId, 10);
                if (result.length > 0) {
                    const nodeId = result[0].id;
                    const nodeInfo = analyzer.getNodeInfo(nodeId);
                    if (nodeInfo) {
                        expect(nodeInfo).toHaveProperty('id');
                        expect(nodeInfo).toHaveProperty('name');
                        // 检查节点信息的基本结构
                        expect(typeof nodeInfo.id).toBe('string');
                        expect(typeof nodeInfo.name).toBe('string');
                    }
                }
            }
        });
    });

    describe('边界情况测试', () => {
        it('应该正确处理不存在的页面ID', () => {
            const result = analyzer.listNodesByPage('non-existent-page', 10);
            expect(result).toEqual([]);
        });

        it('应该正确处理不存在的节点ID', () => {
            const position = analyzer.getNodePosition('non-existent-node');
            expect(position).toBeNull();
            
            const nodeInfo = analyzer.getNodeInfo('non-existent-node');
            expect(nodeInfo).toBeNull();
        });

        it('应该正确处理空搜索词', () => {
            const results = analyzer.findNodesByName('');
            expect(Array.isArray(results)).toBe(true);
        });

        it('应该正确处理分页参数', () => {
            const pages = analyzer.listPages();
            if (pages.length > 0) {
                const pageId = pages[0].id;
                
                // 测试limit参数
                const result1 = analyzer.listNodesByPage(pageId, 5);
                expect(result1.length).toBeLessThanOrEqual(5);
                
                // 测试offset参数
                const result2 = analyzer.listNodesByPage(pageId, 5, undefined, undefined, 2);
                expect(result2.length).toBeLessThanOrEqual(5);
            }
        });
    });

    describe('性能测试', () => {
        it('应该能够快速处理大量节点查询', () => {
            const pages = analyzer.listPages();
            if (pages.length > 0) {
                const pageId = pages[0].id;
                
                const startTime = Date.now();
                for (let i = 0; i < 10; i++) {
                    analyzer.listNodesByPage(pageId, 100);
                }
                const endTime = Date.now();
                
                // 10次查询应该在1秒内完成
                expect(endTime - startTime).toBeLessThan(1000);
            }
        });

        it('应该能够快速处理节点搜索', () => {
            const startTime = Date.now();
            for (let i = 0; i < 10; i++) {
                analyzer.findNodesByName('test');
            }
            const endTime = Date.now();
            
            // 10次搜索应该在500毫秒内完成
            expect(endTime - startTime).toBeLessThan(500);
        });
    });
});