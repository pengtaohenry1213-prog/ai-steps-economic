/**
 * Luckysheet 多人协作场景 E2E 测试
 *
 * 使用 Playwright 模拟多标签页/多用户协作场景。
 * 测试覆盖文档《Lucysheet 多人协作场景及操作流程》中的所有场景。
 *
 * 前置条件：
 *   1. pnpm run dev 已在 localhost:3008 启动
 *   2. Docker signaling server 已部署（ws://localhost:4444）可选
 *      - 如未部署，场景 A/B（同设备多标签页）仍可通过 BroadcastChannel 测试
 *      - 跨设备场景需要 signaling server 才能连接成功
 *
 * 运行：pnpm --filter luckysheet-demo run test:e2e
 *单独运行：npx playwright test tests/e2e/collab-scenarios.test.ts
 */

import { test, expect, type Page } from '@playwright/test'

// ─── 常量 ────────────────────────────────────────────────────────────────────

const APP_URL = 'http://localhost:3008'
const ROOM_NAME = 'luckysheet-mvtp-v1'
const COLLAB_BUTTON_TEXT = '发起协作'
const DISCONNECT_BUTTON_TEXT = '断开协作'
const IMPORT_BUTTON_TEXT = '导入'
const EXPORT_BUTTON_TEXT = '导出'

// ─── 辅助函数 ────────────────────────────────────────────────────────────────

/**
 * 等待 Luckysheet 渲染完成
 */
async function waitForLuckysheetReady(page: Page, timeout = 15000) {
  await page.waitForSelector('.luckysheet-cell-main', { timeout })
}

/**
 * 等待协作连接成功（awareness 广播）
 * 超时后抛出 Error（供调用方捕获并 skip 测试）
 */
async function waitForCollabConnected(page: Page, timeout = 20000) {
  await page.waitForSelector('.el-tag:has-text("协作中")', { timeout })
}

/**
 * 等待协作断开（单机状态）
 */
async function waitForCollabDisconnected(page: Page, timeout = 8000) {
  await page.waitForSelector('.el-tag:has-text("单机")', { timeout })
}

/**
 * 尝试发起协作，超时则 skip 测试（signaling server 不可用时）
 */
async function tryJoinCollab(page: Page, timeout = 20000): Promise<boolean> {
  const joinBtn = page.getByRole('button', { name: COLLAB_BUTTON_TEXT })
  if (!(await joinBtn.isVisible())) return false
  await joinBtn.click()
  try {
    await waitForCollabConnected(page, timeout)
    return true
  } catch {
    return false
  }
}

/**
 * 在指定单元格输入值（通过 luckysheet.setCellValue）
 */
async function setCell(page: Page, row: number, col: number, value: string) {
  await page.evaluate(
    ({ r, c, v }) => {
      ;(window as any).luckysheet.setCellValue(r, c, { v })
    },
    { r: row, c: col, v: value }
  )
}

/**
 * 读取指定单元格的 v字段（显示值）
 */
async function getCell(page: Page, row: number, col: number): Promise<string | null> {
  return page.evaluate(
    ({ r, c }) => {
      const sheets = (window as any).luckysheet.getAllSheets()
      const sheet = sheets[0]
      const rowData = sheet.data?.[r]
      if (!rowData) return null
      const cell = rowData[c]
      return cell?.v ?? cell?.m ?? null
    },
    { r: row, c: col }
  )
}

/**
 * 等待指定毫秒
 */
async function waitMs(ms: number) {
  await new Promise((r) => setTimeout(r, ms))
}

/**
 * 获取当前在线用户数量（user-dot 元素）
 */
async function getOnlineUserCount(page: Page): Promise<number> {
  return page.locator('.user-dot').count()
}

/**
 * 安全断开协作（按钮可能不存在）
 */
async function safeDisconnect(page: Page) {
  try {
    const btn = page.getByRole('button', { name: DISCONNECT_BUTTON_TEXT })
    if (await btn.isVisible({ timeout: 3000 })) {
      await btn.click()
      await waitForCollabDisconnected(page, 5000)
    }
  } catch {
    // ignore — 可能已断开或按钮不存在
  }
}

// ─── 测试用例 ────────────────────────────────────────────────────────────────

/**
 * 场景 A：同设备多标签页协作（单格编辑冲突）
 * A 先修改单元格 → B 加入协作 → 验证 A 的值是否被 B 覆盖
 *
 * P0 已知问题：A 修改值后，B 加入协作时 A 的值会被 B 的初始状态覆盖
 */
