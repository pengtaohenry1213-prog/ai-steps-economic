# 🧠 在线Excel架构设计（Enterprise Spreadsheet Architecture）

适用于：

- Vue3 + TS
    
- Handsontable
    
- vxe-table
    
- Luckysheet
    
- Univer
    
- 自研在线表格系统
    

目标：

构建：

```text
高性能
可扩展
支持公式
支持联动
支持图谱
支持协同
支持AI
```

最终形态：

类似：

- Excel Online
    
- 飞书多维表格
    
- Airtable
    
- Notion Database
    
- FineReport
    

---

# 🚀 一、整体架构（核心）

---

# 📌 推荐分层架构

```text
UI Layer
 ↓
Table Engine
 ↓
Formula Engine
 ↓
Dependency Graph
 ↓
Data Store
 ↓
Persistence Layer
```

---

# 📌 真正核心：

不是表格UI。

而是：

```text
Formula Engine
+
Dependency Graph
```

---

# 🧱 二、推荐目录结构（企业级）

```text
excel/
├── core/
├── engine/
├── formula/
├── parser/
├── tokenizer/
├── ast/
├── interpreter/
├── graph/
├── worker/
├── history/
├── renderer/
├── selection/
├── clipboard/
├── command/
├── plugins/
├── storage/
├── collaboration/
├── ai/
└── tests/
```

---

# 🧠 三、核心模块详解（重要）

---

# 📌 3.1 Table Engine（表格引擎）

负责：

- 单元格渲染
    
- 滚动
    
- 选择
    
- 编辑
    
- 复制粘贴
    
- 虚拟滚动
    

---

# 📌 推荐：

UI只负责：

```text
展示
交互
```

不要做计算。

---

# ⚙️ 四、Formula Engine（最核心）

---

# 📌 公式引擎架构

```text
公式字符串
 ↓
Tokenizer
 ↓
Parser
 ↓
AST
 ↓
Interpreter
 ↓
计算结果
```

---

# 📌 示例

公式：

```text
=A1+B1*2
```

---

# Tokenizer：

```json
[
  "A1",
  "+",
  "B1",
  "*",
  "2"
]
```

---

# AST：

```text
      +
     / \
   A1   *
       / \
     B1   2
```

---

# 🧠 五、AST（抽象语法树）

AST是整个系统核心。

---

# 📌 推荐节点结构

```ts
interface ASTNode {
  type: string;
  value?: string;
  left?: ASTNode;
  right?: ASTNode;
}
```

---

# 📌 节点类型

```text
BinaryExpression
Literal
CellReference
FunctionCall
RangeReference
```

---

# ⚡ 六、Dependency Graph（核心中的核心）

这是 Excel 灵魂。

---

# 📌 例子

```text
A1 = B1 + C1
B1 = D1 * 2
```

---

# Graph：

```text
A1 -> B1
A1 -> C1
B1 -> D1
```

---

# 📌 作用：

- 联动更新
    
- 循环依赖检测
    
- 局部刷新
    
- 影响分析
    
- 图谱展示
    

---

# 📌 推荐数据结构

```ts
Map<CellId, Set<CellId>>
```

---

# 🚨 七、循环依赖检测（必须）

---

# 📌 示例

```text
A1 -> B1
B1 -> C1
C1 -> A1
```

---

# 📌 必须：

检测：

```text
Cycle
```

---

# 📌 推荐算法

- DFS
    
- Topological Sort
    

---

# ⚡ 八、增量计算（高性能核心）

---

# ❌ 错误：

全表重新计算。

---

# ✅ 正确：

只计算：

```text
受影响节点
```

---

# 📌 流程

```text
修改B1
 ↓
查Dependency Graph
 ↓
找到影响节点
 ↓
局部重新计算
```

---

# 🧠 九、Worker架构（非常重要）

大型表格必须 Worker。

---

# 📌 主线程

负责：

- UI
    
- Interaction
    

---

# 📌 Worker线程

负责：

- Formula计算
    
- Graph更新
    
- Parser
    

---

# 📌 推荐：

```text
UI线程 ≠ 计算线程
```

---

# ⚡ 十、性能优化（关键）

---

# 📌 必须：

---

## 虚拟滚动

只渲染可视区域。

---

## 增量更新

局部刷新。

---

## 缓存

缓存：

- AST
    
- Token
    
- Formula结果
    

---

## 防抖

输入防抖。

---

# 🚀 十一、命令系统（推荐）

推荐：

```text
Command Pattern
```

---

# 📌 用于：

- undo
    
- redo
    
- 历史记录
    

---

# 📌 示例

```ts
interface Command {
  execute(): void;
  undo(): void;
}
```

---

# 🧠 十二、协同编辑（未来重点）

---

# 📌 推荐：

```text
CRDT
```

或：

```text
Yjs
```

---

# 📌 实现：

- 多人编辑
    
- 冲突解决
    
- 实时同步
    

---

# 📊 十三、图谱系统（你非常适合）

这是你技术路线亮点。

---

# 📌 关系图

```text
A1 -> B1
A1 -> C1
C1 -> D1
```

---

# 📌 推荐：

```text
Neo4j
+
Cytoscape.js
```

---

# 📌 能力：

- 查看依赖
    
- 查看影响范围
    
- 数据血缘
    
- 联动分析
    

---

# 🤖 十四、AI能力（未来核心）

---

# 📌 AI公式生成

用户输入：

```text
计算销售额增长率
```

AI生成：

```text
=(B2-A2)/A2
```

---

# 📌 AI数据分析

AI：

- 自动生成图表
    
- 自动分析异常
    
- 自动生成报表
    

---

# 📌 AI调试公式

AI：

- 检测错误公式
    
- 分析循环依赖
    
- 给修复建议
    

---

# 🧪 十五、测试架构（必须）

---

# 📌 必测：

|模块|测试|
|---|---|
|tokenizer|unit|
|parser|unit|
|AST|unit|
|graph|integration|
|formula|integration|

---

# 📌 性能测试

必须：

```text
10万单元格
```

压测。

---

# 🚀 十六、推荐技术栈（非常适合你）

|模块|推荐|
|---|---|
|UI|Vue3|
|表格|Handsontable|
|Graph|Cytoscape|
|Worker|Comlink|
|AST|自研/nearley|
|协同|Yjs|
|图谱|Neo4j|

---

# 🧠 十七、最终企业级架构（推荐）

```text
apps/
packages/
├── formula-engine
├── graph-engine
├── worker-engine
├── ui-table
├── ai-engine
└── shared
```
