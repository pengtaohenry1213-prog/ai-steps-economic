/**
 * Yjs 协作服务
 * 支持同设备多标签页协作（通过 BroadcastChannel 发现 peer)
 * 支持局域网 WebRTC 直连（通过 y-webrtc）
 */

import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'

export interface CollabUser {
  id: string
  name: string
  color: string
}

const ROOM_NAME = 'luckysheet-mvtp-v1'

// Signaling server 地址：运行时使用当前访问的 hostname（支持跨设备协作）
// Device A 访问 localhost:3008 → ws://localhost:4444
// Device B 访问 192.168.1.69:3008 → ws://192.168.1.69:4444
// 固定端口 4444
const SIGNALING_PORT = '4444'
function getSignalingUrl(): string {
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
  return `ws://${host}:${SIGNALING_PORT}`
}

export class YjsCollabService {
  private doc: Y.Doc
  private provider: WebrtcProvider | null = null

  public connected = false
  public users: CollabUser[] = []

  // Y.Doc 共享 Map（单元格值）
  public yCells: Y.Map<any>
  // Y.Doc 共享 Map（公式）
  public yFormulas: Y.Map<any>

  constructor() {
    this.doc = new Y.Doc()
    this.yCells = this.doc.getMap('cells')
    this.yFormulas = this.doc.getMap('formulas')
  }

  /** 连接协作房间（同设备标签页 + 局域网 WebRTC） */
  connect(userName = '用户') {
    if (this.provider) return

    // 生成用户信息
    const userId = Math.random().toString(36).slice(2, 8)
    const colors = ['#409eff', '#67c23a', '#f56c6c', '#e6a23c', '#c71585', '#ff8c00']
    const color = colors[Math.floor(Math.random() * colors.length)]

    console.log('[Yjs] connect(), doc id:', this.doc.clientID, 'room:', ROOM_NAME)

    const signalingUrl = getSignalingUrl()
    console.log('[Yjs] signaling URL:', signalingUrl)

    // y-webrtc 通过 BroadcastChannel 发现同设备标签页
    // 通过 signaling 服务器（Docker 部署）发现跨设备 peer
    // signaling URL 运行时动态获取（根据当前访问的 hostname）
    this.provider = new WebrtcProvider(ROOM_NAME, this.doc, {
      signaling: [signalingUrl],
      maxConns: 10
    })

    // 监听同步状态（知道何时收到远程状态）
    this.provider.on('synced', () => {
      console.log('[Yjs] provider synced, yCells size:', this.yCells.size)
    })

    // 监听连接状态
    this.provider.on('status', (event: { connected: boolean }) => {
      console.log('[Yjs] status event:', event.connected)
      this.connected = event.connected
    })

    // 监听用户列表变化
    this.provider.awareness.on('change', () => {
      if (!this.provider) return
      const users: CollabUser[] = []
      this.provider.awareness.getStates().forEach((state: any) => {
        if (state.user) users.push(state.user)
      })
      console.log('[Yjs] users changed:', users.length, 'yCells size:', this.yCells.size)
      this.users = users
    })

    // 即使 WebRTC 未连接成功，也标记为已连接（BC 同步仍然有效）
    this.connected = true

    // 不再拦截远程写入，让 Yjs CRDT 原生 merge 处理冲突
    // interceptRemoteWrites 会在 observer 链中触发 feedback loop
  }

  /** 断开连接（完全清理，释放 Y.Doc） */
  disconnect() {
    if (this.provider) {
      this.provider.destroy()
      this.provider = null
    }
    this.doc.destroy()
    this.doc = new Y.Doc()
    this.yCells = this.doc.getMap('cells')
    this.yFormulas = this.doc.getMap('formulas')
    this.connected = false
    this.users = []
    // 重置单例，下次 getCollabService() 创建全新实例
    _instance = null
  }

  /** 更新单元格值（isRemote=true 表示来自远程 CRDT 更新，跳过本地拦截） */
  setCellValue(row: number, col: number, value: any, isRemote = false) {
    const key = `${row},${col}`
    const clock = Date.now() // 用时间戳作 Lamport clock
    if (!isRemote) {
      this.localClocks.set(key, clock)
      this.localValues.set(key, value)
    }
    this.yCells.set(key, { v: value, clock, isRemote })
  }

