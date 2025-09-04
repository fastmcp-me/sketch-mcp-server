/**
 * 重构后的 Sketch 配置分析器 - 主入口文件
 * 整合各个功能模块，提供统一的API接口
 */
import { NodeIndexer } from './nodeIndexer';
import { StyleExtractor } from './styleExtractor';
import { SvgRenderer } from './svgRenderer';
import { PathProcessor } from './pathProcessor';
import { NodeInfoExtractor } from './nodeInfoExtractor';

export class SketchConfigAnalyzer {
    private config: any | null = null;
    private nodeIndexer: NodeIndexer;
    private styleExtractor: StyleExtractor;
    private svgRenderer: SvgRenderer;
    private pathProcessor: PathProcessor;
    private nodeInfoExtractor: NodeInfoExtractor;

    constructor() {
        this.nodeIndexer = new NodeIndexer();
        this.styleExtractor = new StyleExtractor();
        this.svgRenderer = new SvgRenderer();
        this.pathProcessor = new PathProcessor();
        this.nodeInfoExtractor = new NodeInfoExtractor();
    }

    /**
     * 分析配置文档
     */
    analyzeConfig(config: any) {
        this.config = config || null;
        return this.nodeIndexer.indexConfig(config);
    }

    /**
     * 检查是否有配置
     */
    hasConfig(): boolean {
        return !!(this.config && this.config.document);
    }

    /**
     * 列出页面
     */
    listPages(): Array<{ id: string; name: string; layerCount: number }> {
        if (!this.config || !this.config.document || !Array.isArray(this.config.document.pages)) {
            return [];
        }
        
        const results: Array<{ id: string; name: string; layerCount: number }> = [];
        
        for (const page of this.config.document.pages) {
            const pageInfo = this.nodeInfoExtractor.extractPageInfo(page);
            if (pageInfo) {
                results.push({
                    id: pageInfo.id,
                    name: pageInfo.name,
                    layerCount: pageInfo.layerCount
                });
            }
        }
        
        return results;
    }

    /**
     * 列出节点
     */
    listNodes(limit: number = 50, type?: string, nameContains?: string, offset: number = 0) {
        return this.nodeIndexer.listNodes(limit, type, nameContains, offset);
    }

    /**
     * 获取页面信息
     */
    getPageInfo(pageId: string) {
        const page = this.nodeIndexer.getNode(pageId);
        return this.nodeInfoExtractor.extractPageInfo(page);
    }

    /**
     * 根据页面列出节点
     */
    listNodesByPage(pageId: string, limit: number = 50, type?: string, nameContains?: string, offset: number = 0) {
        const page = this.nodeIndexer.getNode(pageId);
        if (!page || !Array.isArray(page.layers)) {
            return [];
        }

        const results: any[] = [];
        let count = 0;
        let skipped = 0;

        const processLayers = (layers: any[]) => {
            for (const layer of layers) {
                if (count >= limit) return;
                
                const layerId = layer.id || layer.do_objectID;
                if (!layerId) continue;
                
                const nodeInfo = this.getNodeInfo(layerId);
                if (!nodeInfo) continue;
                
                if (type && nodeInfo.type !== type) {
                    if (Array.isArray(layer.layers)) {
                        processLayers(layer.layers);
                    }
                    continue;
                }
                
                if (nameContains && (!nodeInfo.name || !nodeInfo.name.toLowerCase().includes(nameContains.toLowerCase()))) {
                    if (Array.isArray(layer.layers)) {
                        processLayers(layer.layers);
                    }
                    continue;
                }
                
                if (skipped < offset) {
                    skipped++;
                    if (Array.isArray(layer.layers)) {
                        processLayers(layer.layers);
                    }
                    continue;
                }
                
                results.push({
                    id: layerId,
                    name: nodeInfo.name,
                    type: nodeInfo.type
                });
                count++;
                
                if (Array.isArray(layer.layers)) {
                    processLayers(layer.layers);
                }
            }
        };

        processLayers(page.layers);
        return results;
    }

    /**
     * 获取节点信息
     */
    getNodeInfo(nodeId: string) {
        const node = this.nodeIndexer.getNode(nodeId);
        return this.nodeInfoExtractor.extractNodeInfo(node);
    }

    /**
     * 获取Symbol Masters
     */
    getSymbolMasters(): Array<{ id: string; name: string; symbolID: string; layers: any[] }> {
        const results: Array<{ id: string; name: string; symbolID: string; layers: any[] }> = [];
        
        if (!this.config || !this.config.document || !Array.isArray(this.config.document.pages)) {
            return results;
        }
        
        for (const page of this.config.document.pages) {
            if (Array.isArray(page.layers)) {
                this.findSymbolMastersInLayers(page.layers, results);
            }
        }
        
        return results;
    }

