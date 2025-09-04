/**
 * 节点摘要工具 - 提供高效的节点统计和摘要信息
 */
import { SketchConfigAnalyzer } from '../core/analyzer';

export interface NodesSummaryOptions {
    pageId?: string;
    groupBy?: 'type' | 'style' | 'position' | 'size';
    includeStats?: boolean;
    maxSamples?: number;
}

export class NodesSummaryTool {
    private analyzer: SketchConfigAnalyzer;

    constructor(analyzer: SketchConfigAnalyzer) {
        this.analyzer = analyzer;
    }

    /**
     * 获取节点摘要
     */
    getNodesSummary(options: NodesSummaryOptions = {}): any {
        const {
            pageId,
            groupBy = 'type',
            includeStats = true,
            maxSamples = 5
        } = options;

        if (pageId) {
            return this.getPageNodesSummary(pageId, groupBy, includeStats, maxSamples);
        } else {
            return this.getDocumentNodesSummary(groupBy, includeStats, maxSamples);
        }
    }

    /**
     * 获取页面节点摘要
     */
    private getPageNodesSummary(
        pageId: string,
        groupBy: string,
        includeStats: boolean,
        maxSamples: number
    ): any {
        const page = this.analyzer.getRawNode(pageId);
        if (!page) {
            return { error: 'Page not found' };
        }

        const groups: { [key: string]: any } = {};
        let totalNodes = 0;

        const processNode = (node: any) => {
            totalNodes++;
            const groupKey = this.getGroupKey(node, groupBy);
            
            if (!groups[groupKey]) {
                groups[groupKey] = {
                    count: 0,
                    sampleIds: [],
                    samples: []
                };
            }

            groups[groupKey].count++;
            
            if (groups[groupKey].sampleIds.length < maxSamples) {
                const nodeId = node.id || node.do_objectID;
                groups[groupKey].sampleIds.push(nodeId);
                groups[groupKey].samples.push({
                    id: nodeId,
                    name: node.name || '',
                    type: node._class || 'unknown'
                });
            }

            if (Array.isArray(node.layers)) {
                for (const child of node.layers) {
                    processNode(child);
                }
            }
        };

        if (Array.isArray(page.layers)) {
            for (const layer of page.layers) {
                processNode(layer);
            }
        }

        const result: any = {
            pageId,
            pageName: page.name || '',
            totalNodes,
            groups
        };

        if (includeStats) {
            result.statistics = this.generateStatistics(groups, totalNodes);
        }

        return result;
    }

    /**
     * 获取文档节点摘要
     */
    private getDocumentNodesSummary(
        groupBy: string,
        includeStats: boolean,
        maxSamples: number
    ): any {
        const pages = this.analyzer.listPages();
        const documentGroups: { [key: string]: any } = {};
        let documentTotalNodes = 0;
        const pagesSummary: any[] = [];

        for (const page of pages) {
            const pageSummary = this.getPageNodesSummary(
                page.id,
                groupBy,
                false,
                maxSamples
            );

            if (pageSummary && !pageSummary.error) {
                documentTotalNodes += pageSummary.totalNodes;
                pagesSummary.push({
                    pageId: page.id,
                    pageName: page.name,
                    nodeCount: pageSummary.totalNodes,
                    topGroups: this.getTopGroups(pageSummary.groups, 3)
                });

                // 合并到文档级别的组
                for (const [groupKey, groupData] of Object.entries(pageSummary.groups)) {
                    if (!documentGroups[groupKey]) {
                        documentGroups[groupKey] = {
                            count: 0,
                            sampleIds: [],
                            samples: [],
                            pages: []
                        };
                    }

                    documentGroups[groupKey].count += (groupData as any).count;
                    documentGroups[groupKey].pages.push(page.id);

                    // 添加样本（避免重复）
                    const existingSampleIds = new Set(documentGroups[groupKey].sampleIds);
                    for (const sample of (groupData as any).samples) {
                        if (!existingSampleIds.has(sample.id) && 
                            documentGroups[groupKey].samples.length < maxSamples) {
                            documentGroups[groupKey].sampleIds.push(sample.id);
                            documentGroups[groupKey].samples.push(sample);
                            existingSampleIds.add(sample.id);
                        }
                    }
                }
            }
        }

        const result: any = {
            totalPages: pages.length,
            totalNodes: documentTotalNodes,
            groups: documentGroups,
            pages: pagesSummary
        };

        if (includeStats) {
            result.statistics = this.generateStatistics(documentGroups, documentTotalNodes);
        }

        return result;
    }

    /**
     * 获取分组键
     */
    private getGroupKey(node: any, groupBy: string): string {
        switch (groupBy) {
            case 'type':
                return node._class || 'unknown';
            case 'style':
                return this.getStyleSignature(node);
            case 'position':
                return this.getPositionGroup(node);
            case 'size':
                return this.getSizeGroup(node);
            default:
                return node._class || 'unknown';
        }
    }

    /**
     * 获取样式签名
     */
    private getStyleSignature(node: any): string {
        if (!node.style) return 'no-style';
        
        const fills = node.style.fills?.length || 0;
        const borders = node.style.borders?.length || 0;
        const shadows = node.style.shadows?.length || 0;
        
        return `fills:${fills}-borders:${borders}-shadows:${shadows}`;
    }

    /**
     * 获取位置分组
     */
    private getPositionGroup(node: any): string {
        if (!node.frame) return 'no-position';
        
        const x = Math.floor((node.frame.x || 0) / 100) * 100;
        const y = Math.floor((node.frame.y || 0) / 100) * 100;
        
        return `x:${x}-y:${y}`;
    }

    /**
     * 获取尺寸分组
     */
    private getSizeGroup(node: any): string {
        if (!node.frame) return 'no-size';
        
        const width = node.frame.width || 0;
        const height = node.frame.height || 0;
        
        if (width < 50 && height < 50) return 'small';
        if (width < 200 && height < 200) return 'medium';
        if (width < 500 && height < 500) return 'large';
        return 'xlarge';
    }

    /**
     * 生成统计信息
     */
    private generateStatistics(groups: { [key: string]: any }, totalNodes: number): any {
        const groupEntries = Object.entries(groups);
        const sortedGroups = groupEntries.sort((a, b) => b[1].count - a[1].count);
        
        return {
            totalGroups: groupEntries.length,
            largestGroup: sortedGroups[0] ? {
                key: sortedGroups[0][0],
                count: sortedGroups[0][1].count,
                percentage: ((sortedGroups[0][1].count / totalNodes) * 100).toFixed(1)
            } : null,
            distribution: sortedGroups.slice(0, 5).map(([key, data]) => ({
                key,
                count: data.count,
                percentage: ((data.count / totalNodes) * 100).toFixed(1)
            }))
        };
    }

    /**
     * 获取顶部分组
     */
    private getTopGroups(groups: { [key: string]: any }, limit: number): any[] {
        return Object.entries(groups)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, limit)
            .map(([key, data]) => ({
                key,
                count: data.count
            }));
    }
}