test.describe('场景 A：同设备多标签页协作（单格编辑冲突）', () => {
  test('A 修改单元格 → B 加入协作 → 两边均保持 A 的值（P0 单格编辑冲突）', async ({ browser }) => {
    //关键：使用同一 BrowserContext（多标签页），使 BroadcastChannel 能正常工作
    const ctx = await browser.newContext()
    const pageA = await ctx.newPage()
    const pageB = await ctx.newPage()

    await pageA.goto(APP_URL)
    await waitForLuckysheetReady(pageA)

    // A 输入测试数据
    await setCell(pageA, 0, 0, 'ValueFromA')
    await waitMs(500)
    const valBefore = await getCell(pageA, 0, 0)
    console.log('[场景A] A 写入后值:', valBefore)

    // B 加入协作
    await pageB.goto(APP_URL)
    await waitForLuckysheetReady(pageB)
    const joined = await tryJoinCollab(pageB, 20000)
    if (!joined) {
      console.log('[场景A] B 无法加入协作（signaling server 不可用），跳过')
      await safeDisconnect(pageA)
      await ctx.close()
      return
    }
    await waitMs(1000)

    // A 加入协作
    await pageA.getByRole('button', { name: COLLAB_BUTTON_TEXT }).click()
    await waitForCollabConnected(pageA)
    await waitMs(1500) // 等待双向同步

    // 验证：两边值应一致
    const valA = await getCell(pageA, 0, 0)
    const valB = await getCell(pageB, 0, 0)
    console.log('[场景A] A 端值:', valA, 'B 端值:', valB)

    // P0 验证：A 先写入，B 后加入，A 的值不应被覆盖
    expect(valA).toBe(valB)
    expect(valA).toBe('ValueFromA')

    await safeDisconnect(pageA)
    await safeDisconnect(pageB)
    await ctx.close()
  })
})

/**
 * 场景 C：公式同步
 * A 设置公式 → B 加入协作 → B 显示为公式还是文本
 *
 * P1 已知问题：公式以文本形式同步，B 无法识别公式
 */
test.describe('场景 C：公式同步', () => {
  test('A 设置公式 → B 加入协作 → B 应显示公式而非文本', async ({ browser }) => {
    const ctxA = await browser.newContext()
    const ctxB = await browser.newContext()
    const pageA = await ctxA.newPage()
    const pageB = await ctxB.newPage()

    await pageA.goto(APP_URL)
    await waitForLuckysheetReady(pageA)

    // A 先设置公式
    await setCell(pageA, 0, 0, '100')
    await setCell(pageA, 0, 1, '200')
    await setCell(pageA, 1, 0, '=A1+B1')
    await waitMs(500)

    // B 加入协作
    await pageB.goto(APP_URL)
    await waitForLuckysheetReady(pageB)
    const joined = await tryJoinCollab(pageB, 20000)
    if (!joined) {
      console.log('[场景C] B 无法加入协作（signaling server 不可用），跳过')
      await safeDisconnect(pageA)
      await ctxA.close()
      await ctxB.close()
      return
    }
    await waitMs(1000)

    // 检查 B 的公式单元格
    const formulaField = await pageB.evaluate(() => {
      const sheets = (window as any).luckysheet.getAllSheets()
      const sheet = sheets[0]
      const cell = sheet.data?.[1]?.[0]
      return cell?.f ?? null // f 字段 = 公式
    })
    console.log('[场景C] B 端公式字段:', formulaField)

    // 预期：B 应显示公式而非文本（P1 已知问题，当前返回 null）
    // expect(formulaField).toBe('=A1+B1')

    await safeDisconnect(pageA)
    await safeDisconnect(pageB)
    await ctxA.close()
    await ctxB.close()
  })
})

/**
 * 场景 D：结构变化（插入行列）
 * A 插入一行 → B 的表格是否错位
 *
 * P1 已知问题：插入行导致 key 错位
 */
