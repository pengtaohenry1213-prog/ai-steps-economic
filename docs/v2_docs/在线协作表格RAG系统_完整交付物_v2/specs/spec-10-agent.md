# Spec-10: RAG Agent 智能体（ReAct + CoT + 自主拆任务）

> **版本**: v1.0  
> **状态**: Draft  
> **负责人**: [待填写]  
> **评审人**: [待填写]  
> **关联 Spec**: spec-01, spec-02, spec-04, spec-05, spec-07

---

## 1. 目标与范围

### 1.1 目标
定义基于 ReAct（推理+行动）和 CoT（思维链）的 RAG Agent 智能体，使 AI 能够自主拆解复杂指令、调用工具操作表格、完成多步骤任务并返回结果。

### 1.2 范围
- ✅ CoT 思维链：复杂问题分步推理
- ✅ ReAct 循环：推理 → 行动 → 观察 → 再推理
- ✅ Agent 自主拆任务：复杂指令自动拆解为子任务序列
- ✅ 工具调用：操作 vxe-table（筛选、公式、标色、汇总、可视化）
- ✅ 安全控制：危险操作需 Human Gate 确认
- ✅ 审计追踪：Agent 所有操作记录完整日志

### 1.3 不在范围内
- ❌ 跨 Sheet 自动化流程编排（二期）
- ❌ 定时任务/定时报表（二期）

---

## 2. 术语定义

| 术语 | 定义 |
|------|------|
| CoT | Chain of Thought，思维链，让 AI 先展示推理步骤再给出结果 |
| ReAct | Reasoning + Acting，推理与行动结合，循环执行直到任务完成 |
| Agent | 智能体，能自主决策、调用工具、完成复杂任务的 AI 系统 |
| Tool Calling | 工具调用，Agent 调用外部功能（如表格操作 API） |
| Task Decomposition | 任务拆解，将复杂指令拆分为可执行的子任务序列 |
| Reflection | 反思，Agent 对执行结果进行自我验证和纠错 |
| Human Gate | 人工关卡，危险/不可逆操作需人工确认 |

---

## 3. 设计原则

| 原则 | 说明 |
|------|------|
| **可观测** | Agent 的每一步推理和行动必须对用户可见（思维链展示） |
| **可干预** | 用户可在任何步骤暂停、修改、取消 Agent 执行 |
| **可回滚** | Agent 操作支持撤销，错误操作可一键恢复 |
| **最小权限** | Agent 默认只读，写入操作需显式授权或 Human Gate |
| **审计完整** | Agent 的每次推理、工具调用、结果均记录审计日志 |

---

## 4. 详细设计

### 4.1 Agent 架构（ReAct + CoT）

```
用户输入: "帮我分析一下Q3华东区的销售数据，找出异常，标红大于20万的记录，
          并在底部加一行汇总"
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Step 1: CoT 思维链生成（Task Decomposition）                        │
│ ───────────────────────────────────────────                         │
│ 思考: 用户需要完成多个操作，我需要拆解为子任务:                        │
│   1. 筛选出"华东区"且"Q3"的数据                                      │
│   2. 统计分析（总和、平均、最大、最小）                              │
│   3. 异常检测（识别偏离平均值的数据）                                 │
│   4. 标红大于20万的记录（条件格式）                                   │
│   5. 在底部插入汇总行（SUM公式）                                      │
│   6. 生成分析报告返回给用户                                         │
└─────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Step 2~N: ReAct 循环执行                                             │
│ ─────────────────────                                                │
│                                                                      │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐         │
│  │ 推理    │ → │ 行动    │ → │ 观察    │ → │ 反思    │ → ...     │
│  │Think    │    │Act      │    │Observe  │    │Reflect  │         │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘         │
│       ↑______________________________________________________│     │
│                                                                      │
│  示例循环:                                                            │
│  推理: 需要筛选华东区数据 →                                           │
│  行动: 调用 filter_table(地区="华东区") →                             │
│  观察: 返回15行数据 →                                                │
│  反思: 数据量合理，继续下一步 →                                       │
│  推理: 需要计算统计指标 →                                             │
│  行动: 调用 calculate_stats(销售额列) →                              │
│  观察: 平均15.3万，最大28万，最小8万 →                               │
│  反思: 发现28万异常偏高，需标红 →                                     │
│  ...                                                                 │
└─────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 结果返回                                                            │
│ ────────                                                            │
│ "分析完成！Q3华东区共15条记录，销售额平均¥15.3万。                    │
│  发现2条异常记录（>20万）已标红高亮。                                 │
│  底部已添加汇总行：总销售额¥230万。                                  │
│  [查看详情] [撤销操作] [保存结果]"                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 CoT 思维链引擎

```typescript
interface CoTStep {
  stepNumber: number;
  thought: string;           // 推理内容
  action?: AgentAction;      // 对应的行动
  observation?: string;      // 观察结果
  status: 'pending' | 'running' | 'completed' | 'failed';
  timestamp: number;
}

