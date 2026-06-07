# Spec-07: 安全与审计

> **版本**: v1.0  
> **状态**: Draft  
> **负责人**: [待填写]  
> **评审人**: [待填写]  
> **关联 Spec**: spec-01, spec-05, spec-06, spec-09

---

## 1. 目标与范围

### 1.1 目标
定义系统的安全策略、数据脱敏规则、访问控制、审计日志规范，确保敏感数据零泄漏、操作全程可追溯、符合等保合规要求。

### 1.2 范围
- ✅ 数据传输加密（TLS 1.3）
- ✅ 敏感数据脱敏（姓名、手机号、税号、金额等）
- ✅ 访问控制（RBAC + 行列级权限）
- ✅ 审计日志（全链路记录）
- ✅ 防攻击（SQL 注入、XSS、CSRF）
- ✅ 导出水印与防泄漏

### 1.3 不在范围内
- ❌ 物理安全（机房、服务器硬件）
- ❌ 网络安全（防火墙、IDS/IPS）—— 由运维团队负责

---

## 2. 术语定义

| 术语 | 定义 |
|------|------|
| PII | Personally Identifiable Information，个人身份信息 |
| RBAC | Role-Based Access Control，基于角色的访问控制 |
| RLS | Row Level Security，PostgreSQL 行级安全 |
| TLS | Transport Layer Security，传输层安全协议 |
| XSS | Cross-Site Scripting，跨站脚本攻击 |
| CSRF | Cross-Site Request Forgery，跨站请求伪造 |
| 水印 | 导出文件中的隐形标识，用于追溯泄露源 |

---

## 3. 设计原则

| 原则 | 说明 |
|------|------|
| **最小权限** | 每个用户/服务仅拥有完成工作所需的最小权限 |
| **默认拒绝** | 未明确授权的访问一律拒绝 |
| **全程加密** | 传输加密（TLS 1.3）+ 存储加密（敏感字段 AES-256） |
| **全量审计** | 每一次数据访问、修改、导出操作均记录审计日志 |
| **脱敏优先** | 任何展示、导出、传输的敏感数据必须先脱敏 |

---

## 4. 详细设计

### 4.1 安全架构分层

```
┌─────────────────────────────────────────────────────────────┐
│                      应用安全层                              │
│  - 输入校验（防 SQL 注入、XSS）                              │
│  - CSRF Token                                               │
│  - 速率限制（Rate Limiting）                                 │
├─────────────────────────────────────────────────────────────┤
│                      访问控制层                              │
│  - JWT 认证                                                 │
│  - RBAC 角色权限                                            │
│  - 行列级数据权限                                           │
├─────────────────────────────────────────────────────────────┤
│                      数据安全层                              │
│  - 传输加密（TLS 1.3）                                      │
│  - 存储加密（AES-256）                                      │
│  - 敏感字段脱敏                                             │
├─────────────────────────────────────────────────────────────┤
│                      审计追踪层                              │
│  - 操作日志（谁、何时、做了什么）                             │
│  - 数据变更日志（变更前/后值）                               │
│  - 查询日志（RAG 查询记录）                                  │
├─────────────────────────────────────────────────────────────┤
│                      合规保障层                              │
│  - 等保二级/三级要求                                        │
│  - 数据分类分级                                             │
│  - 留存期限管理                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 数据分类分级

| 级别 | 数据类型 | 示例 | 处理要求 |
|------|---------|------|---------|
| **L1 公开** | 公开政策、通用模板 | 增值税税率表 | 无需脱敏 |
| **L2 内部** | 企业内部数据、非敏感报表 | 部门销售汇总 | 内部共享，导出需审批 |
| **L3 敏感** | 含个人信息、财务明细 | 员工工资表、客户名单 | 必须脱敏，严格权限控制 |
| **L4 机密** | 核心商业机密、未公开财务 | 并购方案、年度预算 | 最小范围访问，全程审计 |

### 4.3 RBAC 权限模型

```typescript
// 角色定义
enum UserRole {
  SUPER_ADMIN = 'super_admin',    // 系统管理员：用户管理、全局配置
  ADMIN = 'admin',                // 项目管理员：Sheet 管理、权限分配
  EDITOR = 'editor',              // 编辑者：编辑单元格、创建公式
  VIEWER = 'viewer',              // 查看者：只读访问
  AUDITOR = 'auditor',            // 审计员：查看审计日志，无数据修改权
}

