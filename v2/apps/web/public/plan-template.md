# Cursor Plan Template

## Plan 文件格式

每次执行 Step 前，Planner Agent 需要生成 `.cursor/plans/stepN-plan.md` 文件。

### 文件结构

```markdown
# Step{N} 执行计划

## 阶段信息
- **Step**: step{N}
- **执行角色**: {Frontend Agent / Backend Agent / DBA Agent / Test Agent / UI Agent / Deploy Agent / Fullstack Agent}
- **计划生成时间**: {YYYY-MM-DD HH:mm:ss}

## 任务概述
{简短描述当前 step 的任务目标}

## 详细执行计划

### 步骤 1: {子任务名称}
**涉及文件**: {文件路径}
**执行内容**: {具体要做什么}
**验收标准**: {如何验证完成}

### 步骤 2: {子任务名称}
...

## 依赖关系
- **前置依赖**: step{N-1}.md 或 无
- **产出验证**: {需要验证的前置产出}

## 风险与注意事项
- {风险点}: {应对措施}

## Human Gate 检查点
- [ ] HG1: 计划审查通过
- [ ] HG2: 执行结果验收通过
```

## 使用说明

1. 在执行 step 前，先在 Cursor 的 Plan 模式下生成此文件
2. 根据 step{N}.md 中的 TODO 和验收标准制定详细计划
3. 每个 TODO 对应一个执行步骤
4. 完成后由人工确认是否进入下一步