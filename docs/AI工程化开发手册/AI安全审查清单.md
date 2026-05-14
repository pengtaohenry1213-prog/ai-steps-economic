# AI安全审查清单

适用于：

- AI 生成代码审查
- 人工安全审核
- 安全自动化扫描

---

# 一、认证授权审查

---

## 1.1 认证安全

- [ ] 密码强度校验（长度 + 复杂度）
- [ ] 密码加密存储（bcrypt / argon2）
- [ ] 登录失败限流
- [ ] 账号锁定机制
- [ ] 无默认密码
- [ ] Session 过期机制
- [ ] MFA 支持（如需高安全）

---

## 1.2 JWT 安全

- [ ] JWT Secret 足够复杂（256位）
- [ ] Token 设置过期时间
- [ ] Token 不包含敏感信息
- [ ] Token 存储安全（httpOnly cookie）
- [ ] Refresh Token 安全机制
- [ ] Token 撤销机制

---

## 1.3 权限控制

- [ ] 角色权限设计合理
- [ ] 权限校验在服务端执行
- [ ] 不信任前端返回的角色
- [ ] 最小权限原则
- [ ] 权限变更审计日志

---

# 二、输入验证审查

---

## 2.1 后端验证

- [ ] 所有用户输入验证
- [ ] 参数类型校验
- [ ] 参数长度校验
- [ ] 特殊字符过滤
- [ ] 文件类型校验
- [ ] 文件大小校验
- [ ] SQL 注入防护（参数化查询）
- [ ] NoSQL 注入防护

---

## 2.2 文件上传

- [ ] 文件类型白名单
- [ ] 文件大小限制
- [ ] 文件名随机化
- [ ] 文件内容检测
- [ ] 存储位置隔离
- [ ] 执行权限移除

---

# 三、数据安全审查

---

## 3.1 敏感数据

- [ ] 密码加密存储
- [ ] 敏感字段加密
- [ ] 日志脱敏
- [ ] 数据库访问控制
- [ ] 备份加密
- [ ] 传输加密（HTTPS）

---

## 3.2 隐私保护

- [ ] 不必要的敏感数据不采集
- [ ] 数据删除机制（GDPR）
- [ ] 隐私政策告知
- [ ] 同意机制

---

# 四、API 安全审查

---

## 4.1 API 设计

- [ ] 不暴露内部实现
- [ ] 错误信息不泄露敏感
- [ ] API 版本管理
- [ ] 废弃 API 安全关闭

---

## 4.2 API 保护

- [ ] 限流机制
- [ ] 认证机制
- [ ] CORS 配置正确
- [ ] 请求头安全配置
- [ ] OPTIONS 请求正确处理

---

# 五、认证漏洞审查

---

## 5.1 SQL 注入

### 检查点

- [ ] 所有数据库查询使用参数化
- [ ] 无字符串拼接 SQL
- [ ] ORM 使用正确
- [ ] NoSQL 查询无注入

### 常见位置

```ts
// ❌ 危险
query(`SELECT * FROM users WHERE id = ${id}`)
findOne({ where: `id = ${id}` })

// ✅ 安全
findOne({ where: { id } })
query('SELECT * FROM users WHERE id = ?', [id])
```

---

## 5.2 XSS 跨站脚本

### 检查点

- [ ] 用户输入转义
- [ ] 无 innerHTML 动态赋值
- [ ] CSP 配置正确
- [ ] 富文本编辑器的处理

### 常见位置

```vue
<!-- ❌ 危险 -->
<div v-html="userContent" />
<div innerHTML={userContent} />

<!-- ✅ 安全 -->
<div>{{ userContent }}</div>
<div>{escape(userContent)}</div>
```

---

## 5.3 CSRF 跨站请求伪造

### 检查点

- [ ] POST/PUT/DELETE 有 CSRF Token
- [ ] Cookie 有 SameSite 属性
- [ ] 关键操作有额外验证

### 常见位置

```ts
// ❌ 危险
// 无 CSRF 保护的表单提交

// ✅ 安全
- CSRF Token
- SameSite=Strict Cookie
- 密码确认
```

---

## 5.4 CSRF 攻击检测

```html
<!-- 自动提交表单 -->
<body>
  <form action="https://victim.com/transfer" method="POST">
    <input name="to" value="attacker" />
    <input name="amount" value="10000" />
  </form>
  <script>document.forms[0].submit()</script>
</body>
```

---

# 六、加密与密钥审查

---

## 6.1 密钥管理

- [ ] 无硬编码密钥
- [ ] 密钥从环境变量获取
- [ ] 密钥不在日志中
- [ ] 密钥定期轮换
- [ ] 密钥分离（不同环境不同密钥）

---

## 6.2 加密算法

- [ ] 不使用废弃算法（MD5, SHA1）
- [ ] 使用强加密（AES-256, bcrypt）
- [ ] 加密模式正确（GCM 而非 ECB）
- [ ] 随机数来源安全

---

# 七、前端安全审查

---

## 7.1 前端红线

- [ ] 无 localStorage 存 token
- [ ] 无敏感信息前端明文
- [ ] 无危险 DOM 操作
- [ ] 无 CORS 滥用
- [ ] 无 API Key 暴露

---

## 7.2 前端检查清单

