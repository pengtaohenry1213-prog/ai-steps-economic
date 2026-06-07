-- Cells 表：存储表格单元格数据
-- 用于 MVTP 多人协作场景

CREATE TABLE IF NOT EXISTS cells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id TEXT NOT NULL,
  document_id UUID NOT NULL,
  r INTEGER NOT NULL CHECK (r >= 0),
  c INTEGER NOT NULL CHECK (c >= 0),
  value JSONB,
  format JSONB,
  formula TEXT,
  is_cyclic BOOLEAN DEFAULT FALSE,
  cycle_path TEXT[],
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID,
  UNIQUE(document_id, sheet_id, r, c)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_cells_document ON cells(document_id);
CREATE INDEX IF NOT EXISTS idx_cells_sheet ON cells(sheet_id);
CREATE INDEX IF NOT EXISTS idx_cells_doc_sheet_rc ON cells(document_id, sheet_id, r, c);

-- 启用实时订阅
ALTER TABLE cells REPLICA IDENTITY FULL;

COMMENT ON TABLE cells IS 'Luckysheet 单元格数据表';
COMMENT ON COLUMN cells.is_cyclic IS '是否在循环引用路径中';
COMMENT ON COLUMN cells.cycle_path IS '循环引用路径';
COMMENT ON COLUMN cells.format IS '单元格格式（颜色、字体等）';