# Week2 Plan - v1 公式样本转换验证

## 目标
验证 v1 公式语法 `${metricCode}` 能否转换为 HyperFormula 语法（`A1` 单元格引用）

## 验证策略

### v1 公式格式
```
${C10000A0321100003}+${C10000A0322100003}+${C10000A0323100003}
```
- `${metricCode}` 引用指标值
- 公式在计算时会将 `${xxx}` 替换为实际值

### 转换方案
需要构建 **指标Code → 单元格地址** 的映射表：

```typescript
// v1: 指标Code直接引用
"${C10000A0321100003}"  →  需要动态解析

// 转换后: 单元格地址引用
"SUM(A1:A3)"  →  HyperFormula 原生支持
```

### 核心问题
1. v1 公式中 `${metricCode}` 没有年份后缀，需要根据当前编辑的年份解析
2. HyperFormula 需要具体的单元格地址（如 `A1`）
3. 需要预构建 **指标Code → (行, 列)** 的映射表

## 工作任务

### Task 1: 创建公式转换 Demo
- 构建指标Code到单元格地址的映射
- 实现 `${metricCode}` → `A1` 转换逻辑
- 验证转换前后计算结果一致

### Task 2: 10个典型公式样本验证
选取 v1 典型公式进行转换验证

### Task 3: 生成 Week2 验证报告

## 产出文件
```
MVT/v1/week2-formula-conversion/
├── index.vue              # Demo 入口
├── FormulaConverter.vue   # 公式转换核心
├── samples/               # 10个公式样本
└── week2-verification.md  # 验证报告
```