C10000A0007 value

### FormulaTestPanel.vue 使用指南

根据您提供的截图，我可以看到您已经实现了公式计算测试工具的界面。下面是如何使用 FormulaTestPanel.vue 组件的详细指南：

## 集成到项目中

首先，确保将 FormulaTestPanel.vue 组件正确集成到您的项目中：

```vue file="src/views/FormulaTest.vue"
...
```

然后在路由配置中添加这个页面：

```javascript file="src/router/index.js"
...
```

## 使用方法

### 1. 测试单个公式

1. 在"指标代码"输入框中输入要测试的指标代码（例如：`C10000A0320100003`）
2. 在"字段"输入框中输入要测试的字段（例如：`2027`或`value`）
3. 点击"测试单个公式"按钮
4. 系统将显示测试结果，包括：

1. 原始公式
2. 计算后的公式
3. 期望值（计算结果）
4. 实际值（存储的值）
5. 测试是否通过
6. 相关指标列表





### 2. 批量测试

1. 点击"运行批量测试"按钮
2. 系统将执行预设的测试用例（在代码中定义的测试用例）
3. 测试结果将以表格形式显示
4. 点击"查看详情"可以查看每个测试用例的详细信息


### 3. 自定义测试用例

要添加或修改批量测试的测试用例，需要修改 FormulaTestPanel.vue 中的 `runTests` 函数：

```javascript
const runTests = () => {
  testing.value = true;
  try {
    // 修改这里的测试用例
    const testCases = [
      { metricCode: 'C10000A0320100003', field: '2027' },
      { metricCode: 'C10000A0387', field: 'value' },
      // 添加更多测试用例...
      { metricCode: '您的指标代码', field: '您的字段' }
    ];
    
    batchResults.value = batchTestFormulas(testCases);
  } catch (error) {
    console.error('批量测试出错:', error);
  } finally {
    testing.value = false;
  }
};
```

## 高级功能

### 1. 导出测试结果

您可以添加导出功能，将测试结果导出为 Excel 或 JSON 格式：

```vue
<template>
  <!-- 在批量测试结果表格下方添加 -->
  <div class="export-buttons" v-if="batchResults.length > 0">
    <el-button type="success" @click="exportToExcel">导出为Excel</el-button>
    <el-button type="info" @click="exportToJson">导出为JSON</el-button>
  </div>
</template>

<script setup>
// 添加导出函数
import * as XLSX from 'xlsx';

const exportToExcel = () => {
  const worksheet = XLSX.utils.json_to_sheet(batchResults.value);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "公式测试结果");
  XLSX.writeFile(workbook, "公式测试结果.xlsx");
};

const exportToJson = () => {
  const jsonStr = JSON.stringify(batchResults.value, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '公式测试结果.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
</script>
```

### 2. 从文件加载测试用例

您可以添加从文件加载测试用例的功能：

```vue
<template>
  <!-- 在批量测试部分添加 -->
  <div class="import-section">
    <el-upload
      action=""
      :auto-upload="false"
      :on-change="handleFileChange"
      :show-file-list="false"
    >
      <el-button type="primary">从文件加载测试用例</el-button>
    </el-upload>
  </div>
</template>

<script setup>
// 添加文件处理函数
const handleFileChange = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const testCases = JSON.parse(e.target.result);
      if (Array.isArray(testCases)) {
        // 运行加载的测试用例
        batchResults.value = batchTestFormulas(testCases);
      } else {
        ElMessage.error('文件格式不正确，请提供有效的JSON数组');
      }
    } catch (error) {
      ElMessage.error('解析文件失败: ' + error.message);
    }
  };
  reader.readAsText(file.raw);
};
</script>
```

## 常见问题解决

### 1. 测试失败但计算结果正确

如果测试显示失败，但计算结果看起来是正确的，可能是因为浮点数精度问题。您可以调整 `compareValues` 函数中的容差值：

```javascript
// 在 test-calculator.ts 中
export function compareValues(expected: any, actual: any, tolerance: number = 0.001) {
  // 增加容差值，从0.0001改为0.001
  // ...其余代码不变
}
```

### 2. 找不到公式或指标数据

确保您的测试环境正确加载了公式和指标数据。检查 `setupTestEnvironment` 函数是否正确模拟了 `window.all` 和 `window.formula` 全局对象。

### 3. 自定义测试数据

您可以在 `mock/formula-data.ts` 和 `mock/metric-data.ts` 中添加或修改测试数据，以匹配您的实际业务场景。

## 进一步改进

1. **添加测试历史记录**：保存历史测试结果，方便比较和追踪
2. **添加公式可视化**：使用图表展示公式计算过程和依赖关系
3. **添加性能测试**：测量公式计算的性能和效率
4. **添加错误分析**：提供更详细的错误分析和建议


通过这些方法，您可以充分利用 FormulaTestPanel.vue 组件进行公式计算测试，确保您的业务逻辑计算正确无误。