// 权限矩阵
const PERMISSION_MATRIX = {
  [UserRole.SUPER_ADMIN]: ['*'],  // 所有权限
  [UserRole.ADMIN]: [
    'sheet:create', 'sheet:delete', 'sheet:manage_permissions',
    'user:manage', 'audit:view',
  ],
  [UserRole.EDITOR]: [
    'sheet:read', 'sheet:write', 'sheet:formula',
    'rag:query', 'export:desensitized',
  ],
  [UserRole.VIEWER]: [
    'sheet:read', 'rag:query',
  ],
  [UserRole.AUDITOR]: [
    'audit:view', 'sheet:read',
  ],
};

// 行列级权限（细粒度控制）
interface CellPermission {
  userId: string;
  sheetId: string;
  cellRange: string;        // "A1" 或 "A1:C5" 或 "A:C"
  permission: 'read' | 'write' | 'none';
}
```

### 4.4 敏感数据脱敏策略

#### 4.4.1 脱敏规则详细定义

```typescript
interface DesensitizeRule {
  fieldType: SensitiveFieldType;
  pattern: RegExp;
  maskStrategy: MaskStrategy;
  preserveFormat: boolean;   // 是否保留原始格式
  allowCopy: boolean;        // 是否允许复制
  allowExport: boolean;      // 是否允许导出
}

const DESENSITIZE_RULES: DesensitizeRule[] = [
  {
    fieldType: 'name',
    pattern: /[一-龥]{2,4}/g,
    maskStrategy: (match) => match[0] + '*'.repeat(match.length - 1),
    preserveFormat: true,
    allowCopy: false,
    allowExport: false,
  },
  {
    fieldType: 'phone',
    pattern: /1[3-9]\d{9}/g,
    maskStrategy: (match) => match.slice(0, 3) + '****' + match.slice(7),
    preserveFormat: true,
    allowCopy: false,
    allowExport: false,
  },
  {
    fieldType: 'id_card',
    pattern: /\d{17}[\dXx]/g,
    maskStrategy: (match) => match.slice(0, 6) + '************' + match.slice(-4),
    preserveFormat: true,
    allowCopy: false,
    allowExport: false,
  },
  {
    fieldType: 'tax_id',
    pattern: /[A-Z0-9]{15,20}/g,
    maskStrategy: (match) => match.slice(0, 8) + '*********' + match.slice(-1),
    preserveFormat: true,
    allowCopy: false,
    allowExport: false,
  },
  {
    fieldType: 'bank_card',
    pattern: /\d{16,19}/g,
    maskStrategy: (match) => match.slice(0, 4) + '****' + match.slice(-4),
    preserveFormat: true,
    allowCopy: false,
    allowExport: false,
  },
  {
    fieldType: 'amount',
    pattern: /\d+(,\d{3})*(\.\d+)?/g,
    maskStrategy: (match) => match,  // 金额不脱敏文本
    preserveFormat: true,
    allowCopy: false,                // 但禁止复制
    allowExport: false,              // 禁止导出
  },
  {
    fieldType: 'email',
    pattern: /[\w.-]+@[\w.-]+\.\w+/g,
    maskStrategy: (match) => {
      const [user, domain] = match.split('@');
      return user[0] + '***@' + domain;
    },
    preserveFormat: true,
    allowCopy: false,
    allowExport: false,
  },
];
```

#### 4.4.2 脱敏处理流程

```
原始数据
    │
    ▼
┌─────────────────────────┐
│ 1. 字段类型识别          │
│    - 根据列名/正则匹配   │
│    - 标记敏感字段类型    │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│ 2. 规则匹配              │
│    - 匹配对应脱敏规则    │
│    - 确定掩码策略        │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│ 3. 掩码处理              │
│    - 应用 maskStrategy   │
│    - 保留原始格式        │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│ 4. 权限标记              │
│    - 标记 allowCopy      │
│    - 标记 allowExport    │
└─────────────────────────┘
    │
    ▼
