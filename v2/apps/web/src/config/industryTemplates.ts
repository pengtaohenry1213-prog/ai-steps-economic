/**
 * 行业需求模板配置
 * 用于 AI 需求差距分析
 */

export interface IndustryTemplate {
  id: string
  name: string
  description: string
  userStoryTemplates: string[]
  functionalChecklist: string[]
  nonFunctionalRequirements: {
    performance: string[]
    security: string[]
    reliability: string[]
    usability: string[]
  }
  commonRisks: string[]
}

export const INDUSTRY_TEMPLATES: Record<string, IndustryTemplate> = {
  software_development: {
    id: 'software_development',
    name: '软件开发',
    description: '通用软件开发项目需求模板',
    userStoryTemplates: [
      '作为{角色}，我希望{功能}，以便{价值}',
      '给定{前置条件}，当{触发事件}时，系统应{预期结果}',
      '{角色}能够{操作}，系统应{响应}',
      '系统应支持{并发数}用户同时{操作}',
      '{角色}在{场景}下，系统应{行为}'
    ],
    functionalChecklist: [
      '用户认证与授权',
      '数据增删改查',
      '文件上传/下载',
      '搜索与过滤',
      '数据导出（Excel/CSV/PDF）',
      '消息通知',
      '数据可视化/报表',
      '工作流/审批流',
      '日志记录与审计',
      '帮助文档/使用指南'
    ],
    nonFunctionalRequirements: {
      performance: [
        '页面响应时间 < 3秒',
        '接口响应时间 < 500ms',
        '支持 100+ 并发用户',
        '大数据量查询分页展示'
      ],
      security: [
        '用户密码加密存储',
        '敏感数据脱敏',
        'SQL 注入防护',
        'XSS 攻击防护',
        'CSRF 令牌验证',
        '接口频率限制'
      ],
      reliability: [
        '数据自动保存',
        '操作失败回滚',
        '异常状态提示',
        '网络断开恢复机制'
      ],
      usability: [
        '界面简洁直观',
        '操作步骤 <= 3步',
        '错误提示明确',
        '支持快捷键',
        '响应式布局适配移动端'
      ]
    },
    commonRisks: [
      '需求范围蔓延',
      '技术选型不合理',
      '第三方服务依赖',
      '数据迁移风险',
      '人员变动导致知识断层',
      '测试覆盖率不足'
    ]
  }
}

export function getIndustryTemplate(id: string): IndustryTemplate | undefined {
  return INDUSTRY_TEMPLATES[id]
}

export function getDefaultTemplate(): IndustryTemplate {
  return INDUSTRY_TEMPLATES['software_development']
}