/**
 * 定义Sketch相关的类型
 */

export interface SketchNode {
  id: string;
  name?: string;
  type?: string;
  _class?: string;
  layers?: SketchNode[];
  children?: SketchNode[];
  [key: string]: any;
}

export interface SketchPage {
  id: string;
  name: string;
  layers: SketchNode[];
  [key: string]: any;
}

export interface SketchDocument {
  id: string;
  name: string;
  pages: SketchPage[];
  [key: string]: any;
}

export interface SketchConfig {
  document: SketchDocument;
  [key: string]: any;
}

export interface NodePosition {
  x: number;
  y: number;
  width?: number;
  height?: number;
  absoluteX?: number;
  absoluteY?: number;
}

export interface NodeInfo {
  id: string;
  name: string;
  type: string;
  parentId: string | null;
  hasChildren: boolean;
  childCount: number;
}

export interface PageInfo {
  id: string;
  name: string;
  layerCount: number;
}