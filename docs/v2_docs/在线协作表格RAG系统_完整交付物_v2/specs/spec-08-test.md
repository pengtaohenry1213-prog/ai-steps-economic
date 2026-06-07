# Spec-08: 测试策略与验收标准

> **版本**: v1.0  
> **状态**: Draft  
> **负责人**: [待填写]  
> **评审人**: [待填写]  
> **关联 Spec**: spec-01 ~ spec-07

---

## 1. 目标与范围

### 1.1 目标
定义系统全生命周期的测试策略，包括单元测试、集成测试、性能测试、安全测试、用户验收测试，确保系统质量达标。

### 1.2 范围
- ✅ 单元测试策略与覆盖率要求
- ✅ 集成测试（模块间、端到端）
- ✅ 性能测试（负载、压力、并发）
- ✅ 安全测试（渗透、脱敏、权限）
- ✅ RAG 准确率评测集
- ✅ 用户验收测试（UAT）

### 1.3 不在范围内
- ❌ 运维监控测试（由运维团队负责）
- ❌ 灾难恢复测试（二期补充）

---

## 2. 术语定义

| 术语 | 定义 |
|------|------|
| 单元测试 | 对单个函数/组件的独立测试 |
| 集成测试 | 验证多个模块协同工作的正确性 |
| E2E 测试 | 端到端测试，模拟真实用户操作流程 |
| 性能测试 | 验证系统在高负载下的响应能力 |
| 渗透测试 | 模拟攻击者发现安全漏洞 |
| 评测集 | 用于量化评估 RAG 准确率的标准问答对 |
| 覆盖率 | 代码被测试覆盖的比例 |

---

## 3. 设计原则

| 原则 | 说明 |
|------|------|
| **测试左移** | 开发阶段即编写测试，而非开发完成后补测试 |
| **自动化优先** | 核心测试用例 100% 自动化，减少人工回归成本 |
| **数据驱动** | 测试数据与测试逻辑分离，便于维护和扩展 |
| **失败即停** | CI/CD 流水线中任何测试失败即阻断发布 |
| **可重复** | 测试用例在任何环境下执行结果一致 |

---

## 4. 详细设计

### 4.1 测试金字塔

```
                    ▲
                   /                    / E2E \           20 个核心场景
                 / 测试  \          （登录→编辑→协作→RAG→导出）
                /─────────               /  集成测试  \       100 个接口/模块组合
              /─────────────             /    单元测试     \     500+ 个函数/组件
            /───────────────────\    覆盖率 ≥ 90%
           /    静态分析/代码审查             /─────────────────────────```

### 4.2 单元测试策略

#### 4.2.1 覆盖率要求

| 模块 | 覆盖率要求 | 工具 |
|------|----------|------|
| 公式引擎（HyperFormula 封装） | **100%** | Vitest / Jest |
| 数据脱敏引擎 | **100%** | Vitest / Jest |
| 协作同步（Yjs 绑定） | ≥ 90% | Vitest / Jest |
| vxe-table 封装组件 | ≥ 85% | Vitest + Vue Test Utils |
| RAG 检索逻辑 | ≥ 90% | Vitest / Jest |
| API 服务 | ≥ 85% | Vitest / Jest |
| **整体** | **≥ 90%** | — |

#### 4.2.2 核心单元测试用例

```typescript
// 公式引擎测试
describe('FormulaEngine', () => {
  test('SUM 基础计算', () => {
    expect(calculate('=SUM(1,2,3)')).toBe(6);
  });

  test('SUM 区域计算', () => {
    const data = [[1], [2], [3]];
    expect(calculate('=SUM(A1:A3)', data)).toBe(6);
  });

  test('循环引用检测', () => {
    expect(() => {
      setFormula('A1', '=B1');
      setFormula('B1', '=A1');
    }).toThrow('CircularReference');
  });

  test('浮点精度', () => {
    expect(calculate('=0.1+0.2')).toBeCloseTo(0.3, 10);
  });
});

// 脱敏引擎测试
describe('DesensitizationEngine', () => {
  test('姓名脱敏', () => {
    expect(desensitize('张三')).toBe('张*');
    expect(desensitize('欧阳娜娜')).toBe('欧***');
  });

  test('手机号脱敏', () => {
    expect(desensitize('13812345678')).toBe('138****5678');
  });

  test('混合文本脱敏', () => {
    const input = '张三的税号91310115MA1K3J5P8Y';
    const result = desensitize(input);
    expect(result).toContain('张*');
    expect(result).toContain('91310115*********Y');
    expect(result).not.toContain('91310115MA1K3J5P8Y');
  });
});

// Yjs 同步测试
describe('YjsCollaboration', () => {
  test('双人编辑不同单元格无冲突', async () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();

    // 用户 A 编辑 A1
    docA.getArray('data').get(0).set(0, 'A');
    // 用户 B 编辑 B1
    docB.getArray('data').get(0).set(1, 'B');

    // 同步
    syncDocs(docA, docB);

    expect(docA.getArray('data').get(0).get(0)).toBe('A');
    expect(docA.getArray('data').get(0).get(1)).toBe('B');
  });

  test('单元格锁定阻止编辑', () => {
    lockCell('A1', 'user_A');
    expect(canEdit('A1', 'user_B')).toBe(false);
  });
});
```

