export interface MockSketchNode {
  id: string;
  name: string;
  type?: string;
  frame?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  layers?: MockSketchNode[];
}

export interface MockSketchPage {
  id: string;
  name: string;
  layers: MockSketchNode[];
}

export interface MockSketchConfig {
  document: {
    id: string;
    name: string;
    pages: MockSketchPage[];
  };
}

export function createMockSketchConfig(
  pages: MockSketchPage[] = [],
  documentName: string = 'Test Sketch'
): MockSketchConfig {
  return {
    document: {
      id: 'doc1',
      name: documentName,
      pages
    }
  };
}

export function createMockPage(
  id: string,
  name: string,
  layers: MockSketchNode[] = []
): MockSketchPage {
  return { id, name, layers };
}

export function createMockNode(
  id: string,
  name: string,
  type: string = 'shape',
  frame?: { x: number; y: number; width: number; height: number },
  layers: MockSketchNode[] = []
): MockSketchNode {
  return {
    id,
    name,
    type,
    frame,
    layers: layers.length > 0 ? layers : undefined
  };
}

export function createSimpleSketchConfig(): MockSketchConfig {
  return createMockSketchConfig([
    createMockPage('page1', 'Page 1', [
      createMockNode('layer1', 'Button', 'shape', { x: 100, y: 200, width: 200, height: 50 }),
      createMockNode('layer2', 'Text Label', 'text', { x: 150, y: 250, width: 100, height: 30 })
    ]),
    createMockPage('page2', 'Page 2', [
      createMockNode('layer3', 'Another Button', 'shape', { x: 200, y: 300, width: 150, height: 40 })
    ])
  ]);
}

export function createComplexSketchConfig(): MockSketchConfig {
  return createMockSketchConfig([
    createMockPage('page1', 'Main Page', [
      createMockNode('group1', 'Button Group', 'group', { x: 100, y: 100, width: 300, height: 200 }, [
        createMockNode('button1', 'Primary Button', 'shape', { x: 110, y: 110, width: 120, height: 40 }),
        createMockNode('button2', 'Secondary Button', 'shape', { x: 250, y: 110, width: 120, height: 40 })
      ]),
      createMockNode('text1', 'Header Text', 'text', { x: 100, y: 320, width: 200, height: 30 }),
      createMockNode('image1', 'Logo', 'image', { x: 100, y: 360, width: 80, height: 80 })
    ])
  ]);
}

export function countTotalLayers(config: MockSketchConfig): number {
  let count = 0;
  
  function countLayersInNode(node: MockSketchNode): number {
    let nodeCount = 1; // Count the node itself
    if (node.layers) {
      for (const child of node.layers) {
        nodeCount += countLayersInNode(child);
      }
    }
    return nodeCount;
  }
  
  for (const page of config.document.pages) {
    for (const layer of page.layers) {
      count += countLayersInNode(layer);
    }
  }
  
  return count;
}

export function findNodeById(config: MockSketchConfig, nodeId: string): MockSketchNode | null {
  function searchInNode(node: MockSketchNode): MockSketchNode | null {
    if (node.id === nodeId) {
      return node;
    }
    if (node.layers) {
      for (const child of node.layers) {
        const found = searchInNode(child);
        if (found) return found;
      }
    }
    return null;
  }
  
  for (const page of config.document.pages) {
    for (const layer of page.layers) {
      const found = searchInNode(layer);
      if (found) return found;
    }
  }
  
  return null;
}

export function createMockJsonRpcRequest(
  method: string,
  params: any = {},
  id: number = 1
): any {
  return {
    jsonrpc: '2.0',
    id,
    method,
    params
  };
}

export function createMockJsonRpcResponse(
  result: any,
  id: number = 1
): any {
  return {
    jsonrpc: '2.0',
    id,
    result
  };
}

export function createMockJsonRpcError(
  code: number,
  message: string,
  id: number = 1
): any {
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message
    }
  };
}
