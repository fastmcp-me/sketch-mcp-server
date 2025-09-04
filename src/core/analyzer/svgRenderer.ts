/**
 * SVG渲染器 - 负责将Sketch节点渲染为SVG
 */
export class SvgRenderer {
    
    /**
     * 渲染节点为SVG
     */
    renderNodeAsSVG(nodeInfo: any): any {
        const { size, name } = nodeInfo;
        const width = size.width || 100;
        const height = size.height || 100;
        
        let svgContent = '';
        
        switch (nodeInfo.type) {
            case 'rectangle':
            case 'shape':
                svgContent = this.generateRectangleSVG(nodeInfo);
                break;
            case 'oval':
                svgContent = this.generateOvalSVG(nodeInfo);
                break;
            case 'text':
                svgContent = this.generateTextSVG(nodeInfo);
                break;
            case 'symbolInstance':
                svgContent = this.generateSymbolInstanceSVG(nodeInfo);
                break;
            case 'group':
                svgContent = this.generateGroupSVG(nodeInfo);
                break;
            case 'artboard':
                svgContent = this.generateArtboardSVG(nodeInfo);
                break;
            case 'shapePath':
                svgContent = this.generateShapePathSVG(nodeInfo);
                break;
            default:
                svgContent = this.generateDefaultShapeSVG(nodeInfo);
        }

        const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`;
        const base64 = Buffer.from(svg).toString('base64');
        
        return {
            nodeId: nodeInfo.id,
            name: name,
            format: 'svg',
            width: width,
            height: height,
            imageData: `data:image/svg+xml;base64,${base64}`,
            svgContent: svg
        };
    }

    /**
     * 生成矩形SVG
     */
    private generateRectangleSVG(nodeInfo: any): string {
        const { size, style } = nodeInfo;
        const width = size.width || 100;
        const height = size.height || 100;
        
        let fill = '#cccccc';
        let stroke = 'none';
        let strokeWidth = 0;
        let rx = 0;
        
        if (style && style.fills && style.fills.length > 0) {
            const fillStyle = style.fills[0];
            fill = fillStyle.color?.hex || fill;
        }
        
        if (style && style.borders && style.borders.length > 0) {
            const borderStyle = style.borders[0];
            stroke = borderStyle.color?.hex || '#000000';
            strokeWidth = borderStyle.thickness || 1;
        }
        
        if (nodeInfo.shape && nodeInfo.shape.cornerRadius) {
            rx = nodeInfo.shape.cornerRadius;
        }
        
        return `<rect x="0" y="0" width="${width}" height="${height}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
    }

    /**
     * 生成椭圆SVG
     */
    private generateOvalSVG(nodeInfo: any): string {
        const { size, style } = nodeInfo;
        const width = size.width || 100;
        const height = size.height || 100;
        const cx = width / 2;
        const cy = height / 2;
        const rx = width / 2;
        const ry = height / 2;
        
        let fill = '#cccccc';
        let stroke = 'none';
        let strokeWidth = 0;
        
        if (style && style.fills && style.fills.length > 0) {
            const fillStyle = style.fills[0];
            fill = fillStyle.color?.hex || fill;
        }
        
        if (style && style.borders && style.borders.length > 0) {
            const borderStyle = style.borders[0];
            stroke = borderStyle.color?.hex || '#000000';
            strokeWidth = borderStyle.thickness || 1;
        }
        
        return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
    }

    /**
     * 生成文本SVG
     */
    private generateTextSVG(nodeInfo: any): string {
        const { size, text } = nodeInfo;
        const width = size.width || 100;
        const height = size.height || 100;
        
        const content = text?.content || 'Text';
        const fontSize = text?.fontSize || 12;
        const fontFamily = text?.fontFamily || 'Arial';
        const color = text?.color || '#000000';
        
        const x = 10;
        const y = fontSize + 5;
        
        return `<text x="${x}" y="${y}" font-family="${fontFamily}" font-size="${fontSize}" fill="${color}">${this.escapeXML(content)}</text>`;
    }

