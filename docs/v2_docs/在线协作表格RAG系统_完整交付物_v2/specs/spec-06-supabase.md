# Spec-06: Supabase 本地化部署

> **版本**: v1.0  
> **状态**: Draft  
> **负责人**: [待填写]  
> **评审人**: [待填写]  
> **关联 Spec**: spec-01, spec-03, spec-07

---

## 1. 目标与范围

### 1.1 目标
定义 Supabase 本地化部署方案，提供用户认证、PostgreSQL 数据持久化、Realtime 实时广播、文件存储、审计日志等基础设施能力。

### 1.2 范围
- ✅ Supabase Docker Compose 本地化部署
- ✅ 用户认证与 RBAC 权限
- ✅ PostgreSQL 数据库设计（表格数据、审计日志、用户表）
- ✅ Realtime 实时广播（WebSocket）
- ✅ Storage 文件存储（导入/导出/快照）
- ✅ 备份与恢复策略

### 1.3 不在范围内
- ❌ Supabase Edge Functions（使用自建 API 服务替代）
- ❌ Supabase Analytics（使用自建日志系统）

---

## 2. 术语定义

| 术语 | 定义 |
|------|------|
| Supabase | 开源 Firebase 替代方案，提供 Auth + DB + Realtime + Storage |
| RLS | Row Level Security，PostgreSQL 行级安全策略 |
| JWT | JSON Web Token，用户认证令牌 |
| Realtime | Supabase 的实时广播服务，基于 WebSocket |
| Storage | Supabase 的对象存储服务，支持 S3 兼容 API |
| Pooler | PostgreSQL 连接池服务 |

---

## 3. 设计原则

| 原则 | 说明 |
|------|------|
| **一键部署** | 单条命令启动全部服务，降低运维门槛 |
| **内网运行** | 所有服务绑定内网 IP，无外网依赖 |
| **数据隔离** | 不同租户/项目的数据通过 Schema 或数据库隔离 |
| **权限最小化** | 每个用户/服务仅拥有必要的最小权限 |
| **自动备份** | 数据库每日自动备份，保留 30 天 |

---

## 4. 详细设计

### 4.1 部署架构

```yaml
# docker-compose.yml 核心服务
services:
  # PostgreSQL 数据库
  db:
    image: supabase/postgres:15.1.1.78
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - db-data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d

  # Supabase Auth 服务
  auth:
    image: supabase/gotrue:v2.158.1
    ports:
      - "9999:9999"
    environment:
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://supabase_auth:${POSTGRES_PASSWORD}@db:5432/postgres
      GOTRUE_JWT_SECRET: ${JWT_SECRET}
      GOTRUE_JWT_EXP: 7200                    # JWT 有效期 2 小时
      GOTRUE_SITE_URL: ${SITE_URL}
      GOTRUE_EXTERNAL_EMAIL_ENABLED: "false"  # 关闭外部邮件，使用内部账号
      GOTRUE_EXTERNAL_PHONE_ENABLED: "false"

  # Supabase Realtime（WebSocket 广播）
  realtime:
    image: supabase/realtime:v2.28.32
    ports:
      - "54321:54321"
    environment:
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: postgres
      DB_USER: supabase_realtime
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      SECRET_KEY_BASE: ${SECRET_KEY_BASE}

  # Supabase Storage（文件存储）
  storage:
    image: supabase/storage-api:v1.0.6
    ports:
      - "5000:5000"
    environment:
      ANON_KEY: ${ANON_KEY}
      SERVICE_KEY: ${SERVICE_KEY}
      POSTGREST_URL: http://rest:3000
      PGRST_JWT_SECRET: ${JWT_SECRET}
      DATABASE_URL: postgres://supabase_storage:${POSTGRES_PASSWORD}@db:5432/postgres

  # PostgREST（REST API 自动生成）
  rest:
    image: postgrest/postgrest:v12.0.1
    ports:
      - "3000:3000"
    environment:
      PGRST_DB_URI: postgres://authenticator:${POSTGRES_PASSWORD}@db:5432/postgres
      PGRST_JWT_SECRET: ${JWT_SECRET}
      PGRST_DB_SCHEMAS: public,storage

  # Kong API 网关
  kong:
    image: kong:2.8.1
    ports:
      - "8000:8000"    # HTTP API
      - "8443:8443"    # HTTPS API
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /var/lib/kong/kong.yml
```

### 4.2 部署脚本

