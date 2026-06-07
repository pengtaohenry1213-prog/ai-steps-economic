<!-- 根据功能创建抽离 -->
<script setup lang="ts">
import type { ModelTs } from '@vben/types';
import type { FormInstance, FormRules } from 'element-plus';

import { computed, defineComponent, onMounted, ref, watch } from 'vue';

import DatePickerEnhanced from 'datepicker-enhanced';

import { getOrganization } from '#/api/core/invest';
import { findDataDict } from '#/api/index';
import { getIframeParams, useModelStore } from '#/store/index';

interface Props {
  data: ModelTs.FormModel;
  type: 'model' | 'version';
}

const props = withDefaults(defineProps<Props>(), {
  type: 'model',
  data: () =>
    ({
      investmentName: '',
      datePickerType: '',
      versionName: '',
      investmentType: '',
      companyCode: '',
      modelType: '',
      modelCode: '',
      investmentSubject: '',
      projectCode: '',
      // projectStage: '',
      // projectState: '',
      timeType: 'year',
      timePeriod: ['', ''],
      project: '',
      currencyType: '',
      inputType: '',
      operate: 'CREATE',
      projectName: '',
      targetIndustry: '',
      projectInfo: {
        projectStage: '',
        projectState: '',
      },
    }) as unknown as ModelTs.FormModel,
});

const emits = defineEmits<{
  (e: 'timetypechange', payload: any): void;
}>();

const isDev = import.meta.env.DEV;

export interface ExposeTs {
  getData: () => ModelTs.FormModel;
  reset: () => void;
  validate: () => Promise<boolean>;
}

defineComponent({
  name: 'CreateForm', // 确保组件名称正确
});

const modelStore = useModelStore();
const iframeParams = getIframeParams();

const formRef = ref<FormInstance>();
const projectInfo = ref<ModelTs.ProjectInfo>({
  projectStage: '',
  projectState: '',
});

const model = ref<ModelTs.FormModel>({ ...props.data });
const datePickerTypeMap: ModelTs.DatePickerMapType = {
  year: 'yearrange',
  month: 'monthrange',
  quarter: 'quarteryearrange',
};
const datePickerFormatMap = {
  year: 'YYYY',
  month: 'YYYY-M',
  quarter: 'YYYY-M',
};
const rules: FormRules = {
  modelCode: {
    required: true,
    message: '请选择模型类型',
    trigger: 'blur',
  },
  // companyCode: {
  //   required: true,
  //   message: '请选择专业化公司',
  //   trigger: 'blur',
  // },
  versionName: {
    required: true,
    message: '请输入版本名称',
    trigger: 'blur',
  },
  // investmentSubject: {
  //   required: true,
  //   message: '请选择投资主体',
  //   trigger: 'blur',
  // },
  timePeriod: {
    required: true,
    message: '请选择预测时间',
    trigger: 'blur',
  },
  projectCode: {
    required: true,
    message: '请选择项目名称',
    trigger: 'blur',
  },
  currencyType: {
    required: true,
    message: '请选择货币类型',
    trigger: 'blur',
  },
  targetIndustry: {
    required: true,
    message: '请选目标行业',
    trigger: 'blur',
  },
};

const handle = {
  timeTypeChange(val: ModelTs.TimeType) {
    emits('timetypechange', val);
  },
  modelTypeChange(val: string) {
    const cur = modelStore.modelList.find((item) => item.modelCode === val);
    model.value.modelType = cur?.modelType || '';
    model.value.investmentType = cur?.investmentType || '';
    // @ts-expect-error: modelList item may have 'name' but model.value may not have 'modelName' in its type
    model.value.modelName = cur?.name || '';
  },
};

// 监听 props.data 变化
watch(
  () => props.data,
  (newValue) => {
    model.value.datePickerType = datePickerTypeMap[newValue.timeType];
    // model.value = Object.assign(newValue); // 这行代码会用 newValue 的所有属性覆盖 model.value
    // Object.assign(model.value, newValue); // 只更新有变化的字段
    // console.log(newValue, oldValue);
    if (newValue.timePeriod === model.value.timePeriod) {
      Object.assign(model.value, newValue); // 只更新有变化的字段
      console.log(137);
    } else {
      model.value.timePeriod = newValue.timePeriod;
    }
    // if (newValue.operate === 'CREATE' && oldValue?.operate !== 'CREATE') {
    //   Object.assign(model.value, newValue);
    // }
  },
  { deep: true }, // 添加 deep 选项以进行深度监听
);

