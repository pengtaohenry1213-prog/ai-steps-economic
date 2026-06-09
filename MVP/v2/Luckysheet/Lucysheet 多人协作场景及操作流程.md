# Lucysheet 多人协作场景及操作流程

> 覆盖技术实现原理、用户操作流程及已知问题。

---

## 一、协作场景总览

| 场景 | 触发条件 | 技术实现 | 依赖 |
| --- | --- | --- | --- |
| 同设备多标签页 | 同一浏览器打开多个标签页 | BroadcastChannel（y-webrtc 自动启用） | 无 |
| 局域网 WebRTC | 不同设备在同一个局域网 | WebRTC + signaling 服务器 | Docker 部署 signaling server |

**用户体验**：无需选择场景，打开协作后系统自动选择最优通道（同标签页用 BC，跨设备用 WebRTC）。

---

## 二、技术架构

### 2.1 核心组件

- **Luckysheet**：在线表格 UI 层
- **Yjs**：CRDT 文档（yCells 同步单元格状态）
- **y-webrtc**：WebRTC 传输层（含 BroadcastChannel 同设备发现）
- **WebrtcProvider**：建立 P2P 连接的房间管理

### 2.2 关键配置（yjsCollab.ts:47-50）

```ts
this.provider = new WebrtcProvider(ROOM_NAME, this.doc, {
  signaling: ['ws://localhost:4444'],  // signaling 服务器地址
  maxConns: 10                         // 最多 10 个并发 peer
})
```

### 2.3 协作房间

- 固定房间名：`luckysheet-mvtp-v1`
- 协作流程：`awareness 广播 → UI 更新用户列表 → CRDT 状态同步`

---

## 三、用户操作流程

### 3.1 发起协作

```bash
点击「发起协作」按钮
  → connectCollab()
    → getCollabService().connect(userName)
      → 生成随机 userId + 颜色
      → new WebrtcProvider(room, doc)
      → awareness.setLocalStateField('user', {...})
      → connected = true
    → setupCollabSync()
      → 200ms 等待 Yjs 状态同步
      → 用 getAllCellValues() 种子 prevCellValues
      → 启动 500ms 轮询：Luckysheet → diff → setCellValue → Yjs
      → 启动 yCells.observe()：远程变更 → Luckysheet.setCellValue()
```

### 3.2 断开协作

```bash
点击「断开协作」按钮
  → disconnectCollab()
    → 清除 pollTimer 和 prevCellValues
    → collabService.disconnect()
      → provider.destroy() + doc.destroy()
      → _instance = null（重置单例）
    → UI 恢复「单机」状态
```

### 3.3 用户感知

- 每次有用户加入/离开协作房间，`awareness.on('change')` 触发
- UI 通过 `collabService.users` 数组显示彩色用户圆点
- 最多 6 种颜色循环：`#409eff, #67c23a, #f56c6c, #e6a23c, #c71585, #ff8c00`

### 3.4 单元格冲突处理（CRDT LWW）

- 每个单元格维护 `localClocks`（本地时间戳）和 `localValues`
- 远程写入时：`if (remoteClock <= localClock) → 丢弃远程值，恢复本地值`
- **结果：本地修改永远优先（Last Writer Wins）**

---

## 四、测试场景清单

### 4.1 协作核心场景

| 场景 | 描述 | 状态 | 说明 |
| --- | --- | --- | --- |
| A | 单格编辑冲突——A 修改 → B 加入 → 值被覆盖 | ⚠️ P0 | 当前正在修复 `interceptRemoteWrites` 的 `event.local` 问题 |
| C | 公式同步——A 设置公式 `=A1+B1` → B 显示为公式还是文本 | ⚠️ P1 | 需要在 `setCellValue` 时区分值和公式 |
| D | 结构变化——A 插入一行 → B 的表格是否错位 | ⚠️ P1 | 插入行列导致 key 错位 |
| H | 同场景 A（跨设备版） | ⚠️ P0 | 同单格编辑冲突 |
| I | 状态持久化——A 修改 → 刷新页面 → 状态是否保留 | ⚠️ P2 | Y.Doc 状态不持久化，需引入 `y-indexeddb` |
| J | 协作期间导入文件 | ⚠️ 有风险 | `luckysheet.destroy()` 后 Yjs `yCells` 未清空，旧数据残留 |
| K | 协作期间导出 | ✅ 已实现 | 直接读 Luckysheet DOM，与 Yjs 无关 |

