# Spec-03: Yjs 协作同步规则

> **版本**: v1.0  
> **状态**: Draft  
> **负责人**: [待填写]  
> **评审人**: [待填写]  
> **关联 Spec**: spec-01, spec-02, spec-06

---

## 1. 目标与范围

### 1.1 目标
定义基于 Yjs (CRDT) 的多人实时协作规则，确保多人同时编辑无冲突、不覆盖、离线可恢复。

### 1.2 范围
- ✅ Y.Doc 数据结构设计与 Schema
- ✅ y-websocket 同步协议
- ✅ 单元格/区域锁定机制
- ✅ 离线编辑与自动合并
- ✅ 撤销/重做/历史版本
- ✅ Awareness（在线状态、光标、选区同步）

### 1.3 不在范围内
- ❌ 视频/语音协作（未来扩展）
- ❌ 文档级权限（由 Supabase RLS 负责）

---

## 2. 术语定义

| 术语 | 定义 |
|------|------|
| Y.Doc | Yjs 文档对象，所有协作数据的根容器 |
| Y.Array | Yjs 数组类型，存储表格行数据 |
| Y.Map | Yjs 映射类型，存储单元格元数据（公式、格式） |
| Awareness | Yjs 的临时状态同步（光标、选区、用户信息） |
| Provider | Yjs 的网络同步提供者（y-websocket / y-indexeddb） |
| UndoManager | Yjs 的撤销/重做管理器 |
| CellLock | 单元格锁定，阻止其他用户编辑 |

---

## 3. 设计原则

| 原则 | 说明 |
|------|------|
| **最终一致性** | 所有客户端最终看到相同的数据状态，无需中心协调 |
| **无覆盖** | 多人同时编辑不同单元格，各自修改保留；同一单元格，后到达的生效 |
| **离线优先** | 断网期间可正常编辑，恢复后自动合并，冲突率 < 0.1% |
| **最小同步** | 仅同步变更的单元格，不传输全量数据 |
| **心跳保活** | 锁定状态需心跳续期，断线 30 秒自动释放 |

---

## 4. 详细设计

### 4.1 Y.Doc Schema 设计

```typescript
// Y.Doc 根结构
interface YDocSchema {
  // 表格数据（二维数组）
  'sheet-data': Y.Array<Y.Array<YCellValue>>;

  // 单元格元数据（公式、格式、注释）
  'cell-meta': Y.Map<YCellMeta>;  // key: "row:col"

  // 列配置（宽度、格式、隐藏）
  'column-config': Y.Array<YColumnConfig>;

  // 行配置（高度、隐藏）
  'row-config': Y.Array<YRowConfig>;

  // 单元格锁定状态
  'cell-locks': Y.Map<YCellLock>;  // key: "row:col"

  // 评论/批注
  'comments': Y.Map<YComment[]>;   // key: "row:col"
}

// 单元格值
interface YCellValue {
  v: string | number | null;  // 原始值
  t: 's' | 'n' | 'f' | 'b';  // 类型: string/number/formula/boolean
}

// 单元格元数据
interface YCellMeta {
  formula?: string;           // 公式文本（如 "=SUM(A1:A10)"）
  format?: string;            // 数字格式（如 "#,##0.00"）
  style?: CellStyle;          // 字体、颜色、对齐等
  commentIds?: string[];      // 关联评论 ID
}

// 单元格锁定
interface YCellLock {
  userId: string;
  userName: string;
  userColor: string;
  lockedAt: number;           // 时间戳
  ttl: number;                // 有效期（秒）
}
```

### 4.2 同步协议

#### 4.2.1 消息类型

```typescript
enum YjsMessageType {
  SYNC = 0,           // 初始同步
  UPDATE = 1,         // 文档更新
  AWARENESS = 2,      // 在线状态更新
  LOCK = 3,           // 锁定请求
  UNLOCK = 4,         // 解锁请求
  HEARTBEAT = 5,      // 心跳
}
```

#### 4.2.2 同步流程

```
客户端 A (新加入)                    服务端 (y-websocket)              客户端 B (已在线)
    │                                      │                                │
    │ ─────── WebSocket Connect ─────────> │                                │
    │                                      │                                │
    │ <────── Sync Step 1 (State Vector) ─ │                                │
    │                                      │                                │
    │ ─────── Sync Step 2 (Diff) ────────> │                                │
    │                                      │                                │
    │ <────── Sync Step 1 (State Vector) ─ │ ────── Broadcast Update ────> │
    │                                      │                                │
    │ <────── Awareness (用户列表) ─────── │                                │
    │                                      │                                │
```

### 4.3 单元格锁定机制

#### 4.3.1 锁定规则

| 场景 | 行为 |
|------|------|
| 用户 A 点击单元格 | 自动发送 LOCK 请求，锁定该单元格 |
| 用户 B 尝试编辑已锁定单元格 | 禁止编辑，显示 "已被 user_A 锁定" |
| 用户 A 心跳中断 30 秒 | 服务端自动释放锁定 |
| 用户 A 主动离开/关闭页面 | 发送 UNLOCK，立即释放 |
| 用户 A 选中区域 (A1:C5) | 锁定整个区域，区域内单元格均不可编辑 |

#### 4.3.2 锁定优先级

```typescript
enum LockPriority {
  CELL = 1,      // 单元格锁定
  ROW = 2,       // 行锁定（优先级高于单元格）
  COLUMN = 2,    // 列锁定
  SHEET = 3,     // 整表锁定（管理员维护时）
}

// 冲突解决：高优先级覆盖低优先级
function resolveLockConflict(newLock: Lock, existingLocks: Lock[]): boolean {
  const hasConflict = existingLocks.some(lock => 
    rangesOverlap(newLock.range, lock.range) && 
    lock.priority >= newLock.priority &&
    lock.userId !== newLock.userId
  );
  return !hasConflict;
}
```

