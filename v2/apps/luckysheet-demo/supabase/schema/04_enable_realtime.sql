-- 启用 RLS（行级安全策略）
ALTER TABLE cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Cells 表策略
CREATE POLICY "Users can view cells in their documents"
  ON cells FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM documents WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert cells in their documents"
  ON cells FOR INSERT
  WITH CHECK (
    document_id IN (
      SELECT id FROM documents WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update cells in their documents"
  ON cells FOR UPDATE
  USING (
    document_id IN (
      SELECT id FROM documents WHERE owner_id = auth.uid()
    )
  );

-- Formulas 表策略
CREATE POLICY "Users can view formulas in their documents"
  ON formulas FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM documents WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert formulas in their documents"
  ON formulas FOR INSERT
  WITH CHECK (
    document_id IN (
      SELECT id FROM documents WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update formulas in their documents"
  ON formulas FOR UPDATE
  USING (
    document_id IN (
      SELECT id FROM documents WHERE owner_id = auth.uid()
    )
  );

-- Documents 表策略
CREATE POLICY "Users can view their documents"
  ON documents FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can insert their documents"
  ON documents FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their documents"
  ON documents FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their documents"
  ON documents FOR DELETE
  USING (owner_id = auth.uid());