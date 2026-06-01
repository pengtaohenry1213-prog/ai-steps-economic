# Step 9: CI/CD 基础配置 - GitHub Actions 与自动化

## 任务目标
CI/CD 基础配置 - GitHub Actions 与自动化

## 详细说明
配置 GitHub Actions CI/CD 流水线，实现：1）代码检查（ESLint、Prettier）；2）单元测试（Vitest、Jest）；3）构建验证（前端打包、后端编译）；4）Docker 镜像构建。配置提交规范（commitlint）和 PR 规范。每完成一个功能 step 后自动触发构建测试，尽早发现问题。

v1复用量：15%（CI/CD 配置可参考 v1，pipeline 结构复用）

技术方案：
1. 创建 .github/workflows/ci.yml
2. 配置 Node.js 18+ 环境
3. 配置 pnpm cache
4. 配置 ESLint 检查
5. 配置 Vitest 测试
6. 配置构建步骤
7. 配置 Docker 构建（Dockerfile）
8. 配置 commitlint
9. 创建 Dockerfile 和 docker-compose.yml
- v1复用量：15%
- 技术方案：CI pipeline 结构：Lint → Test → Build → Docker Build。使用 pnpm/setup-action 加速安装。测试覆盖率阈值：80%。Docker multi-stage build 优化镜像大小。前端构建产物直接 COPY 到 Nginx 镜像。

## Out of Scope（当前 Step 不做的事情）
- 不配置生产环境部署（Step 9b 处理）
- 不配置 Kubernetes 部署（后续扩展）
- 不配置自动回滚机制（后续扩展）
- 不配置 CDN 部署（后续扩展）
- 不配置性能测试（后续扩展）

## 执行任务（TODO）
- [ ] todo-9.1: 创建 .github/workflows/ci.yml
- [ ] todo-9.2: 创建 .github/workflows/docker.yml
- [ ] todo-9.3: 配置 ESLint GitHub Action
- [ ] todo-9.4: 配置 Vitest 测试 Action
- [ ] todo-9.5: 创建 Dockerfile（multi-stage build）
- [ ] todo-9.6: 创建 docker-compose.yml
- [ ] todo-9.7: 配置 commitlint 和 husky
- [ ] todo-9.8: 创建 .github/CODEOWNERS
- [ ] todo-9.9: 测试 CI pipeline 执行

## 约束条件
- CI 总运行时间 < 10 分钟
- 测试覆盖率 > 80%
- Docker 镜像大小 < 500MB
- 所有 secrets 不在代码中暴露

## 验收标准
### 功能验收
- [ ] PR 自动触发 CI pipeline
- [ ] Lint 检查失败阻止合并
- [ ] 测试失败阻止合并
- [ ] 构建成功生成 Docker 镜像
- [ ] commitlint 校验提交信息

### 性能验收
| 指标 | 标准 |
|------|------|
| CI 完整流程 | < 10分钟 |

### 安全验收
- Docker 镜像无漏洞（使用 distroless）
- secrets 通过 GitHub Secrets 注入

## 测试标准
### 功能测试
- 创建 PR 验证 CI 自动触发
- 破坏代码验证 CI 失败
- Docker 镜像可正常启动

### 性能测试
| 指标 | 标准 | 测试方法 |
|------|------|---------|
| CI 执行时间 | < 10分钟 | undefined |

### 安全测试
- 镜像安全扫描通过

## 测试验收流程
1. 单元测试：本地验证 CI 逻辑
2. 功能验证：创建 PR 验证流水线
3. Human Gate 验收：人工确认 CI 配置
4. 签字确认：负责人确认后方可进入 Step 9b

## 涉及文件
- .github/workflows/ci.yml
- .github/workflows/docker.yml
- Dockerfile
- docker-compose.yml
- package.json
- .commitlintrc.js
- .husky/commit-msg
- .github/CODEOWNERS

## 前置依赖
Step 8（实时协作）

## 前置产出验证
- 所有功能代码已完成
- 单元测试可正常执行

## 风险提示
- **CI 运行时间过长**: 使用 pnpm cache，优化 Docker 构建层，并行执行无关任务
- **Docker 镜像过大**: 使用 alpine 基础镜像，multi-stage build，清理缓存

## 关联规范
- 角色：Deploy Agent
- 关联规则：.cursor/rules/deploy-rules.mdc
- 关联执行：.cursor/prompts/run-step.md
- 架构文档 - 部署架构
- 部署规范 deploy-rules.mdc

## 里程碑映射
Day 33-34：完成 CI/CD 配置
