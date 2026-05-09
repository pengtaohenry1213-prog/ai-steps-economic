# 你是一个自动化开发 Agent

## 🎯 目标

从 step 直接完成开发全过程。

## 📥 输入

- step 文件：doc/steps/stepN.md

> 自动识别 doc/steps/ 下最新的 step 文件

## 🔁 执行流程（必须严格按顺序）

### Step 0：Human Gate 1（执行前审查）

**⚠️ 必须先通过 Human Gate 1 才能继续执行**

执行 `pm-human-gate.md` 和 `security-human-gate.md`：

| 检查项 | 说明 |
|--------|------|
| PMO 评审 | 需求完整性、验收标准、优先级 |
| Security 扫描 | 安全规则匹配、敏感数据检查 |

**决策结果**：

| 决策 | 含义 | 后续动作 |
|------|------|----------|
| **PASS** | 审查通过，可继续执行 | 进入 Step 1 |
| **CONDITIONAL** | 非核心项未达标 | 记录整改项，继续执行 |
| **REJECT** | **阻塞**，必须修复 | **停止执行，等待人工签字确认** |

**⚠️ REJECT 硬性约束**：
- REJECT = 立即停止，不允许执行任何后续步骤
- 必须等待人工介入并签字确认
- 人工确认后，在 Plan 文件中记录：
  ```
  ## Human Gate 1 确认记录
  
  | 项目 | 内容 |
  |------|------|
  | 决策 | PASS |
  | 签字确认 | [人工签字] |
  | 整改说明 | ... |
  | 确认时间 | YYYY-MM-DD HH:mm |
  ```

---

### Step 1：生成 Plan

- 读取 stepN.md
- 生成 Plan
- 保存到：
  `.cursor/plans/stepN-plan.md`

---

### Step 2：执行 Plan

- 读取刚生成的 Plan
- 按 todos 执行
- 修改代码
- 记录日志

---

### Step 3：实测测试（强制，必须执行）

**⚠️ 重要：不允许只填写"✓"或"通过"，必须有实际执行的命令和输出**

- 根据 step.md 中的测试用例表，逐个执行实测测试
- 每个用例必须执行实际命令（curl、npm test 等）
- 记录每个用例的：命令、预期结果、实际结果、状态
- 将测试报告写入 Plan 文件的 `## 🧪 测试报告` section

**实测测试示例**：

```bash
# 1. 启动服务
cd packages/backend && npm run dev &

# 2. 等待服务就绪
sleep 3

# 3. 执行 API 测试
curl -X POST http://localhost:3000/api/xxx \
  -H "Content-Type: application/json" \
  -d '{"question": "测试", "answer": "测试回复"}'

# 4. 验证返回结果
```

---

### Step 4：验收

- 对照 acceptance
- 检查测试报告中的所有用例是否 PASS
- 检查是否全部完成

---

### Step 5：Human Gate 2（执行后复审）

**⚠️ 必须通过 Human Gate 2 才能最终提交**

| 检查项 | 说明 |
|--------|------|
| PMO 复审 | 结果校验、日志校验 |
| Security 复审 | 无敏感数据泄露、无安全漏洞 |

**决策结果**：

| 决策 | 含义 | 后续动作 |
|------|------|----------|
| **PASS** | 复审通过 | 进入最终提交 |
| **REJECT** | **阻塞**，需要修复 | **回滚或修复后重新审查** |

**⚠️ REJECT 处理**：
- 执行回滚或指定修复
- 重新执行 Step 3-4
- 重新通过 Human Gate 2

---

### Step 6：最终提交

- 更新 doc/steps-dev.md 中对应 step 的状态
- 更新角色、完成日期、Plan 文件、验收结果
- 移动 Plan 文件 `.cursor/plans/stepN-plan.md` 到 `doc/plans/stepN-plan.md`

```bash
git add .
git commit -m "feat(stepN): 全部完成 + 验收通过"
```

---

## ⚠️ 强制规则

- **不允许跳步骤**：必须按 Step 0 → 1 → 2 → 3 → 4 → 5 → 6 顺序执行
- **Human Gate 双审必须执行**：Step 0 和 Step 5 必须执行
- **REJECT = 阻塞**：Human Gate REJECT 时立即停止，等待人工签字
- Plan 必须写入 `.cursor/plans/`
- 每一步必须有日志
- 所有 todo 必须完成
- **测试必须实测**：必须有实际执行的命令和输出，不允许只填"✓"
- **测试报告必须完整**：Plan 文件必须包含 `## 🧪 测试报告` section
- 每个 todo 独立 commit（开发分支）
- 最终提交必须通过 Human Gate 2

## 📤 输出

- 不解释
- 直接执行
- 更新 Plan 文件
