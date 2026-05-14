# 后端工程化 SOP（Node.js + NestJS）

适用于：

- Node.js / NestJS
- TypeScript
- TypeORM / Prisma
- Redis
- PostgreSQL / MySQL
- AI协作开发团队

目标：

- 可维护
- 可扩展
- AI友好
- 工程化
- 适合多人协作
- 适合 Cursor / Claude Code

---

# 一、项目目录标准（强制）

```text
src/
├── common/              # 公共模块
│   ├── decorators/      # 装饰器
│   ├── filters/         # 异常过滤器
│   ├── guards/           # 守卫
│   ├── interceptors/     # 拦截器
│   ├── pipes/            # 管道
│   └── utils/            # 工具函数
├── config/              # 配置文件
├── modules/              # 业务模块
│   ├── user/
│   │   ├── dto/          # 数据传输对象
│   │   ├── entities/    # 实体
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   └── user.module.ts
│   └── ...
├── database/             # 数据库相关
│   ├── migrations/      # 迁移文件
│   └── seeds/           # 种子数据
├── decorators/           # 自定义装饰器
├── guards/               # 认证/权限守卫
├── interceptors/         # 响应/日志拦截器
├── filters/              # 异常过滤器
├── middleware/           # 中间件
├── health/               # 健康检查
└── main.ts
```

---

# 二、模块拆分规范（核心）

---

## 2.1 MVC 职责分离

| 层级 | 职责 | 禁止 |
|------|------|------|
| Controller | 接收请求、参数校验、返回响应 | 禁止写业务逻辑 |
| Service | 业务逻辑、数据处理 | 禁止直接操作 req/res |
| Repository/Entity | 数据库操作 | 禁止写业务逻辑 |

---

## 2.2 模块结构标准

```text
modules/user/
├── dto/
│   ├── create-user.dto.ts
│   ├── update-user.dto.ts
│   └── user-response.dto.ts
├── entities/
│   └── user.entity.ts
├── user.controller.ts
├── user.service.ts
└── user.module.ts
```

---

# 三、TypeScript 严格规范

---

## 3.1 tsconfig 强制配置

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictPropertyInitialization": false,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

---

## 3.2 类型规范

```ts
// 禁止
const data: any = {};

// 必须
interface User {
  id: string;
  name: string;
}

const data: User = {
  id: '1',
  name: 'test',
};
```

---

# 四、API 工程化规范

---

## 4.1 RESTful 命名规范

| 操作 | 方法 | URL |
|------|------|-----|
| 获取列表 | GET | /users |
| 获取单个 | GET | /users/:id |
| 创建 | POST | /users |
| 更新 | PUT | /users/:id |
| 部分更新 | PATCH | /users/:id |
| 删除 | DELETE | /users/:id |

---

## 4.2 API 返回统一结构

```ts
// 成功响应
{
  "code": 0,
  "message": "success",
  "data": { ... }
}

// 错误响应
{
  "code": 1001,
  "message": "用户不存在",
  "data": null
}
```

---

## 4.3 DTO 规范

```ts
// create-user.dto.ts
export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
```

---

# 五、数据库设计规范

---

## 5.1 Entity 规范

```ts
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

---

## 5.2 禁止事项

- 禁止在 Entity 中写业务逻辑
- 禁止在 Entity 中直接返回给前端
- 禁止使用 any 作为字段类型

---

# 六、异常处理规范

---

## 6.1 自定义异常

```ts
// 禁止
if (!user) {
  throw new Error('用户不存在');
}

// 必须
if (!user) {
  throw new NotFoundException('用户不存在');
}
```

---

## 6.2 全局异常过滤器

```ts
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    // 日志记录
    this.logger.error(exception);

    response.status(500).json({
      code: 500,
      message: '内部服务器错误',
    });
  }
}
```

---

# 七、日志规范

---

## 7.1 日志级别

| 级别 | 使用场景 |
|------|----------|
| log | 普通信息 |
| warn | 警告信息 |
| error | 错误信息 |
| debug | 调试信息（生产关闭） |

---

## 7.2 结构化日志

```ts
this.logger.log({
  action: 'USER_LOGIN',
  userId: user.id,
  ip: request.ip,
  userAgent: request.headers['user-agent'],
  timestamp: new Date(),
});
```

---

## 7.3 禁止

```ts
// 禁止
console.log(user);
console.error(err);
```

---

# 八、中间件规范

---

## 8.1 中间件职责

- 请求日志
- CORS 处理
- 请求限流
- 请求超时

禁止在中间件中：

- 写业务逻辑
- 直接操作数据库

---

# 九、认证授权规范

---

## 9.1 JWT 规范

```ts
// token payload
interface JwtPayload {
  sub: string;        // 用户ID
  email: string;
  role: string;
  iat: number;
  exp: number;
}
```

---

## 9.2 守卫顺序

```
Request → Guard → Interceptor → Controller
```

---

# 十、AI 协作开发规范（重点）

---

## 10.1 AI 生成代码必须遵循

```txt
【任务】
创建用户模块

【技术栈】
NestJS + TypeORM + PostgreSQL

【要求】
- 严格 TypeScript 类型
- DTO 必须有 class-validator 校验
- Service 处理业务逻辑
- Controller 只做路由分发
- 禁止 any
- 禁止 console.log

【输出】
1. 目录结构
2. Entity 设计
3. DTO 设计
4. API 设计
5. 代码实现
```

---

## 10.2 AI 开发禁止事项

- ❌ 禁止在 Controller 写业务逻辑
- ❌ 禁止在 Service 写 SQL（用 Repository）
- ❌ 禁止使用 any
- ❌ 禁止 console.log
- ❌ 禁止直接返回 Entity 给前端（必须用 DTO）
- ❌ 禁止在 Entity 写业务逻辑

---

## 10.3 小步提交原则

```txt
完成一个接口 → Git提交 → 测试 → 下一个接口
```

---

# 十一、测试工程化

---

## 11.1 测试层级

| 类型 | 工具 | 覆盖范围 |
|------|------|----------|
| Unit | Jest | Service 业务逻辑 |
| Integration | Jest + supertest | API 接口 |
| E2E | Jest | 完整流程 |

---

## 11.2 AI 生成测试要求

```txt
AI 生成代码必须同时输出：
1. 正常测试用例
2. 边界测试用例
3. 异常测试用例
4. 空值测试用例
```

---

# 十二、CI/CD 门禁

---

## 12.1 PR 必须通过

```yaml
- eslint
- typecheck
- test
- build
- e2e (可选)
```

---

## 12.2 合并标准

```text
✔ lint 通过
✔ 类型通过
✔ 单元测试 > 70%
✔ review 通过
```

---

# 十三、安全红线（强制）

---

## 禁止

- ❌ 密码明文存储（必须 bcrypt）
- ❌ JWT secret 硬编码
- ❌ 敏感信息进 Git
- ❌ SQL 字符串拼接
- ❌ 信任前端参数
- ❌ 文件上传无校验

---

# 十四、最终目标

```text
需求
 ↓
Prompt标准化
 ↓
AI生成设计
 ↓
人工审核架构
 ↓
AI生成代码
 ↓
自动Review
 ↓
自动测试
 ↓
CI检查
 ↓
Merge
```

---