```bash
#!/bin/bash
# deploy.sh - Supabase 本地化一键部署

set -e

SUPABASE_DIR="/opt/supabase-local"
ENV_FILE="$SUPABASE_DIR/.env"

echo "🚀 开始部署 Supabase 本地化..."

# 1. 克隆仓库
if [ ! -d "$SUPABASE_DIR" ]; then
  git clone https://github.com/supabase/supabase.git "$SUPABASE_DIR"
fi

cd "$SUPABASE_DIR/docker"

# 2. 生成环境变量
if [ ! -f "$ENV_FILE" ]; then
  cp .env.example .env

  # 自动生成强密码
  POSTGRES_PASSWORD=$(openssl rand -base64 32)
  JWT_SECRET=$(openssl rand -base64 32)
  ANON_KEY=$(openssl rand -base64 32)
  SERVICE_KEY=$(openssl rand -base64 32)

  sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$POSTGRES_PASSWORD/" .env
  sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
  sed -i "s/ANON_KEY=.*/ANON_KEY=$ANON_KEY/" .env
  sed -i "s/SERVICE_KEY=.*/SERVICE_KEY=$SERVICE_KEY/" .env

  echo "✅ 环境变量已生成并保存到 .env"
fi

# 3. 启动服务
docker compose up -d

# 4. 等待服务就绪
echo "⏳ 等待服务就绪..."
sleep 30

# 5. 健康检查
curl -s http://localhost:8000/health || exit 1
curl -s http://localhost:9999/health || exit 1
curl -s http://localhost:54321/health || exit 1

echo "✅ Supabase 本地化部署完成！"
echo ""
echo "访问地址:"
echo "  Studio 后台: http://localhost:8000"
echo "  REST API:    http://localhost:3000"
echo "  Auth API:    http://localhost:9999"
echo "  Realtime WS: ws://localhost:54321"
echo "  Storage API: http://localhost:5000"
```

### 4.3 数据库 Schema 设计

#### 4.3.1 核心表结构

```sql
-- 用户扩展表（关联 Supabase Auth users）
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100),
  department VARCHAR(50),
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 表格（Sheet）定义表
CREATE TABLE public.sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  column_count INT NOT NULL DEFAULT 26,
  row_count INT NOT NULL DEFAULT 1000,
  is_template BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 表格数据表（按 Sheet 分表或分区）
CREATE TABLE public.sheet_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID NOT NULL REFERENCES public.sheets(id) ON DELETE CASCADE,
  row_index INT NOT NULL,
  col_index INT NOT NULL,
  value TEXT,
  formula TEXT,
  format VARCHAR(50),
  style JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(sheet_id, row_index, col_index)
);

-- 创建分区（按 sheet_id 哈希分区，支持大数据量）
CREATE TABLE public.sheet_data_p0 PARTITION OF public.sheet_data
  FOR VALUES WITH (MODULUS 8, REMAINDER 0);
-- ... 继续创建 p1-p7

-- 表格快照（版本历史）
CREATE TABLE public.sheet_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID NOT NULL REFERENCES public.sheets(id) ON DELETE CASCADE,
  version INT NOT NULL,
  ydoc_state BYTEA NOT NULL,           -- Yjs 文档二进制状态
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  comment TEXT,                         -- 版本备注
  UNIQUE(sheet_id, version)
);

-- 审计日志表（所有操作记录）
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action VARCHAR(50) NOT NULL,          -- CREATE/UPDATE/DELETE/QUERY/EXPORT/LOGIN
  resource_type VARCHAR(50) NOT NULL,   -- sheet/cell/user/rag
  resource_id UUID,
  details JSONB,                        -- 操作详情
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- 按月分区（自动创建）
CREATE TABLE public.audit_logs_2026_05 PARTITION OF public.audit_logs
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

-- RAG 查询日志
CREATE TABLE public.rag_query_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  query TEXT NOT NULL,
  intent VARCHAR(50),
  retrieved_chunks JSONB,               -- 检索到的 Chunk
  answer TEXT,
  confidence FLOAT,
  execution_time_ms INT,
  is_sensitive BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 文件存储元数据
CREATE TABLE public.file_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID REFERENCES public.sheets(id),
  file_name VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,       -- xlsx/csv/pdf
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,           -- Supabase Storage 路径
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  is_desensitized BOOLEAN DEFAULT FALSE, -- 是否已脱敏
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4.3.2 RLS（行级安全）策略

```sql
-- user_profiles 表 RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的 profile
CREATE POLICY "Users can view own profile" 
  ON public.user_profiles FOR SELECT 
  USING (auth.uid() = id);

-- 管理员可以查看所有 profile
CREATE POLICY "Admins can view all profiles" 
  ON public.user_profiles FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- sheets 表 RLS
ALTER TABLE public.sheets ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己有权限的 Sheet
CREATE POLICY "Users can view accessible sheets" 
  ON public.sheets FOR SELECT 
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.sheet_permissions 
      WHERE sheet_id = id AND user_id = auth.uid()
    )
  );