interface CoTChain {
  taskId: string;
  originalQuery: string;
  steps: CoTStep[];
  finalResult?: string;
  isComplete: boolean;
}

class CoTEngine {
  /**
   * 生成思维链（任务拆解）
   */
  async generateChain(query: string, context: AgentContext): Promise<CoTChain> {
    const prompt = `
# 角色
你是企业表格智能助手，擅长将复杂指令拆解为可执行的步骤。

# 当前表格上下文
- Sheet: ${context.sheetName}
- 表头: ${context.headers.join(', ')}
- 数据行数: ${context.rowCount}
- 用户角色: ${context.userRole}

# 用户指令
"${query}"

# 要求
1. 将指令拆解为 3-8 个具体步骤
2. 每个步骤必须是可执行的操作（筛选/计算/格式化/插入）
3. 标注每个步骤的风险等级（read / write / dangerous）
4. 如果包含 write/dangerous 步骤，标记需要 Human Gate

# 输出格式（JSON）
{
  "steps": [
    {
      "stepNumber": 1,
      "thought": "步骤描述",
      "action": { "tool": "tool_name", "params": {} },
      "riskLevel": "read|write|dangerous"
    }
  ],
  "needsHumanGate": boolean,
  "estimatedTime": "预计耗时"
}
`;

    // 调用 LLM 生成思维链
    const response = await this.llm.generate(prompt);
    return this.parseChain(response, query);
  }

  /**
   * 展示思维链（给用户看）
   */
  renderChain(chain: CoTChain): React.ReactNode {
    return (
      <div className="cot-chain">
        <h4>AI 执行计划</h4>
        {chain.steps.map(step => (
          <div key={step.stepNumber} className={`cot-step ${step.status}`}>
            <div className="step-number">{step.stepNumber}</div>
            <div className="step-content">
              <div className="step-thought">{step.thought}</div>
              {step.action && (
                <div className="step-action">
                  <span className="action-tool">{step.action.tool}</span>
                  <span className={`risk-badge ${step.action.riskLevel}`}>
                    {step.action.riskLevel}
                  </span>
                </div>
              )}
              {step.observation && (
                <div className="step-observation">{step.observation}</div>
              )}
            </div>
            <div className="step-status">
              {step.status === 'pending' && '⏳'}
              {step.status === 'running' && '▶️'}
              {step.status === 'completed' && '✅'}
              {step.status === 'failed' && '❌'}
            </div>
          </div>
        ))}
      </div>
    );
  }
}
```

### 4.3 ReAct 执行引擎

```typescript
interface AgentAction {
  tool: string;
  params: Record<string, any>;
  riskLevel: 'read' | 'write' | 'dangerous';
}

interface AgentObservation {
  success: boolean;
  data?: any;
  error?: string;
  affectedCells?: string[];
}

interface ReActState {
  currentStep: number;
  chain: CoTChain;
  memory: AgentMemory;
  isPaused: boolean;
  isWaitingForHuman: boolean;
}

class ReActEngine {
  private tools: Map<string, AgentTool>;
  private state: ReActState;
  private onStepUpdate: (step: CoTStep) => void;

  constructor(tools: AgentTool[], onStepUpdate: (step: CoTStep) => void) {
    this.tools = new Map(tools.map(t => [t.name, t]));
    this.onStepUpdate = onStepUpdate;
  }

