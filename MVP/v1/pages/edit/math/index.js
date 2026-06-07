import * as Q10000A0044 from './Q10000A0044-IRR';
import * as Q10000A0045 from './Q10000A0045';
import * as sumIfNpvIrr from './sumIfNpvIrr';
import * as xirr from './xirr';
import * as xnpv from './xnpv';

export default class FunctionCore {
  createSafeContext() {
    const context = {};

    // 只添加需要的数学函数
    const mathFunctions = {
      // 基础数学函数
      // ABS: Math.abs,
      // SQRT: Math.sqrt,
      // POW: Math.pow,
      // EXP: Math.exp,
      // LN: Math.log,
      // LOG10: Math.log10,
      // SIN: Math.sin,
      // COS: Math.cos,
      // TAN: Math.tan,

      // 你的自定义函数
      ...Q10000A0044,
      ...Q10000A0045,
      ...sumIfNpvIrr,
      ...xirr,
      ...xnpv,
    };

    // 添加到上下文
    Object.assign(context, mathFunctions);

    return context;
  }

  executeFunction(str) {
    try {
      // 创建安全的环境
      const context = this.createSafeContext();
      // 使用 Function 构造器，但不使用 with
      // eslint-disable-next-line no-new-func
      const fn = new Function(...Object.keys(context), `return ${str};`);

      return fn(...Object.values(context));
    } catch (error) {
      console.error('Function execution error:', error);
      return '#ERROR';
    }
  }
}
