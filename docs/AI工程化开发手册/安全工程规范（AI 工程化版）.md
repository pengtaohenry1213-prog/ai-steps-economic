# 安全工程规范（AI 工程化版）

适用于：

- 前端项目
- 后端项目
- AI协作开发团队

目标：

- 防范常见漏洞
- 保护用户数据
- 符合合规要求

---

# 一、安全核心原则

---

# 纵深防御

不再单一安全措施，多层防护：

```text
客户端 → 网络 → 后端 → 数据库
  ↓       ↓       ↓       ↓
输入验证  HTTPS   鉴权    加密
```

---

# 二、认证授权

---

## 2.1 JWT 安全规范

```ts
// ✅ 正确
const token = jwt.sign(
  { sub: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '15m' }
);

// ❌ 禁止
const token = jwt.sign(
  { sub: user.id, role: user.role, password: user.password },
  'hardcoded-secret'
);
```

---

## 2.2 Token 存储

```ts
// ✅ 前端正确
// 使用 httpOnly cookie 或内存变量
document.cookie = 'token=xxx; httpOnly; secure; sameSite=strict';

// ❌ 禁止
localStorage.setItem('token', token);  // XSS 攻击可窃取
sessionStorage.setItem('token', token);
```

---

## 2.3 Token 刷新

```ts
// ✅ 正确
// access_token: 15分钟
// refresh_token: 7天

// 每次请求检查 access_token 过期
// 过期则用 refresh_token 获取新的 access_token
```

---

## 2.4 权限控制

```ts
// ✅ 正确 - 在 Guard 中检查权限
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

---

# 三、数据安全

---

## 3.1 密码存储

```ts
// ✅ 正确 - bcrypt
import bcrypt from 'bcrypt';

const hash = await bcrypt.hash(password, 12);

// ❌ 禁止
const hash = crypto.createHash('sha256').update(password).digest('hex');
```

---

## 3.2 敏感数据加密

```ts
// ✅ 敏感字段加密存储
import crypto from 'crypto';

interface EncryptedField {
  ciphertext: string;
  iv: string;
  tag: string;
}

function encrypt(text: string, key: Buffer): EncryptedField {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return {
    ciphertext: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    tag: cipher.getAuthTag().toString('hex'),
  };
}
```

---

## 3.3 敏感数据脱敏

```ts
// ✅ 日志中脱敏
function maskSensitiveData(data: any): any {
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
  const masked = { ...data };

  for (const field of sensitiveFields) {
    if (masked[field]) {
      masked[field] = '***';
    }
  }
  return masked;
}
```

---

# 四、输入验证

---

## 4.1 后端必须验证

```ts
// ✅ 正确 - 所有输入必须验证
class CreateUserDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;
}

// ❌ 禁止 - 信任前端
async createUser(@Body() body: any) {
  await this.userService.create(body.email, body.password);
}
```

---

## 4.2 文件上传验证

```ts
// ✅ 正确
@Post('upload')
async upload(
  @UploadedFile(
    new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB
        new FileTypeValidator({ fileType: /^(image\/(jpeg|png|gif)|application\/pdf)$/ }),
      ],
    }),
  )
  file: Express.Multer.File,
) {
  // 处理文件
}
```

---

# 五、API 安全

---

## 5.1 限流

```ts
// ✅ 正确
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 限制100次请求
  });

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    try {
      await this.limiter.consume(request.ip);
      return true;
    } catch {
      throw new TooManyRequestsException('请求过于频繁');
    }
  }
}
```

---

## 5.2 CORS

```ts
// ✅ 正确
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// ❌ 禁止
app.enableCors({
  origin: '*',  // 生产环境禁止
});
```

---

## 5.3 API 签名

```ts
// ✅ 高安全场景使用签名
function signRequest(params: Record<string, string>, secret: string): string {
  const sortedParams = Object.keys(params).sort();
  const signString = sortedParams
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return crypto.createHmac('sha256', secret).update(signString).digest('hex');
}
```

---

# 六、SQL 注入防护

---

## 6.1 参数化查询

```ts
// ✅ 正确 - TypeORM
const user = await this.userRepository.findOne({
  where: { email },
});

// ✅ 正确 - Prisma
const user = await prisma.user.findUnique({
  where: { email },
});

// ❌ 禁止 - SQL 拼接
await this.dataSource.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

---

## 6.2 ORM 防止注入

```ts
// ✅ 正确
// 使用 findOne, find 等方法

// ❌ 禁止 - 不要用 raw query 拼接
await this.dataSource.query(
  `SELECT * FROM users WHERE name = '${name}'`
);
```

---

# 七、XSS 防护

---

## 7.1 前端转义

