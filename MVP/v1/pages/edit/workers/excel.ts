import Decimal from 'decimal.js';
import ExcelJS from 'exceljs';

import { checkCodes } from '../constants/special';

globalThis.addEventListener('message', async (e) => {
  console.time('excelWorker');
  // console.log('workers/excel onmessage', e.data);
  const { menuFlat, sheetData, sheetColumn } = JSON.parse(e.data);

  try {
    // 创建工作簿
    const workbook = new ExcelJS.Workbook();

    // 处理单个sheet
    const fun = (pageData: any, columns: any, pageName: string) => {
      // 数据列 fields
      const fields = columns
        .map((col: any) => col.key)
        .filter((key: string) => /^(?:\d{4}|\d{4}-[1-4]|isFixeds)$/.test(key));

      // 创建工作表
      const sheet: any = workbook.addWorksheet(pageName, {
        properties: {
          defaultColWidth: 15, // 默认列宽
          defaultRowHeight: 12, // 默认行高
        },
        views: [
          {
            state: 'frozen',
            xSplit: 9, // 冻结列
            ySplit: 1, // 冻结行
            showGridLines: false, // 隐藏网格线
          },
        ],
      });

      // 配置列
      sheet.columns = columns.map((item: any) => {
        return {
          header: `\u200B${item.header}\u200B`, // 使用零宽度空格包装
          key: item.key,
        };
      });

      // 隐藏列
      ['A', 'B', 'C', 'D', 'E', 'F'].forEach((col) => {
        sheet.getColumn(col).hidden = true;
      });
      // 调整“科目名称”列宽
      sheet.getColumn('G').width = 42;

      // 表头样式
      sheet.getRow(1).eachCell((cell: any, colNumber: number) => {
        cell.numFmt = '@'; // 设置文本格式
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFFF' },
        };
        cell.font = {
          name: '等线',
          size: 10,
          color: { argb: 'FF000000' },
          bold: true,
        };
        const horizontal = colNumber > 8 ? 'right' : 'center';
        cell.alignment = {
          vertical: 'middle',
          horizontal: colNumber === 7 ? 'left' : horizontal,
        };
      });

      // 遍历pageData
      pageData.forEach((item: any) => {
        const { level, metricCategory, isFixed, metricCode } = item;

        // 处理日期列+单一列的值
        fields.forEach((field: string) => {
          // 单一值行只显示单一值，对应数据单元格显示为空
          if (isFixed === 0 && field !== 'isFixeds') {
            item[field] = '';
            return;
          }

          const val = Number(item[field]);
          const scale = Number(item.scale);
          if (val && !Number.isNaN(val)) {
            item[field] = new Decimal(val).div(scale).toNumber();
          }
          if (!item[field]) item[field] = ''; // 使用空字符串占位，防止空单元格错位
        });
        // 添加行
        const row: any = sheet.addRow(item);

        // 基础字体样式
        const baseFont = {
          name: '等线',
          size: 10,
          bold: level < 2 && !checkCodes.has(metricCode), // 0、1级且不是校验的指标，整行加粗
          italic: checkCodes.has(metricCode), // 校验指标，整行斜体
        };

        // 遍历行中所有单元格，包含空单元格
        row.eachCell({ includeEmpty: true }, (cell: any, colNumber: number) => {
          // 对齐方式
          const horizontal = colNumber > 8 ? 'right' : 'center';

          // 非输入值-字色、单元格颜色
          let fillColor = { argb: 'FFFFFFFF' };
          let fontColor = { argb: 'FF000000' };

          // 输入值-字色、单元格颜色
          if (
            (metricCategory === 0 && isFixed === 0 && colNumber === 9) ||
            (metricCategory === 0 && isFixed !== 0 && colNumber > 9)
          ) {
            fillColor = { argb: 'FFFCE4D6' };
            fontColor = { argb: 'FFC00000' };
            // 输入值加边框
            cell.border = {
              top: { style: 'thin' },
              right: { style: 'thin' },
              bottom: { style: 'thin' },
              left: { style: 'thin' },
            };
          }

          // 校验指标-字色
          if (checkCodes.has(metricCode)) fontColor = { argb: 'FF7030A0' };

          // 应用样式
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: fillColor,
          };
          cell.font = {
            ...baseFont,
            color: fontColor,
          };
          cell.alignment = {
            vertical: 'middle',
            horizontal: colNumber === 7 ? 'left' : horizontal,
            indent: colNumber === 7 ? level * 1.8 : 0,
          };

          // 数字千分位+负数显示为红色
          cell.numFmt = colNumber > 8 ? '#,##0.0;[Red]-#,##0.0' : '@';
        });

        // 一级标题上边线
        if (level === 0) {
          row.eachCell({ includeEmpty: true }, (cell: any) => {
            cell.border = {
              top: { style: 'thin' },
            };
          });
        }
      });

      // 设置四周边框
      const startRow = 1; // 起始行
      const startCol = 1; // 起始列
      const isFixedsCol = 9; // 单一值列
      const endRow = sheet.rowCount; // 总行数（包括空行）
      const endCol = sheet.columnCount; // 总列数（包括空列）
      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          const cell = sheet.getCell(row, col);
          const borderStyle = cell.border || {}; // 用于合并原有style
          if (row === startRow) borderStyle.top = { style: 'thin' }; // 上外边框
          if (row === endRow) borderStyle.bottom = { style: 'thin' }; // 下外边框
          if (col === startCol) borderStyle.left = { style: 'thin' }; // 左外边框
          if (col === endCol) borderStyle.right = { style: 'thin' }; // 右外边框
          if (col === isFixedsCol) {
            borderStyle.top = { style: 'thin' };
            borderStyle.bottom = { style: 'thin' };
            borderStyle.left = { style: 'thin' };
            borderStyle.right = { style: 'thin' };
          }
          cell.border = borderStyle;
        }
      }

      // 添加高亮条件格式规则
      sheet.addConditionalFormatting({
        ref: 'A1:ZZ10000', // 将此规则应用到指定区域
        rules: [
          {
            type: 'expression', // 使用公式表达式类型
            formulae: [
              // 关键：设置高亮行列的公式
              '=(CELL("row")=ROW())+(CELL("col")=COLUMN())',
            ],
            style: {
              fill: {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFFF00' }, // 设置高亮颜色，此处为黄色
              },
            },
          },
        ],
      });

      // 处理操作：冻结、锁定、保护（只处理输入表）
      const inputSheetNames = [
        '31-项目参数',
        '32-项目收入',
        '33-项目支出',
        '34-项目资产',
        '速算模型',
      ];
      if (inputSheetNames.includes(pageName)) {
        // 锁定列
        sheet.eachRow((row: any) => {
          row.eachCell((cell: any, colNumber: number) => {
            cell.protection = { locked: colNumber < 9 };
          });
        });

        // 启用工作表保护
        sheet.protect('mypassword', {
          selectLockedCells: false, // 禁止选择被锁定的单元格
          selectUnlockedCells: true, // 允许选择未锁定的单元格
          // 粘贴相关权限
          // insertRows: true, // 允许插入行（粘贴多行数据时需要）
          // insertColumns: true, // 允许插入列
          deleteRows: true, // 允许删除行（覆盖粘贴时可能需要）
          deleteColumns: true, // 允许删除列
          // formatCells: true, // 允许格式化单元格（粘贴格式时需要）
        });
      }
    };

    // 遍历所有sheet
    menuFlat.forEach(({ pageCode, pageName }: any) => {
      // 确保数据不为空
      const pageData = sheetData[pageCode] || [];
      const columns = sheetColumn[pageCode] || [];
      if (pageData.length === 0 && columns.length === 0) return;

      let exportColumns = columns.map((item: any) => {
        return item.children
          ? item.children.map((child: any) => {
              return { header: child.field, key: child.field };
            })
          : { header: item.title, key: item.field };
      });
      exportColumns = exportColumns.flat(); //  扁平化一层

      fun(pageData, exportColumns, pageName);
    });

    // 生成 Excel 文件
    const buffer = await workbook.xlsx.writeBuffer();

    // 将结果返回给主线程
    globalThis.postMessage({
      success: true,
      buffer,
    });
    console.timeEnd('excelWorker');
  } catch (error: any) {
    globalThis.postMessage({
      success: false,
      error: error.message,
    });
  }
});
