# Spec-05: RAG 全流程 + 数据脱敏

> **版本**: v1.0  
> **状态**: Draft  
> **负责人**: [待填写]  
> **评审人**: [待填写]  
> **关联 Spec**: spec-01, spec-04, spec-07

---

## 1. 目标与范围

### 1.1 目标
定义 RAG（检索增强生成）智能助手的完整流程，包括意图识别、向量检索、数据脱敏、LLM 生成回答，确保回答准确率 ≥ 90%，敏感数据零泄漏。

### 1.2 范围
- ✅ 用户查询意图识别与分类
- ✅ 表格数据向量化与索引
- ✅ 两阶段混合检索（稠密 + 稀疏 + Rerank）
- ✅ 数据脱敏（姓名、手机号、税号、金额）
- ✅ LLM 生成回答（Qwen2.5/GLM）
- ✅ Function Calling（表格查询、公式生成）
- ✅ 结果格式化（自然语言 + 表格高亮 + 图表推荐）

### 1.3 不在范围内
- ❌ 多轮对话上下文管理（二期）
- ❌ 语音输入（未来扩展）

---

## 2. 术语定义

| 术语 | 定义 |
|------|------|
| Embedding | 文本向量化，将语义转换为高维向量 |
| Rerank | 重排序，对初筛结果精细排序提升相关性 |
| HyDE | Hypothetical Document Embeddings，查询改写技术 |
| Function Calling | LLM 调用外部工具（如查询数据库、生成公式） |
| PII | Personally Identifiable Information，个人身份信息 |
| 脱敏 | 将敏感信息替换为掩码（如 `138****1234`） |

---

## 3. 设计原则

| 原则 | 说明 |
|------|------|
| **回答可溯源** | 每个回答必须标注数据来源（Sheet 名、行号、列名） |
| **数据零泄漏** | 任何输出（回答、图表、导出）均不可包含明文敏感数据 |
| **意图可控** | 系统只能执行预定义的查询类型，禁止执行写入/删除操作 |
| **不确定不答** | 检索结果相关性低于阈值时，必须回复"无法找到相关信息" |
| **审计全留存** | 每次查询的输入、检索过程、输出结果全部记录 |

---

## 4. 详细设计

### 4.1 RAG 整体流程

```
用户输入: "Q3 华东区销售额总和是多少？"
    │
    ▼
┌─────────────────────────────────────────┐
│  Step 1: 意图识别 (Intent Classification) │
│  - 意图: AGGREGATE_QUERY                 │
│  - 实体: { time: "Q3", region: "华东区", metric: "销售额" } │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  Step 2: 查询改写 (Query Rewriting)      │
│  - 原始: "Q3 华东区销售额总和"            │
│  - 改写: "2024年第三季度 华东地区 销售金额 汇总" │
│  - HyDE: 生成假设文档片段                │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  Step 3: 混合检索 (Hybrid Retrieval)     │
│  ├── 稠密向量检索 (BGE-M3 Dense) → Top 100 │
│  ├── 稀疏向量检索 (BGE-M3 Sparse) → Top 100 │
│  ├── 标签过滤 (L1: 报表类型=销售报表)      │
│  └── RRF 融合 → 150-180 候选              │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  Step 4: 精排 (Rerank)                   │
│  - bge-reranker-v2-m3 重排序              │
│  - 阈值过滤 (score < 0.35 丢弃)           │
│  - 输出: 3-8 个高相关 Chunk               │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  Step 5: 结构化查询生成 (Query Generation) │
│  - 识别到聚合查询 → 生成 HyperFormula 公式  │
│  - 公式: =SUMIF(区域列,"华东区",销售额列)   │
│  - 或生成 SQL: SELECT SUM(销售额) FROM ... │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  Step 6: 数据查询与脱敏 (Query + Desensitize)│
│  - 执行公式/SQL 查询                      │
│  - 对结果进行脱敏处理                     │
│  - 金额: 保留格式，禁止复制导出（可配置）    │
│  - 税号/姓名/手机号: 掩码处理              │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  Step 7: LLM 生成回答 (Answer Generation) │
│  - 输入: 检索到的 Chunk + 脱敏后的查询结果   │
│  - Prompt: "基于以下数据回答..."           │
│  - 输出: 自然语言回答 + 公式展示 + 数据来源   │
└─────────────────────────────────────────┘
    │
    ▼
用户看到: "Q3 华东区销售额总和为 ¥12,568,050.00
          计算方式: SUMIF(区域列,"华东区",销售额列)
          数据来源: 销售报表 Sheet1, 第 3-150 行
          [查看详情] [插入公式]"
```

### 4.2 意图识别分类

