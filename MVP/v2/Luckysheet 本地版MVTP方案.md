# Luckysheet 本地版 MVTP 方案（本地部署版 + 含算法模块, 基于 Luckysheet+Vue3+Element Plus+Supabase）

## 核心目标

聚焦高风险场景，通过最小化测试覆盖，验证 "Excel 数据导入 + 自定义公式 + 多人实时协作" 三大核心功能的稳定性，快速获取用户反馈。

## 核心框架与工具

| 模块 | 技术栈及版本 | 说明 |
| --- | --- | --- |
| 前端框架 | Vue 3.4.x (最新稳定版) | 支持 TypeScript 类型推断优化，适配复杂公式计算的响应式需求 |
| 表格引擎 | Luckysheet v2.1.10 | 基础表格渲染与公式解析能力，需扩展算法模块 |
| UI 组件 | Element Plus 2.14.x (最新稳定版) | 提供循环引用提示弹窗、输入框等交互组件 |
| 本地数据库 | Supabase CLI 2.x.x + PostgreSQL 15+ | 本地 Docker 部署 PostgreSQL，存储表格数据与公式依赖关系 |
| 辅助库1 | xlsx 0.18.x (最新稳定版) | 支持前端 Excel 导入导出，适配 Luckysheet 数据格式 |
| 辅助库2 | VueUse 11.x.x (最新稳定版) | 提供状态管理与事件处理 composables |
| 构建工具 | Vite 5.x (最新稳定版) | 前端开发服务器与生产构建 |
| 语言 | TypeScript 5.x (最新稳定版) | 类型安全的前端开发 |
| 容器化 | Docker 25.x.x + Docker Compose 2.x.x | 容器化运行本地 Supabase 与前端服务 |
| 运行时 | Node.js 20.x LTS | 运行前端项目与 Supabase CLI |

> 注：所有技术栈均选择近 1 年内稳定版本，兼顾功能完整性与部署兼容性。本地 Supabase 通过 Docker 桥接局域网，后续可直接对接现有数据库的 PostgreSQL 协议接口。

## 算法模块集成

### 核心算法及集成环节

| 算法 | 集成模块 | 核心环节 |
| --- | --- | --- |
| 拓扑排序 | Luckysheet 公式计算引擎（前端） | 公式解析阶段：对单元格依赖关系进行排序，确保按依赖层级计算 |
| DFS（深度优先搜索） | Luckysheet 循环引用检测模块（前端） | 公式校验阶段：通过 DFS 追踪引用路径，定位循环引用节点（如 A1→B1→A1） |
| 不动点迭代（Gauss-Seidel） | Luckysheet 循环计算控制模块（前端+Supabase） | 循环处理阶段：迭代计算循环路径值，当连续结果差值 < 阈值（如 1e-6）时终止，结果暂存 Supabase |

> **说明**：循环引用的收敛计算通常使用**不动点迭代**或**高斯-赛德尔迭代**，而非弗洛伊德算法（Floyd-Warshall 用于计算图中最短路径）。阈值可通过 Element Plus 配置界面让用户自定义。

### 技术栈关联

- 所有算法通过 JavaScript/TypeScript 实现，嵌入 Luckysheet 核心计算逻辑（`luckysheet.functions` 扩展）
- 循环引用检测结果可暂存于本地 Supabase 的 `cells` 表扩展字段（如 `is_cyclic`、`cycle_path`），供协作场景下多用户同步提示

## Excel 导入导出功能集成

### 技术栈与集成模块

| 功能 | 技术栈 | 集成模块 | 核心逻辑简述 |
| --- | --- | --- | --- |
| Excel 导入 | `xlsx` | 前端 Vue3 组件（如导入按钮+解析服务） | 1. 用户上传 Excel 文件；2. `xlsx` 库解析文件为 JSON 格式（含单元格值、公式）；3. 调用拓扑排序算法对解析出的公式依赖进行校验，通过后写入本地 Supabase 的 `cells` 表 |
| Excel 导出 | `xlsx` + Luckysheet API | 前端 Vue3 工具类（如导出按钮+数据组装） | 1. 从本地 Supabase 读取当前表格的 `cells` 数据（含计算后的值）；2. 通过 Luckysheet API 获取表格结构（行列信息）；3. `xlsx` 库将数据转换为 Excel 文件流，触发浏览器下载 |

### 关键适配点

- 导入时若 Excel 含循环引用，通过 DFS 检测后，调用不动点迭代算法预处理并标记，导入后在 Luckysheet 界面提示用户
- 导出时默认忽略循环引用的中间计算过程，仅导出最终稳定值（差值 < 阈值），确保导出文件可被 Excel 正常打开

### 数据转换说明

Luckysheet 的单元格数据通过 `celldata` 数组存储，每个单元格对象包含 `r`、`c`、`v`，其中 `v` 需整合单元格属性表中的**格式、值和 ID**。

