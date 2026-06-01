
# 🎯 任务目标

实现环境变量与配置管理，统一管理所有配置项，避免硬编码敏感信息

## 🧱 项目背景

项目需要统一管理配置（如 API 密钥、端口号），避免硬编码，同时支持不同环境的配置切换。

## 📋 任务要求

1. 环境变量配置（.env 文件）：

> 具体 豆包对话 API 配置信息 请参考： ~/config/doubao-model.md

   ```javascript
   PORT=3000
   DOUBAO_API_KEY=279dc1d3-2003-4aa2-baea-5ceda434f97e
   DOUBAO_API_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
   DOUBAO_MODEL_NAME=doubao-seed-2-0-code-preview-260215
   NODE_ENV=development
   ```

2. 配置管理模块（src/config/index.ts）：
   * 使用 dotenv 加载环境变量
   * 封装配置读取函数
   * 提供配置项缺失的校验
3. 配置类型定义（src/types/config.types.ts）：

   ```ts
   interface AppConfig {
     port: number;
     doubao: {
       apiKey: string;
       baseUrl: string;
       model: string;
     };
     env: string;
   }
   ```

4. 统一使用：
   * 所有调用豆包 API 的地方从 config 读取
   * 服务端口从 config 读取
   * 禁止硬编码敏感信息

## ⚠️ 强约束

* .env 文件必须加入 .gitignore
* 配置项缺失时抛出明确错误
* 不能在代码中硬编码 API 密钥

## 📤 输出格式

### 文件1：.env.example

```bash
# 环境变量示例文件
PORT=3000
DOUBAO_API_KEY=279dc1d3-2003-4aa2-baea-5ceda434f97e
DOUBAO_API_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
DOUBAO_MODEL_NAME=doubao-seed-2-0-code-preview-260215
```

### 文件2：src/config/index.ts

```ts
// 配置管理完整代码
```

### 文件3：src/types/config.types.ts

```ts
// 配置类型定义完整代码
```

### 文件4：src/app.ts 或 src/index.ts

```ts
// dotenv 加载示例
```

## 🚫 禁止行为

* 不要提交 .env 文件到仓库
* 不要硬编码 API 密钥
* 不要忽略配置项缺失的校验

---

## 🧪 测试要求（参考 TEST Rule）

### 测试类型：功能测试

### 测试范围

- 环境变量加载
* 配置项读取
* 配置项校验
* .env 文件安全

### 测试用例

| 用例ID | 测试场景 | 预期结果 | 实际结果 | 测试状态 |
|--------|---------|---------|---------|----------|
| TC-CFG-001 | 正常加载 .env 文件 | 所有配置项正确加载 | - | - |
| TC-CFG-002 | 缺少 PORT 配置 | 抛出错误或使用默认值 3000 | - | - |
| TC-CFG-003 | 缺少 DOUBAO_API_KEY | 抛出错误 `"API Key 未配置"` | - | - |
| TC-CFG-004 | 缺少 DOUBAO_API_BASE_URL | 使用默认值 URL | - | - |
| TC-CFG-005 | 配置类型转换正确 | 字符串 "3000" 转为数字 3000 | - | - |
| TC-CFG-006 | 读取不存在的配置 | 返回 undefined | - | - |
| TC-CFG-007 | .env 文件不在仓库中 | .gitignore 包含 .env | - | - |
| TC-CFG-008 | .env.example 存在 | 提供示例但不包含真实密钥 | - | - |
| TC-CFG-009 | 代码中无硬编码密钥 | 所有 API 调用从 config 读取 | - | - |
| TC-CFG-010 | NODE_ENV 切换 | development/production 行为不同 | - | - |

### 问题清单

| 序号 | 问题描述 | 严重级别 | 复现步骤 | 问题状态 |
|------|---------|---------|---------|----------|
| 1 | - | - | - | - |

---

## 项目目录结构（tree 形式）

- 参考：`md/项目结构.md`

## 项目 git commit 规范

- 参考：`md/Git提交规范.md`

> 注：auto-commit.sh 会自动生成的内容（当检测到 step 相关变更时）：feat: step17.md - 实现环境变量与配置管理
