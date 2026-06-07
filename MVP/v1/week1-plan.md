# Week1 MVT 工作计划

> **阶段**: Week1 - vxe-table + HyperFormula 基础绑定
> **日期**: 2026-06-06
> **目标**: 验证 vxe-table 与 HyperFormula 双向绑定的可行性

---

## 1. 验证目标

| 验证点 | 成功标准 |
|--------|----------|
| vxe-table 基础渲染 | 普通单元格渲染正确，支持双击编辑 |
| HyperFormula 初始化 | 能正常创建实例，设置单元格值 |
| 双向绑定 | 编辑单元格 → 公式计算 → 显示结果，延迟 < 100ms |
| 基础公式计算 | `=SUM(A1:A3)` 等基础公式正确计算 |

---

## 2. 工作任务

### 2.1 安装依赖

```bash
cd v2/apps/web
pnpm add vxe-table hyperformula
```

### 2.2 创建目录结构

```
v2/apps/web/src/views/mvt/
├── week1-vxe-hf-binding/
│   ├── VxeTableDemo.vue        # vxe-table 基础渲染 demo
│   ├── HyperFormulaDemo.vue # HyperFormula 初始化 demo
│   ├── BindingDemo.vue         # 双向绑定完整 demo
│   └── README.md              # 本周工作总结
```

### 2.3 验证内容

#### Demo 1: VxeTableDemo.vue
- vxe-table 基础表格渲染
- 3x3 简单数据
- 双击编辑单元格

#### Demo 2: HyperFormulaDemo.vue
- HyperFormula 实例创建
- 设置单元格值
- 基础 SUM 公式计算
- 获取计算结果

#### Demo 3: BindingDemo.vue（核心验证）
- vxe-table + HyperFormula 双向绑定
- 编辑 A1 → A3 自动更新（SUM 公式）
- 验证增量重算是否正常工作

---

## 3. 关键代码设计

### 3.1 BindingDemo.vue 核心逻辑

```typescript
// 双向绑定核心流程
const formulaEngine = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });

// vxe-table 编辑事件 → HyperFormula
function onCellEdit({ row, column, value }) {
  const address = `${column.field}${row + 1}`;
  formulaEngine.setCellContents(address, value);

  // 增量重算并同步回 vxe-table
  const affected = formulaEngine.getAffectedCells(address);
  for (const cell of affected) {
    const result = formulaEngine.getCellValue(cell);
    // 更新 vxe-table 对应单元格
  }
}
```

---

## 4. 验收标准

- [ ] `pnpm add vxe-table hyperformula` 成功，无报错
- [ ] VxeTableDemo.vue 能正常渲染 3x3 表格
- [ ] HyperFormulaDemo.vue 能正确计算 `=SUM(1,2,3)` → 结果6
- [ ] BindingDemo.vue 编辑 A1=1, A2=2, A3=`=SUM(A1:A2)` → A3 自动显示 3
- [ ] 修改 A1=5 → A3 自动更新为 7

---

## 5. 产出文件

| 文件 | 说明 |
|------|------|
| `MVT/v1/week1-worklog.md` | 本周工作记录（含遇到的问题和解决方案） |
| `MVT/v1/week1-verification.md` | 验证结果报告 |
| `v2/apps/web/src/views/mvt/week1-vxe-hf-binding/` | 源代码 |

---

## 6. 参考文档

- `docs/v2_docs/在线协作表格RAG系统_完整交付物_v2/specs/spec-02-vxe-table.md`
- `docs/v2_docs/在线协作表格RAG系统_完整交付物_v2/specs/spec-04-formula.md`
- `docs/v1_docs/公式计算模块.md` - v1 公式实现参考