### 4.4 离线编辑与合并

#### 4.4.1 离线检测

```typescript
// 网络状态监听
provider.on('status', (event) => {
  if (event.status === 'disconnected') {
    // 进入离线模式
    store.isOffline = true;
    store.offlineQueue = [];  // 记录离线期间的操作

    // 启用本地 IndexedDB 持久化
    const indexeddbProvider = new IndexeddbPersistence('sheet-' + sheetId, yDoc);
  }
});
```

#### 4.4.2 合并策略

| 冲突类型 | CRDT 行为 | 用户感知 |
|---------|----------|---------|
| 用户 A、B 编辑不同单元格 | 自动合并，无冲突 | 双方修改均保留 |
| 用户 A、B 编辑同一单元格 | 后到达的操作覆盖 | 显示最后一次修改 |
| 用户 A 删除行，用户 B 编辑该行内单元格 | 删除操作优先 | B 的修改被丢弃 |
| 用户 A 插入行，用户 B 编辑原行号 | 行号自动调整 | B 的编辑跟随原数据 |

### 4.5 Awareness（在线状态同步）

```typescript
// Awareness 数据结构
interface AwarenessState {
  user: {
    id: string;
    name: string;
    color: string;        // 用户标识色（随机分配）
    avatar?: string;
  };
  cursor?: {
    row: number;
    col: number;
  };
  selection?: {
    start: { row: number; col: number };
    end: { row: number; col: number };
  };
  activeCell?: string;    // "row:col" 格式
}

// 更新频率限制（防抖）
const AWARENESS_THROTTLE_MS = 100;  // 100ms 内只发送一次更新
```

#### 4.5.1 视觉呈现

| 元素 | 样式 |
|------|------|
| 远程光标 | 细竖线（2px），颜色 = 用户色，带用户姓名标签 |
| 远程选区 | 半透明背景（rgba 用户色, 0.2），实线边框 |
| 在线用户列表 | 右上角头像列表，显示用户名和当前选中单元格 |

### 4.6 撤销/重做

```typescript
// 每个用户独立的 UndoManager
const undoManager = new Y.UndoManager(yArray, {
  captureTimeout: 500,     // 500ms 内的连续操作合并为一个 undo 步骤
  trackedOrigins: new Set([yDoc.clientID]),  // 只追踪当前用户的操作
});

// 快捷键绑定
// Ctrl+Z / Cmd+Z → undoManager.undo()
// Ctrl+Shift+Z / Cmd+Shift+Z → undoManager.redo()
```

**注意**: 撤销仅影响当前用户的操作，不会撤销其他用户的修改。

---

## 5. 接口契约

### 5.1 WebSocket 消息格式

```typescript
// 通用消息结构
interface YjsMessage {
  type: YjsMessageType;
  payload: Uint8Array;     // Yjs 二进制编码数据
  timestamp: number;
  userId: string;
}

// 锁定消息
interface LockMessage {
  type: YjsMessageType.LOCK;
  sheetId: string;
  cellRange: string;       // "A1" 或 "A1:C5"
  userId: string;
  ttl: number;
}

// Awareness 消息
interface AwarenessMessage {
  type: YjsMessageType.AWARENESS;
  clientId: number;
  state: AwarenessState;
}
```

### 5.2 持久化接口

```typescript
// 保存文档快照到 Supabase
POST /api/collaboration/snapshot
Body: {
  sheetId: string;
  yDocState: Uint8Array;   // Yjs 文档二进制状态
  version: number;
  createdBy: string;
}

// 加载历史版本
GET /api/collaboration/snapshot/{sheetId}?version={n}
Response: {
  yDocState: Uint8Array;
  version: number;
  createdAt: string;
}
```

---

## 6. 测试策略

### 6.1 冲突测试

| 测试场景 | 步骤 | 期望结果 |
|---------|------|---------|
| 双用户编辑不同单元格 | A 编辑 A1，B 编辑 B1 | 双方修改均保留 |
| 双用户编辑同一单元格 | A、B 同时编辑 A1 | 后到达者生效，先到达者收到更新 |
| 离线合并 | A 离线编辑 5 个单元格，恢复网络 | 5 个修改自动合并，无冲突提示 |
| 行删除冲突 | A 删除第 3 行，B 编辑第 3 行某单元格 | B 的编辑被丢弃，A 的删除生效 |

### 6.2 性能测试

| 测试场景 | 指标 | 目标 |
|---------|------|------|
| 50 并发用户编辑 | 同步延迟 | P95 < 100ms |
| 10000 行数据加载 | 初始同步时间 | < 3s |
| 离线 1000 次操作恢复 | 合并时间 | < 1s |
| Awareness 更新 | 光标同步延迟 | < 50ms |

---

## 7. 验收标准

- [ ] 50 并发用户同时编辑，无数据丢失或覆盖
- [ ] 离线编辑 30 分钟后恢复，100% 合并成功
- [ ] 单元格锁定心跳中断 30 秒自动释放
- [ ] 撤销/重做支持至少 100 步历史
- [ ] Awareness 光标同步延迟 < 50ms
- [ ] 历史版本可回溯至少 30 个快照

---

## 8. 关联 Spec

| Spec 编号 | 关系 | 说明 |
|-----------|------|------|
| spec-01 | 依赖 | 架构设计定义协作层位置 |
| spec-02 | 被依赖 | vxe-table 封装实现双向绑定 |
| spec-06 | 被依赖 | Supabase 提供 WebSocket 和持久化 |
