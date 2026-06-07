# v1_db - 从 v1 项目提取的数据库设计

## 目录结构

```
v1_db/
├── sql/
│   └── 01_tables.sql          # MySQL 建表脚本 (8张表)
├── mock/
│   └── 01_core_data.json      # Mock 测试数据
├── api/
│   └── 02_api_definition.json # API 接口定义
└── 03_business_logic.json     # 业务逻辑配置
```

## 表结构 (6+2 张表)

| 表名 | 说明 | 核心字段 |
|------|------|----------|
| datamodel | 数据模型表 | modelCode(PK), modelName, modelType, config, forecastTimeType |
| datamodelversion | 模型版本表 | versionCode(PK), modelCode(FK), versionName, status, isLocked |
| modelmetric | 模型指标表 | metricCode(PK), versionCode(FK), pageCode(FK), metricName, unitCode, isFixed, level, parentEmmId |
| dataentry | 数据录入表 | id(PK), metricCode(FK), versionCode(FK), reportYear, reportQuarter, value |
| modelformula | 模型公式表 | formulaId(PK), metricCode(FK), formulaExpression, luaScript, depends[] |
| modelpage | 模型页面表 | pageCode(PK), versionCode(FK), pageName, interfaceType, sort |
| currencydictionary | 币种字典(参考) | currencyCode(PK), currencyName, exchangeRate |
| unitcategory | 单位分类(参考) | unitCode(PK), unitName, unitType |

## 核心业务逻辑

### 版本状态机
- `status: 0` 草稿 → `status: 1` 已提交 → `status: 2` 已锁定
- 草稿状态可编辑，提交后需管理员退回

### 公式表达式格式
```
${metricCode-year}  例: ${C10001A0002-2025}
```

### 特殊表达式处理器
- `lastPeriod-{code}` - 年末值
- `arrayAllValue-{code}` - 所有周期值数组
- `prev-{code}` - 上期值
- `totalYear-{code}` - 年合计

## 业务功能模块

1. **实例管理** - 版本 CRUD、提交、锁定
2. **模型管理** - 模型 CRUD、模板配置
3. **配置管理** - 主题/指标/公式/数据指标 CRUD
4. **公式计算** - DAG 依赖图 + 拓扑排序 + 循环检测
5. **财务函数** - XIRR, XNPV, NPV, IRR

## 使用方式

### 1. SQL 建表
```bash
mysql -u root -p < sql/01_tables.sql
```

### 2. Mock 数据导入
将 `mock/01_core_data.json` 作为初始数据导入，或用于前端开发调试。

### 3. API 接口调用
参考 `api/02_api_definition.json` 中的接口定义配置 Mock 服务。

## 技术栈参考

- 前端: Vue 3 + Element Plus + vxe-table + Pinia + TypeScript
- 后端: Nitro Mock Server
- 公式引擎: 自研 (Kahn拓扑排序 + DFS环检测)