const searchProjectKeyword = ref('');
const filteredProjectList = computed(() => {
  const { isGroup } = iframeParams;
  const companyCode = isGroup ? model.value.companyCode : iframeParams.companyCode
  let baseList: ModelTs.Project[] = [];

  console.log('isGroup = ', isGroup, ', model.value.companyCode = ', model.value.companyCode);

  if(companyCode){   
    // 先筛选基础列表，确保有 projectCode 和 projectName
    baseList = modelStore.projectList.filter(
      (i) => i.projectCode && i.projectName,
    );
    // 如果不是集团，且有公司代码，则只显示本公司项目
    // if (!isGroup && companyCode) {
      baseList = baseList.filter((i) => i.profCompyCode === companyCode);
    // }
  }

  // 关键字过滤
  if (searchProjectKeyword.value) {
    if (!isGroup && companyCode) {
      const keyword = searchProjectKeyword.value.toLowerCase();
      baseList = baseList.filter(
        (item) =>
          item.projectName.toLowerCase().includes(keyword) &&
          item.profCompyCode === companyCode,
      );
    } else {
      const keyword = searchProjectKeyword.value.toLowerCase();
      baseList = baseList.filter((item) =>
        item.projectName.toLowerCase().includes(keyword),
      );
    }
  }

  console.log('companyCode = ', companyCode, ', baseList = ', baseList);
  return baseList;
});

// 监听 filteredProjectList 变化
watch(
  filteredProjectList,
  (newList) => {
    if (newList && newList.length > 0 && projectInfo.value) {
      projectInfo.value.projectStage = newList[0]?.projectStage || '';
      projectInfo.value.projectState = newList[0]?.projectState || '';

      model.value.projectCode = newList[0]?.projectCode;
      if (model.value.projectInfo) {
        model.value.projectInfo.projectStage = projectInfo.value.projectStage;
        model.value.projectInfo.projectState = projectInfo.value.projectState;
      }
    }
  },
  { immediate: true },
);

// watch(
//   () => model.value.companyCode,
//   () => {
//     model.value.projectCode = '';
//   }
// );

function filterProject(query: string) {
  searchProjectKeyword.value = query;
}

const searchInvestKeyword = ref('');
// 获取 投资主体下拉列表数据
const filteredInvestList = computed(() => {
  const { isGroup, companyCode } = iframeParams;
  // 先筛选基础列表，确保有 investCode 和 investName
  let baseList = modelStore.investList.filter(
    (i) => i.investCode && i.investName,
  );
  if (!isGroup && companyCode) {
    baseList = baseList.filter((i) => i.profCompyCode === companyCode);
  }
  // 再根据关键字过滤
  if (searchInvestKeyword.value) {
    const keyword = searchInvestKeyword.value.toLowerCase();
    baseList =
      !isGroup && companyCode
        ? baseList.filter(
            (item) =>
              item.investName.toLowerCase().includes(keyword) &&
              item.profCompyCode === companyCode,
          )
        : baseList.filter((item) =>
            item.investName.toLowerCase().includes(keyword),
          );
  }

  // 新增：根据当前选中项目的 investCode 过滤
  const selectedProject = filteredProjectList.value.find(
    (p) => p.projectCode === model.value.projectCode,
  );

  if (selectedProject && selectedProject.investCode) {
    baseList = baseList.filter(
      (item) => item.investCode === selectedProject.investCode,
    );
  } else {
    return [];
  }
  // 这里不要再赋值 model.value.investmentSubject
  return baseList;
});

// 新增 watch
watch(filteredInvestList, (newList) => {
  if (newList && newList.length > 0) {
    model.value.investmentSubject = newList[0]?.investCode || '';
  }
});

function filterInvest(query: string) {
  searchInvestKeyword.value = query;
}

