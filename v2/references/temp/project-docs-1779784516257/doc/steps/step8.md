# Step 8: 实时协作 - WebSocket与冲突处理

## 任务目标
实时协作 - WebSocket与冲突处理

## 详细说明
实现实时协作功能。使用 Supabase Realtime 实现多人同时编辑同一个模型。实现协作用户列表、光标位置同步、变更实时推送、冲突检测与处理。实现基础的通知系统（版本创建、数据更新等事件通知）。

v1复用量：10%（冲突处理算法可参考 v1 设计思路）

技术方案：
1. 集成 Supabase Realtime SDK
2. 实现协作状态管理（协作用户、锁、版本）
3. 实现 WebSocket 通道管理
4. 实现 CRDT 算法处理并发冲突
5. 实现通知推送（Supabase 通知）
6. 前端 PresencePanel.vue（协作用户列表）
- v1复用量：10%
- 技术方案：协作房间按 versionId 划分。使用 Supabase Channel 管理实时连接。变更使用 Operational Transform (OT) 算法处理并发冲突。Presence API 显示在线用户和光标位置。通知使用 Supabase Realtime Postgres Changes 监听数据库变更。

## Out of Scope（当前 Step 不做的事情）
- 不实现协作文本评论（后续扩展）
- 不实现 @提及功能（后续扩展）
- 不实现协作权限分级（后续扩展）
- 不实现离线编辑同步（后续扩展）
- 不实现视频/语音协作（后续扩展）

## 执行任务（TODO）
- [ ] todo-8.1: 安装 Supabase JS SDK
- [ ] todo-8.2: 创建 CollaborationModule
- [ ] todo-8.3: 实现 WebSocket 通道管理
- [ ] todo-8.4: 实现 Presence 服务（在线用户）
- [ ] todo-8.5: 实现 OT 算法冲突处理
- [ ] todo-8.6: 实现 NotificationService
- [ ] todo-8.7: 创建前端 useCollaboration composable
- [ ] todo-8.8: 创建前端 PresencePanel.vue
- [ ] todo-8.9: 创建前端 NotificationCenter.vue
- [ ] todo-8.10: 编写单元测试

## 约束条件
- 支持同时在线用户 < 50
- 消息延迟 < 100ms
- 冲突处理策略：最后写入胜出（LWW）+ 人工确认
- 离线消息不保留（重新连接后同步最新状态）

## 验收标准
### 功能验收
- [ ] 协作用户列表实时显示
- [ ] 单元格编辑实时同步
- [ ] 冲突时显示提示
- [ ] 新用户加入时同步当前状态
- [ ] 用户离开时自动清理
- [ ] 通知推送正常

### 性能验收
| 指标 | 标准 |
|------|------|
| 消息延迟 | < 100ms |
| 100 用户同时在线 | < 500ms 同步 |

### 安全验收
- 协作房间权限校验
- 防止恶意消息注入
- 连接认证（JWT）

## 测试标准
### 功能测试
- 多浏览器同时编辑测试
- 冲突场景测试
- 网络波动重连测试
- 通知触发测试

### 性能测试
| 指标 | 标准 | 测试方法 |
|------|------|---------|
| 消息延迟 | < 100ms | WebSocket 压测 |

### 安全测试
- 未授权用户无法加入协作

## 测试验收流程
1. 单元测试：OT 算法测试
2. 功能验证：多端协作测试
3. Human Gate 验收：人工确认
4. 签字确认：负责人确认后方可进入 Step 9a

## 涉及文件
- packages/backend/src/modules/collaboration/collaboration.module.ts
- packages/backend/src/modules/collaboration/collaboration.service.ts
- packages/backend/src/modules/collaboration/presence.service.ts
- packages/backend/src/modules/collaboration/ot-algorithm.ts
- packages/backend/src/modules/notification/notification.module.ts
- packages/backend/src/modules/notification/notification.service.ts
- packages/frontend/src/composables/useCollaboration.ts
- packages/frontend/src/components/collaboration/PresencePanel.vue
- packages/frontend/src/components/notification/NotificationCenter.vue
- packages/frontend/src/stores/collaborationStore.ts

## 前置依赖
Step 7（导入导出）

## 前置产出验证
- 核心功能模块已全部完成
- 版本切换功能正常

## 风险提示
- **大量 WebSocket 连接耗尽资源**: 限制单个用户连接数，连接超时自动断开
- **冲突处理不当导致数据丢失**: LWW + 人工确认策略，保留冲突历史

## 关联规范
- 角色：Fullstack Agent
- 关联规则：.cursor/rules/fullstack.mdc
- 关联执行：.cursor/prompts/run-step.md
- 架构文档 - 后端模块 - 协作服务
- 架构文档 - 前端模块 - 协作模块

## 里程碑映射
Day 29-32：完成实时协作