  /**
   * 执行 ReAct 循环
   */
  async execute(chain: CoTChain): Promise<string> {
    this.state = {
      currentStep: 0,
      chain,
      memory: new AgentMemory(),
      isPaused: false,
      isWaitingForHuman: false,
    };

    for (let i = 0; i < chain.steps.length; i++) {
      if (this.state.isPaused) {
        await this.waitForResume();
      }

      const step = chain.steps[i];
      this.state.currentStep = i;

      // 更新状态为执行中
      step.status = 'running';
      step.timestamp = Date.now();
      this.onStepUpdate(step);

      try {
        // 执行行动
        if (step.action) {
          // 检查是否需要 Human Gate
          if (step.action.riskLevel === 'dangerous') {
            this.state.isWaitingForHuman = true;
            const approved = await this.requestHumanGate(step);
            if (!approved) {
              step.status = 'failed';
              step.observation = '用户拒绝了此操作';
              this.onStepUpdate(step);
              break;
            }
          }

          const tool = this.tools.get(step.action.tool);
          if (!tool) {
            throw new Error(`未知工具: ${step.action.tool}`);
          }

          const observation = await tool.execute(step.action.params, this.state.memory);
          step.observation = this.formatObservation(observation);
          step.status = observation.success ? 'completed' : 'failed';

          // 保存到记忆
          this.state.memory.add(step.thought, step.action, observation);
        } else {
          step.status = 'completed';
        }
      } catch (err: any) {
        step.status = 'failed';
        step.observation = `错误: ${err.message}`;

        // 尝试自我修复（Reflection）
        const fixed = await this.tryFix(step, err, this.state.memory);
        if (fixed) {
          step.status = 'completed';
          step.observation = `已自动修复: ${fixed}`;
        }
      }

      this.onStepUpdate(step);
    }

    // 生成最终结果
    return this.generateFinalResult(chain);
  }

  /**
   * 请求 Human Gate 确认
   */
  private async requestHumanGate(step: CoTStep): Promise<boolean> {
    return new Promise((resolve) => {
      const confirmed = window.confirm(
        `危险操作确认\n\n` +
        `步骤 ${step.stepNumber}: ${step.thought}\n\n` +
        `工具: ${step.action?.tool}\n` +
        `参数: ${JSON.stringify(step.action?.params, null, 2)}\n\n` +
        `此操作将修改表格数据，是否继续？`
      );
      resolve(confirmed);
    });
  }

  /**
   * 尝试自动修复错误（Reflection）
   */
  private async tryFix(
    step: CoTStep,
    error: Error,
    memory: AgentMemory
  ): Promise<string | null> {
    const fixPrompt = `
上一步执行失败:
- 步骤: ${step.thought}
- 工具: ${step.action?.tool}
- 参数: ${JSON.stringify(step.action?.params)}
- 错误: ${error.message}

请提供修复方案（修改参数或更换工具）:
`;

    const fix = await this.llm.generate(fixPrompt);

    if (fix && fix.tool) {
      const tool = this.tools.get(fix.tool);
      if (tool) {
        const observation = await tool.execute(fix.params, memory);
        if (observation.success) {
          return fix.thought;
        }
      }
    }

    return null;
  }

  /**
   * 格式化观察结果
   */
  private formatObservation(obs: AgentObservation): string {
    if (!obs.success) {
      return `失败: ${obs.error}`;
    }
    if (obs.affectedCells) {
      return `成功，影响 ${obs.affectedCells.length} 个单元格`;
    }
    return `成功`;
  }

  /**
   * 生成最终结果
   */
  private generateFinalResult(chain: CoTChain): string {
    const completed = chain.steps.filter(s => s.status === 'completed').length;
    const failed = chain.steps.filter(s => s.status === 'failed').length;

    let result = `任务执行完成！\n\n`;
    result += `成功: ${completed} 步\n`;
    if (failed > 0) {
      result += `失败: ${failed} 步\n`;
    }
    result += `\n执行详情:\n`;

    chain.steps.forEach(step => {
      const icon = step.status === 'completed' ? '✅' : step.status === 'failed' ? '❌' : '⏳';
      result += `${icon} 步骤 ${step.stepNumber}: ${step.thought}\n`;
      if (step.observation) {
        result += `   ${step.observation}\n`;
      }
    });

    return result;
  }

