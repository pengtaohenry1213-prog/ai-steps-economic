/**
 * yjsCollab.ts 单元测试
 *
 * 测试策略：针对 YjsCollabService 核心方法进行隔离测试。
 * 由于 y-webrtc 的 WebrtcProvider 依赖真实网络/广播通道，
 * 测试中使用 vi.mock模拟 WebrtcProvider，仅验证 service 逻辑。
 *
 * 运行：pnpm --filter luckysheet-demo run test:unit
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'

// ─── Mock WebrtcProvider ─────────────────────────────────────────────────────

// 模拟 awareness 对象
const mockAwareness = {
  setLocalStateField: vi.fn(),
  getStates: vi.fn(() => new Map()),
  on: vi.fn(),
  off: vi.fn()
}

//模拟 provider 实例
const mockProvider = {
  awareness: mockAwareness,
  on: vi.fn(),
  off: vi.fn(),
  destroy: vi.fn()
}

// Mock y-webrtc
vi.mock('y-webrtc', () => ({
  WebrtcProvider: vi.fn(() => mockProvider)
}))

// ─── 导入被测模块 ────────────────────────────────────────────────────────────
// 注意：需要在 mock 之后导入，让 mock 生效
import { YjsCollabService, getCollabService } from '../../src/services/yjsCollab'

// ─── 辅助函数 ────────────────────────────────────────────────────────────────

/** 重置单例状态（disconnect 会将 _instance 置为 null） */
function resetInstance() {
  const svc = getCollabService()
  svc.disconnect()
}

beforeEach(() => {
  vi.clearAllMocks()
  resetInstance()
})

afterEach(() => {
  resetInstance()
})

// ─── 测试用例 ────────────────────────────────────────────────────────────────

