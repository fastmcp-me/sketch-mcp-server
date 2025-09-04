import { SketchConfigAnalyzer } from '../core/analyzer';

export function createNodePositionTool(analyzer: SketchConfigAnalyzer) {
    return {
        getNodePosition: (nodeId: string) => analyzer.getNodePosition(nodeId),
        getNodeInfo: (nodeId: string) => analyzer.getNodeInfo(nodeId),
        findNodesByName: (name: string) => analyzer.findNodesByName(name)
    };
}