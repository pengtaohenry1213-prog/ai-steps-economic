## 6. Store 模块

### 6.1 `useModelStore` - 模型全局状态

**文件位置**: `store/model.ts`

**状态定义**:

```typescript
interface ModelState {
  unitDict: {};           // 单位字典: { unitCode: { unit, scale, options } }
  unitTree: [];           // 单位分类树
  modelType: string;      // 模型类型
  forecastTimeType: string; // 时间段类型
  isInit: boolean;        // 是否已初始化
  currencyList: [];       // 币种列表
  projectList: [];        // 项目列表
  investList: [];         // 投资公司列表
  modelList: [];          // 模型列表
  targetIndustryList: []; // 目标行业列表
}
```

**核心 Action**:

```typescript
async fetchAllList() {
  if (!this.isInit) {
    this.setIsInit(true);
    return Promise.all([
      this.fetchModelList(),
      this.fetchProjectList(),
      this.fetchCurrencyList(),
      this.fetchInvestList(),
      this.fetchUnit(),
    ]);
  }
}

async fetchUnit() {
  const response = await getUnitAndCategorylist();
  // 构建单位字典
  const unitTree = response.data.filter(item => item.unitList?.length > 1);
  const unitDict = {};
  unitTree.forEach(item => {
    item.unitList.forEach(e => {
      unitDict[e.unitCode] = {
        unit: e.unitName,
        scale: e.conversionFactor,
        options: item.unitList.map(opt => ({
          value: opt.unitCode,
          label: opt.unitName,
        })),
      };
    });
  });
}
```

---