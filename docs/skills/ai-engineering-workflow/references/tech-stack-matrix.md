# 技术栈与规范文档对应表

## 技术栈与规范对应

| 技术栈 | 主要规范文档 | Cursor Rules |
|-------|------------|-------------|
| Vue3 + TS | `前端工程化 SOP.md` | `frontend-vue3.mdc` |
| NestJS + TypeORM | `后端工程化 SOP.md` | `backend.mdc` |
| PostgreSQL | `数据库设计规范.md` | `database.mdc` |
| 安全 | `安全工程规范.md` | `security-rules.md` |
| 测试 | `Bug 排查 SOP.md` | `TEST.mdc` |

## 前端技术栈规范

### Vue3 + TypeScript

**核心规范文档**：`前端工程化 SOP.md`

**关键要点**：
- 使用 Composition API
- 组件命名使用 PascalCase
- Props 必须定义类型
- 使用 `<script setup>` 语法

**Cursor Rules**：`frontend-vue3.mdc`

**示例代码片段**：

```typescript
// 组件定义示例
interface Props {
  title: string;
  count?: number;
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
});
```

### 状态管理

| v1 | v2 | 规范 |
|----|----|------|
| Pinia | Zustand | `前端工程化 SOP.md` |
| Vuex | - | 不推荐 |

### UI 组件库

| 组件库 | 适用场景 | 规范文档 |
|--------|---------|---------|
| vxe-table | 大数据量表格 | `spec-02-vxe-table.md` |
| Element Plus | 通用组件 | `前端工程化 SOP.md` |
| Ant Design Vue | 企业级应用 | `前端工程化 SOP.md` |

## 后端技术栈规范

### NestJS + TypeORM

**核心规范文档**：`后端工程化 SOP.md`

**关键要点**：
- 使用 DTO 进行数据验证
- 分层架构（Controller/Service/Repository）
- 统一异常处理
- 使用装饰器进行路由定义

**Cursor Rules**：`backend.mdc`

**示例代码片段**：

```typescript
// DTO 定义示例
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  email: string;
}
```

### API 设计规范

| 规范项 | 要求 |
|--------|------|
| RESTful | 遵循 REST 设计原则 |
| 版本控制 | URL 前缀 `/api/v1/` |
| 响应格式 | 统一 JSON 格式 |
| 错误处理 | 统一错误码 |

## 数据库技术栈规范

### PostgreSQL

**核心规范文档**：`数据库设计规范.md`

**关键要点**：
- 使用迁移管理数据库变更
- 表名使用小写 + 下划线
- 字段命名清晰语义化
- 合理使用索引

**Cursor Rules**：`database.mdc`

**示例代码片段**：

```sql
-- 表创建示例
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引示例
CREATE INDEX idx_users_email ON users(email);
```

### ORM 使用规范

| ORM | 适用场景 | 规范 |
|-----|---------|------|
| TypeORM | NestJS 项目 | `后端工程化 SOP.md` |
| Prisma | 现代 Node.js | `数据库设计规范.md` |
| Sequelize | 传统项目 | 不推荐新项目使用 |

## 安全技术栈规范

### 安全规范

**核心规范文档**：`安全工程规范.md`

**关键要点**：
- JWT 认证
- 密码加密存储
- SQL 注入防护
- XSS 防护
- CSRF 防护

**Cursor Rules**：`security-rules.md`

### 权限控制

| 方案 | 适用场景 | 规范 |
|------|---------|------|
| RBAC | 角色权限控制 | `安全工程规范.md` |
| ABAC | 属性权限控制 | `安全工程规范.md` |
| RLS | 数据库行级安全 | `数据库设计规范.md` |

## 测试技术栈规范

### 测试规范

**核心规范文档**：`Bug 排查 SOP.md`

**关键要点**：
- 单元测试覆盖率 > 70%
- 集成测试覆盖核心流程
- E2E 测试覆盖关键路径
- 使用证据链排查法

**Cursor Rules**：`TEST.mdc`

### 测试工具

| 工具 | 用途 | 规范 |
|------|------|------|
| Jest | 单元测试 | `Bug 排查 SOP.md` |
| Cypress | E2E 测试 | `Bug 排查 SOP.md` |
| Playwright | E2E 测试 | `Bug 排查 SOP.md` |

## 快速索引

### 按阶段查规范

| 阶段 | 主要规范 |
|------|---------|
| 立项 | `Prompt 模板库.md` |
| 需求 | `Prompt 模板库.md` |
| 架构 | `前端/后端工程化 SOP.md` |
| 初始化 | `前端工程化 SOP.md` |
| 开发 | 全套 SOP |
| 测试 | `Bug 排查 SOP.md` |
| 验收 | `Prompt 模板库.md` |
| 打包 | `安全工程规范.md` |
| 部署 | `Vercel 部署规范.md` |
| 运维 | `Bug 排查 SOP.md` |
| 迭代 | `Git 规范.md` |

### 按问题查规范

| 问题 | 规范文档 |
|------|---------|
| 代码风格 | `前端/后端工程化 SOP.md` |
| 数据库设计 | `数据库设计规范.md` |
| 安全漏洞 | `安全工程规范.md` |
| Bug 排查 | `Bug 排查 SOP.md` |
| 代码审查 | `AI生成代码审查清单.md` |
| Git 提交 | `Git 规范.md` |
