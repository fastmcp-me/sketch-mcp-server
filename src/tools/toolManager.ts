import { SketchConfigAnalyzer } from '../core/analyzer';
import { Tool } from '../core/types';
import { NodesSummaryTool } from './nodesSummaryTool';

/**
 * 工具管理器，统一管理所有MCP工具
 */
export class ToolManager {
  private analyzer: SketchConfigAnalyzer;
  private nodesSummaryTool: NodesSummaryTool;

  constructor(analyzer: SketchConfigAnalyzer) {
    this.analyzer = analyzer;
    this.nodesSummaryTool = new NodesSummaryTool(analyzer);
  }

  /**
   * 获取所有可用工具的定义
   */
  getToolDefinitions(): Tool[] {
    return [
      {
        name: 'getNodePosition',
        description: 'Get the position of a node by its ID',
        inputSchema: {
          type: 'object',
          properties: {
            nodeId: {
              type: 'string',
              description: 'The ID of the node'
            }
          },
          required: ['nodeId']
        }
      },
      {
        name: 'getNodeInfo',
        description: 'Get detailed information about a node by its ID',
        inputSchema: {
          type: 'object',
          properties: {
            nodeId: {
              type: 'string',
              description: 'The ID of the node'
            }
          },
          required: ['nodeId']
        }
      },
      {
        name: 'findNodesByName',
        description: 'Find nodes by name pattern',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'The name pattern to search for'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return',
              default: 10
            }
          },
          required: ['name']
        }
      },
      {
        name: 'listPages',
        description: 'List all pages in the Sketch document',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'listNodes',
        description: 'List nodes with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description: 'Filter by node type'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return',
              default: 50
            },
            offset: {
              type: 'number',
              description: 'Number of results to skip',
              default: 0
            }
          }
        }
      },
      {
        name: 'listNodesByPage',
        description: 'List nodes within a specific page',
        inputSchema: {
          type: 'object',
          properties: {
            pageId: {
              type: 'string',
              description: 'The ID of the page'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return',
              default: 50
            },
            type: {
              type: 'string',
              description: 'Filter by node type'
            },
            nameContains: {
              type: 'string',
              description: 'Filter by name containing this string'
            },
            offset: {
              type: 'number',
              description: 'Number of results to skip',
              default: 0
            }
          },
          required: ['pageId']
        }
      },
      {
        name: 'loadSketchByPath',
        description: 'Load a Sketch file from a file path',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'The file path to the Sketch file'
            }
          },
          required: ['path']
        }
      },
      {
        name: 'loadSketchByConfig',
        description: 'Load a Sketch configuration object',
        inputSchema: {
          type: 'object',
          properties: {
            cfg: {
              type: 'object',
              description: 'The Sketch configuration object'
            }
          },
          required: ['cfg']
        }
      },
      {
        name: 'getMultipleNodeInfo',
        description: 'Get detailed information for multiple nodes by their IDs in a single call',
        inputSchema: {
          type: 'object',
          properties: {
            nodeIds: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of node IDs to get information for',
              maxItems: 100
            }
          },
          required: ['nodeIds']
        }
      },
      {
        name: 'getPageStructure',
        description: 'Get complete hierarchical structure of a page with all node information',
        inputSchema: {
          type: 'object',
          properties: {
            pageId: {
              type: 'string',
              description: 'The ID of the page'
            },
            includeDetails: {
              type: 'boolean',
              description: 'Whether to include detailed node information (position, size, etc.)',
              default: true
            },
            maxDepth: {
              type: 'number',
              description: 'Maximum depth of hierarchy to return',
              default: 10
            }
          },
          required: ['pageId']
        }
      },
      {
        name: 'getDocumentStructure',
        description: 'Get complete document structure with all pages and their hierarchies',
        inputSchema: {
          type: 'object',
          properties: {
            includeDetails: {
              type: 'boolean',
              description: 'Whether to include detailed node information',
              default: false
            },
            maxNodesPerPage: {
              type: 'number',
              description: 'Maximum number of nodes to return per page',
              default: 200
            },
            fields: {
              type: 'array',
              items: { type: 'string' },
              description: 'Specific fields to include in response (e.g., ["id", "name", "type"])'
            },
            excludeFields: {
              type: 'array',
              items: { type: 'string' },
              description: 'Fields to exclude from response (e.g., ["style", "position"])'
            },
            summaryMode: {
              type: 'boolean',
              description: 'Return summary with statistics instead of full structure',
              default: false
            },
            maxDepth: {
              type: 'number',
              description: 'Maximum depth of hierarchy to return',
              default: 3
            },
            groupSimilar: {
              type: 'boolean',
              description: 'Group similar nodes to reduce data size',
              default: false
            }
          }
        }
      },
      {
        name: 'getSymbolMasters',
        description: 'Get all Symbol Masters in the Sketch document',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'getSymbolInstances',
        description: 'Get all Symbol Instances in the Sketch document',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'getSymbolMasterBySymbolID',
        description: 'Get Symbol Master by its Symbol ID',
        inputSchema: {
          type: 'object',
          properties: {
            symbolID: {
              type: 'string',
              description: 'The Symbol ID to search for'
            }
          },
          required: ['symbolID']
        }
      },
      {
        name: 'getSymbolInstanceStyles',
        description: 'Get styles from Symbol Instance including overrides applied to Symbol Master',
        inputSchema: {
          type: 'object',
          properties: {
            instanceId: {
              type: 'string',
              description: 'The ID of the Symbol Instance'
            }
          },
          required: ['instanceId']
        }
      },
      {
        name: 'getNodesSummary',
        description: 'Get summary of nodes with statistics and grouping to reduce token usage',
        inputSchema: {
          type: 'object',
          properties: {
            pageId: {
              type: 'string',
              description: 'Optional page ID to limit summary to specific page'
            },
            groupBy: {
              type: 'string',
              enum: ['type', 'style', 'position', 'size'],
              default: 'type',
              description: 'How to group nodes for summary'
            },
            includeStats: {
              type: 'boolean',
              default: true,
              description: 'Include statistical analysis'
            },
            maxSamples: {
              type: 'number',
              default: 5,
              description: 'Maximum sample nodes per group'
            }
          }
        }
      },
      {
        name: 'renderNodeAsBase64',
        description: 'Render a node as Base64 encoded image (SVG format) for AI to visualize the actual appearance',
        inputSchema: {
          type: 'object',
          properties: {
            nodeId: {
              type: 'string',
              description: 'The ID of the node to render as image'
            },
            format: {
              type: 'string',
              enum: ['svg', 'png'],
              default: 'svg',
              description: 'The output image format'
            }
          },
          required: ['nodeId']
        }
      }
    ];
  }

  /**
   * 调用指定的工具
   */
  async callTool(name: string, args: any): Promise<any> {
    if (!this.analyzer.hasConfig()) {
      if (name !== 'loadSketchByPath' && name !== 'loadSketchByConfig') {
        throw new Error('No Sketch configuration loaded. Please load a Sketch file first.');
      }
    }

    switch (name) {
      case 'getNodePosition':
        return this.analyzer.getNodePosition(args.nodeId);
      
      case 'getNodeInfo':
        return this.analyzer.getNodeInfo(args.nodeId);
      
      case 'findNodesByName': {
        const results = this.analyzer.findNodesByName(args.name);
        const limit = args.limit || 10;
        return results.slice(0, limit);
      }
      
      case 'listPages':
        return this.analyzer.listPages();
      
      case 'listNodes':
        return this.analyzer.listNodes(args.type, args.limit, args.offset);
      
      case 'listNodesByPage': {
        const { pageId, limit = 50, type, nameContains, offset = 0 } = args;
        const result = this.analyzer.listNodesByPage(pageId, limit, type, nameContains, offset);
        const pageInfo = this.analyzer.getPageInfo(pageId);
        return {
          page: pageInfo,
          nodes: result || [],
          total: result.length || 0,
          limit,
          offset
        };
      }
      
      case 'loadSketchByConfig': {
        const result = this.analyzer.analyzeConfig(args.cfg);
        return {
          pages: result.pages,
          layers: result.layers
        };
      }
      
      case 'loadSketchByPath': {
        const { loadSketchConfigFromPath } = await import('../core/file');
        try {
          const config = await loadSketchConfigFromPath(args.path);
          const result = this.analyzer.analyzeConfig(config);
          return {
            pages: result.pages,
            layers: result.layers
          };
        } catch (error) {
          throw new Error(`Failed to load Sketch file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      case 'getMultipleNodeInfo': {
        const { nodeIds } = args;
        if (!Array.isArray(nodeIds)) {
          throw new Error('nodeIds must be an array');
        }
        if (nodeIds.length > 100) {
          throw new Error('Maximum 100 node IDs allowed per request');
        }
        
        const results: any[] = [];
        for (const nodeId of nodeIds) {
          const info = this.analyzer.getNodeInfo(nodeId);
          if (info) {
            results.push(info);
          }
        }
        return {
          nodes: results,
          total: results.length,
          requested: nodeIds.length
        };
      }
      
      case 'getPageStructure': {
        const { pageId, includeDetails = true, maxDepth = 10 } = args;
        return this.analyzer.getPageStructure(pageId, includeDetails, maxDepth);
      }
      
      case 'getDocumentStructure': {
        const { 
          includeDetails = false, 
          maxNodesPerPage = 200,
          fields,
          excludeFields,
          summaryMode = false,
          maxDepth = 3,
          groupSimilar = false
        } = args;
        
        const options = {
          fields,
          excludeFields,
          summaryMode,
          maxDepth,
          groupSimilar
        };
        
        return this.analyzer.getDocumentStructure(includeDetails, maxNodesPerPage, options);
      }
      
      case 'getSymbolMasters':
        return this.analyzer.getSymbolMasters();
      
      case 'getSymbolInstances':
        return this.analyzer.getSymbolInstances();
      
      case 'getSymbolMasterBySymbolID':
        return this.analyzer.getSymbolMasterBySymbolID(args.symbolID);
      
      case 'getSymbolInstanceStyles':
        return this.analyzer.getSymbolInstanceStyles(args.instanceId);
      
      case 'getNodesSummary': {
        const { pageId, groupBy = 'type', includeStats = true, maxSamples = 5 } = args;
        return this.nodesSummaryTool.getNodesSummary({
          pageId,
          groupBy,
          includeStats,
          maxSamples
        });
      }
      
      case 'renderNodeAsBase64': {
        const { nodeId, format = 'svg' } = args;
        return this.analyzer.renderNodeAsBase64(nodeId, format);
      }
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
}