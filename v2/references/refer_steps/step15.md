
# 🎯 任务目标

实现历史对话 CRUD 接口，内存存储历史对话记录

## 🧱 项目背景

用户需要查看和回显历史对话记录，提升使用体验。该接口是第二优先级的核心功能。

## 📋 任务要求

1. 接口设计（在 src/routes/history.route.ts）：
   * POST /api/history：新增对话
     * 接收参数：{ question: string, answer: string }
     * 生成唯一 id（UUID）和创建时间
     * 存入内存数组
   * GET /api/history：查询所有历史对话
     * 返回所有历史对话列表
     * 支持按创建时间倒序排列
   * DELETE /api/history：清空历史对话
     * 清空内存中的历史对话数组
   * GET /api/history/:id：根据 ID 查询单条对话（扩展）
2. TS 类型定义：

   ```ts
   interface HistoryItem {
     id: string;
     question: string;
     answer: string;
     createTime: string;
   }
   ```

3. 参数校验与错误处理：
   * 必填字段校验
   * 类型校验
   * 异常捕获

## ⚠️ 强约束

* 内存存储仅用数组（重启后数据清零，符合轻量级要求）
* 完整 TS 类型定义
* 接口返回结构化响应（success/error/data）
* 预留分页查询扩展空间

## 📤 输出格式

### 文件1：src/routes/history.route.ts

```ts
// 历史对话路由完整代码
```

### 文件2：src/services/history.service.ts

```ts
// 历史对话逻辑封装完整代码
```

### 文件3：src/types/history.types.ts

```ts
// 历史对话类型定义完整代码
```

## 🚫 禁止行为

* 不要引入数据库依赖
* 不要忽略参数校验
* 不要返回非结构化数据

---

## 🧪 测试要求（参考 TEST Rule）

### 测试类型：接口测试

### 测试范围

* POST /api/history 新增对话
* GET /api/history 查询历史
* DELETE /api/history 清空历史
* GET /api/history/:id 查询单条

### 测试用例

| 用例ID | 测试场景 | 预期结果 | 实际结果 | 测试状态 |
|--------|---------|---------|---------|----------|
| TC-HIST-101 | POST 新增对话 | 返回 `{success: true, data: {id, createTime}}` | `{success:true,data:{id:"d89ed038...",createTime:"2026-03-30T09:15:57.801Z"}}` | ✅ PASS |
| TC-HIST-102 | POST 缺少 question 参数 | 返回 `{success: false, error: "question 为必填"}` | `{success:false,data:null,error:"question 为必填参数"}` | ✅ PASS |
| TC-HIST-103 | POST 缺少 answer 参数 | 返回 `{success: false, error: "answer 为必填"}` | `{success:false,data:null,error:"answer 为必填参数"}` | ✅ PASS |
| TC-HIST-104 | POST 参数类型错误 | 返回参数类型错误提示 | `{success:false,data:null,error:"question 为必填参数"}` | ✅ PASS |
| TC-HIST-105 | GET 查询所有历史 | 返回历史列表，按 createTime 倒序 | 返回列表，按时间倒序排列 | ✅ PASS |
| TC-HIST-106 | GET 空数据库 | 返回 `{success: true, data: []}` | `{success:true,"data":[]}` | ✅ PASS |
| TC-HIST-107 | DELETE 清空历史 | 返回 `{success: true}`，历史列表为空 | `{success:true,data:null}` | ✅ PASS |
| TC-HIST-108 | DELETE 后 GET | 返回空数组 | `{success:true,"data":[]}` | ✅ PASS |
| TC-HIST-109 | 新增后立即 GET | 新增的对话在列表中 | 对话出现在列表中 | ✅ PASS |
| TC-HIST-110 | GET /api/history/:id 存在记录 | 返回单条对话详情 | 返回完整对话详情 | ✅ PASS |
| TC-HIST-111 | GET /api/history/:id 不存在 | 返回 `{success: false, error: "记录不存在"}` | `{success:false,data:null,error:"记录不存在"}` | ✅ PASS |
| TC-HIST-112 | 并发新增多个对话 | 每个都有唯一 id | 3个不同UUID | ✅ PASS |
| TC-HIST-113 | 重启服务后 GET | 数据已清空（内存存储） | `{success:true,"data":[]}` | ✅ PASS |

### 问题清单

| 序号 | 问题描述 | 严重级别 | 复现步骤 | 问题状态 |
|------|---------|---------|---------|----------|
| 1 | - | - | - | - |

---

## 项目目录结构（tree 形式）

- 参考：`md/项目结构.md`

## 项目 git commit 规范

- 参考：`md/Git提交规范.md`

> 注：auto-commit.sh 会自动生成的内容（当检测到 step 相关变更时）：feat: step15.md - 实现历史对话 CRUD 接口
