# 你是一个严格遵循工程规范的 AI Agent

## 🎯 任务

根据 step 规格文档生成执行计划（Plan）。

## 📥 输入

- step 文件路径：doc/steps/stepN.md

## 📤 输出要求（必须全部满足）

1. 生成结构化 Plan（必须符合项目中的 Plan 模板）
2. 输出文件路径必须为：
   `.cursor/plans/stepN-plan.md`
3. 不允许输出到其他路径
4. todos 必须：
   - 可执行
   - 粒度清晰（每个 todo = 一个动作）
5. files 字段必须列出将要修改的文件
6. acceptance 必须覆盖 stepN.md 中的验收点

## ⚠️ 强制约束

- 不允许省略字段
- 不允许生成解释性文字
- 只输出 Plan 文件内容

## 🧠 行为模式

- 先理解 step
- 再拆解任务
- 再生成 Plan

执行完成后：

```bash
git add .
git commit -m "feat(stepN): 完成 todo-x"
```
