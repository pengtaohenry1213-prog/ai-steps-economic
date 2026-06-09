<!-- eslint-disable vue/no-v-html -->
<!-- @ts-nocheck -->
<template>
  <div ref="containerRef" class="d3-graph">
    <svg ref="svgRef"></svg>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'

interface FormulaNode {
  id: string
  metricCode: string
  field: string
  formula: string
  formulaName: string
  calcMarks: string[]
  children: Array<{ id: string; field: string }>
  parent: string[]
}

const props = defineProps<{
  nodes: FormulaNode[]
  cycleNodeIds?: string[]
  sortedNodeIds?: string[]
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)

function render() {
  if (!svgRef.value || !containerRef.value || props.nodes.length === 0) return

  const container = containerRef.value
  const width = container.clientWidth || 600
  const height = container.clientHeight || 400

  // 清空旧图
  d3.select(svgRef.value).selectAll('*').remove()

  const svg = d3.select(svgRef.value)
    .attr('width', width)
    .attr('height', height)

  // 构建节点映射
  const nodeMap = new Map<string, FormulaNode>()
  props.nodes.forEach((n) => nodeMap.set(n.id, n))

  // 入度和出度
  const inDegree = new Map<string, number>()
  const outDegree = new Map<string, number>()
  props.nodes.forEach((n) => {
    inDegree.set(n.id, 0)
    outDegree.set(n.id, n.calcMarks.length)
  })
  props.nodes.forEach((n) => {
    n.calcMarks.forEach((dep) => {
      if (inDegree.has(dep)) {
        inDegree.set(dep, (inDegree.get(dep) ?? 0) + 1)
      }
    })
  })

  // 定义箭头
  svg.append('defs').append('marker')
    .attr('id', 'arrowhead')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 20)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#bbb')

  // 构建边列表
  interface Edge { source: string; target: string }
  const edges: Edge[] = []
  props.nodes.forEach((n) => {
    n.calcMarks.forEach((dep) => {
      if (nodeMap.has(dep)) {
        edges.push({ source: dep, target: n.id })
      }
    })
  })

  // 颜色判断
  function nodeColor(id: string): string {
    if (props.cycleNodeIds?.includes(id)) return '#f56c6c' // 循环节点红色
    if (props.sortedNodeIds) return '#67c23a' // 已排序的节点绿色
    const deg = inDegree.get(id) ?? 0
    return deg === 0 ? '#409eff' : '#e6a23c' // 根节点蓝色，依赖节点橙色
  }

  // 构建 D3 力导向图数据
  interface D3Node extends d3.SimulationNodeDatum {
    id: string
    label: string
  }
  const d3Nodes: D3Node[] = props.nodes.map((n) => ({ id: n.id, label: n.id.split('-')[0] }))
  const nodeById = new Map(d3Nodes.map((d) => [d.id, d]))

  const d3Edges = edges
    .map((e) => ({ ...e, source: nodeById.get(e.source)!, target: nodeById.get(e.target)! }))
    .filter((e) => e.source && e.target)

  // 力导向布局
  const simulation = d3.forceSimulation(d3Nodes)
    .force('link', d3.forceLink(d3Edges).id((d: any) => d.id).distance(100))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(40))

  // 绘制边
  const link = svg.append('g')
    .selectAll('line')
    .data(d3Edges)
    .enter()
    .append('line')
    .attr('stroke', '#dcdfe6')
    .attr('stroke-width', 1.5)
    .attr('marker-end', 'url(#arrowhead)')

  // 绘制节点圆
  const nodeGroup = svg.append('g')
    .selectAll('g')
    .data(d3Nodes)
    .enter()
    .append('g')
    .style('cursor', 'pointer')

  nodeGroup.append('circle')
    .attr('r', 22)
    .attr('fill', (d) => nodeColor(d.id))
    .attr('fill-opacity', 0.85)
    .attr('stroke', (d) => props.cycleNodeIds?.includes(d.id) ? '#c45656' : '#fff')
    .attr('stroke-width', (d) => props.cycleNodeIds?.includes(d.id) ? 3 : 1.5)

  // 节点标签（metricCode 前缀）
  nodeGroup.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .attr('font-size', 9)
    .attr('fill', '#fff')
    .attr('pointer-events', 'none')
    .text((d) => {
      const code = d.label
      return code.length > 8 ? code.slice(0, 8) + '..' : code
    })

  // tooltip
  const tip = d3.select(container)
    .selectAll('.graph-tooltip')
    .data([0])
    .join('div')
    .attr('class', 'graph-tooltip')
    .style('position', 'absolute')
    .style('display', 'none')
    .style('background', 'rgba(0,0,0,0.75)')
    .style('color', '#fff')
    .style('padding', '6px 10px')
    .style('border-radius', '4px')
    .style('font-size', '11px')
    .style('pointer-events', 'none')
    .style('max-width', '240px')
    .style('word-break', 'break-all')
    .style('z-index', '100')

  nodeGroup
    .on('mouseover', (event: MouseEvent, d: any) => {
      const node = nodeMap.get(d.id)
      if (!node) return
      tip
        .style('display', 'block')
        .style('left', `${event.offsetX + 12}px`)
        .style('top', `${event.offsetY - 10}px`)
        .html(`<b>${node.id}</b><br/>${node.formulaName}<br/><code style="font-size:10px;color:#aaa">${node.formula}</code>`)
    })
    .on('mousemove', (event: MouseEvent) => {
      tip
        .style('left', `${event.offsetX + 12}px`)
        .style('top', `${event.offsetY - 10}px`)
    })
    .on('mouseout', () => {
      tip.style('display', 'none')
    })

  // 图例
  const legend = svg.append('g')
    .attr('transform', `translate(${width - 130}, 12)`)

  const legendData = [
    { color: '#409eff', label: '根节点(无依赖)' },
    { color: '#e6a23c', label: '依赖节点' },
    { color: '#67c23a', label: '已排序' },
    { color: '#f56c6c', label: '循环节点' }
  ]
  legendData.forEach((item, i) => {
    const g = legend.append('g').attr('transform', `translate(0, ${i * 18})`)
    g.append('circle').attr('r', 5).attr('fill', item.color)
    g.append('text').attr('x', 10).attr('dy', '0.35em').attr('font-size', 10).attr('fill', '#666').text(item.label)
  })

  // 拖拽
  const drag = d3.drag<SVGGElement, D3Node>()
    .on('start', (event, d) => {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    })
    .on('drag', (event, d) => {
      d.fx = event.x
      d.fy = event.y
    })
    .on('end', (event, d) => {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    })

  nodeGroup.call(drag as any)

  // 动画更新
  simulation.on('tick', () => {
    link
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y)

    nodeGroup.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
  })
}

onMounted(async () => {
  await nextTick()
  render()
})

watch(
  () => [props.nodes, props.cycleNodeIds, props.sortedNodeIds],
  async () => {
    await nextTick()
    render()
  },
  { deep: true }
)
</script>

<style scoped>
.d3-graph {
  width: 100%;
  height: 100%;
  min-height: 300px;
  position: relative;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #eee;
}

.d3-graph svg {
  display: block;
}
</style>