const exposeMethods = {
  getData() {
    return model.value;
  },
  async validate() {
    return await formRef.value!.validate();
  },
  reset() {
    formRef.value!.resetFields();
  },
};

defineExpose<ExposeTs>(exposeMethods);

const projectStageDict = ref<{ dictCode: string; dictName: string }[]>([]);
const projectStageLabel = computed(() => {
  // projectStageDict.value =  [{dictCode: 'reserve', dictName: '储备'}, ...]
  const found = projectStageDict.value.find(
    (item) => item.dictCode === projectInfo.value.projectStage,
  );
  return found ? found.dictName : '';
});

const projectStateDict = ref<{ dictCode: string; dictName: string }[]>([]);
const projectStateLabel = computed(() => {
  const found = projectStateDict.value.find(
    (item) => item.dictCode === projectInfo.value.projectState,
  );
  console.log('[create-form.vue] projectStateLabel =', found);
  return found ? found.dictName : '';
});

const fetchProjectStageDict = async () => {
  const res = await findDataDict({ category: 'projectStage' });
  projectStageDict.value = res || [];
};

const fetchProjectStateDict = async () => {
  // const res = await findDataDict({ category: 'ProjectNature' });
  // projectStateDict.value = res || [];
  // 项目状态字典数据
  projectStateDict.value = [
    { dictCode: '01', dictName: '未入库' },
    { dictCode: '02', dictName: '已入库' },
    { dictCode: '03', dictName: '立项待报' },
    { dictCode: '05', dictName: '立项在批' },
    { dictCode: '06', dictName: '立项已批' },
    { dictCode: '07', dictName: '立项驳回' },
    { dictCode: '08', dictName: '审批待报' },
    { dictCode: '10', dictName: '审批在批' },
    { dictCode: '11', dictName: '审批已批' },
    { dictCode: '12', dictName: '审批驳回' },
  ];
};

// 监听 projectInfo.projectStage 变化
watch(
  () => projectInfo.value.projectStage,
  (newVal) => {
    if (
      newVal && // 如果字典还没拉过，可以在这里拉
      projectStageDict.value.length === 0
    ) {
      fetchProjectStageDict();
    }
  },
  { immediate: true },
);

watch(
  () => projectInfo.value.projectState,
  (newVal) => {
    if (
      newVal && // 如果字典还没拉过，可以在这里拉
      projectStateDict.value.length === 0
    ) {
      fetchProjectStateDict();
    }
  },
  { immediate: true },
);

const initOrganization = async () => {
  const { isGroup, token, companyCode } = iframeParams;
  const res = await getOrganization(token);
  if (res) {
    res.forEach((item: any) => {
      // item = {"orgName": "中粮国际有限公司","orgCode": "02","shortName": "中粮国际"}
      if (isGroup) {
        modelStore.organization.push({
          investCode: item.orgCode,
          investName: item.orgName,
        });
      } else {
        if (item.orgCode === companyCode) {
          modelStore.organization.push({
            investCode: item.orgCode,
            investName: item.orgName,
          });
        }
      }
    });

    console.log('[initOrganization] companyCode = ', companyCode);
    model.value.companyCode = String(companyCode);
    console.log(
      '[create-form.vue] modelStore.organization =',
      modelStore.organization,
    );
  }
};

onMounted(() => {
  initOrganization();
  fetchProjectStageDict();
  // 如果不是集团（isGroup为false），则默认选中当前公司并禁用
  if (!iframeParams.isGroup && iframeParams.companyCode) {
    model.value.companyCode = iframeParams.companyCode;
  }
});
</script>

