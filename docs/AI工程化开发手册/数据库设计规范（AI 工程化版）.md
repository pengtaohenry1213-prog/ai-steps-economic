# 数据库设计规范（AI 工程化版）

适用于：

- PostgreSQL
- MySQL
- TypeORM / Prisma
- AI协作开发团队

---

# 一、命名规范

---

## 1.1 表命名

```text
规则：模块_实体名
示例：
- user_accounts
- order_items
- product_categories
```

---

## 1.2 字段命名

```text
规则：snake_case
示例：
- user_name
- created_at
- updated_at
- is_deleted
```

---

## 1.3 索引命名

```text
规则：idx_表名_字段名
示例：
- idx_users_email
- idx_orders_user_id
```

---

## 1.4 外键命名

```text
规则：fk_表名_关联表名
示例：
- fk_orders_users
- fk_order_items_orders
```

---

# 二、字段设计规范

---

## 2.1 必须字段

所有表必须有：

```sql
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

---

## 2.2 软删除

```sql
is_deleted BOOLEAN DEFAULT FALSE
deleted_at TIMESTAMP NULL
```

---

## 2.3 主键设计

```sql
-- 方案1：UUID（推荐）
id UUID PRIMARY KEY DEFAULT gen_random_uuid()

-- 方案2：自增ID
id BIGSERIAL PRIMARY KEY
```

---

## 2.4 常用字段类型

| 业务场景 | PostgreSQL | MySQL |
|---------|-----------|-------|
| 短文本 | VARCHAR(255) | VARCHAR(255) |
| 长文本 | TEXT | TEXT |
| 整数 | INTEGER / BIGINT | INT / BIGINT |
| 小数 | DECIMAL(10,2) | DECIMAL(10,2) |
| 金额 | DECIMAL(10,2) | DECIMAL(10,2) |
| 日期 | TIMESTAMP | DATETIME |
| 布尔 | BOOLEAN | TINYINT(1) |
| JSON | JSONB | JSON |

---

# 三、表设计原则

---

## 3.1 范式要求

第三范式 (3NF)：

- 每个非主属性完全依赖于主键
- 无传递依赖
- 字段原子性，不可再分

---

## 3.2 字段设计

```sql
-- ✅ 正确
users (
  id,
  email,
  password_hash,
  created_at
)

-- ❌ 错误（违反原子性）
users (
  id,
  name,          -- 应该拆分为 first_name, last_name
  contact_info   -- 应该拆分为 email, phone
)
```

---

## 3.3 避免NULL

```sql
-- ❌ 避免
phone VARCHAR(20) NULL

-- ✅ 优先有默认值
phone VARCHAR(20) DEFAULT ''
status INTEGER DEFAULT 0
```

---

# 四、索引规范

---

## 4.1 必须加索引

- WHERE 条件字段
- ORDER BY 字段
- JOIN 关联字段
- 唯一约束字段

---

## 4.2 索引设计

```sql
-- 单字段索引
CREATE INDEX idx_users_email ON users(email);

-- 联合索引（遵循最左前缀）
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- 唯一索引
CREATE UNIQUE INDEX idx_users_email ON users(email);
```

---

## 4.3 禁止

- ❌ 索引过多（影响写入性能）
- ❌ 在长文本字段建索引
- ❌ 在区分度低的字段建索引

---

# 五、关联设计

---

## 5.1 外键约束

```sql
-- 一对多
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  ...
);

-- 多对多
CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  product_id UUID REFERENCES products(id),
  quantity INTEGER,
  ...
);
```

---

## 5.2 物理删除 vs 逻辑删除

```sql
-- 物理删除（数据量小、可恢复场景）
DELETE FROM users WHERE id = 'xxx';

-- 逻辑删除（生产环境、审计场景）
UPDATE users SET is_deleted = TRUE, deleted_at = NOW() WHERE id = 'xxx';
```

---

# 六、迁移管理

---

## 6.1 迁移文件命名

```text
src/database/migrations/
├── 001-create-users.ts
├── 002-add-user-status.ts
└── 003-create-orders.ts
```

---

## 6.2 AI 生成迁移规范

```txt
【任务】
新增用户表

【要求】
- 使用 TypeORM migration
- 必须有 up() 和 down()
- 必须回滚安全
- 不删除已有数据

【输出】
1. 迁移文件代码
2. 回滚方案
```

---

## 6.3 迁移禁止

- ❌ 不要手动修改已运行的迁移
- ❌ 不要在迁移中删除表
- ❌ 不要在迁移中删除大量数据

---

# 七、ORM 使用规范

---

## 7.1 TypeORM Entity 规范

```ts
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];
}
```

---

## 7.2 Prisma Schema 规范

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  orders    Order[]

  @@index([email])
}
```

---

## 7.3 Repository 模式

```ts
// ✅ 正确
@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }
}
```

---

# 八、常见模式

---

## 8.1 乐观锁

```sql
ALTER TABLE orders ADD COLUMN version INTEGER DEFAULT 0;

-- 更新时检查 version
UPDATE orders
SET status = 'completed', version = version + 1
WHERE id = 'xxx' AND version = 1;
```

---

## 8.2 软删除 + 唯一索引

```sql
-- 允许同一 email 多个用户，但只允许一个未删除
CREATE UNIQUE INDEX idx_users_email_active
ON users(email)
WHERE is_deleted = FALSE;
```

---

## 8.3 审计字段

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  table_name VARCHAR(50),
  record_id UUID,
  action VARCHAR(20),
  old_data JSONB,
  new_data JSONB,
  changed_by UUID,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# 九、AI 开发注意事项

---

## 9.1 AI 生成 SQL 禁止

- ❌ 禁止字符串拼接 SQL（必须参数化）
- ❌ 禁止在循环中查询数据库
- ❌ 禁止 SELECT *
- ❌ 禁止无 LIMIT 查询

---

## 9.2 AI 生成代码检查

```sql
-- ❌ 危险
SELECT * FROM users WHERE id = ${userId}

-- ✅ 正确
SELECT id, email, name FROM users WHERE id = $1
```

---

# 十、性能优化

---

## 10.1 分页查询

```sql
-- ✅ 正确
SELECT * FROM orders
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;

-- ❌ 禁止
SELECT * FROM orders;  -- 全表扫描
```

---

## 10.2 大表处理

- 分区表（按时间/地区）
- 历史数据归档
- 读写分离

---

# 十一、安全规范

---

## 禁止

- ❌ 密码明文存储
- ❌ 敏感信息日志记录
- ❌ SQL 拼接
- ❌ 数据库账号密码硬编码

---

# 十二、AI 数据库设计 Prompt 模板

---

```txt
【任务】
设计用户模块数据库

【要求】
1. 用户表（含审计字段）
2. 角色表
3. 权限表
4. 用户角色关联表

【约束】
- 使用 PostgreSQL
- 使用 UUID 主键
- 支持软删除
- 支持审计

【输出】
1. ER 图
2. 建表 SQL
3. 索引设计
4. 迁移文件
```

---
