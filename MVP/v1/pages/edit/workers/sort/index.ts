import { getAllIds } from '../../utils';
import generateRelation from './relation';

globalThis.addEventListener('message', async (e) => {
  console.time('拓扑排序耗时');

  // console.log('workers/sort', JSON.parse(e.data));
  const { formula, instance } = JSON.parse(e.data);

  try {
    // console.log('Object.keys(formula).length =', Object.keys(formula).length);
    // console.log('Object.keys(formula) =', Object.keys(formula));

    // 执行单元格关系
    const relation = generateRelation(instance, formula);

    // 执行拓扑排序
    const order = await getAllIds(true, instance, relation);

    console.timeEnd('拓扑排序耗时');
    // 将结果返回给主线程
    globalThis.postMessage({
      success: true,
      order,
    });
  } catch (error: any) {
    globalThis.postMessage({
      success: false,
      error: error.message,
    });
  }
});
