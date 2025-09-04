# 测试套件说明

这个测试套件包含了完整的单元测试和集成测试，用于验证 sketch-mcp-server 的功能正确性。

## 测试文件结构

```
test/
├── README.md                 # 测试说明文档
├── setup.ts                  # 测试环境设置
├── testUtils.ts              # 测试工具函数
├── sketchConfigAnalyzer.test.ts  # SketchConfigAnalyzer 单元测试
├── tools.test.ts             # 工具函数单元测试
├── server.test.ts            # 服务器端点集成测试
└── integration.test.ts       # 完整工作流集成测试
```

## 运行测试

### 安装依赖
```bash
npm install
```

### 运行所有测试
```bash
npm test
```

### 运行特定类型的测试
```bash
# 只运行单元测试
npm run test:unit

# 只运行集成测试
npm run test:integration

# 运行测试并监听文件变化
npm run test:watch

# 运行测试并生成覆盖率报告
npm run test:coverage
```

## 测试覆盖范围

### 单元测试 (Unit Tests)

#### 1. SketchConfigAnalyzer 测试 (`sketchConfigAnalyzer.test.ts`)
- ✅ 配置分析功能
- ✅ 页面列表功能
- ✅ 节点列表和过滤功能
- ✅ 节点信息获取功能
- ✅ 节点位置获取功能
- ✅ 按名称查找节点功能
- ✅ 配置状态检查功能

#### 2. 工具函数测试 (`tools.test.ts`)
- ✅ 节点位置获取工具
- ✅ 节点信息获取工具
- ✅ 按名称查找节点工具
- ✅ 错误处理测试

### 集成测试 (Integration Tests)

#### 1. 服务器端点测试 (`server.test.ts`)
- ✅ MCP 工具列表端点
- ✅ loadSketchByPath 工具调用
- ✅ listPages 工具调用
- ✅ 错误处理测试

#### 2. 完整工作流测试 (`integration.test.ts`)
- ✅ 完整的 MCP 工作流程
- ✅ 文件系统集成测试
- ✅ 错误情况处理

## 测试工具函数

`testUtils.ts` 提供了以下工具函数：

### 数据生成函数
- `createMockSketchConfig()` - 创建模拟 Sketch 配置
- `createMockPage()` - 创建模拟页面
- `createMockNode()` - 创建模拟节点
- `createSimpleSketchConfig()` - 创建简单测试配置
- `createComplexSketchConfig()` - 创建复杂测试配置

### 辅助函数
- `countTotalLayers()` - 计算总图层数
- `findNodeById()` - 根据ID查找节点
- `createMockJsonRpcRequest()` - 创建模拟 JSON-RPC 请求
- `createMockJsonRpcResponse()` - 创建模拟 JSON-RPC 响应
- `createMockJsonRpcError()` - 创建模拟 JSON-RPC 错误

## 测试数据示例

### 简单 Sketch 配置
```typescript
const simpleConfig = createSimpleSketchConfig();
// 包含 2 个页面，3 个图层
```

### 复杂 Sketch 配置
```typescript
const complexConfig = createComplexSketchConfig();
// 包含嵌套图层组，用于测试复杂场景
```

## 覆盖率报告

运行 `npm run test:coverage` 后，可以在 `coverage/` 目录下查看详细的覆盖率报告：

- `coverage/lcov-report/index.html` - HTML 格式的覆盖率报告
- `coverage/lcov.info` - LCOV 格式的覆盖率数据

## 持续集成

这些测试可以集成到 CI/CD 流程中：

```yaml
# GitHub Actions 示例
- name: Run Tests
  run: npm test

- name: Generate Coverage Report
  run: npm run test:coverage
```

## 故障排除

### 常见问题

1. **测试超时**
   - 检查网络连接
   - 增加 Jest 超时时间

2. **Mock 文件系统问题**
   - 确保正确设置了 fs 模块的 mock
   - 检查文件路径是否正确

3. **TypeScript 编译错误**
   - 运行 `npm run build` 检查编译错误
   - 确保所有类型定义正确

### 调试测试

```bash
# 运行单个测试文件
npm test -- test/sketchConfigAnalyzer.test.ts

# 运行特定测试用例
npm test -- --testNamePattern="should analyze simple sketch config"

# 开启详细输出
npm test -- --verbose
```

## 添加新测试

当添加新功能时，请确保：

1. 为新功能编写单元测试
2. 更新集成测试以覆盖新功能
3. 运行所有测试确保没有破坏现有功能
4. 更新覆盖率报告

### 测试命名规范

- 测试文件：`*.test.ts`
- 测试套件：`describe('功能名称', () => {})`
- 测试用例：`it('should 预期行为', () => {})`

### 测试最佳实践

1. **AAA 模式**：Arrange（准备）、Act（执行）、Assert（断言）
2. **测试隔离**：每个测试应该独立运行
3. **描述性名称**：测试名称应该清楚描述测试内容
4. **最小化依赖**：使用 mock 减少外部依赖