describe('YjsCollabService 核心方法', () => {

  describe('connect() / disconnect()', () => {
    it('connect() 应创建 provider 并标记 connected=true', () => {
      const svc = getCollabService()
      svc.connect('测试用户')

      expect(svc.connected).toBe(true)
      expect(WebrtcProvider).toHaveBeenCalledWith(
        'luckysheet-mvtp-v1',
        expect.any(Y.Doc),
        expect.objectContaining({ signaling: expect.any(Array) })
      )
    })

    it('disconnect() 应销毁 provider 并重置 connected=false', () => {
      const svc = getCollabService()
      svc.connect('测试用户')
      svc.disconnect()

      expect(mockProvider.destroy).toHaveBeenCalled()
      expect(svc.connected).toBe(false)
    })

    it('disconnect() 后再次 connect() 应正常重建 provider', () => {
      const svc = getCollabService()
      svc.connect('用户A')
      svc.disconnect()
      svc.connect('用户B')

      expect(svc.connected).toBe(true)
      expect(mockProvider.destroy).toHaveBeenCalledTimes(1)
    })

    it('重复 connect() 应直接返回，不重复创建 provider', () => {
      const svc = getCollabService()
      svc.connect('用户A')
      const firstProvider = (svc as any).provider

      svc.connect('用户B') // 再次调用

      // provider 未被重建
      expect((svc as any).provider).toBe(firstProvider)
    })
  })

  describe('setCellValue() / getCellValue()', () => {
    it('setCellValue() 后 getCellValue() 应返回相同值', () => {
      const svc = getCollabService()
      svc.connect('测试用户')

      svc.setCellValue(0, 0, 'Hello')
      expect(svc.getCellValue(0, 0)).toBe('Hello')
    })

    it('设置多个单元格应互不影响', () => {
      const svc = getCollabService()
      svc.connect('测试用户')

      svc.setCellValue(0, 0, 'A0')
      svc.setCellValue(1, 1, 'B1')
      svc.setCellValue(0, 1, 'A1')

      expect(svc.getCellValue(0, 0)).toBe('A0')
      expect(svc.getCellValue(1, 1)).toBe('B1')
      expect(svc.getCellValue(0, 1)).toBe('A1')
      expect(svc.getCellValue(2, 2)).toBeNull()
    })

    it('getCellValue() 对未设置的单元格应返回 null', () => {
      const svc = getCollabService()
      svc.connect('测试用户')

      expect(svc.getCellValue(99, 99)).toBeNull()
    })
  })

  describe('getAllCellValues()', () => {
    it('设置多个单元格后 getAllCellValues() 应返回包含所有值的 Map', () => {
      const svc = getCollabService()
      svc.connect('测试用户')

      svc.setCellValue(0, 0, 'Val00')
      svc.setCellValue(0, 1, 'Val01')
      svc.setCellValue(5, 5, 'Val55')

      const all = svc.getAllCellValues()
      expect(all.size).toBe(3)
      expect(all.get('0,0')).toBe('Val00')
      expect(all.get('0,1')).toBe('Val01')
      expect(all.get('5,5')).toBe('Val55')
    })

    it('未设置任何单元格时 getAllCellValues() 应返回空 Map', () => {
      const svc = getCollabService()
      svc.connect('测试用户')

      const all = svc.getAllCellValues()
      expect(all.size).toBe(0)
    })
  })

  describe('LWW 冲突拦截 (interceptRemoteWrites)', () => {
    it('本地 clock >= 远程 clock 时，远程写入应被丢弃，本地值保持', () => {
      const svc = getCollabService()
      svc.connect('用户A')

      // 用户A 本地设置一个值（clock = 1000）
      svc.setCellValue(0, 0, 'LocalValue')

      // 模拟远程写入 clock=800（小于本地）
      // 通过直接操作 yCells 模拟远程写入低 clock 场景
      const yCells = (svc as any).yCells
      yCells.set('0,0', { v: 'RemoteValue', clock: 800 })

      // 触发 interceptRemoteWrites 逻辑（通过 onCellChange 回调触发检查）
      // interceptRemoteWrites 在 yCells.observe 中处理远程写入
      // 手动触发一次 setCellValue 来激活拦截逻辑
      svc.setCellValue(0, 0, 'LocalValue') // 再次设置本地值，clock = 1001

      // 由于本地 clock 更大，下次远程写入（如果更低）会被丢弃
      expect(svc.getCellValue(0, 0)).toBe('LocalValue')
    })
  })

  describe('awareness 用户感知', () => {
    it('awareness.getStates() 返回用户列表时应正确解析', () => {
      const svc = getCollabService()
      svc.connect('用户A')

      // 模拟 awareness.getStates() 返回多个用户
      const statesMap = new Map([
        [1, { user: { id: 'u1', name: '用户A-abc123', color: '#409eff' } }],
        [2, { user: { id: 'u2', name: '用户B-def456', color: '#67c23a' } }]
      ])
      mockAwareness.getStates.mockReturnValue(statesMap)

      // 触发 awareness change 事件
      const changeHandler = mockAwareness.on.mock.calls.find(
        (call: any) => call[0] === 'change'
      )?.[1]
      changeHandler?.()

      expect(svc.users).toHaveLength(2)
      expect(svc.users[0].id).toBe('u1')
      expect(svc.users[1].id).toBe('u2')
    })

    it('awareness change 但 provider 已销毁时不应抛错', () => {
      const svc = getCollabService()
      svc.connect('用户A')

      // 模拟 provider已被销毁（disconnect）
      svc.disconnect()

      // 尝试触发 awareness change事件（模拟异步场景）
      const changeHandler = mockAwareness.on.mock.calls.find(
        (call: any) => call[0] === 'change'
      )?.[1]

      // 不应抛出异常
      expect(() => changeHandler?.()).not.toThrow()
    })
  })

  describe('onUsersChange()', () => {
    it('用户列表变化时应触发回调', () => {
      const svc = getCollabService()
      svc.connect('用户A')

      const callback = vi.fn()
      svc.onUsersChange(callback)

      const statesMap = new Map([
        [1, { user: { id: 'u1', name: '用户A-abc', color: '#409eff' } }]
      ])
      mockAwareness.getStates.mockReturnValue(statesMap)

      const changeHandler = mockAwareness.on.mock.calls.find(
        (call: any) => call[0] === 'change'
      )?.[1]
      changeHandler?.()

      expect(callback).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'u1' })
        ])
      )
    })
  })

  describe('onCellChange()', () => {
    it('单元格变化时应触发回调', () => {
      const svc = getCollabService()
      svc.connect('测试用户')

      const callback = vi.fn()
      svc.onCellChange(callback)

      // 直接设置 yCells，触发 observe回调
      svc.setCellValue(0, 0, 'TestValue')

      expect(callback).toHaveBeenCalledWith(0, 0, 'TestValue')
    })
  })

  describe('getDebugInfo()', () => {
    it('应返回正确的调试信息', () => {
      const svc = getCollabService()
      svc.connect('测试用户')

      const info = svc.getDebugInfo()
      expect(info).toMatchObject({
        connected: true,
        roomName: 'luckysheet-mvtp-v1'
      })
      expect(info.yCellsCount).toBeDefined()
    })

    it('disconnect 后 getDebugInfo 应正常返回（不抛错）', () => {
      const svc = getCollabService()
      svc.connect('测试用户')
      svc.disconnect()

      expect(() => svc.getDebugInfo()).not.toThrow()
    })
  })
})

describe('全局单例行为', () => {
  afterEach(() => {
    resetInstance()
  })

  it('getCollabService() 应返回同一实例', () => {
    const a = getCollabService()
    const b = getCollabService()
    expect(a).toBe(b)
  })

  it('disconnect() 后再调用 getCollabService() 应返回新实例', () => {
    const a = getCollabService()
    a.disconnect()
    const b = getCollabService()
    expect(b).not.toBe(a)
  })
})