### 4.3 集成测试策略

#### 4.3.1 模块集成测试

| 测试模块组合 | 测试场景 | 工具 |
|------------|---------|------|
| vxe-table + Yjs | 编辑单元格 → Yjs 同步 → 其他客户端收到更新 | Playwright |
| Yjs + Supabase | 离线编辑 → 恢复网络 → 数据持久化到 PostgreSQL | Playwright + API 测试 |
| 公式引擎 + vxe-table | 输入公式 → 计算结果 → 渲染到单元格 | Vitest + Vue Test Utils |
| RAG + LLM | 输入查询 → 检索 → 生成回答 → 返回前端 | Supertest |
| 脱敏 + 导出 | 含敏感数据的表格 → 导出 → 验证水印和脱敏 | Playwright |

#### 4.3.2 API 集成测试

```typescript
// 使用 Supertest 进行 API 测试
describe('API Integration', () => {
  test('创建 Sheet → 编辑单元格 → 查询数据', async () => {
    // 1. 登录
    const loginRes = await request(app)
      .post('/auth/v1/token?grant_type=password')
      .send({ email: 'test@example.com', password: 'password' });
    const token = loginRes.body.access_token;

    // 2. 创建 Sheet
    const sheetRes = await request(app)
      .post('/rest/v1/sheets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '测试表格', column_count: 10, row_count: 100 });
    const sheetId = sheetRes.body.id;

    // 3. 编辑单元格
    await request(app)
      .patch('/rest/v1/sheet_data')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sheet_id: sheetId,
        updates: [{ row_index: 0, col_index: 0, value: '100' }],
      });

    // 4. 查询验证
    const dataRes = await request(app)
      .get(`/rest/v1/sheet_data?sheet_id=eq.${sheetId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(dataRes.body[0].value).toBe('100');
  });

  test('RAG 查询端到端', async () => {
    const res = await request(app)
      .post('/api/rag/query')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: 'A列总和是多少', sheetId: sheetId });

    expect(res.status).toBe(200);
    expect(res.body.answer).toContain('100');
    expect(res.body.confidence).toBeGreaterThan(0.8);
  });
});
```

### 4.4 性能测试策略

#### 4.4.1 性能基准

| 场景 | 指标 | 目标 | 测试工具 |
|------|------|------|---------|
| 表格加载 | 10000 行加载时间 | < 2s | Lighthouse |
| 虚拟滚动 | 滚动帧率 | > 30fps | Chrome DevTools |
| 公式重算 | 1000 个 SUM 公式 | < 50ms | Benchmark.js |
| 协作同步 | 50 并发用户编辑延迟 | P95 < 100ms | k6 |
| RAG 检索 | 端到端查询延迟 | P95 < 350ms | k6 |
| LLM 生成 | 回答生成时间 | < 2s | 自定义脚本 |
| 登录并发 | 100 用户同时登录 | < 500ms | k6 |

#### 4.4.2 k6 性能测试脚本

```javascript
// load-test.js - 协作编辑负载测试
import http from 'k6/http';
import { check, sleep } from 'k6';
import ws from 'k6/ws';