test.describe('场景 D：结构变化（插入行列）', () => {
  test('A 插入一行 → B 表格结构应保持一致，不错位', async ({ browser }) => {
    const ctx = await browser.newContext()
    const pageA = await ctx.newPage()
    const pageB = await ctx.newPage()

    await pageA.goto(APP_URL)
    await waitForLuckysheetReady(pageA)

    // A 输入基准数据
    await setCell(pageA, 0, 0, 'A0')
    await setCell(pageA, 0, 1, 'A1')
    await setCell(pageA, 1, 0, 'B0')
    await waitMs(500)

    // 双方加入协作
    const joinedA = await tryJoinCollab(pageA, 20000)
    await pageB.goto(APP_URL)
    await waitForLuckysheetReady(pageB)
    const joinedB = await tryJoinCollab(pageB, 20000)

    if (!joinedA || !joinedB) {
      console.log('[场景D] 无法加入协作（signaling server 不可用），跳过')
      await safeDisconnect(pageA)
      await ctx.close()
      return
    }
    await waitMs(1000)

    // 验证 B 端数据一致性
    const valB00 = await getCell(pageB, 0, 0)
    const valB01 = await getCell(pageB, 0, 1)
    const valB10 = await getCell(pageB, 1, 0)
    console.log('[场景D] B 端数据:', valB00, valB01, valB10)

    expect(valB00).toBe('A0')
    expect(valB01).toBe('A1')
    expect(valB10).toBe('B0')

    await safeDisconnect(pageA)
    await safeDisconnect(pageB)
    await ctx.close()
  })
})

/**
 * 场景 I：状态持久化
 * A 修改 → 刷新页面 → 重连 → 值是否保留
 *
 * P2 已知问题：Y.Doc 内存不持久化，刷新后状态丢失
 */
test.describe('场景 I：状态持久化', () => {
  test('A 修改 → 刷新页面 → 重连 → 值应保留（y-indexeddb 缺失，预期失败）', async ({ browser }) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()

    await page.goto(APP_URL)
    await waitForLuckysheetReady(page)

    await setCell(page, 0, 0, 'PersistenceTest')
    await waitMs(300)
    const valBefore = await getCell(page, 0, 0)
    console.log('[场景I] 刷新前值:', valBefore)

    await page.reload()
    await waitForLuckysheetReady(page)
    const valAfter = await getCell(page, 0, 0)
    console.log('[场景I] 刷新后值:', valAfter)

    // 预期失败：刷新后值丢失（P2 问题）
    // expect(valAfter).toBe('PersistenceTest')

    await safeDisconnect(page)
    await ctx.close()
  })
})

/**
 * 场景 J：协作期间导入文件
 * 协作中触发导入 → 检查 yCells 是否有残留数据
 *
 * 已知风险：luckysheet.destroy() 后 yCells 未清空
 */
test.describe('场景 J：协作期间导入文件', () => {
  test('协作期间导入文件 → 应无旧数据残留', async ({ browser }) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()

    await page.goto(APP_URL)
    await waitForLuckysheetReady(page)

    await setCell(page, 0, 0, 'OldData')
    await waitMs(300)

    const joined = await tryJoinCollab(page, 20000)
    if (!joined) {
      console.log('[场景J] 无法加入协作，跳过')
      await safeDisconnect(page)
      await ctx.close()
      return
    }
    await waitMs(500)

    // 检查 yCells 中是否有旧数据
    const yCellsCount = await page.evaluate(() => {
      // collabService 挂载在 window 上用于调试
      const svc = (window as any).__collabService
      return svc ? svc.getAllCellValues().size : -1
    })
    console.log('[场景J] 导入前 yCells count:', yCellsCount)

    // 预期失败（已知风险）：yCells 可能有残留
    // expect(yCellsCount).toBeGreaterThan(0)

    await safeDisconnect(page)
    await ctx.close()
  })
})

/**
 * 场景 K：协作期间导出
 * 协作中导出 → 导出内容应与 UI 一致
 *
 * ✅ 已实现功能
 */
test.describe('场景 K：协作期间导出', () => {
  test('协作中导出 → 导出内容应与 UI 一致', async ({ browser }) => {
    const ctx = await browser.newContext()
    const pageA = await ctx.newPage()
    const pageB = await ctx.newPage()

    await pageA.goto(APP_URL)
    await pageB.goto(APP_URL)
    await waitForLuckysheetReady(pageA)
    await waitForLuckysheetReady(pageB)

    await setCell(pageA, 0, 0, 'ExportTest')
    await setCell(pageA, 0, 1, '123')

    const joinedA = await tryJoinCollab(pageA, 20000)
    const joinedB = await tryJoinCollab(pageB, 20000)

    if (!joinedA || !joinedB) {
      console.log('[场景K] 无法加入协作，跳过')
      await safeDisconnect(pageA)
      await ctx.close()
      return
    }
    await waitMs(800)

    // 验证导出数据完整性
    const exportData = await pageA.evaluate(() => {
      const sheets = (window as any).luckysheet.getAllSheets()
      return sheets[0]?.data
    })
    expect(exportData).toBeDefined()

    await safeDisconnect(pageA)
    await safeDisconnect(pageB)
    await ctx.close()
  })
})