```typescript
enum QueryIntent {
  // 聚合查询
  AGGREGATE_QUERY = 'aggregate_query',    // "总和/平均/最大/最小"

  // 筛选查询
  FILTER_QUERY = 'filter_query',          // "找出大于10万的记录"

  // 对比查询
  COMPARE_QUERY = 'compare_query',        // "对比本月和上月"

  // 公式解释
  FORMULA_EXPLAIN = 'formula_explain',    // "这个公式什么意思"

  // 公式推荐
  FORMULA_SUGGEST = 'formula_suggest',    // "怎么计算增长率"

  // 异常检测
  ANOMALY_DETECT = 'anomaly_detect',      // "为什么这个月异常高"

  // 数据概览
  DATA_OVERVIEW = 'data_overview',        // "这张表有什么数据"

  // 未知/闲聊
  UNKNOWN = 'unknown',
}

interface IntentResult {
  intent: QueryIntent;
  confidence: number;       // 置信度 0-1
  entities: {
    time?: string;          // 时间范围
    region?: string;        // 地区
    metric?: string;        // 指标（销售额/税额等）
    columns?: string[];     // 涉及的列
    condition?: string;     // 筛选条件
  };
}
```

### 4.3 表格数据向量化策略

#### 4.3.1 Chunk 设计

| 数据类型 | Chunk 内容 | 元数据 | 向量维度 |
|---------|-----------|--------|---------|
| 表头信息 | `"列名:销售额,类型:货币,单位:元,Sheet:销售报表"` | sheet_id, col_index, data_type | 1024 |
| 数据行 | `"表头[销售额|地区|月份] 数据[100万|华东|2024-07]"` | row_index, sheet_id | 1024 |
| 公式单元格 | `"公式:=SUM(A1:A10),结果:1000,含义:A列求和,Sheet:销售报表"` | formula_type, dependencies | 1024 |
| Sheet 摘要 | `"Sheet:销售报表,包含列:销售额/地区/月份,共150行,时间范围:2024-Q1~Q3"` | sheet_name, row_count | 1024 |

#### 4.3.2 向量索引配置（Qdrant）

```yaml
# Qdrant Collection 配置
collection_name: table_rag

vectors:
  dense:          # 稠密向量
    size: 1024
    distance: Cosine
  sparse:         # 稀疏向量（BGE-M3 支持）
    index_type: sparse

payload_schema:
  sheet_id:       # Sheet 标识
    type: keyword
  row_index:      # 行号
    type: integer
  col_index:      # 列号
    type: integer
  data_type:      # 数据类型
    type: keyword
    enum: [header, data_row, formula, sheet_summary]
  formula_type:   # 公式类型
    type: keyword
    enum: [SUM, AVERAGE, VLOOKUP, IF, CUSTOM]
  l1_tag:         # 业务域标签
    type: keyword
  l2_tag:         # 文档属性标签
    type: keyword
  is_sensitive:   # 是否含敏感数据
    type: bool
```

### 4.4 两阶段混合检索

```typescript
// 第一阶段：召回（力度优先）
async function firstStageRetrieval(query: string, intent: IntentResult): Promise<Chunk[]> {
  // 1. 查询向量化
  const queryEmbedding = await embeddingModel.encode(query);
  const querySparse = await embeddingModel.encodeSparse(query);

  // 2. 标签过滤（L1）
  const filter = {
    must: [
      { key: 'l1_tag', match: { value: intent.entities.metric } },
    ],
  };

  // 3. 稠密向量检索
  const denseResults = await qdrant.search('dense', {
    vector: queryEmbedding,
    limit: 100,
    filter,
  });

  // 4. 稀疏向量检索
  const sparseResults = await qdrant.search('sparse', {
    vector: querySparse,
    limit: 100,
    filter,
  });

  // 5. RRF 融合 (k=60)
  const fused = reciprocalRankFusion(denseResults, sparseResults, { k: 60 });

  return fused.slice(0, 180);
}

// 第二阶段：精排（精度优先）
async function secondStageRerank(query: string, candidates: Chunk[]): Promise<Chunk[]> {
  // 1. 重排序
  const scores = await reranker.rerank(query, candidates.map(c => c.content));

  // 2. 阈值过滤
  const filtered = candidates
    .map((c, i) => ({ ...c, score: scores[i] }))
    .filter(c => c.score >= 0.35)
    .sort((a, b) => b.score - a.score);

  // 3. 控制送入 LLM 的 Chunk 数量
  return filtered.slice(0, 8);
}

// 自适应降级
function adaptiveFallback(rerankScore: number): string {
  if (rerankScore < 0.2) {
    // 触发 HyDE 改写
    return 'hyde_rewrite';
  }
  if (rerankScore === 0) {
    // 降级到外部搜索（如内部知识库）
    return 'external_search';
  }
  return 'normal';
}
```

