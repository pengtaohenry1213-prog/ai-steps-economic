# Step 9b: 集成测试执行 + Docker 容器化 + 生产环境部署

## 任务目标
集成测试执行 + Docker 容器化 + 生产环境部署

## 详细说明
完成所有功能后的集成测试和部署阶段。执行完整的端到端测试、Docker 容器化前端和后端、配置 Nginx 代理、生产环境部署到 Vercel（前端）和 Railway/Render（后端）。
- v1复用量：0%
- 技术方案：1. 执行完整 E2E 测试套件
2. 创建 Dockerfile（前端 + 后端）
3. 创建 docker-compose.yml 用于本地测试
4. 配置 Nginx 配置文件
5. 配置环境变量注入
6. 部署前端到 Vercel
7. 部署后端到 Railway/Render
8. 配置生产环境数据库连接

## Out of Scope（当前 Step 不做的事情）
- 不配置多云部署
- 不配置 CDN 加速（前端 Vercel 已内置）
- 不配置 APM 监控
- 不配置日志收集系统

## 执行任务（TODO）
- [ ] todo-9b.1: 执行完整 E2E 测试套件
- [ ] todo-9b.2: 创建前端 Dockerfile
- [ ] todo-9b.3: 创建后端 Dockerfile
- [ ] todo-9b.4: 创建 docker-compose.yml
- [ ] todo-9b.5: 配置 Nginx 反向代理
- [ ] todo-9b.6: 部署前端到 Vercel
- [ ] todo-9b.7: 部署后端到 Railway
- [ ] todo-9b.8: 配置生产环境数据库
- [ ] todo-9b.9: 执行生产环境冒烟测试

## 约束条件
- Docker 镜像大小不超过 500MB
- 后端启动时间不超过 30 秒
- 前端必须启用 Gzip 压缩
- 所有敏感配置通过环境变量注入

## 验收标准
### 功能验收
- [ ] E2E 测试全部通过
- [ ] Docker 容器本地运行正常
- [ ] 生产环境部署成功
- [ ] 前后端联调通过

### 性能验收
| 指标 | 标准 |
|------|------|
| Docker 构建时间 | < 5分钟 |

### 安全验收
- 生产环境使用 .env.production
- 数据库密码不硬编码
- 禁止调试模式在生产环境开启

## 测试标准
### 功能测试
- 完整 E2E 测试套件通过
- Docker 本地运行测试通过
- 生产环境冒烟测试通过
- 数据库连接测试通过

### 性能测试
| 指标 | 标准 | 测试方法 |
|------|------|---------|
| 生产环境首次加载 | < 3秒 | undefined |

### 安全测试
- 安全扫描无高危漏洞
- 敏感数据加密传输

## 测试验收流程
E2E 测试 → Docker 构建测试 → 生产部署验证 → Human Gate 最终验收

## 涉及文件
- Dockerfile.frontend
- Dockerfile.backend
- docker-compose.yml
- nginx.conf
- .env.production.example
- .github/workflows/deploy.yml

## 前置依赖
step9a CI/CD 基础配置 + step8 在线协作

## 前置产出验证
- CI/CD 流水线正常工作
- 所有功能开发完成
- 单元测试覆盖率达到 70%

## 风险提示
- **生产环境数据库连接失败**: 使用数据库连接字符串环境变量，启动脚本添加重试逻辑
- **前端 API 地址配置错误**: Vercel 配置环境变量，前端读取 VITE_API_URL

## 关联规范
- 角色：Deploy Agent
- 关联规则：.cursor/rules/deploy-rules.mdc
- 关联执行：.cursor/prompts/run-step.md
- 架构设计文档 - 部署架构 - 部署方式

## 里程碑映射
部署上线（Day 10）
