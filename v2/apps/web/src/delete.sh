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

# List remaining files
echo "=== components/ ===" && ls components/ 2>/dev/null || echo "(empty or not found)"
echo "=== views/ ===" && ls views/ 2>/dev/null || echo "(empty or not found)"
echo "=== stores/ ===" && ls stores/ 2>/dev/null || echo "(empty or not found)"
echo "=== config/ ===" && ls config/ 2>/dev/null || echo "(not found)"
echo "=== types/ ===" && ls types/ 2>/dev/null || echo "(not found)"