    private findSymbolMastersInLayers(layers: any[], results: any[]) {
        for (const layer of layers) {
            if (layer._class === 'symbolMaster') {
                const symbolInfo = this.nodeInfoExtractor.extractSymbolMasterInfo(layer);
                if (symbolInfo) {
                    results.push({
                        id: symbolInfo.id,
                        name: symbolInfo.name,
                        symbolID: symbolInfo.symbolID,
                        layers: symbolInfo.layers || []
                    });
                }
            }
            
            if (Array.isArray(layer.layers)) {
                this.findSymbolMastersInLayers(layer.layers, results);
            }
        }
    }

    /**
     * 根据Symbol ID获取Symbol Master
     */
    getSymbolMasterBySymbolID(symbolID: string): any {
        const symbolMasters = this.getSymbolMasters();
        return symbolMasters.find(master => master.symbolID === symbolID) || null;
    }

    /**
     * 获取Symbol Instances
     */
    getSymbolInstances(): Array<{ id: string; name: string; symbolID: string; overrides: any[] }> {
        const results: Array<{ id: string; name: string; symbolID: string; overrides: any[] }> = [];
        
        if (!this.config || !this.config.document || !Array.isArray(this.config.document.pages)) {
            return results;
        }
        
        for (const page of this.config.document.pages) {
            if (Array.isArray(page.layers)) {
                this.findSymbolInstancesInLayers(page.layers, results);
            }
        }
        
        return results;
    }

    private findSymbolInstancesInLayers(layers: any[], results: any[]) {
        for (const layer of layers) {
            if (layer._class === 'symbolInstance') {
                const instanceInfo = this.nodeInfoExtractor.extractSymbolInstanceInfo(layer);
                if (instanceInfo) {
                    results.push({
                        id: instanceInfo.id,
                        name: instanceInfo.name,
                        symbolID: instanceInfo.symbolID,
                        overrides: instanceInfo.overrides || []
                    });
                }
            }
            
            if (Array.isArray(layer.layers)) {
                this.findSymbolInstancesInLayers(layer.layers, results);
            }
        }
    }

    /**
     * 渲染节点为Base64
     */
    renderNodeAsBase64(nodeId: string, format: 'svg' | 'png' = 'svg'): any {
        const debugSteps: string[] = [];
        debugSteps.push(`Starting render for node: ${nodeId}`);
        
        if (!this.hasConfig()) {
            return {
                error: 'No Sketch file loaded',
                debugInfo: {
                    sketchFileLoaded: false,
                    instruction: 'Please use loadSketchByPath tool to load a Sketch file first'
                }
            };
        }
        
        const stats = this.nodeIndexer.getStats();
        debugSteps.push(`Total nodes loaded: ${stats.totalNodes}`);
        
        const nodeInfo = this.getNodeInfo(nodeId);
        if (!nodeInfo) {
            const availableNodes = this.listNodes(10);
            return {
                error: 'Node not found',
                availableNodes: availableNodes,
                debugInfo: {
                    sketchFileLoaded: true,
                    suggestion: 'Use listNodes tool to see available nodes'
                }
            };
        }
        
        debugSteps.push(`Found node: ${nodeInfo.name}, type: ${nodeInfo.type}`);
        debugSteps.push(`NodeInfo obtained: type=${nodeInfo.type}, size=${JSON.stringify(nodeInfo.size)}`);
        
        if (format === 'svg') {
            debugSteps.push('Rendering as SVG');
            const result = this.renderNodeAsSVG(nodeInfo);
            
            if (result.error) {
                return {
                    ...result,
                    debugSteps: debugSteps,
                    debugInfo: {
                        renderSuccess: false,
                        nodeType: nodeInfo.type,
                        nodeSize: nodeInfo.size,
                        format: format
                    }
                };
            }
            
            debugSteps.push('SVG render successful');
            
            return {
                ...result,
                debugSteps: debugSteps,
                debugInfo: {
                    renderSuccess: true,
                    nodeType: nodeInfo.type,
                    nodeSize: nodeInfo.size,
                    format: format
                }
            };
        }
        
        return {
            error: 'PNG format not supported yet',
            debugSteps: debugSteps
        };
    }