### 4.5 数据脱敏规则

#### 4.5.1 脱敏策略表

| 敏感类型 | 正则规则 | 脱敏方式 | 示例 |
|---------|---------|---------|------|
| 姓名 | `[一-龥]{2,4}` | 保留首字，其余替换为 `*` | `张三` → `张*` |
| 手机号 | `1[3-9]\d{9}` | 中间 4 位替换为 `****` | `13812345678` → `138****5678` |
| 身份证号 | `\d{17}[\dXx]` | 中间 12 位替换为 `************` | `11010119900101****` |
| 纳税人识别号 | `[A-Z0-9]{15,20}` | 中间替换为 `*********` | `91310115*********Y` |
| 银行卡号 | `\d{16,19}` | 保留前 4 后 4，中间 `****` | `6222****8888` |
| 金额 | `\d+(,\d{3})*(\.\d+)?` | 展示但禁止复制导出（可配置） | `¥1,234,567.89`（只读展示） |
| 邮箱 | `[\w.-]+@[\w.-]+\.\w+` | 用户名部分掩码 | `z***@example.com` |

#### 4.5.2 脱敏引擎实现

```typescript
class DesensitizationEngine {
  private rules: DesensitizeRule[] = [
    {
      name: 'name',
      pattern: /[一-龥]{2,4}/g,
      mask: (match: string) => match[0] + '*'.repeat(match.length - 1),
    },
    {
      name: 'phone',
      pattern: /1[3-9]\d{9}/g,
      mask: (match: string) => match.slice(0, 3) + '****' + match.slice(7),
    },
    {
      name: 'tax_id',
      pattern: /[A-Z0-9]{15,20}/g,
      mask: (match: string) => match.slice(0, 8) + '*********' + match.slice(-1),
    },
    {
      name: 'amount',
      pattern: /\d+(,\d{3})*(\.\d+)?/g,
      mask: (match: string) => match,  // 金额不脱敏文本，但标记为敏感
      isSensitive: true,
    },
  ];

  // 文本脱敏
  desensitize(text: string): { text: string; sensitiveFields: SensitiveField[] } {
    let result = text;
    const sensitiveFields: SensitiveField[] = [];

    for (const rule of this.rules) {
      result = result.replace(rule.pattern, (match) => {
        const masked = rule.mask(match);
        sensitiveFields.push({
          type: rule.name,
          original: match,
          masked,
          isSensitive: rule.isSensitive || false,
        });
        return masked;
      });
    }

    return { text: result, sensitiveFields };
  }

  // 表格数据脱敏（结构化）
  desensitizeTableData(data: any[][], headers: ColumnConfig[]): any[][] {
    return data.map(row => 
      row.map((cell, colIndex) => {
        const header = headers[colIndex];
        if (header.sensitiveType) {
          return this.desensitizeCell(cell, header.sensitiveType);
        }
        return cell;
      })
    );
  }

  private desensitizeCell(value: any, type: SensitiveType): any {
    switch (type) {
      case 'amount':
        return { value, display: this.formatAmount(value), copyable: false };
      case 'name':
        return typeof value === 'string' ? value[0] + '*' : value;
      case 'phone':
        return typeof value === 'string' ? value.slice(0, 3) + '****' + value.slice(7) : value;
      default:
        return value;
    }
  }
}
```

### 4.6 LLM 生成与 Function Calling

#### 4.6.1 Prompt 模板

```markdown
# 角色设定
你是企业财税智能助手，精通 Excel 公式和财税数据分析。
你的回答必须基于提供的参考数据，不可编造信息。

# 当前上下文
- 当前表格: {{sheet_name}}
- 表头: {{headers}}
- 数据范围: {{data_range}}
- 用户角色: {{user_role}}

# 参考数据片段
{{retrieved_chunks}}

# 查询结果（已脱敏）
{{query_result}}

# 指令
1. 用自然语言回答用户问题
2. 如涉及计算，展示具体公式和计算过程
3. 标注数据来源（Sheet 名、行号范围）
4. 如涉及敏感数据，提醒"数据已脱敏处理"
5. 如信息不足，回复"无法找到相关信息"

# 输出格式
{
  "answer": "自然语言回答",
  "formula": "涉及的公式（如有）",
  "data_source": "数据来源说明",
  "confidence": 0.95,
  "sensitive_notice": true
}
```

#### 4.6.2 Function Calling 工具集