```ts
// ❌ 危险
localStorage.setItem('token', jwt);
sessionStorage.setItem('password', password);
document.getElementById('x').innerHTML = userInput;
fetch('/api', { headers: { 'Authorization': apiKey }});

// ✅ 安全
// httpOnly cookie
// 内存变量
// textContent
// 后端代理
```

---

# 八、后端安全审查

---

## 8.1 后端红线

- [ ] 无 SQL 拼接
- [ ] 无命令注入
- [ ] 无路径遍历
- [ ] 无文件包含漏洞
- [ ] 无不安全的反序列化

---

## 8.2 后端检查清单

```ts
// ❌ 危险
exec(`ls ${dir}`);
readFile(`${userPath}/file`);
JSON.parse(untrustedData);

// ✅ 安全
execFile('ls', [dir]);
readFile(path.join(BASE_DIR, userPath));
// 使用安全的反序列化库
```

---

# 九、错误处理审查

---

## 9.1 错误信息

- [ ] 不泄露内部实现
- [ ] 不泄露堆栈信息
- [ ] 错误日志安全存储
- [ ] 用户看到友好错误

---

## 9.2 错误示例

```ts
// ❌ 泄露信息
throw new Error(`Database connection failed: ${connectionString}`);

// ✅ 安全
throw new Error('服务暂时不可用');
// 详细错误存日志
```

---

# 十、日志与监控审查

---

## 10.1 日志安全

- [ ] 无密码/Token 日志
- [ ] 无敏感数据日志
- [ ] 日志有足够上下文
- [ ] 日志防篡改

---

## 10.2 监控告警

- [ ] 异常登录告警
- [ ] 大量请求告警
- [ ] 权限变更告警
- [ ] 安全事件告警

---

# 十一、AI 生成代码专项审查

---

## 11.1 必须人工审核

以下场景必须人工安全审核：

- [ ] 认证/登录相关
- [ ] 支付/金融相关
- [ ] 用户数据处理
- [ ] 文件上传
- [ ] 权限控制
- [ ] 外部 API 调用

---

## 11.2 AI 常见安全问题

| AI 常见问题 | 风险 | 修复 |
|------------|------|------|
| 使用 any 类型 | 类型安全、注入风险 | 定义完整类型 |
| SQL 字符串拼接 | SQL 注入 | 参数化查询 |
| localStorage 存 token | XSS 窃取 | httpOnly cookie |
| 错误信息泄露 | 信息收集 | 统一错误包装 |
| 缺少输入验证 | 各种注入 | class-validator |

---

## 11.3 AI 安全 Prompt 模板

```txt
【安全审查任务】
审查以下代码的安全问题

【代码】
[粘贴代码]

【重点检查】
1. 注入漏洞（SQL/XSS/命令）
2. 认证授权漏洞
3. 敏感数据泄露
4. 加密/密钥问题
5. 输入验证

【输出】
1. 风险列表
2. 风险等级（高/中/低）
3. 修复建议
```

---

# 十二、漏洞等级定义

---

## 高危（立即修复）

- SQL 注入
- 命令注入
- 认证绕过
- 垂直越权
- 敏感数据泄露
- 文件上传可执行

---

## 中危（尽快修复）

- XSS 存储型
- CSRF
- 弱密码
- 暴力破解无防护
- 敏感数据日志

---

## 低危（计划修复）

- 信息泄露（版本号等）
- 弱加密算法
- 缺少安全 Headers
- 错误信息不友好

---

# 十三、修复优先级

---

## 第一优先（上线前必须修复）

1. SQL 注入
2. 认证绕过
3. 垂直越权
4. 敏感数据泄露

---

## 第二优先（本周内修复）

1. XSS 存储型
2. CSRF
3. 弱密码
4. 无登录限流

---

## 第三优先（迭代计划）

1. 缺少安全 Headers
2. 错误信息优化
3. 日志完善
4. CSP 配置

---

# 十四、自动化工具

---

## 14.1 静态分析

| 工具 | 语言 | 用途 |
|------|------|------|
| ESLint security | JS/TS | JS 安全规则 |
| Semgrep | 多语言 | 自定义规则 |
| SonarQube | 多语言 | 代码质量+安全 |
| Snyk | JS/Java/Python | 依赖漏洞 |

---

## 14.2 动态扫描

| 工具 | 用途 |
|------|------|
| OWASP ZAP | Web 漏洞扫描 |
| Burp Suite | Web 安全测试 |
| sqlmap | SQL 注入检测 |
| XSStrike | XSS 检测 |

---

## 14.3 CI 集成

```yaml
# .github/workflows/security.yml
- name: Security Scan
  run: |
    snyk test
    npm audit
    eslint --security
```

---

# 十五、审查流程

---

## 15.1 代码审查流程

```
开发者提交代码
     ↓
AI Code Review Bot 初审
     ↓
安全相关人工复核
     ↓
高危漏洞扫描
     ↓
修复确认
     ↓
合并
```

---

## 15.2 审查要点

- [ ] 代码变更涉及哪些安全点
- [ ] 是否有新增外部输入
- [ ] 是否有敏感数据处理
- [ ] 是否有认证授权逻辑
- [ ] 工具扫描是否通过

---

# 十六、总结

---

> 安全审查不是阻碍开发，而是确保安全。

> AI 生成代码，100% 需要人工安全审核。

> 宁可慢一点上线，不可带漏洞上线。

---
