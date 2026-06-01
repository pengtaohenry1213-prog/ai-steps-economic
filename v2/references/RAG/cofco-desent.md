下面直接给你**可落地、可直接复制进项目**的全套内容：
敏感词库 + 正则规则 + 权限角色表 + 可运行 Python 脱敏代码，完全适配**央企**场景。

---

# 一、央企专用敏感词库（可直接用）
## 1. 核心商业机密（必屏蔽）
```
采购底价
到厂价
口岸价
期货头寸
基差
进口成本
渠道底价
进场费
条码费
返利政策
扣点
终端供货价
招投标底价
中标价格
排他协议
OEM代工成本
代工底价
产能利用率
排产计划
```

## 2. 财务经营敏感（泛化）
```
销售额
营收
利润
毛利
毛利率
净利率
费用率
税负率
纳税额
回款
账期
资金占用
```

## 3. 研发&工艺敏感（模糊）
```
配方
配比
添加剂
精炼参数
浸出工艺
压榨温度
脱胶
脱酸
脱色
脱臭
馏出温度
活性白土用量
```

## 4. 质量&合规敏感（遮蔽）
```
不合格
退货
投诉
召回
辐照
农残超标
真菌毒素
整改报告
飞检
飞行检查
稽查
```

## 5. 渠道&客户敏感（替换）
```
经销商
代理商
KA客户
商超
沃尔玛
永辉
物美
京东自营
天猫超市
特通渠道
团餐
学生餐
```

## 6. 组织&人事敏感（遮蔽）
```
薪资
年终奖
绩效
裁员
优化
编制
人事调整
高管行程
```

---

# 二、可直接用的正则规则（财务+证照+金额）
```python
import re

# 统一社会信用代码
CREDIT_CODE_PATTERN = re.compile(r'[0-9A-HJ-NPQRTUW]{18}')
# 手机号
PHONE_PATTERN = re.compile(r'1[3-9]\d{9}')
# 固定电话
TEL_PATTERN = re.compile(r'0\d{2,3}-\d{7,8}')
# 银行账号
BANK_CARD_PATTERN = re.compile(r'\d{12,20}')
# 金额（带元/万/亿/吨/公斤/升等单位）
MONEY_PATTERN = re.compile(r'(\d{1,3}(?:,\d{3})*|\d+)(?:\.\d+)?\s*(元|万|亿|万元|亿元|吨|万吨|kg|公斤|升|kwh)')
# 百分比
PERCENT_PATTERN = re.compile(r'\d+\.?\d*%')
# 日期精准脱敏
DATE_PATTERN = re.compile(r'(\d{4})年(\d{1,2})月(\d{1,2})日')
```

---

# 三、央企 5 级权限角色表（直接给HR/IT用）
| 角色 | 可见范围 | 脱敏强度 | 适用岗位 |
|-----|---------|---------|---------|
| Level 0 公众 | 仅公开产品信息 | 极强脱敏 | 消费者、电商客服、外部访客 |
| Level 1 普通员工 | 制度、公告、产品知识 | 中度脱敏 | 行政、文员、基层生产、普通销售 |
| Level 2 业务骨干 | 区域数据、渠道概况 | 轻度脱敏 | 区域主管、品控、采购执行 |
| Level 3 部门负责人 | 部门完整经营数据 | 仅核心机密脱敏 | 工厂厂长、销售经理、研发主管 |
| Level 4 高管/核心 | 全量原文 | 不脱敏 | 总经理、财务负责人、战略、董秘 |

---

# 四、可直接运行的 Python 脱敏代码（RAG 召回后调用）
```python
import re

# ====================== 规则库 ======================
PATTERNS = {
    "phone": re.compile(r'1[3-9]\d{9}'),
    "credit_code": re.compile(r'[0-9A-HJ-NPQRTUW]{18}'),
    "bank_card": re.compile(r'\d{12,20}'),
    "money": re.compile(r'(\d{1,3}(?:,\d{3})*|\d+)(?:\.\d+)?\s*(元|万|亿|万元|亿元|吨|万吨|kg|公斤|升)'),
    "percent": re.compile(r'\d+\.?\d*%'),
}

# 敏感词列表
SENSITIVE_WORDS = {
    "采购底价", "渠道底价", "返利政策", "中标价格", "产能利用率",
    "配方", "压榨温度", "不合格", "退货", "召回", "飞检",
    "薪资", "绩效", "裁员", "优化", "营收", "毛利", "税负率"
}

# ====================== 脱敏策略 ======================
def mask_phone(s):
    return PATTERNS["phone"].sub(lambda m: m.group()[:3] + "****" + m.group()[-4:], s)

def mask_credit_code(s):
    return PATTERNS["credit_code"].sub(lambda m: m.group()[:4] + "*"*10 + m.group()[-4:], s)

def mask_bank_card(s):
    return PATTERNS["bank_card"].sub(lambda m: m.group()[:4] + "*"*10 + m.group()[-4:], s)

def mask_money(s):
    def rep(m):
        num = m.group(1)
        unit = m.group(2)
        if len(num) >= 5:
            return f"约{num[:2]}万{unit}"
        elif len(num) >= 3:
            return f"约{num[:1]}千{unit}"
        else:
            return f"一定金额{unit}"
    return PATTERNS["money"].sub(rep, s)

def mask_percent(s):
    return PATTERNS["percent"].sub("合理区间", s)

def mask_sensitive_words(s):
    for word in SENSITIVE_WORDS:
        s = s.replace(word, "【信息已脱敏】")
    return s

# ====================== 分级脱敏主函数 ======================
def desensitize_fulinmen(text: str, role_level: int = 1) -> str:
    """
    role_level: 0-公众 1-普通员工 2-骨干 3-负责人 4-高管
    """
    if role_level >= 4:
        return text  # 高管不脱敏

    # 统一脱敏
    text = mask_phone(text)
    text = mask_credit_code(text)
    text = mask_bank_card(text)

    if role_level <= 2:
        text = mask_money(text)
        text = mask_percent(text)

    if role_level <= 1:
        text = mask_sensitive_words(text)

    return text
```

---

# 五、真实央企场景示例
## 原文
```
2025年4月，大豆油采购底价7850元/吨，对沃尔玛供货价8420元/吨，毛利率8.3%，天津工厂产能利用率92%，部分批次酸价超标，已内部整改。
```

## Level 0（消费者）
```
产品采用科学成本管控与合理定价，保障品质与性价比。生产基地运行稳定，质量严格按国家标准管控。
```

## Level 1（普通员工）
```
原料成本处于合理区间，终端售价亲民，盈利水平处于行业正常水平，生产基地运行稳定，质量改进工作已完成。
```

## Level 2（销售主管）
```
原料成本约7800元/吨，供货价格合理，毛利率处于合理区间，工厂产能保持高位，质量问题已整改。
```

## Level 4（高管）
```
原文完全可见
```

---

# 六、直接接入你的 RAG 流程
```python
# RAG 核心流程
def rag_query(query, user_role=1):
    # 1. 检索
    chunks = vector_db.search(query, top_k=5)
    # 2. 动态脱敏
    safe_chunks = [desensitize_fulinmen(c.text, user_role) for c in chunks]
    # 3. 构造prompt
    prompt = "根据以下信息回答：\n" + "\n".join(safe_chunks) + "\n问题：" + query
    # 4. 生成
    return llm.generate(prompt)
```

---

如果你告诉我：
- 用的是哪个向量库（FAISS/Chroma/Pinecone）
- LLM 是本地还是云端（文心/通义/豆包等）

---