  private async waitForResume(): Promise<void> {
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (!this.state.isPaused) {
          clearInterval(check);
          resolve();
        }
      }, 100);
    });
  }
}
```

### 4.4 Agent 工具集（操作 vxe-table）

```typescript
interface AgentTool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  riskLevel: 'read' | 'write' | 'dangerous';
  execute: (params: any, memory: AgentMemory) => Promise<AgentObservation>;
}

interface ToolParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

// 工具 1: 筛选数据
const filterTableTool: AgentTool = {
  name: 'filter_table',
  description: '根据条件筛选表格数据',
  riskLevel: 'read',
  parameters: [
    { name: 'column', type: 'string', description: '列名', required: true },
    { name: 'operator', type: 'string', description: '操作符: eq/ne/gt/lt/contains', required: true },
    { name: 'value', type: 'any', description: '筛选值', required: true },
  ],
  execute: async (params, memory) => {
    const { column, operator, value } = params;
    const filteredRows = memory.getSheetData().filter(row => {
      const cellValue = row[memory.getColumnIndex(column)];
      switch (operator) {
        case 'eq': return cellValue == value;
        case 'ne': return cellValue != value;
        case 'gt': return Number(cellValue) > Number(value);
        case 'lt': return Number(cellValue) < Number(value);
        case 'contains': return String(cellValue).includes(value);
        default: return false;
      }
    });
    memory.setFilteredData(filteredRows);
    return {
      success: true,
      data: { count: filteredRows.length, rows: filteredRows.slice(0, 5) },
    };
  },
};

// 工具 2: 插入公式
const insertFormulaTool: AgentTool = {
  name: 'insert_formula',
  description: '在指定单元格插入公式',
  riskLevel: 'write',
  parameters: [
    { name: 'cell', type: 'string', description: '单元格地址 (如 A1)', required: true },
    { name: 'formula', type: 'string', description: '公式文本', required: true },
  ],
  execute: async (params, memory) => {
    const { cell, formula } = params;
    const validation = formulaEngine.validateFormula(formula);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    const match = cell.match(/([A-Z]+)(\d+)/);
    if (!match) {
      return { success: false, error: '无效的单元格地址' };
    }
    const col = match[1].charCodeAt(0) - 65;
    const row = parseInt(match[2]) - 1;
    formulaEngine.setCell(row, col, formula);
    const result = formulaEngine.getCellValue(row, col);
    memory.updateCell(row, col, { formula, value: result.value });
    return {
      success: true,
      data: { value: result.value, displayValue: result.displayValue },
      affectedCells: [cell],
    };
  },
};

// 工具 3: 条件格式（标色）
const conditionalFormatTool: AgentTool = {
  name: 'conditional_format',
  description: '对满足条件的单元格应用格式',
  riskLevel: 'write',
  parameters: [
    { name: 'range', type: 'string', description: '范围 (如 A1:A100)', required: true },
    { name: 'condition', type: 'string', description: '条件表达式', required: true },
    { name: 'style', type: 'object', description: '样式 {backgroundColor, fontColor}', required: true },
  ],
  execute: async (params, memory) => {
    const { condition, style } = params;
    const affectedCells: string[] = [];
    const rows = memory.getSheetData();
    rows.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (evaluateCondition(cell, condition)) {
          memory.setCellStyle(rowIndex, colIndex, style);
          affectedCells.push(`${String.fromCharCode(65 + colIndex)}${rowIndex + 1}`);
        }
      });
    });
    return {
      success: true,
      data: { formattedCount: affectedCells.length },
      affectedCells,
    };
  },
};