脱敏后数据（展示/传输/导出）
```

### 4.5 审计日志规范

#### 4.5.1 日志分类

| 日志类型 | 记录内容 | 留存期限 | 访问权限 |
|---------|---------|---------|---------|
| 操作日志 | 用户登录、登出、Sheet 创建/删除 | 180 天 | 管理员 |
| 数据变更日志 | 单元格编辑（变更前/后值） | 365 天 | 管理员 |
| RAG 查询日志 | 查询内容、检索结果、生成回答 | 365 天 | 管理员+审计员 |
| 导出日志 | 导出时间、导出内容、导出者 | 永久 | 管理员 |
| 安全日志 | 登录失败、权限越界、异常访问 | 永久 | 管理员 |

#### 4.5.2 日志格式

```typescript
interface AuditLogEntry {
  // 基础信息
  id: string;                    // UUID
  timestamp: string;             // ISO 8601
  level: 'info' | 'warn' | 'error' | 'critical';

  // 用户信息
  userId: string;
  userName: string;
  userRole: string;
  sessionId: string;

  // 操作信息
  action: string;                // CREATE/UPDATE/DELETE/QUERY/EXPORT/LOGIN
  resourceType: string;          // sheet/cell/user/rag/file
  resourceId: string;

  // 详情
  details: {
    before?: any;                // 变更前值
    after?: any;                 // 变更后值
    query?: string;              // RAG 查询内容
    formula?: string;            // 涉及的公式
    cellRange?: string;          // 单元格范围
    fileName?: string;           // 导出文件名
    isDesensitized?: boolean;    // 是否已脱敏
  };

  // 环境信息
  ipAddress: string;
  userAgent: string;
  requestId: string;
}
```

#### 4.5.3 日志采集与存储

```typescript
// 审计日志中间件（Express/Koa）
function auditLogMiddleware() {
  return async (ctx, next) => {
    const startTime = Date.now();

    await next();

    const logEntry: AuditLogEntry = {
      id: generateUUID(),
      timestamp: new Date().toISOString(),
      level: ctx.status >= 400 ? 'warn' : 'info',
      userId: ctx.state.user?.id || 'anonymous',
      userName: ctx.state.user?.name || 'anonymous',
      userRole: ctx.state.user?.role || 'none',
      sessionId: ctx.state.sessionId,
      action: inferAction(ctx.method, ctx.path),
      resourceType: inferResourceType(ctx.path),
      resourceId: ctx.params.id,
      details: extractDetails(ctx),
      ipAddress: ctx.ip,
      userAgent: ctx.headers['user-agent'],
      requestId: ctx.headers['x-request-id'] || generateUUID(),
    };

    // 异步写入数据库（不阻塞响应）
    auditLogQueue.add(logEntry);
  };
}
```

### 4.6 导出水印与防泄漏

```typescript
// 导出文件水印
interface WatermarkConfig {
  type: 'visible' | 'invisible';    // 可见/隐形水印
  content: string;                   // 水印内容
  userInfo: boolean;                 // 是否包含用户信息
  timestamp: boolean;                // 是否包含时间戳
  ipAddress: boolean;                // 是否包含 IP
}

// 可见水印（PDF/图片导出）
function addVisibleWatermark(canvas: HTMLCanvasElement, config: WatermarkConfig) {
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.globalAlpha = 0.1;             // 透明度 10%
  ctx.font = '14px Arial';
  ctx.fillStyle = '#000000';
  ctx.rotate(-Math.PI / 6);          // 倾斜角度

  const text = `${config.content} ${new Date().toISOString()}`;

  // 平铺水印
  for (let x = -canvas.width; x < canvas.width * 2; x += 200) {
    for (let y = -canvas.height; y < canvas.height * 2; y += 200) {
      ctx.fillText(text, x, y);
    }
  }

  ctx.restore();
}

