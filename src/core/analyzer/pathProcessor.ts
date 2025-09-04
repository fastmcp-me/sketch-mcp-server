/**
 * 路径处理器 - 负责处理Sketch路径数据并转换为SVG路径
 */
export class PathProcessor {
    
    /**
     * 将Sketch points数组转换为SVG路径数据
     */
    pointsToPathData(points: any[], nodeFrame?: any): string {
        if (!points || points.length === 0) {
            return 'M 0 0';
        }
        
        const width = nodeFrame?.width || 100;
        const height = nodeFrame?.height || 100;
        
        let pathData = '';
        
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            const { x, y } = this.parsePointCoordinates(point, width, height);
            
            if (i === 0) {
                pathData += `M ${x.toFixed(2)} ${y.toFixed(2)}`;
            } else {
                // 检查是否有曲线控制点
                if (point.hasCurveFrom || point.hasCurveTo) {
                    const { cp1x, cp1y, cp2x, cp2y } = this.parseCurveControlPoints(point, points[i-1], width, height);
                    pathData += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)}`;
                } else {
                    pathData += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
                }
            }
        }
        
        // 检查是否需要闭合路径
        if (points.length > 2 && this.shouldClosePath(points)) {
            pathData += ' Z';
        }
        
        return pathData;
    }
    
    /**
     * 解析点坐标
     */
    private parsePointCoordinates(point: any, width: number, height: number): { x: number; y: number } {
        let relativeX = 0;
        let relativeY = 0;
        
        // 尝试不同的坐标格式
        if (point.point) {
            if (typeof point.point === 'string') {
                // 解析字符串格式的坐标，如 "{0, 0.5}"
                const coords = point.point.match(/([\d.-]+)/g);
                if (coords && coords.length >= 2) {
                    relativeX = parseFloat(coords[0]);
                    relativeY = parseFloat(coords[1]);
                }
            } else if (typeof point.point === 'object') {
                // 对象格式的坐标
                relativeX = point.point.x || 0;
                relativeY = point.point.y || 0;
            }
        } else if (point.x !== undefined && point.y !== undefined) {
            // 直接的x, y坐标
            relativeX = point.x;
            relativeY = point.y;
        }
        
        // 转换为绝对坐标
        const x = relativeX * width;
        const y = relativeY * height;
        
        return { x, y };
    }
    
    /**
     * 解析曲线控制点
     */
    private parseCurveControlPoints(currentPoint: any, previousPoint: any, width: number, height: number): {
        cp1x: number; cp1y: number; cp2x: number; cp2y: number;
    } {
        let cp1x = 0, cp1y = 0, cp2x = 0, cp2y = 0;
        
        // 解析前一个点的curveTo（控制点1）
        if (previousPoint && previousPoint.curveTo) {
            const { x: prevX, y: prevY } = this.parsePointCoordinates(previousPoint, width, height);
            const curveTo = this.parseCoordinateString(previousPoint.curveTo);
            cp1x = prevX + curveTo.x * width;
            cp1y = prevY + curveTo.y * height;
        }
        
        // 解析当前点的curveFrom（控制点2）
        if (currentPoint.curveFrom) {
            const { x: currX, y: currY } = this.parsePointCoordinates(currentPoint, width, height);
            const curveFrom = this.parseCoordinateString(currentPoint.curveFrom);
            cp2x = currX + curveFrom.x * width;
            cp2y = currY + curveFrom.y * height;
        }
        
        return { cp1x, cp1y, cp2x, cp2y };
    }
    
    /**
     * 解析坐标字符串
     */
    private parseCoordinateString(coordStr: string): { x: number; y: number } {
        if (typeof coordStr === 'string') {
            const coords = coordStr.match(/([\d.-]+)/g);
            if (coords && coords.length >= 2) {
                return {
                    x: parseFloat(coords[0]),
                    y: parseFloat(coords[1])
                };
            }
        }
        return { x: 0, y: 0 };
    }
    
    /**
     * 判断是否应该闭合路径
     */
    private shouldClosePath(points: any[]): boolean {
        if (points.length < 3) return false;
        
        // 检查第一个点和最后一个点是否接近
        const firstPoint = points[0];
        const lastPoint = points[points.length - 1];
        
        const first = this.parseCoordinateString(firstPoint.point || '{0,0}');
        const last = this.parseCoordinateString(lastPoint.point || '{0,0}');
        
        const threshold = 0.001; // 很小的阈值
        const distance = Math.sqrt(
            Math.pow(first.x - last.x, 2) + Math.pow(first.y - last.y, 2)
        );
        
        return distance < threshold;
    }
    
    /**
     * 从原始节点提取路径数据
     */
    extractPathFromNode(rawNode: any): string | null {
        if (!rawNode) return null;
        
        // 尝试从path.pathData获取
        if (rawNode.path && rawNode.path.pathData) {
            return rawNode.path.pathData;
        }
        
        // 尝试从points数组构建
        if (rawNode.points && Array.isArray(rawNode.points)) {
            return this.pointsToPathData(rawNode.points, rawNode.frame);
        }
        
        return null;
    }
    
    /**
     * 优化路径数据
     */
    optimizePathData(pathData: string): string {
        if (!pathData) return '';
        
        // 移除多余的空格
        let optimized = pathData.replace(/\s+/g, ' ').trim();
        
        // 简化连续的相同命令
        optimized = optimized.replace(/([ML])\s+([ML])/g, '$1 $2');
        
        // 移除不必要的小数位
        optimized = optimized.replace(/([\d]+)\.00/g, '$1');
        
        return optimized;
    }
    
    /**
     * 验证路径数据是否有效
     */
    isValidPathData(pathData: string): boolean {
        if (!pathData || typeof pathData !== 'string') return false;
        
        // 检查是否包含基本的路径命令
        const hasValidCommands = /[MLHVCSQTAZ]/i.test(pathData);
        
        // 检查是否有坐标数据
        const hasCoordinates = /[\d.-]+/.test(pathData);
        
        return hasValidCommands && hasCoordinates;
    }
    
    /**
     * 获取路径边界框
     */
    getPathBounds(pathData: string): { x: number; y: number; width: number; height: number } | null {
        if (!this.isValidPathData(pathData)) return null;
        
        // 简单的边界框计算（提取所有数字坐标）
        const numbers = pathData.match(/[\d.-]+/g);
        if (!numbers || numbers.length < 2) return null;
        
        const coords = numbers.map(n => parseFloat(n));
        const xCoords = coords.filter((_, i) => i % 2 === 0);
        const yCoords = coords.filter((_, i) => i % 2 === 1);
        
        if (xCoords.length === 0 || yCoords.length === 0) return null;
        
        const minX = Math.min(...xCoords);
        const maxX = Math.max(...xCoords);
        const minY = Math.min(...yCoords);
        const maxY = Math.max(...yCoords);
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
}