### 4.2 多 Sheet 支持

| 场景 | 描述 | 状态 | 说明 |
| --- | --- | --- | --- |
| E/F/G | 多 Sheet 协作同步 | ⚠️ P2 | 当前只同步第一个 Sheet |

---

## 五、问题优先级

| 优先级 | 场景 | 问题 | 状态 |
| --- | --- | --- | --- |
| **P0** | 单格编辑冲突 | A 修改 → B 加入 → A 的值被覆盖 | 正在修复 |
| **P1** | 公式同步 | 公式无法跨用户正确计算 | 待修复 |
| **P1** | 结构变化 | 插入行列导致 key 错位 | 待修复 |
| **P2** | 多 Sheet | 只同步第一个 Sheet | 待修复 |
| **P2** | 状态持久化 | 刷新后状态丢失 | 待修复（引入 y-indexeddb） |
| **P3** | 撤销功能 | CRDT 无标准撤销 | 长期课题 |

---

## 六、验证方式

| 验证项 | 操作步骤 | 预期结果 |
| --- | --- | --- |
| 场景 A/H | A 修改单元格为 `111` → B 加入协作 → 观察两边是否都保持 `111` | 两边均为 `111` |
| 场景 C | A 设置公式 `=A1+B1` → B 加入协作 → 观察是否显示为公式 | B 显示公式而非文本 |
| 场景 D | A 插入一行 → B 的表格是否错位 | B 表格结构保持一致 |
| 场景 I | A 修改 → 刷新页面 → 状态是否保留 | 刷新后状态保留 |
| 场景 J | 协作期间点击「导入」→ 观察是否有数据残留 | 无旧数据残留 |
| 场景 K | 协作期间点击「导出」→ 检查导出内容是否完整 | 导出内容与 UI 一致 |

---

## 七、建议优先修复

1. **P0 单格编辑冲突**：当前正在修复 `interceptRemoteWrites` 的 `event.local` 问题
2. **P1 公式同步**：需要在 `setCellValue` 时区分值和公式
3. **P2 状态持久化**：引入 `y-indexeddb` 持久化 Y.Doc 状态

---

## 八、缺失常用场景（待补充）

| 场景 | 风险点 | 建议 |
| --- | --- | --- |
| 网络闪断重连 | WebRTC P2P 断开后是否自动重连？重连期间数据是否丢失？ | 需补充断网容忍测试 |
| 网络丢包 | 弱网环境下编辑延迟/乱序，同步一致性保障？ | 需补充弱网测试 |
| 大并发（>10人） | `maxConns: 10` 达到上限后行为？新用户被拒绝还是排队？ | 需明确降级策略 |
| 粘贴/复制同步 | 从外部粘贴大块数据，协作双方如何同步？粘贴来源格式如何处理？ | 需补充粘贴冲突场景 |
| 样式同步 | 单元格背景色、字体加粗等样式变更是否纳入 Yjs 同步？ | 当前未实现，仅同步值 |
| 跨 Sheet 引用公式 | 公式引用其他 Sheet 单元格，协作时是否正确计算？ | 需补充跨 Sheet 公式场景 |
| 光标/选区实时同步 | 其他用户当前选中了哪些单元格，是否实时展示？ | 当前仅覆盖用户色块，未覆盖选区 |
| 长文本/大单元格 | 单元格内容超过 10KB 时的同步性能？ | 需补充大文本场景 |
| 协作中断通知 | 对方网络断开，用户侧是否有明确提示（如"用户 X 已离线"）？ | 需补充离线通知 UI |

---

## 九、已知风险项

- ⚠️ 刷新页面后需手动重连，Y.Doc 状态不持久化
- ⚠️ `luckysheet.destroy()` 后 Yjs `yCells` 未清空，旧数据残留；如果新旧数据结构差异大，可能导致数据错乱
