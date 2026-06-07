-- Formulas 表：存储自定义公式定义
-- 用于 MVTP 公式管理和版本控制

CREATE TABLE IF NOT EXISTS formulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  cell_id TEXT NOT NULL,
  formula_str TEXT NOT NULL,
  description TEXT,
  func_name TEXT NOT NULL,
  parameters JSONB DEFAULT '[]',
  return_type TEXT DEFAULT 'number',
  is_custom BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  UNIQUE(document_id, cell_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_formulas_document ON formulas(document_id);
CREATE INDEX IF NOT EXISTS idx_formulas_func_name ON formulas(func_name);
CREATE INDEX IF NOT EXISTS idx_formulas_cell ON formulas(cell_id);

-- 启用实时订阅
ALTER TABLE formulas REPLICA IDENTITY FULL;

COMMENT ON TABLE formulas IS '自定义公式定义表';
COMMENT ON COLUMN formulas.func_name IS '函数名称（如 CALC_DISCOUNT）';
COMMENT ON COLUMN formulas.parameters IS '参数定义数组';
COMMENT ON COLUMN formulas.is_custom IS '是否为自定义函数（vs 内置函数）';