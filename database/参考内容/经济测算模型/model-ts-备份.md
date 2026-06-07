import type { ModelTs } from '@vben/types';

import { defineStore } from 'pinia';

import {
  getCurrencyList,
  getInvestList,
  getModelList,
  getProjectList,
  getScriptFormula,
} from '#/api/index';

// 定义模型状态接口
interface ModelState {
  isInit: boolean; // 是否已初始化
  loading: boolean; // 加载状态
  currencyList: ModelTs.CurrencyList; // 币种列表
  projectList: ModelTs.ProjectList; // 项目列表
  investList: ModelTs.InvestList; // 投资公司列表
  formula: string; // 脚本公式
  modelList: ModelTs.ModelList; // 模型列表
  targetIndustryList: any; // 目标行业列表
  [props: string]: any; // 其他属性
}

// 创建模型状态管理store
export const useModelStore = defineStore('model', {
  // 定义初始状态
  state: (): ModelState => ({
    isInit: false,
    loading: false,
    currencyList: [], // 币种列表
    projectList: [], // 项目列表
    investList: [], // 投资公司列表
    targetIndustryList: [
      {
        label: '农粮',
        value: '农粮',
      },
      {
        label: '食品',
        value: '食品',
      },
      {
        label: '地产',
        value: '地产',
      },
      {
        label: '金融',
        value: '金融',
      },
    ], // 预定义的目标行业列表
    formula: '', // 脚本公式
    modelList: [], // 模型列表
    sheetColumn: {}, // 保存表格列数据
  }),
  actions: {
    // 设置初始化状态
    setIsInit(payload: boolean) {
      this.isInit = payload;
    },
    // 设置加载状态
    setLoading(payload: boolean) {
      this.loading = payload;
    },
    // 设置币种列表
    setCurrencyList(payload: ModelTs.CurrencyList) {
      this.currencyList = payload;
    },
    // 设置项目列表
    setProjectList(payload: ModelTs.ProjectList) {
      this.projectList = payload;
    },
    // 设置投资公司列表
    setInvestList(payload: ModelTs.InvestList) {
      this.investList = payload;
    },
    // 设置脚本公式
    setFormula(payload: string) {
      this.formula = payload;
    },
    // 设置模型列表
    setModelList(payload: ModelTs.ModelList) {
      this.modelList = payload;
    },
    // 设置表格列数据
    setSheetColumn(payload: any) {
      const { key, value } = payload;
      this.sheetColumn[key] = value;
    },
    // 重置变更数据
    resetChange() {
      this.change = {};
      this.setChangeStatus(false);
      this.setCloneDataMap();
    },
    // 重置所有数据
    reset() {
      this.data = [];
      this.dataMap = {};
      this.sheet = {};
      this.sheetColumn = {};
      this.change = {};
      this.changeStatus = false;
      this._data = [];
      this._dataMap = {};
    },
    // 获取项目列表
    async fetchProjectList() {
      try {
        const response = await getProjectList();
        // 过滤无效数据
        const data = response.filter((item: any) => {
          if (!item) return false;
          return !!item.projectCode;
        });
        this.setProjectList(data);
      } catch (error) {
        console.error('Failed to fetch project list:', error);
      }
    },
    // 获取币种列表
    async fetchCurrencyList() {
      try {
        const response = await getCurrencyList();
        this.setCurrencyList(response);
      } catch (error) {
        console.error('Failed to fetch currency list:', error);
      }
    },
    // 获取投资公司列表
    async fetchInvestList() {
      try {
        const response = await getInvestList();
        // 过滤无效数据
        const data = response.filter((item: any) => {
          return item !== null;
        });
        this.setInvestList(data);
      } catch (error) {
        console.error('Failed to fetch invest list:', error);
      }
    },
    // 获取脚本公式
    async fetchFormula() {
      try {
        const response = await getScriptFormula();
        this.setFormula(response);
      } catch (error) {
        console.error('Failed to fetch 公式:', error);
      }
    },
    // 获取模型列表
    async fetchModelList() {
      try {
        const response = await getModelList({
          pageSize: 999_999_999, // 设置一个很大的pageSize以获取所有数据
          pageNo: 1,
        });

        // 过滤无效数据
        const data =
          response.records && response.records.length > 0
            ? response.records.filter((item: any) => {
                return item !== null;
              })
            : [];

        this.setModelList(data);
      } catch (error) {
        console.error('Failed to fetch model list:', error);
      }
    },
    // 获取所有列表数据
    async fetchAllList() {
      if (!this.isInit) {
        this.setLoading(true);

        // 按顺序获取所有必要的数据
        await this.fetchModelList(); // 获取模型列表
        await this.fetchProjectList(); // 获取项目列表
        await this.fetchCurrencyList(); // 获取币种列表
        await this.fetchInvestList(); // 获取投资公司列表
        await this.fetchFormula(); // 获取脚本公式

        this.setLoading(false);
        this.setIsInit(true);
      }
    },
  },
});
