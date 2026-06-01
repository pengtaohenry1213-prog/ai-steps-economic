---
name: step7-文件上传接口
overview: 按 step7.md 规格，为后端开发 /api/file/upload 接口，实现文件上传、校验与解析功能，并编写接口测试
todos:
  - id: step7-deps
    content: 安装依赖：multer、pdf-parse、mammoth、@types/multer
    status: completed
  - id: step7-types
    content: 创建 src/types/file.types.ts（文件相关 TS 类型定义）
    status: completed
  - id: step7-service
    content: 创建 src/services/file.service.ts（pdf-parse + mammoth 解析服务）
    status: completed
  - id: step7-route
    content: 创建 src/routes/file.route.ts（multer + /api/file/upload）
    status: completed
  - id: step7-register
    content: 在 src/index.ts 中注册 file.route
    status: completed
  - id: step7-test
    content: 编写测试文件 src/__tests__/file.test.ts（覆盖 TC-FILE-001～007）
    status: completed
  - id: step7-verify
    content: 验证接口：运行测试，确保所有用例通过
    status: completed
isProject: false
---

# Step7 Plan: 文件上传接口开发

## 任务目标

开发 `/api/file/upload` 接口，实现文件接收、校验、解析返回文本（PDF/Word）

## 新增内容

更新后的 step7.md 新增了**测试要求**部分，包含 7 个测试用例（文件类型、大小、空文件、损坏文件等场景）

## Todo 清单


| ID  | 任务                                                                | 状态      |
| --- | ----------------------------------------------------------------- | ------- |
| 1   | 安装依赖：multer、pdf-parse、mammoth、@types/multer                       | pending |
| 2   | 创建 `src/types/file.types.ts`（文件相关 TS 类型定义）                        | pending |
| 3   | 创建 `src/services/file.service.ts`（文件解析服务：pdf-parse + mammoth）     | pending |
| 4   | 创建 `src/routes/file.route.ts`（POST /api/file/upload 路由，使用 multer） | pending |
| 5   | 在 `src/index.ts` 中注册 file.route                                   | pending |
| 6   | 编写测试文件 `src/__tests__/file.test.ts`（覆盖 TC-FILE-001～007）           | pending |
| 7   | 验证接口：运行测试，确保所有用例通过                                                | pending |


## 文件路径清单

```
packages/backend/src/
├── index.ts                        ← 注册 file.route
├── types/
│   └── file.types.ts              ← 新增：文件类型定义
├── routes/
│   └── file.route.ts              ← 新增：上传路由
├── services/
│   └── file.service.ts            ← 新增：解析服务
└── __tests__/
    └── file.test.ts               ← 新增：接口测试
```

## 验收标准


| 验收项      | 预期结果                                                     |
| -------- | -------------------------------------------------------- |
| 文件限制     | 单文件≤10MB，仅 .pdf/.docx/.txt 可上传                                |
| 成功响应     | `{ success: true, data: { text: "解析文本" }, error: null }` |
| 错误响应     | `{ success: false, data: null, error: "错误描述" }`          |
| 文件类型错误   | 拒绝非 pdf/docx/txt 文件，返回 "不支持的文件类型"                            |
| 文件大小超限   | 拒绝>10MB 文件，返回 "文件大小超过限制"                                 |
| 空文件/损坏文件 | 返回 "文件解析失败"                                              |
| 未上传文件    | 返回 "未上传文件"                                               |
| 内存管理     | 不在内存中存储大文本，仅返回后释放                                        |


## 测试用例覆盖


| 用例ID        | 测试场景                          |
| ----------- | ----------------------------- |
| TC-FILE-001 | 上传合法 PDF 文件（≤10MB）→ 成功解析返回文本  |
| TC-FILE-002 | 上传合法 Word 文件（≤10MB）→ 成功解析返回文本 |
| TC-FILE-003 | 上传合法 TXT 文件（≤10MB）→ 成功解析返回文本 |
| TC-FILE-003 | 上传超过 10MB 的文件 → 返回大小超限错误      |
| TC-FILE-004 | 上传不允许的文件类型（如 .txt） → 返回类型错误   |
| TC-FILE-005 | 上传损坏/空文件 → 返回解析失败错误           |
| TC-FILE-006 | 不带文件参数请求接口 → 返回 "未上传文件"       |
| TC-FILE-007 | 连续上传多个文件 → 每个独立解析             |


## 执行顺序

1. 安装依赖
2. 定义类型 → `file.types.ts`
3. 实现解析服务 → `file.service.ts`
4. 实现路由 + Multer → `file.route.ts`
5. 注册路由 → `src/index.ts`
6. 编写测试 → `file.test.ts`
7. 运行测试验证