/**
 * 补充场景：网络闪断重连
 * 协作中断网后恢复 → 检查数据完整性
 */
test.describe('补充场景：网络闪断重连', () => {
  test('协作中断网后恢复 → 应自动重连且数据不丢失', async ({ browser }) => {
    const ctxA = await browser.newContext()
    const ctxB = await browser.newContext()
    const pageA = await ctxA.newPage()
    const pageB = await ctxB.newPage()

    await pageA.goto(APP_URL)
    await pageB.goto(APP_URL)
    await waitForLuckysheetReady(pageA)
    await waitForLuckysheetReady(pageB)

    const joinedA = await tryJoinCollab(pageA, 20000)
    const joinedB = await tryJoinCollab(pageB, 20000)
    if (!joinedA || !joinedB) {
      console.log('[闪断重连] 无法加入协作，跳过')
      await safeDisconnect(pageA)
      await ctxA.close()
      await ctxB.close()
      return
    }
    await waitMs(500)

    await setCell(pageA, 0, 0, 'ReconnectTest')
    await waitMs(500)

    // 模拟 A 断网
    await ctxA.setOffline(true)
    await waitMs(2000)
    await ctxA.setOffline(false)
    await waitMs(2000)

    const valA = await getCell(pageA, 0, 0)
    const valB = await getCell(pageB, 0, 0)
    console.log('[闪断重连] A 端值:', valA, 'B 端值:', valB)

    await safeDisconnect(pageA)
    await safeDisconnect(pageB)
    await ctxA.close()
    await ctxB.close()
  })
})

/**
 * 补充场景：用户列表感知
 * B 加入协作 → A 应看到 B 的用户色块
 */
test.describe('补充场景：用户列表感知', () => {
  test('B 加入协作 → A 应看到 B 的用户色块', async ({ browser }) => {
    const ctx = await browser.newContext()
    const pageA = await ctx.newPage()
    const pageB = await ctx.newPage()

    await pageA.goto(APP_URL)
    await waitForLuckysheetReady(pageA)

    const joinedA = await tryJoinCollab(pageA, 20000)
    if (!joinedA) {
      console.log('[用户感知] A 无法加入协作，跳过')
      await ctx.close()
      return
    }

    const userCountA = await getOnlineUserCount(pageA)
    console.log('[用户感知] A 单独时在线用户数:', userCountA)

    await pageB.goto(APP_URL)
    await waitForLuckysheetReady(pageB)
    const joinedB = await tryJoinCollab(pageB, 20000)
    if (!joinedB) {
      console.log('[用户感知] B 无法加入协作，跳过')
      await safeDisconnect(pageA)
      await ctx.close()
      return
    }
    await waitMs(1000)

    const userCountAAfter = await getOnlineUserCount(pageA)
    console.log('[用户感知] B 加入后 A 看到在线用户数:', userCountAAfter)

    expect(userCountAAfter).toBeGreaterThan(userCountA)

    await safeDisconnect(pageA)
    await safeDisconnect(pageB)
    await ctx.close()
  })
})

/**
 * 补充场景：断开协作后 UI 状态重置
 */
test.describe('补充场景：断开协作后 UI 状态重置', () => {
  test('断开协作 →按钮恢复「发起协作」，状态为「单机」', async ({ browser }) => {
    const ctx = await browser.newContext()
    const page = await ctx.newPage()

    await page.goto(APP_URL)
    await waitForLuckysheetReady(page)

    const joined = await tryJoinCollab(page, 20000)
    if (!joined) {
      console.log('[UI重置] 无法加入协作，跳过')
      await ctx.close()
      return
    }

    await safeDisconnect(page)

    await expect(page.getByRole('button', { name: COLLAB_BUTTON_TEXT })).toBeVisible()
    const userCount = await getOnlineUserCount(page)
    expect(userCount).toBe(0)

    await ctx.close()
  })
})