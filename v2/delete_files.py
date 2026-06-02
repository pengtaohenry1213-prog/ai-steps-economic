#!/usr/bin/env python3
import os

base = '/Users/taopeng/workspace/AI_2026/ai-steps-economic/v2/apps/web/src'

# Delete views
for f in ['LifecycleDashboard.vue', 'StepDetail.vue', 'StepList.vue', 'WorkflowDashboard.vue']:
    p = os.path.join(base, 'views', f)
    if os.path.exists(p):
        os.unlink(p)
        print(f'Deleted: {p}')

# Delete components
for f in ['TodoGraph.vue', 'HumanGatePanel.vue', 'GapAnalysisViewer.vue', 'DocumentEditor.vue',
          'DocumentEditorSimple.vue', 'ModelSelector.vue', 'AgentLog.vue']:
    p = os.path.join(base, 'components', f)
    if os.path.exists(p):
        os.unlink(p)
        print(f'Deleted: {p}')

# Delete stores
for f in ['lifecycleStore.ts', 'workflowStore.ts']:
    p = os.path.join(base, 'stores', f)
    if os.path.exists(p):
        os.unlink(p)
        print(f'Deleted: {p}')

# Delete config and types directories
for d in ['config', 'types']:
    p = os.path.join(base, d)
    if os.path.exists(p):
        import shutil
        shutil.rmtree(p)
        print(f'Deleted directory: {p}')

# List remaining
print('\n=== components/ ===')
try:
    print(os.listdir(os.path.join(base, 'components')))
except: print('(error)')
print('\n=== views/ ===')
try:
    print(os.listdir(os.path.join(base, 'views')))
except: print('(error)')
print('\n=== stores/ ===')
try:
    print(os.listdir(os.path.join(base, 'stores')))
except: print('(error)')