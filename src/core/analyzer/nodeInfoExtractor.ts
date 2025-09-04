import { StyleExtractor } from './styleExtractor';

/**
 * 节点信息提取器 - 负责从原始节点数据中提取结构化信息
 */
export class NodeInfoExtractor {
    private styleExtractor: StyleExtractor;
    
    constructor() {
        this.styleExtractor = new StyleExtractor();
    }
    
    /**
     * 提取节点完整信息
     */
    extractNodeInfo(node: any): any {
        if (!node) {
            return null;
        }
        
        const nodeId = node.id || node.do_objectID;
        const nodeType = this.getNodeType(node);
        
        const baseInfo: any = {
            id: nodeId,
            name: node.name || '',
            type: nodeType,
            position: this.extractPosition(node),
            size: this.extractSize(node),
            rotation: node.rotation || 0,
            isVisible: node.isVisible !== false,
            isLocked: node.isLocked === true,
            opacity: this.extractOpacity(node)
        };
        
        // 添加样式信息
        const styleInfo = this.styleExtractor.extractStyleInfo(node.style);
        baseInfo.style = styleInfo;
        
        // 根据节点类型添加特定信息
        switch (nodeType) {
            case 'text':
                baseInfo.text = this.styleExtractor.extractTextInfo(node.attributedString);
                break;
            case 'rectangle':
            case 'oval':
            case 'shapePath':
                baseInfo.shape = this.styleExtractor.extractShapeInfo(node);
                break;
            case 'bitmap':
                baseInfo.image = this.styleExtractor.extractImageInfo(node);
                break;
            case 'symbolInstance':
            case 'symbolMaster':
                baseInfo.symbol = this.styleExtractor.extractSymbolInfo(node);
                break;
            case 'group':
            case 'artboard':
                baseInfo.children = this.extractChildrenIds(node);
                break;
        }
        
        return baseInfo;
    }
    
    /**
     * 获取节点类型
     */
    private getNodeType(node: any): string {
        if (!node || !node._class) return 'unknown';
        
        switch (node._class) {
            case 'page': return 'page';
            case 'artboard': return 'artboard';
            case 'group': return 'group';
            case 'rectangle': return 'rectangle';
            case 'oval': return 'oval';
            case 'text': return 'text';
            case 'symbolInstance': return 'symbolInstance';
            case 'symbolMaster': return 'symbolMaster';
            case 'shapePath': return 'shapePath';
            case 'bitmap': return 'bitmap';
            case 'shapeGroup': return 'shapeGroup';
            case 'slice': return 'slice';
            default: return node._class || 'unknown';
        }
    }
    
    /**
     * 提取位置信息
     */
    private extractPosition(node: any): { x: number; y: number } {
        if (node.frame) {
            return {
                x: node.frame.x || 0,
                y: node.frame.y || 0
            };
        }
        return { x: 0, y: 0 };
    }
    
    /**
     * 提取尺寸信息
     */
    private extractSize(node: any): { width: number; height: number } {
        if (node.frame) {
            return {
                width: node.frame.width || 0,
                height: node.frame.height || 0
            };
        }
        return { width: 0, height: 0 };
    }
    
    /**
     * 提取透明度
     */
    private extractOpacity(node: any): number {
        if (node.style && node.style.contextSettings) {
            return node.style.contextSettings.opacity !== undefined 
                ? node.style.contextSettings.opacity 
                : 1;
        }
        return 1;
    }
    
    /**
     * 提取子节点ID列表
     */
    private extractChildrenIds(node: any): string[] {
        const children: string[] = [];
        
        if (Array.isArray(node.layers)) {
            for (const child of node.layers) {
                const childId = child.id || child.do_objectID;
                if (childId) {
                    children.push(childId);
                }
            }
        }
        
        return children;
    }
    
    /**
     * 提取页面信息
     */
    extractPageInfo(page: any): any {
        if (!page) return null;
        
        const pageId = page.id || page.do_objectID;
        let layerCount = 0;
        
        if (Array.isArray(page.layers)) {
            layerCount = this.countLayersRecursive(page.layers);
        }
        
        return {
            id: pageId,
            name: page.name || '',
            layerCount: layerCount,
            frame: page.frame || { x: 0, y: 0, width: 0, height: 0 },
            backgroundColor: this.extractBackgroundColor(page)
        };
    }
    
    /**
     * 递归计算层数
     */
    private countLayersRecursive(layers: any[]): number {
        let count = 0;
        
        for (const layer of layers) {
            count++; // 当前层
            
            if (Array.isArray(layer.layers)) {
                count += this.countLayersRecursive(layer.layers);
            }
        }
        
        return count;
    }
    
    /**
     * 提取背景色
     */
    private extractBackgroundColor(node: any): string {
        if (node.backgroundColor) {
            const color = this.styleExtractor.extractColor(node.backgroundColor);
            return color.hex;
        }
        return '#ffffff';
    }
    
    /**
     * 提取Symbol Master信息
     */
    extractSymbolMasterInfo(node: any): any {
        if (!node || node._class !== 'symbolMaster') return null;
        
        const baseInfo = this.extractNodeInfo(node);
        
        return {
            ...baseInfo,
            symbolID: node.symbolID || '',
            includeBackgroundColorInExport: node.includeBackgroundColorInExport || false,
            includeBackgroundColorInInstance: node.includeBackgroundColorInInstance || false,
            layers: this.extractChildrenIds(node)
        };
    }
    
    /**
     * 提取Symbol Instance信息
     */
    extractSymbolInstanceInfo(node: any): any {
        if (!node || node._class !== 'symbolInstance') return null;
        
        const baseInfo = this.extractNodeInfo(node);
        const overrides: any[] = [];
        
        if (Array.isArray(node.overrideValues)) {
            for (const override of node.overrideValues) {
                overrides.push({
                    overrideName: override.overrideName || '',
                    value: override.value
                });
            }
        }
        
        return {
            ...baseInfo,
            symbolID: node.symbolID || '',
            overrides: overrides
        };
    }
    
    /**
     * 批量提取节点信息
     */
    extractMultipleNodeInfo(nodes: any[]): any[] {
        const results: any[] = [];
        
        for (const node of nodes) {
            const nodeInfo = this.extractNodeInfo(node);
            if (nodeInfo) {
                results.push(nodeInfo);
            }
        }
        
        return results;
    }
}