// 工具 4: 插入汇总行
const insertSummaryTool: AgentTool = {
  name: 'insert_summary',
  description: '在表格底部插入汇总行',
  riskLevel: 'write',
  parameters: [
    { name: 'columns', type: 'string[]', description: '需要汇总的列', required: true },
    { name: 'functions', type: 'string[]', description: '汇总函数 (SUM/AVG/COUNT)', required: true },
  ],
  execute: async (params, memory) => {
    const { columns, functions } = params;
    const lastRow = memory.getRowCount();
    const formulas: string[] = [];
    columns.forEach((col: string, index: number) => {
      const func = functions[index] || 'SUM';
      const colLetter = String.fromCharCode(65 + memory.getColumnIndex(col));
      formulas.push(`=${func}(${colLetter}1:${colLetter}${lastRow})`);
    });
    memory.insertRow(lastRow, formulas);
    return {
      success: true,
      data: { insertedAt: lastRow + 1, formulas },
      affectedCells: formulas.map((_, i) => `${String.fromCharCode(65 + i)}${lastRow + 1}`),
    };
  },
};

// 工具 5: 数据可视化
const createChartTool: AgentTool = {
  name: 'create_chart',
  description: '根据数据生成图表',
  riskLevel: 'read',
  parameters: [
    { name: 'type', type: 'string', description: '图表类型: bar/line/pie', required: true },
    { name: 'dataRange', type: 'string', description: '数据范围', required: true },
    { name: 'title', type: 'string', description: '图表标题', required: false },
  ],
  execute: async (params, memory) => {
    const { type, dataRange, title } = params;
    const data = memory.getRangeData(dataRange);
    return {
      success: true,
      data: {
        chartType: type,
        chartData: data,
        title: title || '数据图表',
      },
    };
  },
};

// 工具 6: 异常检测
const detectAnomalyTool: AgentTool = {
  name: 'detect_anomaly',
  description: '检测数据异常值',
  riskLevel: 'read',
  parameters: [
    { name: 'column', type: 'string', description: '检测列', required: true },
    { name: 'method', type: 'string', description: '检测方法: z_score/iqr/rule', required: true },
  ],
  execute: async (params, memory) => {
    const { column, method } = params;
    const values = memory.getColumnData(column).map(Number).filter(v => !isNaN(v));
    let anomalies: { row: number; value: number; reason: string }[] = [];

    if (method === 'z_score') {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const std = Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length);
      values.forEach((value, index) => {
        const zScore = Math.abs((value - mean) / std);
        if (zScore > 2) {
          anomalies.push({ row: index, value, reason: `Z-Score=${zScore.toFixed(2)} > 2` });
        }
      });
    } else if (method === 'iqr') {
      const sorted = [...values].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;
      values.forEach((value, index) => {
        if (value < q1 - 1.5 * iqr || value > q3 + 1.5 * iqr) {
          anomalies.push({ row: index, value, reason: `超出 IQR 范围` });
        }
      });
    }

    return {
      success: true,
      data: {
        anomalyCount: anomalies.length,
        anomalies: anomalies.slice(0, 10),
        statistics: { mean: values.reduce((a, b) => a + b, 0) / values.length, count: values.length },
      },
    };
  },
};

// 工具注册表
export const AGENT_TOOLS: AgentTool[] = [
  filterTableTool,
  insertFormulaTool,
  conditionalFormatTool,
  insertSummaryTool,
  createChartTool,
  detectAnomalyTool,
];
```

### 4.5 Agent 记忆系统

```typescript
class AgentMemory {
  private sheetData: any[][];
  private filteredData: any[][];
  private cellStyles: Map<string, CellStyle>;
  private history: { thought: string; action: AgentAction; observation: AgentObservation }[];

  constructor() {
    this.sheetData = [];
    this.filteredData = [];
    this.cellStyles = new Map();
    this.history = [];
  }

  add(thought: string, action: AgentAction, observation: AgentObservation): void {
    this.history.push({ thought, action, observation });
  }

  getSheetData(): any[][] {
    return this.filteredData.length > 0 ? this.filteredData : this.sheetData;
  }

  setSheetData(data: any[][]): void {
    this.sheetData = data;
  }

  setFilteredData(data: any[][]): void {
    this.filteredData = data;
  }

  getColumnIndex(columnName: string): number {
    const headers = this.sheetData[0] || [];
    return headers.indexOf(columnName);
  }

  getColumnData(columnName: string): any[] {
    const colIndex = this.getColumnIndex(columnName);
    return this.getSheetData().map(row => row[colIndex]);
  }

  getRangeData(range: string): any[][] {
    return this.getSheetData();
  }

  getRowCount(): number {
    return this.getSheetData().length;
  }

