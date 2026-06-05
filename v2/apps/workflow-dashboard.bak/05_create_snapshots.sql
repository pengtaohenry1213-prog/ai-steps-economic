-- Create lifecycle_snapshots table for full workflow state persistence
CREATE TABLE IF NOT EXISTS lifecycle_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT NOT NULL,
  lifecycle_state JSONB NOT NULL DEFAULT '{}',
  workflow_steps JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for querying by project
CREATE INDEX IF NOT EXISTS idx_lifecycle_snapshots_project_id ON lifecycle_snapshots(project_id);
CREATE INDEX IF NOT EXISTS idx_lifecycle_snapshots_created_at ON lifecycle_snapshots(created_at DESC);

-- Enable Row Level Security
ALTER TABLE lifecycle_snapshots ENABLE ROW LEVEL SECURITY;

-- Create policy for anonymous access
CREATE POLICY "Allow_all_snapshots" ON lifecycle_snapshots FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for snapshots
ALTER PUBLICATION supabase_realtime ADD TABLE lifecycle_snapshots;
