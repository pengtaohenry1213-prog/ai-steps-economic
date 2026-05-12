ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow_all_proposals" ON proposals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow_all_versions" ON proposal_versions FOR ALL USING (true) WITH CHECK (true);
