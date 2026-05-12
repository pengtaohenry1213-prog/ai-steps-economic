-- 添加 workflow_steps 列到 lifecycle_snapshots 表（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lifecycle_snapshots' AND column_name = 'workflow_steps'
  ) THEN
    ALTER TABLE lifecycle_snapshots ADD COLUMN workflow_steps JSONB NOT NULL DEFAULT '[]';
    RAISE NOTICE 'Added workflow_steps column to lifecycle_snapshots';
  ELSE
    RAISE NOTICE 'workflow_steps column already exists in lifecycle_snapshots';
  END IF;
END $$;