  updateCell(row: number, col: number, data: { formula?: string; value?: any }): void {
    if (!this.sheetData[row]) this.sheetData[row] = [];
    this.sheetData[row][col] = data.value;
  }

  setCellStyle(row: number, col: number, style: CellStyle): void {
    this.cellStyles.set(`${row}:${col}`, style);
  }

  insertRow(index: number, data: any[]): void {
    this.sheetData.splice(index, 0, data);
  }

  getHistory(): string {
    return this.history.map((h, i) => 
      `${i + 1}. ${h.thought}\n   行动: ${h.action.tool}\n   结果: ${h.observation.success ? '成功' : '失败'}`
    ).join('\n');
  }
}
```

---

## 5. 接口契约

### 5.1 Agent 执行接口

```typescript
// 启动 Agent 任务
POST /api/agent/execute
Body: {
  query: string;              // 用户自然语言指令
  sheetId: string;
  userId: string;
  autoApprove?: boolean;     // 是否自动批准非危险操作（默认 false）
}

Response: {
  taskId: string;
  chain: CoTChain;
  status: 'running' | 'paused' | 'completed' | 'cancelled';
  currentStep: number;
}

// 获取任务状态
GET /api/agent/status/{taskId}
Response: {
  taskId: string;
  chain: CoTChain;
  status: string;
  currentStep: number;
  isWaitingForHuman: boolean;
}

// 暂停/继续/取消任务
POST /api/agent/control/{taskId}
Body: {
  action: 'pause' | 'resume' | 'cancel';
}

// Human Gate 确认
POST /api/agent/approve/{taskId}
Body: {
  stepNumber: number;
  approved: boolean;
  reason?: string;           // 拒绝原因
}

// 撤销 Agent 操作
POST /api/agent/undo/{taskId}
Body: {
  undoAll: boolean;          // true=撤销全部，false=撤销最后一步
}
```

---

## 6. 测试策略

### 6.1 Agent 功能测试

| 测试场景 | 输入 | 期望行为 |
|---------|------|---------|
| 简单筛选 | "筛选出华东区的数据" | 生成 1 步 CoT，执行 filter_table |
| 复杂分析 | "分析Q3数据，标红异常，加汇总" | 生成 5+ 步 CoT，含 ReAct 循环 |
| 危险操作 | "删除所有数据" | 标记 dangerous，触发 Human Gate |
| 错误恢复 | "对不存在的列执行操作" | Reflection 尝试修复或优雅失败 |
| 用户暂停 | 执行中点击暂停 | 当前步骤完成后暂停，可继续 |
| 撤销操作 | 执行完成后点击撤销 | 恢复原始数据状态 |

### 6.2 CoT 准确率测试

| 指令类型 | 数量 | 通过标准 |
|---------|------|---------|
| 单步操作 | 20 条 | 拆解为 1 步，准确率 100% |
| 多步操作 | 30 条 | 拆解为 2-5 步，顺序正确 |
| 复杂分析 | 20 条 | 拆解为 5-8 步，含条件判断 |
| 含危险操作 | 10 条 | 正确标记 dangerous |
| 模糊指令 | 10 条 | 生成澄清问题或合理假设 |

---

## 7. 验收标准

- [ ] CoT 任务拆解准确率 ≥ 90%（100 条测试指令）
- [ ] ReAct 循环执行成功率 ≥ 85%
- [ ] 危险操作 100% 触发 Human Gate
- [ ] Agent 操作支持一键撤销
- [ ] 审计日志记录 Agent 完整执行轨迹
- [ ] 用户可在任何步骤暂停/修改/取消
- [ ] 执行结果包含数据溯源（来源 Sheet、行号）

---

## 8. 关联 Spec

| Spec 编号 | 关系 | 说明 |
|-----------|------|------|
| spec-01 | 依赖 | 架构设计定义 Agent 层位置 |
| spec-02 | 被依赖 | vxe-table 封装提供工具操作能力 |
| spec-04 | 被依赖 | 公式引擎提供计算工具 |
| spec-05 | 被依赖 | RAG 检索提供数据上下文 |
| spec-07 | 被依赖 | 安全规则定义 Human Gate 和审计 |
