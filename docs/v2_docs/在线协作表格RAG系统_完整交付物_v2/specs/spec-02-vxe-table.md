# Spec-02: vxe-table 封装规范

> **版本**: v1.0  
> **状态**: Draft  
> **负责人**: [待填写]  
> **评审人**: [待填写]  
> **关联 Spec**: spec-01, spec-03, spec-04

---

## 1. 目标与范围

### 1.1 目标
定义 vxe-table 在 Vue3/React 环境下的封装标准，确保表格渲染、编辑、公式单元格、虚拟滚动等行为一致且可维护。

### 1.2 范围
- ✅ vxe-table 基础配置与渲染
- ✅ 单元格编辑（文本/数字/公式）
- ✅ 自定义公式单元格渲染
- ✅ 虚拟滚动（万行级数据）
- ✅ 与 Yjs 的双向绑定
- ✅ 单元格/区域锁的视觉反馈

### 1.3 不在范围内
- ❌ 图表渲染（由 RAG 面板负责）
- ❌ 文件导入导出（由 Supabase Storage 负责）

---

## 2. 术语定义

| 术语 | 定义 |
|------|------|
| FormulaCell | 自定义公式单元格渲染组件 |
| VirtualScroll | 虚拟滚动，仅渲染视口内行 |
| EditTrigger | 触发单元格编辑的方式（dblclick / click / enter）|
| CellLock | 单元格锁定状态，阻止其他用户编辑 |
| AwarenessCursor | Yjs Awareness 同步的其他用户光标位置 |

---

## 3. 设计原则

| 原则 | 说明 |
|------|------|
| **渲染性能优先** | 万行级数据必须启用虚拟滚动，DOM 节点 < 50 个 |
| **编辑体验一致** | 所有单元格编辑行为统一，公式单元格与普通单元格视觉区分明显 |
| **协作感知** | 其他用户光标、选区、锁定状态实时可见 |
| **公式即文本** | 公式以 `=` 开头存储，展示计算结果 |

---

## 4. 详细设计

### 4.1 组件架构

```
VxeTableWrapper (封装层)
    │
    ├──► VxeTable (vxe-table 实例)
    │       │
    │       ├──► VxeColumn (列定义)
    │       │       ├──► DefaultCell (普通单元格)
    │       │       └──► FormulaCell (公式单元格)
    │       │
    │       ├──► EditConfig (编辑配置)
    │       ├──► ScrollConfig (虚拟滚动配置)
    │       └──► KeyboardConfig (快捷键配置)
    │
    ├──► FormulaBar (公式输入栏)
    │       ├──► CellReference (单元格引用显示)
    │       ├──► FormulaInput (公式编辑输入框)
    │       └──► FunctionHint (函数自动提示)
    │
    └──► CollaborationLayer (协作视觉层)
            ├──► RemoteCursor (远程用户光标)
            ├──► RemoteSelection (远程用户选区)
            ├──► CellLockOverlay (锁定遮罩)
            └──► UserAvatar (在线用户头像)
```

### 4.2 vxe-table 核心配置

```typescript
// vxe-table 配置规范
interface VxeTableConfig {
  // 虚拟滚动
  scrollY: {
    enabled: true;
    gt: 100;              // 超过 100 行启用虚拟滚动
    oSize: 10;            // 视口外预渲染 10 行
  };

  // 编辑配置
  editConfig: {
    trigger: 'dblclick';  // 双击触发编辑
    mode: 'cell';         // 单元格编辑模式
    showStatus: true;     // 显示编辑状态
    autoClear: false;     // 不自动清空原值
  };

  // 键盘导航
  keyboardConfig: {
    isArrow: true;        // 方向键导航
    isEnter: true;        // Enter 确认编辑
    isTab: true;          // Tab 切换单元格
    isEsc: true;          // Esc 取消编辑
    isDel: true;          // Delete 清空单元格
    editMethod: ({ row, column }) => {
      // 自定义：锁定单元格不可编辑
      const cellKey = `${row._rowid}:${column.field}`;
      return !lockedCells.has(cellKey);
    };
  };

  // 列配置
  columns: ColumnConfig[];
}

interface ColumnConfig {
  field: string;          // 数据字段名
  title: string;          // 表头显示名
  width: number;          // 列宽
  editRender?: {          // 编辑渲染器
    name: 'input' | 'FormulaCell';
    props?: Record<string, any>;
  };
  cellRender?: {          // 展示渲染器
    name: 'DefaultCell' | 'FormulaCell';
  };
}
```

### 4.3 FormulaCell 组件规范

```typescript
// FormulaCell  Props 接口
interface FormulaCellProps {
  row: any;               // 行数据
  column: VxeColumn;      // 列配置
  rowIndex: number;       // 行索引
  columnIndex: number;    // 列索引

  // 公式引擎实例
  formulaEngine: HyperFormula;

  // 协作状态
  isLocked: boolean;      // 是否被锁定
  lockedBy?: User;        // 锁定者信息
  remoteCursors: Cursor[]; // 远程用户光标
}

// FormulaCell 状态机
enum FormulaCellState {
  DISPLAY = 'display',     // 展示计算结果
  EDITING = 'editing',     // 编辑公式文本
  CALCULATING = 'calculating', // 计算中（显示 loading）
  ERROR = 'error'          // 公式错误（显示 #REF! / #VALUE!）
}
```

#### 4.3.1 视觉规范

