# Step 8: 实现在线协作功能（协作者邀请、WebSocket 实时同步）

## 任务目标
实现在线协作功能（协作者邀请、WebSocket 实时同步）

## 详细说明
实现多用户实时协作功能，支持邀请协作者、实时同步单元格编辑、在线用户列表、光标位置同步。使用 WebSocket 实现实时通信，Prisma Transaction 保证数据一致性。
- v1复用量：15%
- 技术方案：1. 集成 Socket.IO 实现 WebSocket 通信
2. 设计 Collaborator Entity（userId + datamodelId + role）
3. 实现房间概念（每个模型版本一个房间）
4. 实现 CRDT 算法处理并发编辑冲突
5. 实现光标位置广播
6. 实现在线用户列表
7. 前端实现协作状态栏和用户头像显示

## Out of Scope（当前 Step 不做的事情）
- 不支持冲突解决策略（Last Write Wins）
- 不支持离线编辑
- 不支持操作历史重播
- 不支持语音/视频通话

## 执行任务（TODO）
- [ ] todo-8.1: 设计 Collaborator Entity（Prisma Schema）
- [ ] todo-8.2: 集成 Socket.IO 实现 WebSocket 网关
- [ ] todo-8.3: 实现协作房间管理服务
- [ ] todo-8.4: 实现协作者邀请接口 POST /api/v1/models/:id/invite
- [ ] todo-8.5: 实现协作者列表接口 GET /api/v1/models/:id/collaborators
- [ ] todo-8.6: 实现 CRDT 冲突处理算法
- [ ] todo-8.7: 前端实现协作状态栏组件
- [ ] todo-8.8: 前端实现光标同步显示
- [ ] todo-8.9: 前端实现协作者邀请弹窗

## 约束条件
- 同一单元格同时只能一人编辑
- 编辑锁定 30 秒后自动释放
- 最多 10 人同时在线编辑同一模型
- 离线用户超过 5 分钟自动移出房间

## 验收标准
### 功能验收
- [ ] 用户可邀请其他人协作编辑模型
- [ ] 协作者可看到其他人的实时编辑
- [ ] 在线用户列表实时更新
- [ ] 光标位置实时同步
- [ ] 编辑冲突时显示锁定状态

### 性能验收
| 指标 | 标准 |
|------|------|
| 编辑同步延迟 | < 100ms |

### 安全验收
- 只有模型 owner 可邀请协作者
- 协作者权限校验通过 WebSocket 验证
- 恶意断开连接自动清理

## 测试标准
### 功能测试
- 协作者邀请和接受流程正常
- 单元格编辑实时同步正常
- 在线用户列表实时更新
- 编辑锁定正确显示
- 用户离开后正确清理

### 性能测试
| 指标 | 标准 | 测试方法 |
|------|------|---------|
| 10人同时编辑延迟 | < 200ms | undefined |

### 安全测试
- 未授权用户无法加入房间
- 恶意广播消息过滤

## 测试验收流程
单元测试 → WebSocket 连接测试 → 协作场景测试 → Human Gate

## 涉及文件
- packages/backend/prisma/schema.prisma
- packages/backend/src/modules/collaboration/entities/collaborator.entity.ts
- packages/backend/src/modules/collaboration/collaboration.controller.ts
- packages/backend/src/modules/collaboration/collaboration.service.ts
- packages/backend/src/modules/collaboration/collaboration.module.ts
- packages/backend/src/gateway/collaboration.gateway.ts
- packages/backend/src/utils/crdt.ts
- packages/frontend/src/views/models/components/CollaborationBar.vue
- packages/frontend/src/views/models/components/InviteModal.vue
- packages/frontend/src/stores/collaboration.ts

## 前置依赖
step7 公式引擎

## 前置产出验证
- 公式计算正常
- 模型详情页可访问

## 风险提示
- **WebSocket 连接数过多导致服务器压力**: 限制每个模型最多10人，使用 Redis Pub/Sub 水平扩展
- **恶意用户频繁广播消息**: 消息频率限制，单用户每秒最多10条消息

## 关联规范
- 角色：Backend Agent
- 关联规则：.cursor/rules/backend.mdc
- 关联执行：.cursor/prompts/run-step.md
- 架构设计文档 - API 设计 - 在线协作
- 架构设计文档 - 数据模型设计 - 关系设计

## 里程碑映射
协作功能（Day 8-9）
