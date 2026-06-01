# 经济模型系统 V2 - UI设计规范

## 设计概述

**设计风格**: Corporate Clean (企业简洁风)  
**适用场景**: B2B SaaS、企业级财务建模平台  
**核心目标**: 专业、可信、高效的信息传达

---

## 色彩系统

### 主色调
| 名称 | 色值 | 用途 |
|------|------|------|
| Primary | `#3b82f6` | 主按钮、链接、强调 |
| Primary Hover | `#2563eb` | 悬停状态 |
| Primary Light | `#eff6ff` | 背景高亮 |

### 中性色
| 名称 | 色值 | 用途 |
|------|------|------|
| Text Primary | `#1e293b` | 主文本 |
| Text Secondary | `#64748b` | 次要文本 |
| Text Muted | `#94a3b8` | 占位符、禁用 |
| Border | `#e2e8f0` | 边框、分隔线 |
| Background | `#f8fafc` | 页面背景 |
| White | `#ffffff` | 卡片背景 |

### 状态色
| 状态 | 背景色 | 文本色 |
|------|--------|--------|
| 草稿 | `#f1f5f9` | `#64748b` |
| 已提交 | `#eff6ff` | `#3b82f6` |
| 已锁定 | `#f0fdf4` | `#22c55e` |
| 风险 | `#fef2f2` | `#ef4444` |

---

## 字体规范

### 字体栈
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### 字号层级
| 层级 | 大小 | 字重 | 用途 |
|------|------|------|------|
| Page Title | `text-lg` (18px) | semibold | 页面标题 |
| Section Title | `text-base` (16px) | semibold | 区块标题 |
| Body | `text-sm` (14px) | normal | 正文 |
| Small | `text-xs` (12px) | normal | 辅助文本、标签 |
| Mono | `font-mono` | normal | 数字、代码 |

---

## 间距系统

### 基础单位: 4px

| Token | 值 | 用途 |
|-------|-----|------|
| space-1 | 4px | 图标间距 |
| space-2 | 8px | 紧凑间距 |
| space-3 | 12px | 标准间距 |
| space-4 | 16px | 卡片内边距 |
| space-6 | 24px | 区块间距 |

### 组件间距
- 卡片内边距: `p-4` (16px)
- 表单字段间距: `gap-3` (12px)
- 按钮内边距: `px-4 py-2` (16px × 8px)
- 表格单元格: `px-3 py-2` (12px × 8px)

---

## 圆角规范

| Token | 值 | 用途 |
|-------|-----|------|
| rounded | 4px | 小元素、标签 |
| rounded-lg | 8px | 按钮、输入框 |
| rounded-xl | 12px | 卡片、弹窗 |

---

## 阴影规范

| Token | 值 | 用途 |
|-------|-----|------|
| shadow-sm | `0 1px 2px rgba(0,0,0,0.05)` | 卡片默认 |
| shadow | `0 1px 3px rgba(0,0,0,0.1)` | 悬停状态 |
| shadow-md | `0 4px 6px rgba(0,0,0,0.1)` | 弹窗、下拉 |

---

## 组件规范

### 按钮

**Primary Button**
```
class: bg-[#3b82f6] text-white px-4 py-2 rounded-lg font-medium shadow-sm
hover: bg-[#2563eb] shadow
active: scale-[0.98]
```

**Secondary Button**
```
class: bg-white text-[#64748b] border border-[#e2e8f0] px-4 py-2 rounded-lg font-medium
hover: bg-[#f8fafc] border-[#cbd5e1]
```

**Danger Button**
```
class: text-[#ef4444] bg-transparent px-4 py-2 rounded-lg font-medium
hover: bg-[#fef2f2]
```

### 卡片

**标准卡片**
```
class: bg-white rounded-xl shadow-sm border border-[#e2e8f0] p-4
hover: shadow-md -translate-y-0.5
```

**选中卡片**
```
class: bg-white rounded-xl shadow-sm border-2 border-[#3b82f6] p-4
```

### 输入框

**标准输入**
```
class: w-full bg-white rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm text-[#1e293b]
placeholder: text-[#94a3b8]
focus: border-[#3b82f6] ring-2 ring-[#3b82f6]/20
```

### 表格

**表头**
```
class: bg-[#f8fafc] text-xs font-medium text-[#64748b] uppercase tracking-wide
border-b border-[#e2e8f0] px-3 py-2
```

**数据行**
```
class: text-sm text-[#1e293b] border-b border-[#e2e8f0] px-3 py-2
hover: bg-[#f8fafc]
```

**数字单元格**
```
class: font-mono text-sm text-[#1e293b]
```

### 标签/徽章

**状态标签**
```
class: inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
```

**草稿标签**
```
class: bg-[#f1f5f9] text-[#64748b]
```

**已提交标签**
```
class: bg-[#eff6ff] text-[#3b82f6]
```

**已锁定标签**
```
class: bg-[#f0fdf4] text-[#22c55e]
```

---

## 页面布局

### 整体结构
```
┌─────────────────────────────────────────┐
│  Sidebar (220px)  │  Main Content       │
│                   │  (flex-1)           │
│  - Logo           │                     │
│  - Navigation     │  ┌───────────────┐  │
│  - Collapse       │  │  Header       │  │
│                   │  │  (56px)       │  │
│                   │  ├───────────────┤  │
│                   │  │               │  │
│                   │  │  Content      │  │
│                   │  │  Area         │  │
│                   │  │               │  │
│                   │  └───────────────┘  │
└─────────────────────────────────────────┘
```

### 响应式断点
| 断点 | 宽度 | 行为 |
|------|------|------|
| Mobile | < 768px | 侧边栏隐藏，汉堡菜单 |
| Tablet | 768px - 1024px | 侧边栏可折叠 |
| Desktop | > 1024px | 完整布局 |

---

## 交互规范

### 过渡动画
- 默认过渡: `transition-all duration-200`
- 悬停过渡: `transition-colors duration-150`
- 弹窗动画: `scale-95 → scale-100`, `opacity-0 → opacity-100`

### 焦点状态
- 所有可交互元素必须有焦点环
- 焦点环样式: `ring-2 ring-[#3b82f6] ring-offset-2`

### 加载状态
- 按钮加载: 显示旋转图标，禁用点击
- 页面加载: Skeleton 骨架屏
- 数据加载: 进度条或旋转指示器

---

## 设计原则

### Do's
- 使用一致的间距和圆角
- 保持足够的色彩对比度 (WCAG AA)
- 为所有交互提供视觉反馈
- 使用 monospace 字体显示数字
- 表格行使用斑马纹或悬停高亮

### Don'ts
- 不要使用超过 3 种主色
- 不要使用装饰性渐变
- 不要使用超过 200ms 的动画
- 不要隐藏重要操作在下拉菜单中
- 不要使用纯黑色文本 (#000)

---

## 文件输出

设计规范文档已保存至: `/home/project/outputs/UI-Design-System.md`
