import { SketchConfigAnalyzer } from '../../../src/core/analyzer/sketchConfigAnalyzer';
import { loadSketchConfigFromPath } from '../../../src/core/file';
import path from 'path';
import fs from 'fs';

describe('SketchConfigAnalyzer - renderNodeAsBase64', () => {
    let analyzer: SketchConfigAnalyzer;
    const testSketchPath = path.join(__dirname, '../../test.sketch');
    
    beforeAll(async () => {
        analyzer = new SketchConfigAnalyzer();
        
        // 检查测试文件是否存在
        if (!fs.existsSync(testSketchPath)) {
            throw new Error(`Test sketch file not found: ${testSketchPath}`);
        }
        
        // 加载测试用的 Sketch 文件
        const config = await loadSketchConfigFromPath(testSketchPath);
        analyzer.analyzeConfig(config);
    });
    
    describe('基础功能测试', () => {
        test('应该返回错误当没有加载Sketch文件时', () => {
            const emptyAnalyzer = new SketchConfigAnalyzer();
            const result = emptyAnalyzer.renderNodeAsBase64('test-id');
            
            expect(result.error).toBe('No Sketch file loaded');
            expect(result.debugInfo.sketchFileLoaded).toBe(false);
            expect(result.debugInfo.instruction).toContain('loadSketchByPath');
        });
        
        test('应该返回错误当节点不存在时', () => {
            const result = analyzer.renderNodeAsBase64('non-existent-id');
            
            expect(result.error).toBe('Node not found');
            expect(result.debugInfo.sketchFileLoaded).toBe(true);
            expect(result.debugInfo.suggestion).toContain('listNodes');
            expect(result.availableNodes).toBeDefined();
            expect(Array.isArray(result.availableNodes)).toBe(true);
        });
        
        test('应该包含调试步骤信息', () => {
            const nodes = analyzer.listNodes(1);
            if (nodes.length === 0) {
                throw new Error('No nodes found in test sketch');
            }
            
            const result = analyzer.renderNodeAsBase64(nodes[0].id);
            
            expect(result.debugSteps).toBeDefined();
            expect(Array.isArray(result.debugSteps)).toBe(true);
            expect(result.debugSteps.length).toBeGreaterThan(0);
            expect(result.debugSteps[0]).toContain('Starting render for node');
        });
    });
    
    describe('Rectangle 节点渲染', () => {
        test('应该正确渲染 Rectangle 节点', () => {
            const allNodes = analyzer.listNodes(100);
            const rectangleNodes = allNodes.filter(node => node.type === 'rectangle');
            
            expect(rectangleNodes.length).toBeGreaterThan(0);
            
            const result = analyzer.renderNodeAsBase64(rectangleNodes[0].id);
            
            expect(result.error).toBeUndefined();
            expect(result.format).toBe('svg');
            expect(result.imageData).toMatch(/^data:image\/svg\+xml;base64,/);
            expect(result.svgContent).toContain('<rect');
            expect(result.debugInfo.renderSuccess).toBe(true);
        });
    });
    
    describe('ShapePath 节点渲染', () => {
        test('应该正确渲染 ShapePath 节点', () => {
            const allNodes = analyzer.listNodes(100);
            const shapePathNodes = allNodes.filter(node => node.type === 'shapePath');
            
            expect(shapePathNodes.length).toBeGreaterThan(0);
            
            const result = analyzer.renderNodeAsBase64(shapePathNodes[0].id);
            
            expect(result.error).toBeUndefined();
            expect(result.format).toBe('svg');
            expect(result.imageData).toMatch(/^data:image\/svg\+xml;base64,/);
            expect(result.svgContent).toContain('<path');
            expect(result.svgContent).toContain('d="');
            expect(result.debugInfo.renderSuccess).toBe(true);
        });
        
        test('ShapePath 应该包含真实的路径数据而不是占位符', () => {
            const allNodes = analyzer.listNodes(100);
            const shapePathNodes = allNodes.filter(node => node.type === 'shapePath');
            
            if (shapePathNodes.length === 0) {
                throw new Error('No shapePath nodes found in test sketch');
            }
            
            const result = analyzer.renderNodeAsBase64(shapePathNodes[0].id);
            
            expect(result.svgContent).not.toContain('shapePath'); // 不应该包含占位符文字
            expect(result.svgContent).toMatch(/d="M [\d.-]+ [\d.-]+/); // 应该包含真实的路径数据
        });
        
        test('应该正确解析坐标和样式', () => {
            const allNodes = analyzer.listNodes(100);
            const shapePathNodes = allNodes.filter(node => node.type === 'shapePath');
            
            if (shapePathNodes.length === 0) {
                throw new Error('No shapePath nodes found in test sketch');
            }
            
            const result = analyzer.renderNodeAsBase64(shapePathNodes[0].id);
            const svgContent = result.svgContent;
            
            // 检查路径数据格式
            expect(svgContent).toMatch(/<path d="[^"]+"/); // 应该有路径数据
            expect(svgContent).toMatch(/fill="[^"]+"/); // 应该有填充色
            expect(svgContent).toMatch(/stroke="[^"]+"/); // 应该有描边色
        });
    });
    
    describe('Group 节点渲染', () => {
        test('应该正确渲染 Group 节点及其子节点', () => {
            const allNodes = analyzer.listNodes(100);
            const groupNodes = allNodes.filter(node => node.type === 'group');
            
            expect(groupNodes.length).toBeGreaterThan(0);
            
            const result = analyzer.renderNodeAsBase64(groupNodes[0].id);
            
            expect(result.error).toBeUndefined();
            expect(result.format).toBe('svg');
            expect(result.imageData).toMatch(/^data:image\/svg\+xml;base64,/);
            expect(result.svgContent).toContain('<g transform="translate');
            expect(result.debugInfo.renderSuccess).toBe(true);
        });
        
        test('Group 中的 shapePath 子节点应该正确渲染', () => {
            // 查找包含 shapePath 子节点的 Group
            const allNodes = analyzer.listNodes(200);
            const arrowNodes = allNodes.filter(node => 
                node.type === 'group' && node.name && node.name.includes('arrow')
            );
            
            if (arrowNodes.length === 0) {
                // 如果没有找到 arrow 节点，跳过这个测试
                return;
            }
            
            const result = analyzer.renderNodeAsBase64(arrowNodes[0].id);
            
            expect(result.error).toBeUndefined();
            expect(result.svgContent).toContain('<path'); // 应该包含路径元素
            expect(result.svgContent).not.toContain('shapePath'); // 不应该包含占位符
        });
    });
    
    describe('Text 节点渲染', () => {
        test('应该正确渲染 Text 节点', () => {
            const allNodes = analyzer.listNodes(100);
            const textNodes = allNodes.filter(node => node.type === 'text');
            
            expect(textNodes.length).toBeGreaterThan(0);
            
            const result = analyzer.renderNodeAsBase64(textNodes[0].id);
            
            expect(result.error).toBeUndefined();
            expect(result.format).toBe('svg');
            expect(result.svgContent).toContain('<text');
            expect(result.debugInfo.renderSuccess).toBe(true);
        });
    });
    
    describe('输出格式验证', () => {
        test('应该返回正确的数据结构', () => {
            const nodes = analyzer.listNodes(1);
            if (nodes.length === 0) {
                throw new Error('No nodes found in test sketch');
            }
            
            const result = analyzer.renderNodeAsBase64(nodes[0].id);
            
            // 验证返回结构
            expect(result).toHaveProperty('nodeId');
            expect(result).toHaveProperty('format');
            expect(result).toHaveProperty('imageData');
            expect(result).toHaveProperty('svgContent');
            expect(result).toHaveProperty('debugSteps');
            expect(result).toHaveProperty('debugInfo');
            
            // 验证数据类型
            expect(typeof result.nodeId).toBe('string');
            expect(typeof result.format).toBe('string');
            expect(typeof result.imageData).toBe('string');
            expect(typeof result.svgContent).toBe('string');
            expect(Array.isArray(result.debugSteps)).toBe(true);
            expect(typeof result.debugInfo).toBe('object');
        });
        
        test('Base64 数据应该是有效的', () => {
            const nodes = analyzer.listNodes(1);
            if (nodes.length === 0) {
                throw new Error('No nodes found in test sketch');
            }
            
            const result = analyzer.renderNodeAsBase64(nodes[0].id);
            
            expect(result.imageData).toMatch(/^data:image\/svg\+xml;base64,/);
            
            // 验证 Base64 编码是否有效
            const base64Data = result.imageData.replace('data:image/svg+xml;base64,', '');
            expect(() => {
                Buffer.from(base64Data, 'base64');
            }).not.toThrow();
            
            // 解码后应该是有效的 SVG
            const decodedSvg = Buffer.from(base64Data, 'base64').toString('utf8');
            expect(decodedSvg).toContain('<svg');
            expect(decodedSvg).toContain('</svg>');
        });
    });
    
    describe('性能和边界测试', () => {
        test('应该在合理时间内完成渲染', () => {
            const nodes = analyzer.listNodes(5);
            
            const startTime = Date.now();
            
            nodes.forEach(node => {
                analyzer.renderNodeAsBase64(node.id);
            });
            
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            // 5个节点的渲染应该在1秒内完成
            expect(duration).toBeLessThan(1000);
        });
        
        test('应该处理复杂的 Group 结构', () => {
            const allNodes = analyzer.listNodes(100);
            const complexGroups = allNodes.filter(node => 
                node.type === 'group' || node.type === 'symbolMaster'
            );
            
            if (complexGroups.length === 0) {
                return; // 跳过测试如果没有复杂结构
            }
            
            const result = analyzer.renderNodeAsBase64(complexGroups[0].id);
            
            expect(result.error).toBeUndefined();
            expect(result.debugInfo.renderSuccess).toBe(true);
        });
    });
    
    describe('调试信息验证', () => {
        test('调试步骤应该包含关键信息', () => {
            const nodes = analyzer.listNodes(1);
            if (nodes.length === 0) {
                throw new Error('No nodes found in test sketch');
            }
            
            const result = analyzer.renderNodeAsBase64(nodes[0].id);
            
            const debugSteps = result.debugSteps;
            expect(debugSteps.some((step: string) => step.includes('Starting render'))).toBe(true);
            expect(debugSteps.some((step: string) => step.includes('Total nodes loaded'))).toBe(true);
            expect(debugSteps.some((step: string) => step.includes('Found node'))).toBe(true);
            expect(debugSteps.some((step: string) => step.includes('NodeInfo obtained'))).toBe(true);
            expect(debugSteps.some((step: string) => step.includes('render successful'))).toBe(true);
        });
        
        test('调试信息应该包含节点类型和尺寸', () => {
            const nodes = analyzer.listNodes(1);
            if (nodes.length === 0) {
                throw new Error('No nodes found in test sketch');
            }
            
            const result = analyzer.renderNodeAsBase64(nodes[0].id);
            
            expect(result.debugInfo.renderSuccess).toBe(true);
            expect(result.debugInfo.nodeType).toBeDefined();
            expect(result.debugInfo.nodeSize).toBeDefined();
            expect(result.debugInfo.format).toBe('svg');
        });
    });
});