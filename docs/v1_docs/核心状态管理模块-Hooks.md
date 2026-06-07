## 1. 核心状态管理模块（Hooks）

### 1.1 `useData` - 主数据池

**文件位置**: `views/instance/edit/hooks/modules/useData.ts`

**职责**: 作为所有数据操作的统一入口，协调数据池、页面池、变化池

**核心数据结构**:

```typescript
// 数据池: { metricCode: { field: value } }
let data: any = {};          

// 原始数据池（用于变化检测）
let _data: any = {};          

// 可视行指标集合
let visibleRows: string[] = [];  
```

**关键方法**:

| 方法 | 入参 | 返回 | 说明 |
|------|------|------|------|
| `setData(code, field, value)` | 指标编码, 字段, 值 | void | 设置数据到池 |
| `getData(code, field)` | 指标编码, 字段 | any | 获取单个数据 |
| `updateData(code, field, value)` | 指标编码, 字段, 值 | void | 更新数据并同步页面池 |
| `clone()` | - | void | 克隆当前数据到原始池 |
| `setVisibleRows(value)` | JSON数组 | void | 设置可视行 |
| `clearData()` | - | void | 清空所有池 |

**updateData 核心逻辑**:

```typescript
const updateData = (code, field, value) => {
  const oldValue = data[code]?.[field];  // 获取旧值
  
  if (isEqual(oldValue, value)) return;  // 无变化则跳过
  
  // 1. 记录旧值到动画池（用于翻转效果）
  if (visibleRows.includes(code)) {
    addAnimationData(`${code}-${field}`, oldValue);
  }
  
  // 2. 更新数据池
  data[code][field] = value;
  
  // 3. 同步更新页面池
  updatePageData(code, field, value);
  
  // 4. 更新变化池（记录修改）
  if (isEqual(_data[code][field], value)) {
    removeChangeData(code, field);  // 恢复原始值
  } else {
    setChangeData(code, field, value);  // 记录变化
  }
};
```

---

### 1.2 `useFormula` - 公式管理

**文件位置**: `views/instance/edit/hooks/modules/useFormula.ts`

**职责**: 管理指标与公式表达式的映射关系

**核心数据结构**:

```typescript
// 公式表达式: { metricCode: formulaString }
let formula: Formula = {};  

// 公式详细信息: { metricCode: { remarks, metricName, formulaDescription } }
let formulaDetail: FormulaDetail = {};  
```

**关键方法**:

| 方法 | 入参 | 返回 | 说明 |
|------|------|------|------|
| `setFormula(code, value)` | 指标编码, 表达式 | void | 设置指标公式 |
| `getFormula(code)` | 指标编码 | string | 获取公式表达式 |
| `setFormulaDetail(code, value)` | 指标编码, 详情对象 | void | 设置公式详情 |
| `getFormulaDetail(code)` | 指标编码 | object | 获取公式详情 |

**公式表达式示例**:

```
${C10001A0433-2027} + MAX(${C10001A0391}-${C10001A0389}, 0)
```

---

### 1.3 `useChangeData` - 变化追踪

**文件位置**: `views/instance/edit/hooks/modules/useChangeData.ts`

**职责**: 记录用户修改的数据，用于增量保存

**核心数据结构**:

```typescript
// 变化池: { metricCode: { field: changedValue } }
const changeData: any = ref({});  
```

**关键方法**:

| 方法 | 入参 | 返回 | 说明 |
|------|------|------|------|
| `setData(code, field, value)` | 指标编码, 字段, 值 | void | 添加变化 |
| `removeData(code, field)` | 指标编码, 字段 | void | 移除变化（恢复原始值时） |
| `clear()` | - | void | 清空变化池 |

---

### 1.4 `usePageData` - 页面数据池

**文件位置**: `views/instance/edit/hooks/modules/usePageData.ts`

**职责**: 按页面管理行数据，用于表格渲染

**核心数据结构**:

```typescript
// 页面池: { pageCode: [row1, row2, ...] }
const pageData: any = ref({});  
```