| 状态 | 背景色 | 文字色 | 边框 | 说明 |
|------|--------|--------|------|------|
| 普通单元格 | #FFFFFF | #333333 | 1px solid #E8E8E8 | 默认状态 |
| 公式单元格 | #F0F8FF | #333333 | 1px solid #B0C4DE | 含公式的单元格 |
| 编辑中 | #FFFACD | #333333 | 2px solid #FFD700 | 当前正在编辑 |
| 被锁定 | #FFEBEE | #999999 | 1px dashed #EF5350 | 被其他用户锁定 |
| 错误 | #FFEBEE | #D32F2F | 2px solid #D32F2F | 公式计算错误 |
| 远程光标 | — | — | 2px solid [用户色] | 其他用户光标位置 |

### 4.4 公式栏 (FormulaBar) 规范

```
┌─────────────────────────────────────────────────────────────┐
│ 名称框 │  A1   │ 公式栏 │ =SUM(A1:A10)              │  ✓  │
└─────────────────────────────────────────────────────────────┘
```

- **名称框**: 显示当前选中单元格地址（如 A1、B2:C5）
- **公式栏**: 
  - 选中普通单元格：显示单元格值
  - 选中公式单元格：显示公式文本（以 `=` 开头）
  - 编辑时：支持函数自动补全（Ctrl+Space）
- **确认按钮**: 点击或按 Enter 确认编辑

### 4.5 与 Yjs 双向绑定

```typescript
// 绑定流程
function bindVxeTableToYjs(vxeTable: VxeTableInstance, yDoc: Y.Doc) {
  const yArray = yDoc.getArray('sheet-data');

  // vxe-table → Yjs (用户编辑)
  vxeTable.on('edit-closed', (event) => {
    const { row, column, value } = event;
    const rowIndex = vxeTable.getRowIndex(row);
    const colIndex = vxeTable.getColumnIndex(column);

    // 更新 Yjs 文档
    yDoc.transact(() => {
      const yRow = yArray.get(rowIndex);
      yRow.set(colIndex, value);
    });
  });

  // Yjs → vxe-table (远程同步)
  yArray.observe((event) => {
    event.changes.delta.forEach((delta) => {
      if (delta.retain) {
        // 更新对应行
        vxeTable.reloadRow(delta.retain, yArray.get(delta.retain).toJSON());
      }
    });
  });
}
```

---

## 5. 接口契约

### 5.1 FormulaCell 输入输出

```typescript
// 输入
interface FormulaCellInput {
  formula: string;        // 如 "=SUM(A1:A10)"
  dependencies: string[]; // 依赖的单元格地址 ["A1", "A2", ...]
}

// 输出
interface FormulaCellOutput {
  value: number | string | null;  // 计算结果
  displayValue: string;           // 展示文本（格式化后）
  error: string | null;           // 错误信息（如 #REF!）
  isCalculating: boolean;         // 是否计算中
}
```

### 5.2 单元格锁接口

```typescript
// 锁定单元格
POST /api/collaboration/lock
Body: {
  sheetId: string;
  cellRange: "A1" | "A1:C5";
  userId: string;
  ttl: 300;  // 锁定有效期 300 秒，心跳续期
}

// 释放锁定
DELETE /api/collaboration/lock
Body: {
  sheetId: string;
  cellRange: string;
  userId: string;
}

// 查询锁定状态
GET /api/collaboration/locks?sheetId=xxx
Response: {
  locks: [
    { cellRange: "A1", lockedBy: "user_123", expireAt: "2026-05-07T10:00:00Z" }
  ]
}
```

---

## 6. 测试策略

### 6.1 单元测试

| 测试场景 | 输入 | 期望输出 |
|---------|------|---------|
| 公式单元格渲染 | `=SUM(1,2,3)` | 展示 `6`，背景色 #F0F8FF |
| 公式编辑 | 双击公式单元格 | 进入编辑状态，显示 `=SUM(1,2,3)` |
| 错误公式 | `=SUM(A999)` | 展示 `#REF!`，背景色 #FFEBEE |
| 虚拟滚动 | 10000 行数据 | DOM 节点 < 50 个 |
| 锁定视觉 | 单元格被锁定 | 显示红色虚线边框 + 锁定者头像 |

### 6.2 集成测试

| 测试场景 | 步骤 | 验收标准 |
|---------|------|---------|
| 双向绑定 | 用户 A 编辑 A1 → 用户 B 看到更新 | 延迟 < 100ms |
| 批量编辑 | 复制 1000 行粘贴 | 不卡顿，Yjs 同步完成 |
| 公式级联 | A1=1, A2=2, A3=SUM(A1:A2)，修改 A1=10 | A3 自动更新为 12 |

---

## 7. 验收标准

- [ ] 万行级数据虚拟滚动，滚动帧率 > 30fps
- [ ] 公式单元格与普通单元格视觉区分明显
- [ ] 单元格锁定状态实时同步，延迟 < 200ms
- [ ] 公式栏支持函数自动补全（≥50 个常用函数）
- [ ] 编辑快捷键与 Excel 一致（Enter 确认、Esc 取消、Tab 切换）

---

## 8. 关联 Spec

| Spec 编号 | 关系 | 说明 |
|-----------|------|------|
| spec-01 | 依赖 | 架构设计定义组件关系 |
| spec-03 | 被依赖 | Yjs 协作定义同步协议 |
| spec-04 | 被依赖 | 公式引擎定义计算逻辑 |
