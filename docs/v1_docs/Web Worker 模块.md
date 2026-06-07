## 8. Web Worker 模块

### 8.1 排序 Worker

**文件位置**: `views/instance/edit/workers/sort/index.ts`

**职责**: 在独立线程中执行拓扑排序

```typescript
globalThis.addEventListener('message', async (e) => {
  const { formula, instance } = JSON.parse(e.data);
  
  try {
    // 1. 生成依赖关系图
    const relation = generateRelation(instance, formula);
    
    // 2. 执行拓扑排序
    const order = await getAllIds(true, instance, relation);
    
    globalThis.postMessage({ success: true, order });
  } catch (error) {
    globalThis.postMessage({ success: false, error: error.message });
  }
});
```