-- audit_logs 表 RLS（仅管理员可查看）
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs" 
  ON public.audit_logs FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'
  ));
```

### 4.4 Realtime 配置

```sql
-- 启用 Realtime 广播的表
BEGIN;
  -- Sheet 数据变更广播
  ALTER PUBLICATION supabase_realtime ADD TABLE public.sheet_data;

  -- 单元格锁定状态广播
  ALTER PUBLICATION supabase_realtime ADD TABLE public.cell_locks;

  -- 在线用户状态（通过 Awareness，不直接走 DB）
COMMIT;

-- 客户端订阅示例
const channel = supabase
  .channel('sheet-' + sheetId)
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'sheet_data', filter: 'sheet_id=eq.' + sheetId },
    (payload) => {
      // 收到数据变更，同步到 Yjs
      yDoc.transact(() => {
        updateYjsFromPayload(payload);
      });
    }
  )
  .subscribe();
```

### 4.5 备份策略

```bash
#!/bin/bash
# backup.sh - 数据库自动备份

BACKUP_DIR="/backup/supabase"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# 1. PostgreSQL 逻辑备份
docker exec supabase-db pg_dump   -U postgres   -d postgres   -F custom   -f /tmp/backup_$DATE.dump

# 2. 复制到备份目录
docker cp supabase-db:/tmp/backup_$DATE.dump $BACKUP_DIR/

# 3. 压缩
gzip $BACKUP_DIR/backup_$DATE.dump

# 4. 清理过期备份
find $BACKUP_DIR -name "backup_*.dump.gz" -mtime +$RETENTION_DAYS -delete

echo "✅ 备份完成: backup_$DATE.dump.gz"
```

---

## 5. 接口契约

### 5.1 用户认证接口

```typescript
// 登录
POST /auth/v1/token?grant_type=password
Body: {
  email: string;
  password: string;
}
Response: {
  access_token: string;    // JWT
  refresh_token: string;
  expires_in: number;      // 7200
  user: {
    id: string;
    email: string;
    role: string;
  };
}

// 刷新 Token
POST /auth/v1/token?grant_type=refresh_token
Body: {
  refresh_token: string;
}
```

### 5.2 Sheet 管理接口

```typescript
// 创建 Sheet
POST /rest/v1/sheets
Headers: { Authorization: Bearer <jwt> }
Body: {
  name: string;
  description?: string;
  column_count?: number;
  row_count?: number;
}

// 获取 Sheet 列表
GET /rest/v1/sheets?select=*&order=created_at.desc

// 获取 Sheet 数据
GET /rest/v1/sheet_data?sheet_id=eq.{id}&order=row_index.asc,col_index.asc

// 批量更新单元格
PATCH /rest/v1/sheet_data
Body: {
  sheet_id: string;
  updates: [
    { row_index: 0, col_index: 0, value: "100", formula: null },
    { row_index: 1, col_index: 1, value: null, formula: "=SUM(A1:A10)" }
  ];
}
```

---

## 6. 测试策略

### 6.1 部署测试

| 测试场景 | 步骤 | 期望结果 |
|---------|------|---------|
| 一键部署 | 执行 deploy.sh | 所有服务启动成功，健康检查通过 |
| 内网访问 | 关闭外网，仅内网 IP 访问 | 所有 API 正常响应 |
| 服务重启 | docker compose restart | 数据不丢失，服务快速恢复 |

### 6.2 权限测试

| 测试场景 | 步骤 | 期望结果 |
|---------|------|---------|
| 普通用户查看他人 Sheet | 用 editor 账号查询他人 Sheet | 403 Forbidden |
| 管理员查看审计日志 | 用 admin 账号查询 audit_logs | 200 OK |
| 普通用户查看审计日志 | 用 editor 账号查询 audit_logs | 403 Forbidden |
| RLS 绕过尝试 | 直接 SQL 注入绕过 RLS | 被 PostgreSQL RLS 拦截 |

---

## 7. 验收标准

- [ ] 一键部署脚本执行成功，所有服务健康检查通过
- [ ] 内网环境无外网依赖，服务正常运行
- [ ] RLS 策略生效，普通用户无法越权访问
- [ ] Realtime 广播延迟 < 100ms
- [ ] 数据库备份/恢复测试通过
- [ ] 并发 100 用户登录，响应时间 < 500ms

---

## 8. 关联 Spec

| Spec 编号 | 关系 | 说明 |
|-----------|------|------|
| spec-01 | 依赖 | 架构设计定义基础设施层 |
| spec-03 | 被依赖 | Yjs 协作使用 Supabase Realtime |
| spec-07 | 被依赖 | 安全规则依赖 Supabase Auth 和 RLS |
