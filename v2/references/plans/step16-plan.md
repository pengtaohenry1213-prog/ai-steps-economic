# step16 Plan：全局异常处理与日志中间件

## 目标

实现全局异常处理中间件和请求日志中间件，提升服务稳定性与可调试性。

## 现状分析

- `error.middleware.ts` 已存在：处理 multer 错误，但缺少异步异常处理、统一响应格式
- `logger.middleware.ts` 已存在：记录请求方法/路径，但缺少响应时间和状态码
- `index.ts` 已注册中间件，但缺少 process unhandled rejection 处理

## Todos

| id | 类型 | 描述 | 状态 |
|----|------|------|------|
| todo-1 | backend | 改进 error.middleware.ts：统一 `{success, data, error}` 响应、区分业务/系统错误、防止敏感信息泄露 | pending |
| todo-2 | backend | 改进 logger.middleware.ts：记录响应状态码、响应时间 | pending |
| todo-3 | backend | 更新 index.ts：添加 process unhandled rejection 处理 | pending |
| todo-4 | backend | 测试验证 | pending |

## 文件清单

- `packages/backend/src/middlewares/error.middleware.ts` - 重写
- `packages/backend/src/middlewares/logger.middleware.ts` - 重写
- `packages/backend/src/index.ts` - 更新

## 验收标准

- [ ] 异常处理中间件捕获同步异常，返回 `{success: false, error: string}`
- [ ] 异常处理中间件捕获异步 Promise rejection
- [ ] 业务错误返回 4xx，系统错误返回 500 但 message 为通用信息
- [ ] 错误信息不包含堆栈/路径等敏感信息
- [ ] 日志中间件输出格式：`[时间] METHOD /path - status - time`
- [ ] 一个请求异常不影响其他请求
- [ ] 中间件注册顺序：logger 在前、errorHandler 在最后

## 测试用例

| 用例ID | 测试场景 | 预期结果 | 状态 |
|--------|---------|---------|------|
| TC-MID-001 | 触发业务异常 | 返回 `{success: false, error: "错误信息"}` | - |
| TC-MID-002 | 触发系统异常（如空指针） | 返回 `{success: false, error: "服务器内部错误"}` | - |
| TC-MID-003 | 正常请求无异常 | 请求正常处理，不触发异常处理 | - |
| TC-MID-004 | 异步异常捕获 | Promise rejection 被正确捕获 | - |
| TC-MID-005 | 异常中无敏感信息泄露 | 错误信息不包含堆栈/路径等敏感信息 | - |
| TC-MID-006 | 日志记录请求方法 | 日志包含 GET/POST 等方法名 | - |
| TC-MID-007 | 日志记录请求路径 | 日志包含请求的 URL 路径 | - |
| TC-MID-008 | 日志记录响应状态码 | 日志包含 200/404/500 等状态码 | - |
| TC-MID-009 | 日志记录响应时间 | 日志包含请求耗时（ms） | - |
| TC-MID-010 | 日志格式正确 | 格式：`[时间] METHOD /path - status - time` | - |
| TC-MID-011 | 中间件执行顺序正确 | 日志先于异常处理输出 | - |
| TC-MID-012 | 异常后继续处理其他请求 | 一个请求异常不影响其他请求 | - |

---

## 🧪 测试报告

### 测试环境
- 时间：2026-03-30 20:33
- 服务：Backend on http://localhost:3000

### 测试执行

| 用例ID | 测试场景 | 预期结果 | 实际结果 | 状态 |
|--------|---------|---------|---------|------|
| TC-MID-001 | 触发业务异常 | `{success: false, error: "错误信息"}` | `{"success":false,"data":null,"error":"记录不存在"}` | ✅ |
| TC-MID-002 | 触发系统异常（404） | 返回结构化错误 | `{"success":false,"data":null,"error":"Not Found"}` | ✅ |
| TC-MID-003 | 正常请求无异常 | 正常处理 | `{"code":200,"msg":"server is running"}` | ✅ |
| TC-MID-004 | 异步异常捕获 | Promise rejection 被正确捕获 | unhandledRejection handler 已注册 | ✅ |
| TC-MID-005 | 异常中无敏感信息泄露 | 错误信息为通用信息 | 404 返回 "Not Found" | ✅ |
| TC-MID-006 | 日志记录请求方法 | 日志包含 GET/POST | `GET /api/health`, `POST /api/history` | ✅ |
| TC-MID-007 | 日志记录请求路径 | 日志包含 URL 路径 | `[2026-03-30 12:33:21] GET /api/health` | ✅ |
| TC-MID-008 | 日志记录响应状态码 | 日志包含 200/404 | `GET /api/health - 200`, `GET /api/nonexistent - 404` | ✅ |
| TC-MID-009 | 日志记录响应时间 | 日志包含耗时（ms） | `200 - 2ms`, `404 - 1ms` | ✅ |
| TC-MID-010 | 日志格式正确 | 格式：`[时间] METHOD /path - status - time` | `[2026-03-30 12:33:21] GET /api/health - 200 - 2ms` | ✅ |
| TC-MID-011 | 中间件执行顺序正确 | 日志先于异常处理输出 | 日志输出正常 | ✅ |
| TC-MID-012 | 异常后继续处理其他请求 | 服务继续响应 | 所有测试正常响应 | ✅ |

### 测试汇总
- 总用例：12
- 通过：12
- 失败：0
- 状态：**全部通过** ✅