  /** 获取单元格值 */
  getCellValue(row: number, col: number): any {
    const key = `${row},${col}`
    return this.yCells.get(key)?.v ?? null
  }

  /** 获取所有单元格值（Map 结构） */
  getAllCellValues(): Map<string, any> {
    const result = new Map<string, any>()
    this.yCells.forEach((val, key) => {
      result.set(key, val?.v ?? null)
    })
    return result
  }

  /** 强制全量同步所有 yCells 到目标（用于 B 加入时同步初始状态） */
  syncAllCells(callback: (row: number, col: number, value: any) => void) {
    console.log('[Yjs] syncAllCells, yCells size:', this.yCells.size)
    this.yCells.forEach((val, key) => {
      const [row, col] = key.split(',').map(Number)
      callback(row, col, val?.v ?? null)
    })
  }

  /** 监听单元格变化 */
  onCellChange(callback: (row: number, col: number, value: any) => void) {
    this.yCells.observe((event) => {
      console.log('[Yjs] yCells.observe fired, keys:', Array.from(event.keysChanged))
      event.keysChanged.forEach((key: string) => {
        const [row, col] = key.split(',').map(Number)
        callback(row, col, this.yCells.get(key)?.v)
      })
    })
  }

  /** 拦截远程写入：丢弃版本低于本地记录的值（CRDT LWW） */
  interceptRemoteWrites() {
    const self = this
    this.yCells.observe((event) => {
      event.keysChanged.forEach((key: string) => {
        const entry = self.yCells.get(key)
        if (!entry) return

        // 如果 entry 带有 isRemote:true 标志，说明是本地调用 setCellValue 写入的
        // 不是真正的远程更新，直接放行，不拦截
        if ((entry as any).isRemote === true) {
          self.yCells.set(key, { v: entry.v, clock: entry.clock })
          return
        }

        const localClock = self.localClocks.get(key)
        const localValue = self.localValues.get(key)

        // 本地没有记录 → 直接接受远程值（首次同步场景）
        if (localClock === undefined) {
          console.log('[Yjs] first sync: accepting remote value for', key, 'value:', entry.v)
          self.localClocks.set(key, entry.clock ?? Date.now())
          self.localValues.set(key, entry.v)
          return
        }

        // 本地有记录 → 比较 clock，LWW
        if (entry.clock !== undefined && entry.clock <= localClock) {
          console.log('[Yjs] LWW: dropping remote write, key:', key, 'remote clock:', entry.clock, 'local clock:', localClock)
          self.yCells.set(key, { v: localValue ?? entry.v, clock: localClock })
        } else {
          // 远程值更新了本地，更新本地记录
          console.log('[Yjs] LWW: accepting newer remote value for', key, 'clock:', entry.clock)
          self.localClocks.set(key, entry.clock)
          self.localValues.set(key, entry.v)
        }
      })
    })
  }

  private localClocks = new Map<string, number>()
  private localValues = new Map<string, any>()

  /** 监听 Yjs 同步完成事件（远程状态已收到） */
  onSynced(callback: () => void) {
    if (!this.provider) return
    this.provider.on('synced', () => {
      console.log('[Yjs] onSynced fired, yCells size:', this.yCells.size)
      callback()
    })
  }

  /** 监听用户列表变化 */
  onUsersChange(callback: (users: CollabUser[]) => void) {
    if (!this.provider) return

    // 立即查询一次当前 awareness 状态（避免漏掉已有用户）
    const syncUsers = () => {
      if (!this.provider) return
      const users: CollabUser[] = []
      this.provider.awareness.getStates().forEach((state: any) => {
        if (state.user) users.push(state.user)
      })
      console.log('[Yjs] onUsersChange sync, users:', users.length)
      callback(users)
    }

    this.provider.awareness.on('change', syncUsers)
    syncUsers() // 注册时立即调用一次
  }

  /** 调试：获取连接信息 */
  getDebugInfo() {
    return {
      connected: this.connected,
      peerCount: this.provider ? Array.from(this.provider.awareness.getStates().keys()).length : 0,
      yCellsCount: this.yCells.size,
      roomName: ROOM_NAME
    }
  }
}

// 全局单例
let _instance: YjsCollabService | null = null

export function getCollabService(): YjsCollabService {
  if (!_instance) _instance = new YjsCollabService()
  return _instance
}
