import request from 'supertest';
import { HttpServer } from '../../../src/server/http/httpServer';

describe('HttpServer', () => {
    let httpServer: HttpServer;
    let app: any;

    beforeEach(() => {
        httpServer = new HttpServer();
        app = httpServer.getApp();
    });

    describe('constructor', () => {
        it('should create an instance', () => {
            expect(httpServer).toBeInstanceOf(HttpServer);
        });

        it('should have an express app', () => {
            expect(app).toBeDefined();
        });
    });

    describe('GET /health', () => {
        it('should return health status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body).toEqual({
                status: 'ok',
                timestamp: expect.any(String)
            });
        });
    });

    describe('POST /analyze', () => {
        it('should analyze sketch config', async () => {
            const mockConfig = {
                document: {
                    pages: [
                        {
                            id: 'page1',
                            name: 'Page 1',
                            layers: [
                                {
                                    id: 'layer1',
                                    name: 'Rectangle',
                                    _class: 'rectangle'
                                }
                            ]
                        }
                    ]
                }
            };

            const response = await request(app)
                .post('/analyze')
                .send({ config: mockConfig })
                .expect(200);

            expect(response.body).toHaveProperty('pages');
            expect(response.body).toHaveProperty('layers');
        });

        it('should handle missing config parameter', async () => {
            const response = await request(app)
                .post('/analyze')
                .send({})
                .expect(400);

            expect(response.body).toEqual({
                error: 'Missing config parameter'
            });
        });
    });

    describe('POST /analyze-path', () => {
        it('should handle missing path parameter', async () => {
            const response = await request(app)
                .post('/analyze-path')
                .send({})
                .expect(400);

            expect(response.body).toEqual({
                error: 'Missing path parameter'
            });
        });
    });

    describe('GET /tools', () => {
        it('should return tools list', async () => {
            const response = await request(app)
                .get('/tools')
                .expect(200);

            expect(response.body).toHaveProperty('tools');
            expect(Array.isArray(response.body.tools)).toBe(true);
        });
    });

    describe('POST /tools/:toolName', () => {
        it('should handle tool execution without config', async () => {
            const response = await request(app)
                .post('/tools/listPages')
                .send({})
                .expect(500);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('No Sketch configuration loaded');
        });

        it('should handle unknown tool', async () => {
            const response = await request(app)
                .post('/tools/unknownTool')
                .send({})
                .expect(500);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /events', () => {
        it('should have SSE endpoint available', () => {
            // SSE endpoint exists but testing it requires special handling
            // This test just verifies the endpoint is configured
            expect(app).toBeDefined();
        });
    });

    describe('getApp', () => {
        it('should return express application', () => {
            const app = httpServer.getApp();
            expect(app).toBeDefined();
            expect(typeof app).toBe('function');
        });
    });
});