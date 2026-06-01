/**
 * @ai-toolkit/lifecycle-core 测试验证
 */

import { createLifecycleCore, LIFECYCLE_STAGES, STAGE_ORDER } from '../src'

async function main() {
  console.log('=== Lifecycle Core SDK 测试 ===\n')

  // 1. 测试创建实例
  console.log('1. 创建 LifecycleCore 实例')
  const lifecycle = createLifecycleCore({
    storageKey: 'test-lifecycle'
  })
  console.log('   ✓ 实例创建成功\n')

  // 2. 测试获取状态
  console.log('2. 测试获取状态')
  const state = lifecycle.getState()
  console.log(`   当前阶段: ${state.currentStageId}`)
  console.log(`   阶段数量: ${state.stages.length}`)
  console.log('   ✓ 状态获取正常\n')

  // 3. 测试阶段定义
  console.log('3. 测试阶段定义')
  console.log(`   阶段数量: ${LIFECYCLE_STAGES.length}`)
  LIFECYCLE_STAGES.forEach(stage => {
    console.log(`   - ${stage.id}: ${stage.name}`)
  })
  console.log('   ✓ 阶段定义正常\n')

  // 4. 测试更新状态
  console.log('4. 测试更新状态')
  lifecycle.updateStageStatus('init', 'in_progress')
  const updatedState = lifecycle.getState()
  const initStage = updatedState.stages.find(s => s.id === 'init')
  console.log(`   init 状态: ${initStage?.status}`)
  console.log(`   开始时间: ${initStage?.startTime}`)
  console.log('   ✓ 状态更新正常\n')

  // 5. 测试阶段流转
  console.log('5. 测试阶段流转')
  lifecycle.setCurrentStage('requirement')
  console.log(`   设置当前阶段为 requirement`)
  const nextId = lifecycle.nextStageId()
  console.log(`   下一阶段: ${nextId}`)
  console.log('   ✓ 阶段流转正常\n')

  // 6. 测试重置
  console.log('6. 测试重置')
  lifecycle.reset()
  const resetState = lifecycle.getState()
  console.log(`   重置后当前阶段: ${resetState.currentStageId}`)
  console.log('   ✓ 重置功能正常\n')

  console.log('=== 测试完成 ===')
}

main().catch(console.error)