    /**
     * 渲染节点为SVG
     */
    private renderNodeAsSVG(nodeInfo: any): any {
        try {
            // 对于shapePath类型，需要特殊处理路径数据
            if (nodeInfo.type === 'shapePath') {
                const rawNode = this.getRawNode(nodeInfo.id);
                const pathData = this.pathProcessor.extractPathFromNode(rawNode);
                
                if (pathData && this.pathProcessor.isValidPathData(pathData)) {
                    return this.svgRenderer.renderNodeAsSVG({
                        ...nodeInfo,
                        pathData: pathData
                    });
                }
            }
            
            // 对于group类型，需要渲染子节点
            if (nodeInfo.type === 'group') {
                const childRenderer = (childId: string) => {
                    const childInfo = this.getNodeInfo(childId);
                    if (!childInfo) return '';
                    
                    if (childInfo.type === 'shapePath') {
                        const rawChild = this.getRawNode(childId);
                        const childPathData = this.pathProcessor.extractPathFromNode(rawChild);
                        
                        if (childPathData && this.pathProcessor.isValidPathData(childPathData)) {
                            return this.svgRenderer.generateShapePathSVG(childInfo, childPathData);
                        }
                    }
                    
                    // 对于其他类型的子节点，递归渲染
                    const childResult = this.renderNodeAsSVG(childInfo);
                    return childResult.svgContent ? childResult.svgContent.replace(/<\/?svg[^>]*>/g, '') : '';
                };
                
                const groupSVG = this.svgRenderer.generateGroupSVG(nodeInfo, childRenderer);
                return this.svgRenderer.renderNodeAsSVG({
                    ...nodeInfo,
                    customSVG: groupSVG
                });
            }
            
            return this.svgRenderer.renderNodeAsSVG(nodeInfo);
            
        } catch (error: any) {
            return {
                error: `Render failed: ${error.message}`,
                nodeId: nodeInfo.id
            };
        }
    }

    /**
     * 获取节点位置
     */
    getNodePosition(nodeId: string) {
        const nodeInfo = this.getNodeInfo(nodeId);
        return nodeInfo ? nodeInfo.position : null;
    }

    /**
     * 根据名称查找节点
     */
    findNodesByName(name: string) {
        return this.nodeIndexer.findNodesByName(name);
    }

    /**
     * 获取祖先节点
     */
    getAncestors(nodeId: string): string[] {
        return this.nodeIndexer.getAncestors(nodeId);
    }

    /**
     * 获取原始节点数据
     */
    getRawNode(nodeId: string) {
        return this.nodeIndexer.getNode(nodeId);
    }

    /**
     * 获取页面结构
     */
    getPageStructure(pageId: string, includeDetails: boolean = true, maxDepth: number = 10): any {
        const page = this.nodeIndexer.getNode(pageId);
        if (!page) return null;
        
        const buildStructure = (node: any, depth: number): any => {
            if (depth > maxDepth) return null;
            
            const nodeId = node.id || node.do_objectID;
            const result: any = {
                id: nodeId,
                name: node.name || '',
                type: node._class || 'unknown'
            };
            
            if (includeDetails) {
                const nodeInfo = this.getNodeInfo(nodeId);
                if (nodeInfo) {
                    result.position = nodeInfo.position;
                    result.size = nodeInfo.size;
                    result.isVisible = nodeInfo.isVisible;
                }
            }
            
            if (Array.isArray(node.layers) && node.layers.length > 0) {
                result.children = [];
                for (const child of node.layers) {
                    const childStructure = buildStructure(child, depth + 1);
                    if (childStructure) {
                        result.children.push(childStructure);
                    }
                }
            }
            
            return result;
        };
        
        return buildStructure(page, 0);
    }

    /**
     * 获取文档结构
     */
    getDocumentStructure(
        includeDetails: boolean = false, 
        maxNodesPerPage: number = 200,
        options?: {
            fields?: string[];           // 指定返回的字段
            excludeFields?: string[];    // 排除的字段
            summaryMode?: boolean;       // 摘要模式
            maxDepth?: number;          // 最大深度
            groupSimilar?: boolean;     // 合并相似节点
        }
    ): any {
        if (!this.config || !this.config.document) {
            return { error: 'No document loaded' };
        }
        
        const opts = options || {};
        
        // 摘要模式
        if (opts.summaryMode) {
            return this.generateDocumentSummary(maxNodesPerPage, opts);
        }
        
        const result: any = {
            pages: [],
            totalPages: 0,
            metadata: {
                version: this.config.meta?.version || 'unknown',
                created: this.config.meta?.created || null
            }
        };
        
        if (Array.isArray(this.config.document.pages)) {
            result.totalPages = this.config.document.pages.length;
            
            for (const page of this.config.document.pages) {
                const pageId = page.id || page.do_objectID;
                const maxDepth = opts.maxDepth || 3;
                const pageStructure = this.getPageStructure(pageId, includeDetails, maxDepth);
                
                if (pageStructure) {
                    // 应用字段过滤
                    const filteredStructure = this.applyFieldFilters(pageStructure, opts);
                    
                    // 限制每页的节点数量
                    if (filteredStructure.children && filteredStructure.children.length > maxNodesPerPage) {
                        filteredStructure.children = filteredStructure.children.slice(0, maxNodesPerPage);
                        filteredStructure.truncated = true;
                        filteredStructure.totalChildren = filteredStructure.children.length;
                    }
                    
                    result.pages.push(filteredStructure);
                }
            }
        }
        
        return result;
    }