```ts
// ✅ React 自动转义
// 使用 JSX 时，React 会自动转义

// ✅ Vue 自动转义
// {{ }} 会自动转义

// ❌ 禁止 - 危险
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ 如果必须使用，加密处理
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

---

## 7.2 CSP 配置

```ts
// ✅ NestJS CSP 中间件
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
  },
}));
```

---

# 八、CSRF 防护

---

## 8.1 CSRF Token

```ts
// ✅ 正确 - 表单使用 CSRF Token
// 后端生成
const csrfToken = crypto.randomBytes(32).toString('hex');
// 存储在 session 或 Redis

// 前端请求时携带
fetch('/api/action', {
  headers: {
    'X-CSRF-Token': csrfToken,
  },
});
```

---

## 8.2 SameSite Cookie

```ts
// ✅ 正确
res.cookie('session', sessionId, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',  // CSRF 防护
});
```

---

# 九、安全Headers

---

## 9.1 Helmet 中间件

```ts
// ✅ NestJS
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: true,
  hsts: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  noSniff: true,
}));
```

---

## 9.2 关键 Headers

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

---

# 十、密钥管理

---

## 10.1 禁止硬编码

```ts
// ❌ 禁止
const SECRET = 'my-api-key-123';

// ✅ 正确 - 环境变量
const SECRET = process.env.API_SECRET;
```

---

## 10.2 .env 文件规范

```text
# .env.example (进 Git)
API_SECRET=
JWT_SECRET=
DB_PASSWORD=

# .env (不进 Git)
API_SECRET=xxx
JWT_SECRET=xxx
DB_PASSWORD=xxx
```

---

## 10.3 密钥轮换

```text
定期更换：
- JWT Secret: 每3个月
- API Key: 每6个月
- 数据库密码: 每3个月
```

---

# 十一、日志安全

---

## 11.1 禁止记录

- ❌ 密码
- ❌ Token
- ❌ 敏感个人信息
- ❌ 银行卡号
- ❌ 身份证号

---

## 11.2 日志脱敏

```ts
function sanitizeLogData(data: any): any {
  const sensitive = ['password', 'token', 'secret', 'creditCard', 'idCard'];
  const sanitized = { ...data };

  for (const key of Object.keys(sanitized)) {
    if (sensitive.some((s) => key.toLowerCase().includes(s))) {
      sanitized[key] = '***';
    }
  }
  return sanitized;
}
```

---

# 十二、AI 生成代码安全红线

---

## 必须检查

- [ ] 无 SQL 拼接
- [ ] 无 any 类型
- [ ] 输入有验证
- [ ] 敏感数据加密
- [ ] 无硬编码密钥
- [ ] 无 XSS 风险
- [ ] 有权限校验
- [ ] 有错误处理
- [ ] 有日志脱敏

---

## 禁止模式

```txt
❌ 禁止: eval(userInput)
❌ 禁止: Function(userInput)
❌ 禁止: innerHTML = userInput
❌ 禁止: document.write(userInput)
❌ 禁止: ${userInput} in SQL
❌ 禁止: localStorage.setItem('token', token)
```

---

# 十三、安全测试

---

## 13.1 渗透测试清单

| 类型 | 工具 |
|------|------|
| SQL注入 | sqlmap |
| XSS | burp, xsstrike |
| CSRF | burp |
| 认证绕过 | burp |
| 信息泄露 | OWASP ZAP |

---

## 13.2 安全扫描

```yaml
# CI 中集成
- name: Run Security Scan
  run: |
    npm install -g snyk
    snyk auth $SNYK_TOKEN
    snyk test
```

---

# 十四、AI 开发安全 Prompt 模板

---

```txt
【任务】
实现用户认证API

【安全要求】
1. 密码必须 bcrypt 加密
2. JWT secret 从环境变量获取
3. 所有输入必须验证
4. 错误信息不泄露敏感信息
5. 敏感操作记录日志（脱敏）

【禁止】
- 禁止明文密码
- 禁止硬编码密钥
- 禁止 SQL 拼接
- 禁止信任前端数据

【输出】
1. 安全设计
2. 代码实现
3. 测试用例
```

---

# 十五、常见漏洞修复

---

## 15.1 SQL 注入

```sql
-- 攻击
' OR '1'='1

-- 修复
WHERE email = ?  -- 参数化查询
```

---

## 15.2 XSS

```html
<!-- 攻击 -->
<script>alert('xss')</script>

<!-- 修复 -->
&lt;script&gt;alert('xss')&lt;/script&gt;  -- 转义
```

---

## 15.3 CSRF

```html
<!-- 攻击 - 用户不知情提交 -->
<form action="https://bank.com/transfer" method="POST">
  <input name="to" value="hacker" />
  <input name="amount" value="10000" />
</form>

<!-- 修复 -->
- SameSite Cookie
- CSRF Token
```

---

# 十六、最终核心

> 安全不是事后补救，而是设计之初就考虑。

> AI 生成代码，必须人工审核安全。

---