```typescript
const ragTools = [
  {
    name: 'query_table_aggregate',
    description: '对表格数据进行聚合计算（SUM/AVG/COUNT/MAX/MIN）',
    parameters: {
      sheet_id: { type: 'string', description: 'Sheet ID' },
      columns: { type: 'array', items: { type: 'string' }, description: '目标列名' },
      operation: { type: 'string', enum: ['SUM', 'AVG', 'COUNT', 'MAX', 'MIN'] },
      filter: { type: 'string', description: '筛选条件（如 "地区=华东区"）' },
    },
  },
  {
    name: 'query_table_filter',
    description: '筛选表格数据',
    parameters: {
      sheet_id: { type: 'string' },
      conditions: { type: 'array', description: '筛选条件列表' },
      limit: { type: 'number', default: 100 },
    },
  },
  {
    name: 'generate_formula',
    description: '根据需求生成 Excel 公式',
    parameters: {
      goal: { type: 'string', description: '计算目标' },
      data_context: { type: 'string', description: '数据结构描述' },
    },
  },
  {
    name: 'detect_anomaly',
    description: '检测数据异常',
    parameters: {
      sheet_id: { type: 'string' },
      column: { type: 'string' },
      method: { type: 'string', enum: ['Z_SCORE', 'IQR', 'RULE_BASED'] },
    },
  },
];
```

---

## 5. 接口契约

### 5.1 RAG 查询接口

```typescript
// RAG 查询
POST /api/rag/query
Body: {
  query: string;              // 用户自然语言查询
  sheetId?: string;           // 指定表格（可选）
  conversationId?: string;    // 对话 ID（多轮上下文）
  userId: string;
}

Response: {
  answer: string;             // 自然语言回答
  formula?: string;           // 推荐公式
  dataSource: {
    sheetName: string;
    rowRange: string;         // "3-150"
    columns: string[];
  };
  confidence: number;         // 置信度
  retrievedChunks: Chunk[];   // 检索到的 Chunk（调试用）
  executionTime: number;      // 总耗时（ms）
  sensitiveNotice: boolean;   // 是否包含脱敏提示
}
```

### 5.2 向量索引管理接口

```typescript
// 索引表格数据
POST /api/rag/index
Body: {
  sheetId: string;
  data: any[][];
  headers: ColumnConfig[];
  metadata: SheetMetadata;
}

// 删除索引
DELETE /api/rag/index/{sheetId}

// 增量更新
PATCH /api/rag/index/{sheetId}
Body: {
  updatedRows: { rowIndex: number; data: any[] }[];
  deletedRows: number[];
}
```

---

## 6. 测试策略

### 6.1 准确率测试（评测集）

| 测试类型 | 数量 | 通过标准 |
|---------|------|---------|
| 聚合查询 | 50 条 | 准确率 ≥ 95% |
| 筛选查询 | 50 条 | 准确率 ≥ 90% |
| 对比查询 | 30 条 | 准确率 ≥ 85% |
| 公式解释 | 30 条 | 准确率 ≥ 90% |
| 异常检测 | 20 条 | 准确率 ≥ 85% |
| 数据概览 | 20 条 | 准确率 ≥ 90% |
| **合计** | **200 条** | **整体 ≥ 90%** |

### 6.2 脱敏测试

| 测试场景 | 输入 | 期望输出 |
|---------|------|---------|
| 姓名脱敏 | `张三` | `张*` |
| 手机号脱敏 | `13812345678` | `138****5678` |
| 税号脱敏 | `91310115MA1K3J5P8Y` | `91310115*********Y` |
| 金额展示 | `1234567.89` | `¥1,234,567.89`（不可复制） |
| 混合文本 | `张三的税号91310115MA1K3J5P8Y` | `张*的税号91310115*********Y` |

### 6.3 性能测试

| 指标 | 目标 |
|------|------|
| 意图识别延迟 | < 50ms |
| 向量检索 P95 | < 350ms |
| Rerank 延迟 | < 100ms |
| LLM 生成延迟 | < 2s |
| 端到端总延迟 | < 3s |

---

## 7. 验收标准

- [ ] 200 条评测集 Query 整体准确率 ≥ 90%
- [ ] 敏感数据脱敏率 100%（人工抽检 100 条）
- [ ] 检索 P95 延迟 < 350ms
- [ ] LLM 生成延迟 < 2s
- [ ] 回答可溯源（每条回答标注数据来源）
- [ ] 不确定时正确回复"无法找到相关信息"（误答率 < 5%）

---

## 8. 关联 Spec

| Spec 编号 | 关系 | 说明 |
|-----------|------|------|
| spec-01 | 依赖 | 架构设计定义 RAG 层位置 |
| spec-04 | 被依赖 | 公式引擎提供计算能力 |
| spec-07 | 被依赖 | 安全规则定义脱敏策略 |