    // 兼容性方法 - 保持与原有API的兼容
    getSymbolInstanceStyles(instanceId: string): any {
        const instance = this.nodeIndexer.getNode(instanceId);
        if (!instance || instance._class !== 'symbolInstance') {
            return null;
        }
        
        const instanceInfo = this.nodeInfoExtractor.extractSymbolInstanceInfo(instance);
        return instanceInfo ? instanceInfo.style : null;
    }

    /**
     * 生成文档摘要
     */
    private generateDocumentSummary(maxNodesPerPage: number, options: any): any {
        if (!this.config || !this.config.document || !Array.isArray(this.config.document.pages)) {
            return { error: 'No document loaded' };
        }

        const summary: any = {
            totalPages: this.config.document.pages.length,
            totalNodes: 0,
            nodeTypes: {},
            commonStyles: [],
            pages: []
        };

        for (const page of this.config.document.pages) {
            const pageId = page.id || page.do_objectID;
            const pageSummary = this.generatePageSummary(pageId, maxNodesPerPage);
            
            if (pageSummary) {
                summary.totalNodes += pageSummary.nodeCount;
                
                // 合并节点类型统计
                for (const [type, count] of Object.entries(pageSummary.nodeTypes)) {
                    summary.nodeTypes[type] = (summary.nodeTypes[type] || 0) + (count as number);
                }
                
                summary.pages.push({
                    id: pageId,
                    name: page.name || '',
                    nodeCount: pageSummary.nodeCount,
                    nodeTypes: pageSummary.nodeTypes,
                    representativeNodes: pageSummary.representativeNodes
                });
            }
        }

        return summary;
    }

    /**
     * 生成页面摘要
     */
    private generatePageSummary(pageId: string, maxSamples: number = 5): any {
        const page = this.nodeIndexer.getNode(pageId);
        if (!page) return null;

        const nodeTypes: { [key: string]: number } = {};
        const representativeNodes: any[] = [];
        let nodeCount = 0;

        const collectNodes = (node: any) => {
            nodeCount++;
            const nodeType = node._class || 'unknown';
            nodeTypes[nodeType] = (nodeTypes[nodeType] || 0) + 1;

            // 收集代表性节点
            if (representativeNodes.length < maxSamples) {
                representativeNodes.push({
                    id: node.id || node.do_objectID,
                    name: node.name || '',
                    type: nodeType
                });
            }

            if (Array.isArray(node.layers)) {
                for (const child of node.layers) {
                    collectNodes(child);
                }
            }
        };

        if (Array.isArray(page.layers)) {
            for (const layer of page.layers) {
                collectNodes(layer);
            }
        }

        return {
            nodeCount,
            nodeTypes,
            representativeNodes
        };
    }

    /**
     * 应用字段过滤
     */
    private applyFieldFilters(structure: any, options: any): any {
        if (!options.fields && !options.excludeFields) {
            return structure;
        }

        const filterNode = (node: any): any => {
            let filtered: any = {};

            if (options.fields) {
                // 只包含指定字段
                for (const field of options.fields) {
                    if (node.hasOwnProperty(field)) {
                        filtered[field] = node[field];
                    }
                }
            } else {
                // 复制所有字段
                filtered = { ...node };
            }

            if (options.excludeFields) {
                // 排除指定字段
                for (const field of options.excludeFields) {
                    delete filtered[field];
                }
            }

            // 递归处理子节点
            if (filtered.children && Array.isArray(filtered.children)) {
                filtered.children = filtered.children.map(filterNode);
            }

            return filtered;
        };

        return filterNode(structure);
    }
}

// 导出所有模块
export { NodeIndexer } from './nodeIndexer';
export { StyleExtractor } from './styleExtractor';
export { SvgRenderer } from './svgRenderer';
export { PathProcessor } from './pathProcessor';
export { NodeInfoExtractor } from './nodeInfoExtractor';

// 保持向后兼容
export { SketchConfigAnalyzer as default };