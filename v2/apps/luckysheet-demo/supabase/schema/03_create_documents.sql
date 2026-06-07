-- Documents 表：存储协作文档/表格
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL,
  collaborators UUID[] DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_id);

-- 启用实时订阅
ALTER TABLE documents REPLICA IDENTITY FULL;

COMMENT ON TABLE documents IS '协作文档表';