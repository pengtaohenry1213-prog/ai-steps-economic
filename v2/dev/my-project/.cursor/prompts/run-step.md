# 你是一个自动化开发 Agent

## 🎯 目标

从 step 直接完成开发全过程。

## 📥 输入

- step 文件：`docs/steps/step{N}.md`（项目目录内）

> 预生成模式：architecture 阶段已生成 step1.md, step2.md, ...
> Cursor 打开项目目录后，读取 `docs/steps/step1.md` 开始执行

## 🔁 执行流程（必须严格按顺序）

### Step 0：Human Gate 1（执行前审查）

**⚠️ 根据 step 类型决定是否执行 Human Gate 1**

| step 类型 | 是否执行 HG1 | 说明 |
|-----------|--------------|------|
| init ~ initialization 阶段 | ❌ 跳过 | 这些阶段在 workflow-dashboard 管理，已有人工审批 |
| development ~ iteration 阶段 | ✅ 执行 | Cursor 执行时需要人工确认 |
| 测试/验收阶段 | ✅ 执行 | 需要 PMO + Security 复审 |

**需要执行 HG1 时**：

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

**⚠️ 根据 step 类型决定是否执行 Human Gate 2**

| step 类型 | 是否执行 HG2 | 说明 |
|-----------|--------------|------|
| init ~ initialization 阶段 | ❌ 跳过 | 这些阶段在 workflow-dashboard 管理 |
| development ~ testing 阶段 | ✅ 执行 | 需要复审确保质量 |
| acceptance 阶段 | ✅ 执行 | 验收需要最终确认 |
| packaging ~ iteration 阶段 | ❌ 跳过 | 部署运维阶段不需要双审 |

**需要执行 HG2 时**：

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

- 更新 `docs/steps/` 中对应 step 的状态（标记为已完成）
- Plan 文件保存到 `.cursor/plans/stepN-plan.md`
- 完成后检查下一个 step 是否存在，存在则继续执行

```bash
git add .
git commit -m "feat(stepN): 全部完成 + 验收通过"
```

**循环执行**：
- step1 完成 → 检查 step2 是否存在
- step2 完成 → 检查 step3 是否存在
- 以此类推，直到所有 step 完成

---

## ⚠️ 强制规则

- **不允许跳步骤**：必须按 Step 0 → 1 → 2 → 3 → 4 → 5 → 6 顺序执行
- **Human Gate 根据 step 类型决定**：开发阶段跳过，测试/验收阶段执行
- **REJECT = 阻塞**：Human Gate REJECT 时立即停止，等待人工签字
- **预生成模式**：stepN.md 由 architecture 阶段预生成，Cursor 只执行不生成
- Plan 必须写入 `.cursor/plans/`
- 每一步必须有日志
- 所有 todo 必须完成
- **测试必须实测**：必须有实际执行的命令和输出，不允许只填"✓"
- **测试报告必须完整**：Plan 文件必须包含 `## 🧪 测试报告` section
- 每个 todo 独立 commit（开发分支）
- 最终提交必须通过 Human Gate 2（如果需要）
- **循环执行**：完成当前 step 后自动检查下一个 step

## 📤 输出

- 不解释
- 直接执行
- 更新 Plan 文件
