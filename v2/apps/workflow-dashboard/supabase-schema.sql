-- Create proposals table for storing project proposals
CREATE TABLE IF NOT EXISTS proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT NOT NULL,
  stage_id TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  title TEXT,
  content JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'approved', 'rejected')),
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, stage_id)
);

-- Create proposal_versions table for version history
CREATE TABLE IF NOT EXISTS proposal_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  change_summary TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_proposals_project_id ON proposals(project_id);
CREATE INDEX IF NOT EXISTS idx_proposals_stage_id ON proposals(stage_id);
CREATE INDEX IF NOT EXISTS idx_proposal_versions_proposal_id ON proposal_versions(proposal_id);

-- Enable Row Level Security
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_versions ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (for local development)
CREATE POLICY "Allow anonymous access to proposals" ON proposals
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous access to proposal_versions" ON proposal_versions
  FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for proposals
ALTER PUBLICATION supabase_realtime ADD TABLE proposals;
ALTER PUBLICATION supabase_realtime ADD TABLE proposal_versions;

-- Create lifecycle_snapshots table for full workflow state persistence
CREATE TABLE IF NOT EXISTS lifecycle_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id TEXT NOT NULL,
  lifecycle_state JSONB NOT NULL DEFAULT '{}',
  workflow_steps JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lifecycle_snapshots_project_id ON lifecycle_snapshots(project_id);
CREATE INDEX IF NOT EXISTS idx_lifecycle_snapshots_created_at ON lifecycle_snapshots(created_at DESC);

-- Enable Row Level Security
ALTER TABLE lifecycle_snapshots ENABLE ROW LEVEL SECURITY;

-- Create policy for anonymous access
CREATE POLICY "Allow anonymous access to lifecycle_snapshots" ON lifecycle_snapshots
  FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for snapshots
ALTER PUBLICATION supabase_realtime ADD TABLE lifecycle_snapshots;
