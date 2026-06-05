import { supabase } from './supabaseClient'
import type { ProposalContent } from '../types'

export interface ProposalRecord {
  id: string
  project_id: string
  stage_id: string
  version: number
  title: string
  content: ProposalContent
  status: 'draft' | 'in_review' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export interface ProposalVersionRecord {
  id: string
  proposal_id: string
  version: number
  content: ProposalContent
  change_summary: string | null
  created_by: string | null
  created_at: string
}

export async function saveProposal(params: {
  projectId: string
  stageId: string
  title: string
  content: ProposalContent
  createdBy?: string
}): Promise<{ data: ProposalRecord | null; error: Error | null }> {
  if (!supabase) {
    console.warn('Supabase not configured, skipping save')
    return { data: null, error: null }
  }

  const { data: existingRows } = await supabase
    .from('proposals')
    .select('id, version')
    .eq('project_id', params.projectId)
    .eq('stage_id', params.stageId)
    .limit(1)

  if (existingRows && existingRows.length > 0) {
    const existing = existingRows[0]
    await supabase.from('proposal_versions').insert({
      proposal_id: existing.id,
      version: existing.version,
      content: params.content
    })

    const { data, error } = await supabase
      .from('proposals')
      .update({
        version: existing.version + 1,
        title: params.title,
        content: params.content,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()

    const rows = data as ProposalRecord[] | null
    if (!rows || rows.length === 0) {
      return { data: null, error: error as Error | null }
    }
    return { data: rows[0], error: error as Error | null }
  } else {
    const { data, error } = await supabase
      .from('proposals')
      .insert({
        project_id: params.projectId,
        stage_id: params.stageId,
        title: params.title,
        content: params.content
      })
      .select()

    const rows = data as ProposalRecord[] | null
    if (!rows || rows.length === 0) {
      return { data: null, error: error as Error | null }
    }
    return { data: rows[0], error: error as Error | null }
  }
}

export async function loadProposal(projectId: string, stageId: string): Promise<{ data: ProposalRecord | null; error: Error | null }> {
  if (!supabase) {
    console.warn('Supabase not configured, skipping load')
    return { data: null, error: null }
  }

  const { data, error } = await supabase
    .from('proposals')
    .select('id, project_id, stage_id, version, title, content, status, created_at, updated_at')
    .eq('project_id', projectId)
    .eq('stage_id', stageId)
    .limit(1)

  // Handle empty result (no .single() to avoid 406 error)
  if (error) {
    return { data: null, error: error as Error | null }
  }

  const rows = data as ProposalRecord[] | null
  if (!rows || rows.length === 0) {
    return { data: null, error: null }
  }

  return { data: rows[0], error: null }
}

export async function getProposalHistory(proposalId: string): Promise<{ data: ProposalVersionRecord[] | null; error: Error | null }> {
  if (!supabase) {
    console.warn('Supabase not configured, skipping load')
    return { data: null, error: null }
  }

  const { data, error } = await supabase
    .from('proposal_versions')
    .select('id, proposal_id, version, content, change_summary, created_by, created_at')
    .eq('proposal_id', proposalId)
    .order('version', { ascending: false })

  return { data: data as ProposalVersionRecord[] | null, error: error as Error | null }
}

export async function deleteProposal(projectId: string, stageId: string): Promise<{ error: Error | null }> {
  if (!supabase) {
    console.warn('Supabase not configured, skipping delete')
    return { error: null }
  }

  const { error } = await supabase
    .from('proposals')
    .delete()
    .eq('project_id', projectId)
    .eq('stage_id', stageId)

  return { error: error as Error | null }
}