**关键方法**:

| 方法 | 入参 | 返回 | 说明 |
|------|------|------|------|
| `setPageData(code, value)` | 页面编码, 行数组 | void | 设置页面数据 |
| `update(code, field, value)` | 指标编码, 字段, 值 | void | 遍历所有页面更新单元格 |
| `clear()` | - | void | 清空页面池 |

**update 核心逻辑**:

```typescript
const update = (code, field, value) => {
  Object.values(pageData.value).forEach((data) => {
    data.forEach((row) => {
      if (code === row.metricCode) {
        row[field] = value;
        
        // 单一值行：自动同步所有日期列
        if ([0, '0'].includes(row.isFixed)) {
          const k = Object.keys(row).find(
            (key) => /^(?:\d{4}|\d{4}-[1-4])$/.test(key) && row[key]
          );
          row.isFixeds = k ? row[k] : '';
        }
      }
    });
  });
};
```

---

### 1.5 `useAnimationData` - 动画数据追踪

**文件位置**: `views/instance/edit/hooks/modules/useAnimationData.ts`

**职责**: 记录单元格修改前的旧值，用于翻转动画效果

**核心数据结构**:

```typescript
// 动画池: Map<key, { value, timestamp }>
const animationData: any = ref(new Map());
const expireTime = 10 * 1000;  // 10秒过期

// 高亮状态
const highlight: any = ref({
  enabled: false,
  metricCode: null,
  field: null,
});
```

**关键方法**:

| 方法 | 入参 | 返回 | 说明 |
|------|------|------|------|
| `addAnimationData(key, value)` | 唯一键, 旧值 | void | 添加动画数据 |
| `getAnimationData(key)` | 唯一键 | any | 获取旧值（含过期检查） |
| `checkAnimationData()` | - | void | 批量清理过期数据 |
| `hasAnimationData(key)` | 唯一键 | boolean | 检查是否存在 |

---

### 1.6 `useGridOptions` - 表格配置

**文件位置**: `views/instance/edit/hooks/modules/useGridOptions.ts`

**职责**: 定义 vxe-table 的配置项

**核心配置项**:

```typescript
const gridOptions = reactive({
  // 行配置
  rowConfig: {
    isHover: true,
    isCurrent: true,
    height: 34,
    useKey: true,
  },
  
  // 编辑配置
  editConfig: {
    trigger: 'click',      // 点击编辑
    mode: 'cell',          // 单元格模式
    showIcon: false,       // 不显示编辑图标
    enabled: true,
    beforeEditMethod({ row, column }) {
      return getEditable({...});  // 动态判断是否可编辑
    },
  },
  
  // 右键菜单配置
  menuConfig: {
    enabled: true,
    visibleMethod({ column }) {
      return column.field === 'metricName';  // 只在名称列显示
    },
    body: {
      options: [
        [
          { code: 'expand', name: '同级全部展开' },
          { code: 'collapse', name: '同级全部折叠' },
          { code: 'expandNext', name: '下级全部展开' },
          { code: 'collapseNext', name: '下级全部折叠' },
        ],
      ],
    },
  },
  
  // 树形配置
  treeConfig: {
    rowField: 'emmId',           // 行ID字段
    parentField: 'parentEmmId',   // 父行ID字段
    transform: true,              // 自动转换树结构
    expandAll: true,             // 默认全部展开
    reserve: true,                // 刷新后保持状态
  },
});
```

**单元格样式类**:

| 类名 | 触发条件 | 样式效果 |
|------|----------|----------|
| `is--title` | level 0/1 | 加粗 |
| `is--italic` | italicCodes 集合 | 斜体 |
| `is--check` | checkCodes 集合 | 蓝色斜体 |
| `is--negative` | 数值 < 0 | 红色 |
| `is--editable` | 可编辑状态 | 正常 |
| `is--disabled` | 不可编辑状态 | 灰色 |
| `is--animate` | 动画池中存在 | 翻转动画 |
| `is--highlight` | 高亮模式匹配 | 背景高亮 |

---