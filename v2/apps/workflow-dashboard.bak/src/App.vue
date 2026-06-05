<template>
  <el-config-provider :z-index="3000">
    <div class="dashboard">
      <el-container>
        <el-header class="header">
          <div class="header-content">
            <div class="header-left">
              <el-icon class="header-icon"><Monitor /></el-icon>
              <h1 class="header-title">AI 驱动开发工作台</h1>
            </div>
            <el-radio-group v-model="activeView" size="small" class="view-switcher">
              <el-radio-button value="lifecycle">
                <el-icon class="el-icon--left"><List /></el-icon>
                全生命周期
              </el-radio-button>
              <el-radio-button value="workflow">
                <el-icon class="el-icon--left"><Document /></el-icon>
                Step 工作台
              </el-radio-button>
            </el-radio-group>
            <el-tag type="success" effect="dark">
              <el-icon class="el-icon--left"><CircleCheck /></el-icon>
              系统就绪
            </el-tag>
          </div>
        </el-header>

        <el-main>
          <LifecycleDashboard v-if="activeView === 'lifecycle'" />
          <WorkflowDashboard v-else />
        </el-main>
      </el-container>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Monitor, CircleCheck, List, Document } from '@element-plus/icons-vue'
import WorkflowDashboard from './views/WorkflowDashboard.vue'
import LifecycleDashboard from './views/LifecycleDashboard.vue'

const activeView = ref<'workflow' | 'lifecycle'>('lifecycle')
</script>

<style>
.dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.view-switcher {
  margin: 0 20px;
}

.header-icon {
  font-size: 28px;
  color: #409eff;
}

.header-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #303133;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>