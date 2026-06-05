import { supabase } from './supabaseClient'
import type { LifecycleStage, Step } from '../types'

export interface LifecycleSnapshot {
  id: string
  project_id: string
  lifecycle_state: {
    stages: LifecycleStage[]
    currentStageId: string
  }
  workflow_steps: Step[]
  created_at: string
}

export interface SaveSnapshotParams {
  projectId: string
  lifecycleStages: LifecycleStage[]
  currentStageId: string
  workflowSteps: Step[]
}

const SNAPSHOT_TABLE = 'lifecycle_snapshots'

export async function saveSnapshot(params: SaveSnapshotParams): Promise<{ data: LifecycleSnapshot | null; error: Error | null }> {
  if (!supabase) {
    console.warn('Supabase not configured, skipping snapshot save')
    return { data: null, error: null }
  }

  const { error } = await supabase
    .from(SNAPSHOT_TABLE)
    .insert({
      project_id: params.projectId,
      lifecycle_state: {
        stages: params.lifecycleStages,
        currentStageId: params.currentStageId
      },
      workflow_steps: params.workflowSteps
    })

  if (error) {
    console.error('Failed to save lifecycle snapshot:', error)
    return { data: null, error }
  }

  return { data: null, error: null }
}

export async function loadLatestSnapshot(projectId: string): Promise<{ data: LifecycleSnapshot | null; error: Error | null }> {
  if (!supabase) {
    console.warn('Supabase not configured, skipping snapshot load')
    return { data: null, error: null }
  }

  const { data, error } = await supabase
    .from(SNAPSHOT_TABLE)
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)

  // .single() throws error when 0 rows, so we check array length instead
  if (error) {
    return { data: null, error: error as Error | null }
  }

  const snapshots = data as LifecycleSnapshot[] | null
  if (!snapshots || snapshots.length === 0) {
    return { data: null, error: null }
  }

  return { data: snapshots[0], error: null }
}

export async function deleteAllSnapshots(projectId: string): Promise<{ error: Error | null }> {
  if (!supabase) {
    console.warn('Supabase not configured, skipping snapshot delete')
    return { error: null }
  }

  const { error } = await supabase
    .from(SNAPSHOT_TABLE)
    .delete()
    .eq('project_id', projectId)

  return { error: error as Error | null }
}
