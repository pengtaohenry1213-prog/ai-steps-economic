#!/bin/bash
cd /Users/taopeng/workspace/AI_2026/ai-steps-economic/v2/apps/web/src

# Delete views
rm -f views/LifecycleDashboard.vue views/StepDetail.vue views/StepList.vue views/WorkflowDashboard.vue

# Delete components
rm -f components/TodoGraph.vue components/HumanGatePanel.vue components/GapAnalysisViewer.vue components/DocumentEditor.vue components/DocumentEditorSimple.vue components/ModelSelector.vue components/AgentLog.vue

# Delete stores
rm -f stores/lifecycleStore.ts stores/workflowStore.ts

# Delete config and types directories
rm -rf config types

echo "Done"