    /**
     * 生成Symbol实例SVG
     */
    private generateSymbolInstanceSVG(nodeInfo: any): string {
        const { size } = nodeInfo;
        const width = size.width || 100;
        const height = size.height || 100;
        
        return `<rect x="0" y="0" width="${width}" height="${height}" fill="#e0e0e0" stroke="#999999" stroke-width="1" stroke-dasharray="3,3"/>
                <text x="${width/2}" y="${height/2}" font-family="Arial" font-size="10" fill="#666666" text-anchor="middle" dominant-baseline="middle">Symbol</text>`;
    }

    /**
     * 生成Group SVG
     */
    generateGroupSVG(nodeInfo: any, childRenderer?: (childId: string) => string): string {
        const { size } = nodeInfo;
        const width = size.width || 100;
        const height = size.height || 100;
        
        let childrenSVG = '';
        
        // 如果提供了子节点渲染器，使用它来渲染子节点
        if (childRenderer && nodeInfo.children) {
            for (const childId of nodeInfo.children) {
                const childSVG = childRenderer(childId);
                if (childSVG) {
                    childrenSVG += `<g transform="translate(0, 0)">${childSVG}</g>`;
                }
            }
        }
        
        // 如果有子节点内容，添加Group背景（可选）
        if (childrenSVG) {
            const backgroundRect = `<rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="none"/>`;
            return backgroundRect + childrenSVG;
        }
        
        // 如果没有子节点或渲染失败，显示Group占位符
        return `<rect x="0" y="0" width="${width}" height="${height}" fill="#f8f8f8" stroke="#cccccc" stroke-width="1" stroke-dasharray="3,3"/>
                <text x="${width/2}" y="${height/2}" font-family="Arial" font-size="12" fill="#999999" text-anchor="middle" dominant-baseline="middle">Group</text>`;
    }

    /**
     * 生成Artboard SVG
     */
    private generateArtboardSVG(nodeInfo: any): string {
        const { size, style } = nodeInfo;
        const width = size.width || 100;
        const height = size.height || 100;
        
        let backgroundColor = '#ffffff';
        
        if (style && style.fills && style.fills.length > 0) {
            const fill = style.fills[0];
            if (fill.color) {
                backgroundColor = fill.color.hex || '#ffffff';
            }
        }
        
        return `<rect x="0" y="0" width="${width}" height="${height}" fill="${backgroundColor}" stroke="#dddddd" stroke-width="2"/>
                <text x="10" y="20" font-family="Arial" font-size="12" fill="#666666">${nodeInfo.name || 'Artboard'}</text>`;
    }

    /**
     * 生成ShapePath SVG
     */
    generateShapePathSVG(nodeInfo: any, pathData?: string): string {
        if (!pathData) {
            return this.generateDefaultShapeSVG(nodeInfo);
        }
        
        const { style } = nodeInfo;
        let fillColor = '#cccccc';
        let strokeColor = 'none';
        let strokeWidth = 0;
        
        if (style) {
            // 填充颜色
            if (style.fills && style.fills.length > 0) {
                const fill = style.fills[0];
                if (fill.color) {
                    fillColor = fill.color.hex || fillColor;
                }
            }
            
            // 描边信息
            if (style.borders && style.borders.length > 0) {
                const border = style.borders[0];
                if (border.color) {
                    strokeColor = border.color.hex || '#000000';
                    strokeWidth = border.thickness || 1;
                }
            }
        }
        
        return `<path d="${pathData}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
    }

    /**
     * 生成默认形状SVG
     */
    private generateDefaultShapeSVG(nodeInfo: any): string {
        const { size } = nodeInfo;
        const width = size.width || 100;
        const height = size.height || 100;
        
        return `<rect x="0" y="0" width="${width}" height="${height}" fill="#f0f0f0" stroke="#cccccc" stroke-width="1"/>
                <text x="${width/2}" y="${height/2}" font-family="Arial" font-size="10" fill="#999999" text-anchor="middle" dominant-baseline="middle">${nodeInfo.type}</text>`;
    }

    /**
     * XML转义
     */
    private escapeXML(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}