公式方面，Luckysheet 单元格的 `v` 对象中，用 `f` 字段存储**公式字符串**，可将公式表中的公式内容关联到对应单元格的 `f` 字段，同时通过自定义函数注册机制，将公式表中的管理逻辑映射为 Luckysheet 可识别的函数实现。

关键是初始化时，需将两个表的数据联合转换为 Luckysheet 要求的 `{r, c, v: {v: 值, f: 公式, ...属性}}` 结构。

## 测试范围与用例设计（聚焦高风险场景）

### 1. 核心功能测试（必测）

| 测试场景 | 测试步骤 | 预期结果 |
| --- | --- | --- |
| Excel 数据 + 公式导入 | 1. 准备含自定义公式的 Excel 文件（如 =MY_FUNC(A1,B1)）2. 通过 Element Plus 上传按钮导入 3. 检查 Luckysheet 单元格值与公式 | 导入后单元格值计算正确，公式栏显示自定义公式，格式（如颜色、字体）保留 |
| 自定义公式执行 | 1. 在 Luckysheet 中手动输入自定义公式（如 =CALC_DISCOUNT(100,0.2)）2. 修改参数值观察结果变化 | 公式实时计算，结果正确；参数修改后，结果同步更新 |
| 多人实时协作 | 1. 打开两个浏览器窗口，登录同一 Supabase 账号 2. 窗口 1 修改单元格值 3. 观察窗口 2 数据变化 | 窗口 2 在 1 秒内同步显示修改后的值，无冲突覆盖（基于 Supabase 行级锁）|

### 2. 边界条件测试（高风险）

- **大数据量导入**：测试导入含 1000 行 × 20 列数据的 Excel，检查 Luckysheet 渲染性能（是否卡顿、崩溃）
- **公式错误处理**：输入错误参数（如 =MY_FUNC(100,"abc")），检查是否返回友好错误提示（如 #VALUE!）
- **循环引用处理**：创建循环引用场景（如 A1=B1, B1=A1），验证算法收敛与用户提示

## 数据结构与 Mock 配置（适配 Luckysheet+Supabase）

### 1. Mock 数据（JSON 文件模拟后端）

**单元格属性表（cells.json）**：

```json
[
  {"id": "cell_1", "r": 0, "c": 0, "value": 100, "format": {"color": "red"}},
  {"id": "cell_2", "r": 0, "c": 1, "value": 0.2, "format": {"bold": true}}
]
```

**公式表（formulas.json）**：

```json
[
  {"id": "formula_1", "cell_id": "cell_3", "formula_str": "=CALC_DISCOUNT(A1,B1)", "description": "计算折扣价"}
]
```

### 2. 数据转换逻辑（前端处理）

- **导入 Excel 时**：用 xlsx 库解析文件，将单元格值、格式存入 Luckysheet 的 celldata，公式存入 `v.f` 字段
- **Mock 转 Supabase 时**：将 JSON 数据映射为 Supabase 表结构（如 `cells(r, c, value, format)`、`formulas(cell_id, formula_str)`）

## 测试环境与工具

- **创建 Vue3 项目**：`npm create vite@latest lucky-supabase -- --template vue-ts`
- **前端环境**：Vite 开发服务器（`npm run dev`），Chrome 浏览器（开启 DevTools 网络节流模拟弱网）
- **Supabase 配置**：创建免费账号，新建 cells 和 formulas 表，开启 Realtime 订阅（`supabase.channel('public:cells').on('INSERT',...)`）
- **自动化简化**：用 VueUse 的 `useLocalStorage` 缓存 Mock 数据，减少重复导入操作

## 测试通过标准

1. 核心场景测试用例 100% 通过（无数据丢失、公式计算错误、协作延迟 > 2 秒问题）
2. 边界场景（如 1000 行数据导入）无崩溃，渲染时间 < 3 秒
3. 循环引用场景：算法在 100 次迭代内收敛（差值 < 1e-6），否则提示用户手动解决
4. 生成测试报告：包含用例执行结果、Supabase 实时日志截图、Luckysheet 公式执行截图

## 后续优化方向（基于 MVTP 反馈）

- 若发现自定义公式解析效率低，可引入 Web Worker 隔离计算逻辑
- 若多人协作冲突频繁，可在 Supabase 中增加 `updated_at` 字段实现乐观锁

---

## Supabase 本地部署

Supabase 本地部署，通过 Docker 容器在局域网环境中搭建私有实例，满足数据保密性需求。

### 本地部署 Supabase 核心步骤

#### 1. 环境准备

安装 Docker Desktop 和 Docker Compose。

安装 Supabase CLI：

```bash
# macOS
brew install supabase/tap/supabase

# 或下载预编译二进制
# https://github.com/supabase/cli/releases
```

初始化项目：

```bash
mkdir lucky-supabase && cd lucky-supabase
supabase init
```

#### 2. 配置局域网访问

