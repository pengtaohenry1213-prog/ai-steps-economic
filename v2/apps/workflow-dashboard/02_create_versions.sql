CREATE TABLE IF NOT EXISTS proposal_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  change_summary TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
