export interface SketchConfig {
    document: {
        id: string;
        name: string;
        pages: Page[];
    };
}

export interface Page {
    id: string;
    name: string;
    layers: Layer[];
}

export interface Layer {
    id: string;
    name: string;
    type: string;
    frame: Frame;
}

export interface Frame {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface NodeInfo {
    id: string;
    name: string;
    position: {
        x: number;
        y: number;
    };
    size: {
        width: number;
        height: number;
    };
}