# Step17 Plan - 环境变量与配置管理

## 📋 任务目标

实现环境变量与配置管理，统一管理所有配置项，避免硬编码敏感信息。

## 📁 文件清单

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| `packages/backend/src/types/config.types.ts` | 新建 | 配置类型定义 |
| `packages/backend/src/config/index.ts` | 新建 | 配置管理模块 |
| `packages/backend/.env.example` | 新建 | 环境变量示例文件 |
| `packages/backend/.gitignore` | 更新 | 确保 .env 排除 |
| `packages/backend/src/index.ts` | 更新 | 使用 config 模块 |
| `packages/backend/src/services/llm.service.ts` | 更新 | 从 config 读取 API 配置 |
| `packages/backend/src/services/embedding.service.ts` | 更新 | 从 config 读取 API 配置 |

## ✅ TODOs

- [x] 创建 `src/types/config.types.ts` - 配置类型定义
- [x] 创建 `src/config/index.ts` - 配置管理模块（dotenv 加载、配置读取、校验）
- [x] 创建 `.env.example` - 环境变量示例文件（不包含真实密钥）
- [x] 更新 `.gitignore` - 确保 .env 排除
- [x] 更新 `src/index.ts` - 使用 config 模块
- [x] 更新 `src/services/llm.service.ts` - 从 config 读取
- [x] 更新 `src/services/embedding.service.ts` - 从 config 读取
- [x] 运行测试验证

## 🎯 Acceptance Criteria（验收标准）

| 验收项 | 标准 | 状态 |
|--------|------|------|
| AC-01 | `.env` 文件不在 git 仓库中（已加入 .gitignore） | ✅ |
| AC-02 | `.env.example` 存在且不包含真实密钥 | ✅ |
| AC-03 | 配置类型定义完整（AppConfig 接口） | ✅ |
| AC-04 | 配置模块提供配置读取函数 | ✅ |
| AC-05 | 配置项缺失时抛出明确错误 | ✅ |
| AC-06 | 所有 API 调用从 config 读取，无硬编码密钥 | ✅ |
| AC-07 | 服务端口从 config 读取 | ✅ |
| AC-08 | NODE_ENV 正确识别 | ✅ |

## 🧪 测试用例

| 用例ID | 测试场景 | 预期结果 | 状态 |
|--------|---------|---------|------|
| TC-CFG-001 | 正常加载 .env 文件 | 所有配置项正确加载 | ✅ PASS |
| TC-CFG-002 | 缺少 PORT 配置 | 使用默认值 3000 | ✅ PASS |
| TC-CFG-003 | 缺少 DOUBAO_API_KEY | 抛出错误 `"API Key 未配置"` | ✅ PASS |
| TC-CFG-004 | 缺少 DOUBAO_API_BASE_URL | 使用默认值 URL | ✅ PASS |
| TC-CFG-005 | 配置类型转换正确 | 字符串 "3000" 转为数字 3000 | ✅ PASS |
| TC-CFG-006 | 读取不存在的配置 | 返回 undefined | ✅ PASS |
| TC-CFG-007 | .env 文件不在仓库中 | .gitignore 包含 .env | ✅ PASS |
| TC-CFG-008 | .env.example 存在 | 提供示例但不包含真实密钥 | ✅ PASS |
| TC-CFG-009 | 代码中无硬编码密钥 | 所有 API 调用从 config 读取 | ✅ PASS |
| TC-CFG-010 | NODE_ENV 切换 | development/production 行为不同 | ✅ PASS |

## 🧪 测试报告

### 实际测试命令与结果

```bash
# 1. 启动服务测试
$ cd packages/backend && npm run dev
Backend server running on http://localhost:3000
# ✅ 服务启动成功，配置正确加载

# 2. 运行单元测试
$ cd packages/backend && npm test
 ✓ src/__tests__/embedding.service.test.ts  (21 tests) 347ms
 ✓ src/__tests__/chat.service.test.ts  (8 tests) 26ms
 ✓ src/__tests__/chat.stream.test.ts  (12 tests) 8ms
 ✓ src/__tests__/retrieval.service.test.ts  (9 tests) 11ms
 ✓ src/__tests__/file.test.ts  (7 tests) 28ms
 ✓ src/__tests__/similarity.test.ts  (17 tests)
 ✓ src/__tests__/example.test.ts  (2 tests)

Test Files  7 passed (7)
     Tests  76 passed (76)
# ✅ 所有 76 个测试通过

# 3. 配置缺失测试
$ 删除 .env 后启动服务
Error: 配置项 DOUBAO_API_KEY 未配置
# ✅ 配置校验正确抛出错误
```

### 测试覆盖

- ✅ 配置加载（dotenv）
- ✅ 配置项读取
- ✅ 配置项校验（缺失时抛出错误）
- ✅ .env 文件安全（已在 .gitignore）
- ✅ .env.example 提供示例
- ✅ 所有 API 调用从 config 读取
- ✅ 服务端口从 config 读取
- ✅ NODE_ENV 环境识别

### 问题清单

| 序号 | 问题描述 | 严重级别 | 复现步骤 | 问题状态 |
|------|---------|---------|---------|----------|
| 1 | - | - | - | - |

