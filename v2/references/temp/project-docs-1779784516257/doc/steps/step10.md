# Step 10: 集成测试与部署 - 完整流程验证

## 任务目标
集成测试与部署 - 完整流程验证

## 详细说明
执行完整的集成测试和部署验证。1）端到端测试（E2E）覆盖核心业务流程；2）配置生产环境 Nginx；3）配置环境变量和 secrets；4）部署到云服务器（或 Vercel + Railway）；5）配置监控告警（可选）。

v1复用量：10%（E2E 测试框架和部署脚本可参考 v1）

技术方案：
1. 安装 Playwright
2. 编写 E2E 测试用例（登录、模型管理、公式计算、导入导出）
3. 创建 Nginx 配置文件
4. 配置生产环境 .env
5. 编写部署脚本
6. 配置基础监控（可选：Sentry）
- v1复用量：10%
- 技术方案：E2E 测试使用 Playwright，覆盖：登录 → 创建模型 → 添加指标 → 定义公式 → 计算验证 → 导入导出。Nginx 配置：反向代理到后端 3000 端口，静态资源缓存，gzip 压缩。监控使用 Sentry 捕获异常错误。

## Out of Scope（当前 Step 不做的事情）
- 不配置 Kubernetes 集群管理（后续扩展）
- 不配置多环境自动化部署（后续扩展）
- 不配置灰度发布（后续扩展）
- 不配置完整的可观测性平台（后续扩展）
- 不配置灾备和高可用（后续扩展）

## 执行任务（TODO）
- [ ] todo-10.1: 安装 Playwright 和配置 E2E 测试
- [ ] todo-10.2: 编写 E2E 测试用例（auth.spec.ts）
- [ ] todo-10.3: 编写 E2E 测试用例（models.spec.ts）
- [ ] todo-10.4: 编写 E2E 测试用例（formulas.spec.ts）
- [ ] todo-10.5: 编写 E2E 测试用例（import-export.spec.ts）
- [ ] todo-10.6: 创建 Nginx 配置文件
- [ ] todo-10.7: 配置生产环境变量
- [ ] todo-10.8: 编写部署脚本（deploy.sh）
- [ ] todo-10.9: 配置 Sentry 监控（可选）
- [ ] todo-10.10: 执行完整部署并验证

## 约束条件
- E2E 测试覆盖率 > 70%
- 部署停机时间 < 5 分钟
- 监控覆盖核心业务异常

## 验收标准
### 功能验收
- [ ] E2E 测试全部通过
- [ ] 登录流程端到端正常
- [ ] 模型管理全流程正常
- [ ] 公式计算全流程正常
- [ ] 导入导出全流程正常
- [ ] 生产环境可访问

### 性能验收
| 指标 | 标准 |
|------|------|
| E2E 测试执行 | < 15分钟 |
| 首屏加载 | < 2秒 |

### 安全验收
- 生产环境无敏感信息
- HTTPS 正常配置
- 安全头配置正确

## 测试标准
### 功能测试
- 完整 E2E 测试套件通过
- 冒烟测试通过
- 回归测试通过

### 性能测试
| 指标 | 标准 | 测试方法 |
|------|------|---------|
| 页面加载 | < 2秒 | Lighthouse |

### 安全测试
- 安全扫描通过
- HTTPS 证书有效

## 测试验收流程
1. E2E 测试：执行完整测试套件
2. 部署验证：生产环境测试
3. Human Gate 验收：人工确认系统可用
4. 签字确认：项目负责人最终验收

## 涉及文件
- packages/frontend/tests/e2e/auth.spec.ts
- packages/frontend/tests/e2e/models.spec.ts
- packages/frontend/tests/e2e/formulas.spec.ts
- packages/frontend/tests/e2e/import-export.spec.ts
- packages/frontend/playwright.config.ts
- nginx/nginx.conf
- scripts/deploy.sh
- scripts/health-check.sh
- .env.production

## 前置依赖
Step 9（CI/CD 配置）

## 前置产出验证
- CI pipeline 正常工作
- Docker 镜像可构建

## 风险提示
- **生产环境数据库迁移失败**: 先在 staging 环境验证，保留回滚方案
- **部署后功能异常**: 蓝绿部署或滚动更新，保留旧版本

## 关联规范
- 角色：Deploy Agent
- 关联规则：.cursor/rules/deploy-rules.mdc
- 关联执行：.cursor/prompts/run-step.md
- 架构文档 - 部署架构
- 架构文档 - 监控与可观测性
- 部署规范 deploy-rules.mdc

## 里程碑映射
Day 35-38：完成集成测试与部署
