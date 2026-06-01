# Step 9a: 配置 CI/CD 基础流水线（GitHub Actions + 自动化构建测试）

## 任务目标
配置 CI/CD 基础流水线（GitHub Actions + 自动化构建测试）

## 详细说明
配置 GitHub Actions CI/CD 流水线，实现代码提交自动触发构建、单元测试、集成测试。每完成一个 step 后自动构建验证，尽早发现问题。
- v1复用量：0%
- 技术方案：1. 创建 .github/workflows/ci.yml
2. 配置 Node.js 环境（pnpm）
3. 配置 ESLint 检查
4. 配置单元测试（Vitest/Jest）
5. 配置端到端测试（Playwright）
6. 配置测试覆盖率报告
7. 配置构建产物上传到 Artifacts

## Out of Scope（当前 Step 不做的事情）
- 不配置生产环境部署
- 不配置 Docker 容器化
- 不配置 Kubernetes 部署
- 不配置灰度发布策略

## 执行任务（TODO）
- [ ] todo-9a.1: 创建 .github/workflows/ci.yml
- [ ] todo-9a.2: 配置 pnpm 安装和缓存
- [ ] todo-9a.3: 配置 ESLint 检查任务
- [ ] todo-9a.4: 配置单元测试任务（Vitest）
- [ ] todo-9a.5: 配置测试覆盖率报告
- [ ] todo-9a.6: 配置 E2E 测试任务（Playwright）
- [ ] todo-9a.7: 配置构建产物上传
- [ ] todo-9a.8: 配置分支保护规则

## 约束条件
- CI 构建时间不能超过 10 分钟
- 测试覆盖率必须超过 70%
- lint 错误必须修复才能合并
- 必须支持前端和后端分别构建

## 验收标准
### 功能验收
- [ ] 代码提交自动触发 CI 构建
- [ ] 构建失败发送通知
- [ ] 测试报告自动生成
- [ ] 前端和后端构建日志分离

### 性能验收
| 指标 | 标准 |
|------|------|
| CI 构建时间 | < 10分钟 |

### 安全验收
- 敏感信息不写入日志
- .env 文件不参与构建

## 测试标准
### 功能测试
- PR 创建触发 CI 流程
- main 分支保护规则生效
- 测试失败阻止合并
- lint 错误阻止合并

### 性能测试
| 指标 | 标准 | 测试方法 |
|------|------|---------|
| CI 构建时间 | < 10分钟 | undefined |

### 安全测试
- Secrets 不泄露测试

## 测试验收流程
PR 创建验证 → CI 执行验证 → 构建产物验证 → Human Gate

## 涉及文件
- .github/workflows/ci.yml
- .github/workflows/release.yml
- package.json (scripts)
- vitest.config.ts
- playwright.config.ts

## 前置依赖
step5 指标管理功能（CI/CD 应尽早接入）

## 前置产出验证
- 项目结构完整
- 后端服务可启动
- 前端服务可启动

## 风险提示
- **CI 构建时间过长**: 配置 pnpm 缓存，优化测试用例并行执行
- **测试覆盖率不达标**: 编写测试用例时优先覆盖核心业务逻辑

## 关联规范
- 角色：Deploy Agent
- 关联规则：.cursor/rules/deploy-rules.mdc
- 关联执行：.cursor/prompts/run-step.md
- 架构设计文档 - 部署架构 - 环境规划

## 里程碑映射
DevOps（Day 9）
