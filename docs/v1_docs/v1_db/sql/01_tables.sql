-- =====================================================
-- 经济测算模型系统 - 数据库建表脚本
-- Economic Model System - Database Schema
-- =====================================================

-- ----------------------------
-- 1. 数据模型表 (datamodel)
-- ----------------------------
CREATE TABLE IF NOT EXISTS datamodel (
    model_code VARCHAR(64) PRIMARY KEY COMMENT '模型编码(PK)',
    model_name VARCHAR(255) NOT NULL COMMENT '模型名称',
    model_type VARCHAR(32) COMMENT '模型类型: budget/forecast/actual',
    config JSON COMMENT '模型配置JSON',
    forecast_time_type VARCHAR(16) COMMENT '预测时间类型: year/quarter/month',
    currency_code VARCHAR(8) DEFAULT 'CNY' COMMENT '默认币种',
    invest_company_code VARCHAR(64) COMMENT '投资主体编码',
    project_code VARCHAR(64) COMMENT '项目编码',
    status TINYINT DEFAULT 0 COMMENT '状态: 0-草稿 1-已发布',
    create_user VARCHAR(64) COMMENT '创建人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_model_type (model_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据模型表';

-- ----------------------------
-- 2. 模型版本表 (datamodelversion)
-- ----------------------------
CREATE TABLE IF NOT EXISTS datamodelversion (
    version_code VARCHAR(64) PRIMARY KEY COMMENT '版本编码(PK)',
    model_code VARCHAR(64) NOT NULL COMMENT '模型编码(FK)',
    version_name VARCHAR(255) NOT NULL COMMENT '版本名称',
    status TINYINT DEFAULT 0 COMMENT '状态: 0-草稿 1-已提交 2-已锁定',
    is_locked TINYINT DEFAULT 0 COMMENT '是否锁定: 0-未锁定 1-已锁定',
    forecast_time_range JSON COMMENT '预测时间范围 {startYear, endYear, startQuarter, endQuarter}',
    version_config JSON COMMENT '版本配置JSON',
    submit_user VARCHAR(64) COMMENT '提交人',
    submit_time DATETIME COMMENT '提交时间',
    lock_user VARCHAR(64) COMMENT '锁定人',
    lock_time DATETIME COMMENT '锁定时间',
    create_user VARCHAR(64) COMMENT '创建人',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (model_code) REFERENCES datamodel(model_code) ON DELETE CASCADE,
    INDEX idx_model_code (model_code),
    INDEX idx_status (status),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='模型版本表';

-- ----------------------------
-- 3. 模型指标表 (modelmetric)
-- ----------------------------
CREATE TABLE IF NOT EXISTS modelmetric (
    metric_code VARCHAR(64) PRIMARY KEY COMMENT '指标编码(PK)',
    version_code VARCHAR(64) NOT NULL COMMENT '版本编码(FK)',
    page_code VARCHAR(64) COMMENT '页面编码(FK)',
    metric_name VARCHAR(255) NOT NULL COMMENT '指标名称',
    metric_name_en VARCHAR(255) COMMENT '英文名称',
    unit_code VARCHAR(16) COMMENT '单位编码',
    is_fixed TINYINT DEFAULT 0 COMMENT '是否固定值: 0-否 1-是',
    level INT DEFAULT 0 COMMENT '层级: 0-分类 1-父指标 2-子指标',
    parent_emm_id VARCHAR(64) COMMENT '父指标ID',
    sort_order INT DEFAULT 0 COMMENT '排序',
    metric_type VARCHAR(16) COMMENT '指标类型: input/formula/reference',
    formula_expression TEXT COMMENT '公式表达式',
    description TEXT COMMENT '描述',
    create_user VARCHAR(64),
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (version_code) REFERENCES datamodelversion(version_code) ON DELETE CASCADE,
    INDEX idx_version_code (version_code),
    INDEX idx_page_code (page_code),
    INDEX idx_parent_emm_id (parent_emm_id),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='模型指标表';

-- ----------------------------
-- 4. 数据录入表 (dataentry)
-- ----------------------------
CREATE TABLE IF NOT EXISTS dataentry (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    metric_code VARCHAR(64) NOT NULL COMMENT '指标编码(FK)',
    version_code VARCHAR(64) NOT NULL COMMENT '版本编码(FK)',
    report_year INT NOT NULL COMMENT '报表年度',
    report_quarter TINYINT COMMENT '报表季度: 0-全年 1-4',
    value DECIMAL(20,6) COMMENT '数值',
    display_value VARCHAR(128) COMMENT '显示值(格式化后)',
    is_verified TINYINT DEFAULT 0 COMMENT '是否审核: 0-未审 1-已审',
    verify_user VARCHAR(64) COMMENT '审核人',
    verify_time DATETIME COMMENT '审核时间',
    create_user VARCHAR(64),
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (metric_code) REFERENCES modelmetric(metric_code) ON DELETE CASCADE,
    FOREIGN KEY (version_code) REFERENCES datamodelversion(version_code) ON DELETE CASCADE,
    UNIQUE KEY uk_metric_version_period (metric_code, version_code, report_year, report_quarter),
    INDEX idx_version_code (version_code),
    INDEX idx_report_year (report_year),
    INDEX idx_report_quarter (report_quarter)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='数据录入表';

-- ----------------------------
-- 5. 模型公式表 (modelformula)
-- ----------------------------
CREATE TABLE IF NOT EXISTS modelformula (
    formula_id VARCHAR(64) PRIMARY KEY COMMENT '公式ID(PK)',
    metric_code VARCHAR(64) NOT NULL COMMENT '指标编码(FK)',
    formula_expression TEXT NOT NULL COMMENT '公式表达式',
    formula_name VARCHAR(255) COMMENT '公式名称',
    lua_script TEXT COMMENT 'Lua脚本(可选)',
    depends JSON COMMENT '依赖指标数组: [code1, code2]',
    description TEXT COMMENT '公式描述',
    function_type VARCHAR(32) COMMENT '函数类型: arithmetic/financial/statistical',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用 1-启用',
    create_user VARCHAR(64),
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (metric_code) REFERENCES modelmetric(metric_code) ON DELETE CASCADE,
    INDEX idx_metric_code (metric_code),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='模型公式表';

-- ----------------------------
-- 6. 模型页面表 (modelpage)
-- ----------------------------
CREATE TABLE IF NOT EXISTS modelpage (
    page_code VARCHAR(64) PRIMARY KEY COMMENT '页面编码(PK)',
    version_code VARCHAR(64) NOT NULL COMMENT '版本编码(FK)',
    page_name VARCHAR(255) NOT NULL COMMENT '页面名称',
    page_name_en VARCHAR(255) COMMENT '英文名称',
    interface_type VARCHAR(32) COMMENT '界面类型: table/chart/form',
    model_type VARCHAR(16) COMMENT '模型类型',
    sort_order INT DEFAULT 0 COMMENT '排序',
    page_config JSON COMMENT '页面配置JSON',
    create_user VARCHAR(64),
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (version_code) REFERENCES datamodelversion(version_code) ON DELETE CASCADE,
    INDEX idx_version_code (version_code),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='模型页面表';

-- ----------------------------
-- 7. 币种字典表 (currencydictionary) - 参考表
-- ----------------------------
CREATE TABLE IF NOT EXISTS currencydictionary (
    currency_code VARCHAR(8) PRIMARY KEY COMMENT '币种编码',
    currency_name VARCHAR(64) NOT NULL COMMENT '币种名称',
    currency_symbol VARCHAR(8) COMMENT '符号',
    exchange_rate DECIMAL(20,6) DEFAULT 1 COMMENT '汇率',
    status TINYINT DEFAULT 1 COMMENT '状态',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='币种字典表';

-- ----------------------------
-- 8. 单位分类表 (unitcategory) - 参考表
-- ----------------------------
CREATE TABLE IF NOT EXISTS unitcategory (
    unit_code VARCHAR(16) PRIMARY KEY COMMENT '单位编码',
    unit_name VARCHAR(64) NOT NULL COMMENT '单位名称',
    unit_type VARCHAR(16) COMMENT '单位类型: amount/ratio/count',
    category_code VARCHAR(16) COMMENT '分类编码',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='单位分类表';

-- ----------------------------
-- 关系图
-- ----------------------------
-- datamodel 1:N datamodelversion
-- datamodelversion 1:N modelmetric
-- datamodelversion 1:N modelpage
-- modelmetric 1:N dataentry
-- modelmetric 1:N modelformula
-- modelpage 1:N modelmetric