修改 `supabase/config.toml`，将 API 服务端口映射改为局域网可访问：

```toml
[api]
enabled = true
port = 8000
host = "0.0.0.0"  # 允许局域网访问
```

或通过 `docker-compose.yml` 配置：

```yaml
services:
  kong:
    ports:
      - "8000:8000"  # 本地端口:容器端口，局域网内通过 http://[服务器IP]:8000 访问
```

生成安全密钥（如已有可跳过）：

```bash
supabase login
supabase link --project-ref <your-project-ref>
```

> 注：本地开发使用本地密钥，云端部署时替换为云端密钥

启动本地服务：

```bash
supabase start  # 首次启动约5分钟，依赖网络拉取镜像
```

验证服务：访问 `http://localhost:8000` 或 `http://[服务器局域网 IP]:8000`

#### 3. 初始化数据库

- 访问 Supabase Studio：`http://localhost:8000/studio` 或 `http://[服务器IP]:8000/studio`
- 创建与云端相同的 cells 和 formulas 表
- 关闭云端同步，前端通过本地 API 地址连接：

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'http://[服务器IP]:8000',  // 本地 Supabase URL
  'your-anon-key'           // 本地 anon key（见 .env 或 supabase/config.toml）
)
```

### MVTP 方案调整：本地 Supabase 适配

#### 1. 实时协作验证

- 局域网内多台设备通过服务器 IP 访问前端页面，测试数据同步（依赖 Docker 容器网络通畅，建议关闭服务器防火墙对 8000 端口的限制）
- 数据存储路径：Docker 容器内 PostgreSQL 数据默认挂载到 `./volumes/db`，可备份此目录防止数据丢失

#### 2. 与现有数据库集成预留

- 本地 Supabase 支持通过 PostgreSQL 协议直接连接，后续可将 cells 和 formulas 表数据迁移到现有数据库（如 MySQL 需通过 ETL 工具转换）
- 临时方案：在 MVTP 测试阶段，先用本地 Supabase 验证功能，后续替换为现有数据库时，仅需修改前端数据请求接口（如将 Supabase SDK 调用改为 Axios 请求现有后端 API）

### 数据保密性保障

- **网络隔离**：本地部署后，数据仅在局域网内传输，无需连接公网，避免云端数据泄露风险
- **权限控制**：通过 Supabase Studio 设置表级权限（如仅允许认证用户读写 cells 表），结合局域网内用户认证机制（如企业内部单点登录），确保数据安全

---

## 补充说明

### Luckysheet vs Handsontable

Luckysheet（开源 MIT 协议）在 Excel 导入带公式数据的场景下更优。它有专门的 Luckyexcel 导入插件，能直接解析 Excel 文件中的公式，包括常规函数、动态数组公式等，导入后公式可直接计算生效，无需额外复杂处理。而 Handsontable 导入 Excel 公式时，需要借助 Excel.js 读取公式，再通过 HyperFormula 引擎重新计算，过程中可能遇到复杂公式解析不全的问题，且配置步骤更多。对于追求开源免费且公式导入体验接近 Excel 的需求，Luckysheet 是更好的选择。

### Vue3 + Supabase 技术选型说明

**执行效率**：Vue3 初始渲染和内存占用比 React 更优，20KB 左右的运行时体积（gzip）比 React 小一半，对多人表格这种中等复杂度应用，开箱即用的性能足够。

**代码工作量**：Vue3 的模板语法更接近 HTML，学习成本低。而且 Vue3 有成熟的 Supabase 集成方案，通过创建数据服务层封装 Supabase 交互，再用 Composables 管理响应式状态，结构清晰，比 React 需要手动处理的状态管理更省心。

**实现要点**：

- 通过 npm 安装 `@supabase/supabase-js` 和 `@rowsncolumns/spreadsheet`（专门处理表格协作的 OT 冲突和实时同步）
- 在 `<script setup>` 中初始化 Supabase 客户端，传入环境变量里的 URL 和密钥
- 用 `useSupabase` 钩子绑定文档 ID、用户 ID 和表格状态，自动处理数据持久化和实时广播
- 用户编辑单元格时，钩子生成操作补丁，同步到 Supabase 并广播给其他用户

**实时光标同步**：用 Supabase 的 Broadcast 功能自己实现。在 Vue 组件里监听鼠标移动事件，通过频道广播位置，其他用户收到后更新对应光标元素的样式和位置，用 Vue 的响应式数组管理在线用户的光标状态。

**其他注意事项**：

- Supabase 的免费计划完全够用，200 个并发连接的上限远高于当前用户规模
- 付费计划能支持上万并发连接和每秒数千条消息，延迟中位数可低至 6ms，满足多人协作的实时性要求
- 免费计划并发连接限制 200 人，如果用户量较大，需要升级到 Pro 或更高版本
- 加个 2 秒的去重窗口和 3 秒的回声防止，能避免本地更新和服务器事件冲突导致的 UI 闪烁