<template>
  <el-form
    ref="formRef"
    :label-width="120"
    :model="model"
    :rules="rules"
    v-loading="modelStore.loading"
  >
    <el-form-item label="模型名称" prop="modelCode">
      <el-select
        v-model="model.modelCode"
        :disabled="type === 'model'"
        placeholder="请选择模型类型"
        @change="handle.modelTypeChange"
      >
        <el-option
          v-for="item in modelStore.modelList"
          :key="item.modelCode"
          :label="item.name"
          :value="item.modelCode"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="模型类型" prop="modelCode">
      <el-input v-model="model.modelType" disabled />
    </el-form-item>
    <el-form-item label="投资类型">
      <el-input v-model="model.investmentType" disabled />
    </el-form-item>
    <el-form-item label="版本名称" prop="versionName">
      <el-input v-model="model.versionName" />
    </el-form-item>

    <el-form-item label="项目周期" prop="timePeriod">
      <el-space>
        <el-select
          v-model="model.timeType"
          style="width: 80px"
          @change="handle.timeTypeChange"
        >
          <el-option label="季度" value="quarter" />
          <el-option label="年度" value="year" />
          <el-option
            v-if="model.modelType !== '速算模型' && isDev"
            label="月度"
            value="month"
          />
        </el-select>
      </el-space>
      <el-space>
        <template v-if="model.timeType === 'quarter'">
          <DatePickerEnhanced
            v-model="model.timePeriod"
            :value-format="datePickerFormatMap[model.timeType]"
            end-placeholder="起始时间"
            range-separator="-"
            start-placeholder="结束时间"
            type="quarteryearrange"
          />
        </template>
        <template v-else>
          <el-date-picker
            v-model="model.timePeriod"
            :format="datePickerFormatMap[model.timeType]"
            :type="model.datePickerType"
            :value-format="datePickerFormatMap[model.timeType]"
            end-placeholder="起始时间"
            range-separator="-"
            start-placeholder="结束时间"
          />
        </template>
      </el-space>
    </el-form-item>
    <el-form-item
      label="专业化公司"
      prop="companyCode"
    >:{{ model.companyCode }}
      <el-select
        v-model="model.companyCode"
        :disabled="!iframeParams || iframeParams.companyCode !== '01'"
        placeholder="请选择专业化公司"
        v-if="modelStore.organization.length > 0"
      >
        <el-option
          v-for="item in modelStore.organization"
          :key="item.investCode"
          :label="item.investName"
          :value="item.investCode"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="项目名称" prop="projectCode">
      <el-select
        v-model="model.projectCode"
        :filter-method="filterProject"
        :remote="false"
        filterable
        placeholder="请选择项目"
      >
        <el-option
          v-for="item in filteredProjectList"
          :key="item.projectCode"
          :label="item.projectName"
          :value="item.projectCode"
        />
      </el-select>
    </el-form-item>
    <el-form-item
      v-if="projectInfo && projectInfo.projectStage"
      label="项目推进阶段"
      prop="projectStage"
    >
      <el-tag type="info">{{ projectStageLabel }}</el-tag>
    </el-form-item>

    <el-form-item
      v-if="projectInfo && projectInfo.projectState"
      label="项目状态"
      prop="projectState"
    >
      <el-tag type="info">{{ projectStateLabel }}</el-tag>
    </el-form-item>

    <el-form-item label="投资主体" prop="investmentSubject">
      <el-select
        v-model="model.investmentSubject"
        :filter-method="filterInvest"
        :remote="false"
        filterable
        placeholder="请选择投资主体"
      >
        <el-option
          v-for="item in filteredInvestList"
          :key="item.investCode"
          :label="item.investName"
          :value="item.investCode"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="货币类型" prop="currencyType">
      <el-select v-model="model.currencyType" placeholder="请选择货币类型">
        <el-option
          v-for="item in modelStore.currencyList"
          :key="item.currencyCode"
          :label="item.currencyName"
          :value="item.currencyCode"
        />
      </el-select>
    </el-form-item>
    <el-form-item
      v-if="model.modelType === '速算模型'"
      label="目标行业"
      prop="targetIndustry"
    >
      <el-select v-model="model.targetIndustry" placeholder="请选择目标行业">
        <el-option
          v-for="item in modelStore.targetIndustryList"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>
  </el-form>
</template>

<style scoped>
.label-name {
  margin-right: 4px; /* 与 tag 保持间距 */
  font-size: 13px; /* 字体大小适中 */
  font-weight: 500; /* 稍微加粗，突出标签 */
  color: #5c75a8;
  letter-spacing: 0.5px; /* 字间距微调 */
  vertical-align: middle; /* 与 tag 垂直居中 */
}
</style>