// 隐形水印（Excel 导出 - 元数据嵌入）
function addInvisibleWatermark(workbook: XLSX.WorkBook, config: WatermarkConfig) {
  // 在自定义属性中嵌入水印信息
  workbook.Props = {
    ...workbook.Props,
    Company: config.content,
    Manager: config.userInfo ? getCurrentUser().name : '',
    CreatedDate: config.timestamp ? new Date().toISOString() : '',
    // 使用 steganography 在特定单元格嵌入隐藏信息
    _watermark: btoa(JSON.stringify({
      userId: getCurrentUser().id,
      timestamp: Date.now(),
      ip: getClientIP(),
      hash: generateHash(),
    })),
  };
}
```

### 4.7 防攻击措施

| 攻击类型 | 防御措施 | 实现方式 |
|---------|---------|---------|
| SQL 注入 | 参数化查询 + ORM | 使用 Supabase PostgREST（自动参数化） |
| XSS | 输入过滤 + 输出编码 | DOMPurify 过滤 HTML，文本输出转义 |
| CSRF | Token 验证 | 每个请求携带 CSRF Token |
| 速率限制 | 接口限流 | Redis + 滑动窗口算法 |
| JWT 伪造 | 强密钥 + 短有效期 | HS256 算法，2 小时过期 |
| 暴力破解 | 登录失败锁定 | 5 次失败后锁定 30 分钟 |
| 文件上传漏洞 | 类型校验 + 大小限制 | 仅允许 xlsx/csv，最大 10MB |

---

## 5. 接口契约

### 5.1 审计日志查询接口

```typescript
// 查询审计日志（管理员专用）
GET /api/audit/logs
Headers: { Authorization: Bearer <admin_jwt> }
Query: {
  startDate: string;        // ISO 8601
  endDate: string;
  userId?: string;
  action?: string;
  resourceType?: string;
  page?: number;
  pageSize?: number;
}

Response: {
  total: number;
  logs: AuditLogEntry[];
  page: number;
  pageSize: number;
}
```

### 5.2 权限管理接口

```typescript
// 设置 Sheet 权限
POST /api/permissions/sheet
Body: {
  sheetId: string;
  permissions: [
    { userId: string, role: 'editor' | 'viewer', cellRange?: string },
  ];
}

// 查询用户权限
GET /api/permissions/user/{userId}
Response: {
  globalRole: string;
  sheetPermissions: [
    { sheetId: string, role: string, cellRange?: string },
  ];
}
```

---

## 6. 测试策略

### 6.1 安全测试

| 测试场景 | 工具/方法 | 通过标准 |
|---------|----------|---------|
| SQL 注入 | sqlmap + 手工测试 | 无注入漏洞 |
| XSS | OWASP ZAP + 手工测试 | 无 XSS 漏洞 |
| CSRF | 手工测试 | 无 CSRF 漏洞 |
| 权限越界 | 自动化测试 | 普通用户无法访问 admin 接口 |
| 脱敏完整性 | 人工抽检 100 条 | 100% 脱敏 |
| 水印追溯 | 导出文件分析 | 可提取水印信息 |

### 6.2 渗透测试清单

```
□ 认证绕过测试
□ 会话劫持测试
□ 权限提升测试
□ 敏感数据泄露测试
□ 文件上传漏洞测试
□ API 接口滥用测试
□ JWT 安全测试
□ 审计日志完整性测试
```

---

## 7. 验收标准

- [ ] 所有传输使用 TLS 1.3
- [ ] 敏感数据脱敏率 100%（人工抽检）
- [ ] RBAC 权限生效，无越权访问
- [ ] 审计日志覆盖 100% 操作
- [ ] 导出文件包含可追溯水印
- [ ] 渗透测试无高危漏洞
- [ ] 等保二级/三级要求达标

---

## 8. 关联 Spec

| Spec 编号 | 关系 | 说明 |
|-----------|------|------|
| spec-01 | 依赖 | 架构设计定义安全层位置 |
| spec-05 | 被依赖 | RAG 流程依赖脱敏策略 |
| spec-06 | 被依赖 | Supabase 提供 Auth 和 RLS |
| spec-09 | 被依赖 | 等保合规定义具体合规要求 |