export const options = {
  stages: [
    { duration: '2m', target: 10 },   //  Ramp up
    { duration: '5m', target: 50 },   //  Steady state
    { duration: '2m', target: 100 },  //  Peak load
    { duration: '2m', target: 0 },    //  Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  // 1. 登录获取 JWT
  const loginRes = http.post(`${__ENV.BASE_URL}/auth/v1/token`, {
    email: `user_${__VU}@test.com`,
    password: 'testpassword',
  });

  check(loginRes, {
    'login success': (r) => r.status === 200,
  });

  const token = loginRes.json('access_token');

  // 2. WebSocket 连接（协作编辑）
  const wsRes = ws.connect(`${__ENV.WS_URL}/socket?token=${token}`, null, (socket) => {
    socket.on('open', () => {
      // 发送编辑操作
      socket.send(JSON.stringify({
        type: 'UPDATE',
        cell: `A${__VU}`,
        value: `test_${__VU}_${Date.now()}`,
      }));
    });

    socket.on('message', (msg) => {
      check(msg, {
        'received sync': (m) => m.includes('SYNC'),
      });
    });

    sleep(5);
    socket.close();
  });

  check(wsRes, {
    'websocket connected': (r) => r && r.status === 101,
  });
}
```

### 4.5 RAG 准确率评测集

#### 4.5.1 评测集构建

```typescript
// 评测集数据结构
interface RagTestCase {
  id: string;
  query: string;                    // 用户查询
  intent: QueryIntent;              // 期望意图
  expectedAnswer: string;           // 期望回答（关键词匹配）
  expectedFormula?: string;         // 期望公式
  dataSetup: {                      // 测试数据
    sheetName: string;
    headers: string[];
    rows: any[][];
  };
  evaluationCriteria: {
    accuracy: boolean;              // 回答是否准确
    formulaCorrect: boolean;        // 公式是否正确
    desensitized: boolean;          // 是否脱敏
    sourced: boolean;               // 是否标注来源
  };
}

// 示例评测用例
const RAG_TEST_SET: RagTestCase[] = [
  {
    id: 'RAG-001',
    query: 'A列到F列的平均值是多少？',
    intent: 'aggregate_query',
    expectedAnswer: '平均值',
    expectedFormula: '=AVERAGE(A1:F1)',
    dataSetup: {
      sheetName: '测试表',
      headers: ['A', 'B', 'C', 'D', 'E', 'F'],
      rows: [[10, 20, 30, 40, 50, 60]],
    },
    evaluationCriteria: {
      accuracy: true,
      formulaCorrect: true,
      desensitized: true,
      sourced: true,
    },
  },
  {
    id: 'RAG-002',
    query: '找出销售额大于10万的记录',
    intent: 'filter_query',
    expectedAnswer: '大于10万',
    dataSetup: {
      sheetName: '销售表',
      headers: ['客户', '销售额'],
      rows: [
        ['张三', 50000],
        ['李四', 150000],
        ['王五', 200000],
      ],
    },
    evaluationCriteria: {
      accuracy: true,
      formulaCorrect: false,
      desensitized: true,
      sourced: true,
    },
  },
  // ... 共 200 条
];
```

#### 4.5.2 评测执行

```typescript
// 自动评测脚本
async function evaluateRag(testSet: RagTestCase[]): Promise<EvaluationResult> {
  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  for (const testCase of testSet) {
    // 1. 设置测试数据
    await setupTestData(testCase.dataSetup);

    // 2. 执行 RAG 查询
    const result = await ragQuery(testCase.query);

    // 3. 评估结果
    const checks = {
      accuracy: result.answer.includes(testCase.expectedAnswer),
      formulaCorrect: testCase.expectedFormula 
        ? result.formula === testCase.expectedFormula 
        : true,
      desensitized: !containsSensitiveData(result.answer),
      sourced: !!result.dataSource,
    };

    const allPassed = Object.values(checks).every(Boolean);

    if (allPassed) {
      passed++;
    } else {
      failed++;
      failures.push(`${testCase.id}: ${JSON.stringify(checks)}`);
    }
  }

  return {
    total: testSet.length,
    passed,
    failed,
    accuracy: passed / testSet.length,
    failures,
  };
}
```

### 4.6 E2E 测试策略

#### 4.6.1 核心用户旅程

| 旅程 | 步骤 | 验证点 |
|------|------|--------|
| **登录→编辑→保存** | 1. 登录 2. 创建 Sheet 3. 编辑单元格 4. 保存 | 数据持久化、审计日志记录 |
| **多人协作** | 1. 用户 A 登录 2. 用户 B 登录 3. 同时编辑 4. 验证同步 | 无冲突、Awareness 显示 |
| **公式计算** | 1. 输入公式 2. 验证结果 3. 修改依赖单元格 4. 验证级联更新 | 计算准确、增量重算 |
| **RAG 查询** | 1. 打开助手面板 2. 输入查询 3. 验证回答 4. 插入公式 | 回答准确、公式可插入 |
| **导出脱敏** | 1. 编辑含敏感数据表格 2. 导出 3. 验证脱敏和水印 | 敏感数据已脱敏、水印存在 |

#### 4.6.2 Playwright E2E 测试

```typescript
// e2e/collaboration.spec.ts
import { test, expect } from '@playwright/test';

test('双人协作编辑无冲突', async ({ browser }) => {
  // 创建两个浏览器上下文（模拟两个用户）
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();

  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  // 用户 A 登录并打开表格
  await pageA.goto('/login');
  await pageA.fill('[name=email]', 'userA@test.com');
  await pageA.fill('[name=password]', 'password');
  await pageA.click('button[type=submit]');
  await pageA.goto('/sheet/test-sheet');

  // 用户 B 登录并打开同一表格
  await pageB.goto('/login');
  await pageB.fill('[name=email]', 'userB@test.com');
  await pageB.fill('[name=password]', 'password');
  await pageB.click('button[type=submit]');
  await pageB.goto('/sheet/test-sheet');

  // 用户 A 编辑 A1
  await pageA.dblclick('[data-cell="A1"]');
  await pageA.fill('[data-cell="A1"] input', 'Hello from A');
  await pageA.press('[data-cell="A1"] input', 'Enter');

  // 用户 B 编辑 B1
  await pageB.dblclick('[data-cell="B1"]');
  await pageB.fill('[data-cell="B1"] input', 'Hello from B');
  await pageB.press('[data-cell="B1"] input', 'Enter');

  // 等待同步
  await pageA.waitForTimeout(500);
  await pageB.waitForTimeout(500);

  // 验证双方都能看到对方的修改
  await expect(pageA.locator('[data-cell="B1"]')).toContainText('Hello from B');
  await expect(pageB.locator('[data-cell="A1"]')).toContainText('Hello from A');

  await contextA.close();
  await contextB.close();
});
```

### 4.7 CI/CD 测试流水线

```yaml
# .github/workflows/test.yml
name: Test Pipeline

on: [push, pull_request]

jobs:
  unit-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - uses: codecov/codecov-action@v3
        with:
          fail_ci_if_error: true
          minimum_coverage: 90

  integration-test:
    runs-on: ubuntu-latest
    needs: unit-test
    services:
      postgres:
        image: supabase/postgres:15.1.1.78
        env:
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:integration

  e2e-test:
    runs-on: ubuntu-latest
    needs: integration-test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e

  performance-test:
    runs-on: ubuntu-latest
    needs: integration-test
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:perf
      - run: |
          # k6 性能测试
          docker run -v $(pwd)/tests/perf:/tests             -e BASE_URL=http://host.docker.internal:3000             grafana/k6 run /tests/load-test.js
```

---

## 5. 验收标准汇总

### 5.1 功能验收

| 模块 | 验收项 | 标准 |
|------|--------|------|
| 表格编辑 | 万行级虚拟滚动 | 帧率 > 30fps |
| 公式计算 | 10000 条随机公式 | 准确率 100% |
| 协作同步 | 50 并发用户 | 无冲突、P95 < 100ms |
| RAG 查询 | 200 条评测集 | 准确率 ≥ 90% |
| 数据脱敏 | 100 条敏感数据 | 脱敏率 100% |
| 审计日志 | 所有操作 | 覆盖率 100% |

### 5.2 性能验收

| 指标 | 目标 | 测试方法 |
|------|------|---------|
| 表格加载 | < 2s | Lighthouse |
| 公式重算 | < 50ms | Benchmark.js |
| RAG 检索 | P95 < 350ms | k6 |
| LLM 生成 | < 2s | 自定义脚本 |
| 登录响应 | < 500ms | k6 |

### 5.3 安全验收

| 指标 | 目标 | 测试方法 |
|------|------|---------|
| 渗透测试 | 无高危漏洞 | 专业渗透测试 |
| 脱敏完整性 | 100% | 人工抽检 |
| 权限控制 | 无越权 | 自动化测试 |
| 审计完整性 | 100% | 日志分析 |

---

## 6. 测试环境配置

| 环境 | 用途 | 数据 |
|------|------|------|
| 本地开发 | 开发调试 | 模拟数据 |
| CI 测试 | 自动化测试 | 固定测试数据集 |
| 集成测试 | 模块集成 | 生产数据脱敏副本 |
| 预发布 | UAT | 生产数据脱敏副本 |
| 生产 | 线上运行 | 真实数据 |

---

## 7. 关联 Spec

| Spec 编号 | 关系 | 说明 |
|-----------|------|------|
| spec-01 ~ spec-07 | 依赖 | 所有 Spec 的功能均需测试覆盖 |
