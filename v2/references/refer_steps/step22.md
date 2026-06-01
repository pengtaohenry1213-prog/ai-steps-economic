# 🎯 任务目标

改造后端 PDF 解析服务，基于**已集成成功的 pdfjs-dist**，合并「PDF 原生文本提取 + 图片 OCR 识别」逻辑，实现**含图片/扫描件的 PDF 全内容解析**，支撑知识库完整文本提取

## 🧱 项目背景

项目以上传的 PDF 文档作为核心知识库来源，原有解析仅支持提取 PDF 原生可复制文本，**PDF 内图片、扫描件中的文字无法识别**，导致知识库内容缺失；
本次改造基于已稳定集成的 `pdfjs-dist`，集成 OCR 能力识别 PDF 内嵌图片文字，将**原生文本 + 图片识别文本**合并输出，实现 PDF 全内容解析。

## 📋 任务要求

1. 基于 `src/services/file.service.ts` 改造 PDF 解析逻辑，**复用已集成的 pdfjs-dist** 提取原生文本
2. 集成 `tesseract.js` 实现 PDF 内嵌图片的文字 OCR 识别（纯 JS 实现，无系统依赖）
3. 自动提取 PDF 所有页面图片，完成 OCR 后与原生文本合并，返回完整文本
4. 保留原有 `.docx` 文档解析逻辑，不影响原有功能
5. 新增临时文件目录自动创建、解析后自动清理功能，避免文件残留
6. 全量异常捕获：PDF 解析失败、图片提取失败、OCR 识别失败、空内容判断
7. 接口响应格式保持不变：`{ success: boolean, data: { text: string }, error: string }`

## ⚠️ 强约束

1. **`pdfjs-dist` 已全局集成完成，禁止修改/重复配置 Worker、初始化逻辑**
2. 必须严格合并「原生文本 + OCR 图片文本」，不丢失任何内容
3. 图片提取、OCR 识别、临时文件清理必须封装在 Service 层
4. 所有解析逻辑必须兼容 Node.js 环境，无浏览器依赖
5. 解析后的完整文本仅用于接口返回，不做持久化存储
6. TS 类型保持原有定义，无需新增类型文件

## 📤 输出格式

### 依赖安装（仅执行一次）

```bash

pnpm add pdf-image tesseract.js fs-extra -F backend
# -F backend = 仅为 Monorepo 后端应用包安装依赖

```

#### 文件1：src/services/file.service.ts（核心改造文件）

```ts
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { PDFImage } from 'pdf-image';
import { createWorker } from 'tesseract.js';
import fs from 'fs-extra';
import path from 'path';

export const fileUploadService = {
  /**
   * 解析文件文本（PDF：原生文本+图片OCR | Word：原生文本）
   * 基于已集成的pdfjs-dist，合并OCR识别结果
   */
  parseFile: async (file: Express.Multer.File): Promise<string> => {
    try {
      const ext = '.' + file.originalname.split('.').pop()!.toLowerCase();
      let totalText = '';

      switch (ext) {
        case '.pdf':
          // ============== 1. 复用pdfjs-dist提取PDF原生文本 ==============
          const uint8Array = new Uint8Array(file.buffer);
          const pdfDoc = await pdfjsLib.getDocument(uint8Array).promise;
          let nativeText = '';
          for (let i = 1; i <= pdfDoc.numPages; i++) {
            const page = await pdfDoc.getPage(i);
            const content = await page.getTextContent();
            // @ts-ignore 类型适配
            const pageStr = content.items.map(item => item.str).join(' ');
            nativeText += pageStr + '\n';
          }
          totalText += '【原生文本】\n' + nativeText.trim() + '\n\n';

          // ============== 2. 提取PDF图片 + OCR识别文字 ==============
          const tempDir = path.join(process.cwd(), 'temp-pdf-images');
          await fs.ensureDir(tempDir);

          const pdfImage = new PDFImage(file.buffer, {
            convertOptions: { '-density': '300' },
            outputDirectory: tempDir,
          });

          // 提取所有图片
          const imagePaths = await pdfImage.convertFile();
          if (imagePaths.length > 0) {
            const worker = await createWorker('chi_sim+eng');
            let ocrText = '';

            for (const imgPath of imagePaths) {
              const { data: { text } } = await worker.recognize(imgPath);
              ocrText += text + '\n';
              await fs.unlink(imgPath); // 清理单张图片
            }

            await worker.terminate();
            totalText += '【图片OCR文本】\n' + ocrText.trim();
          }

          // 清理临时目录
          await fs.remove(tempDir);
          break;

        case '.docx':
          // 保留原有Word解析逻辑
          const result = await mammoth.extractRawText({ buffer: file.buffer });
          totalText = result.value.trim();
          break;

        default:
          throw new Error('不支持的文件类型');
      }

      if (!totalText.trim()) {
        throw new Error('文件解析失败：未提取到有效文本');
      }

      return totalText.trim();
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }
};
```

#### 文件2：src/routes/file.route.ts（无修改，复用原有文件）

```ts
// 保持原有代码不变，无需修改
```

#### 文件3：src/types/file.types.ts（无修改，复用原有文件）

```ts
// 保持原有代码不变，无需修改
```

## 🚫 禁止行为

1. 禁止修改已集成完成的 `pdfjs-dist` 全局配置
2. 禁止删除原有 PDF 原生文本提取逻辑
3. 禁止省略临时文件/图片清理逻辑，避免服务器文件堆积
4. 禁止将 OCR 逻辑写在路由层，必须封装在 Service 层
5. 禁止使用 `pdf-parse` 解析 PDF，必须复用 `pdfjs-dist`
6. 禁止忽略 OCR 识别后的文本合并逻辑
7. 禁止使用 npm/yarn 安装依赖，必须使用 pnpm
8. 禁止将临时文件创建在前端 Vite 打包目录
9. 禁止在解析逻辑中引入浏览器 / Vite 专属 API
10. 禁止省略临时文件清理逻辑
11. 禁止破坏 Monorepo 包边界
12. 禁止使用 pdf-parse，必须复用 pdfjs-dist

## 🧪 测试要求（参考 TEST Rule）

### 测试类型：接口测试 + 功能测试

### 测试范围

- `pdfjs-dist` 原生文本提取功能
- PDF 图片提取 + OCR 文字识别功能
- 原生文本 + OCR 文本合并结果
- 临时文件自动清理功能
- 异常场景兼容
- 与 Vite 前端无冲突
- 参考测试文件：`cofco-ai-knowledge-base/data/*.pdf`

### 测试用例

| 用例ID | 测试场景 | 预期结果 | 实际结果 | 测试状态 |
|--------|---------|---------|---------|----------|
| TC-FILE-001 | 上传纯原生文本PDF | 成功提取原生文本，无OCR内容 | - | - |
| TC-FILE-002 | 上传纯图片/扫描件PDF | 成功通过OCR识别图片文字 | - | - |
| TC-FILE-003 | 上传图文混排PDF | 合并输出原生文本+OCR图片文本 | - | - |
| TC-FILE-004 | 上传多页PDF（含图片） | 全页面文本+图片内容完整提取 | - | - |
| TC-FILE-005 | 上传合法Word文档 | 正常解析，不受改造影响 | - | - |
| TC-FILE-006 | 解析完成后 | 临时文件自动清理，无残留 | - | - |
| TC-FILE-007 | 上传损坏PDF | 返回解析失败提示 | - | - |
| TC-PDF-008 | Vite 启动前端 | 前端构建无报错、无依赖冲突 | - | - |
| TC-PDF-009 | 启动后端服务 | 服务正常运行，解析无异常 | - | - |

### 问题清单

| 序号 | 问题描述 | 严重级别 | 复现步骤 | 状态 |
|------|---------|---------|---------|------|
| 1 | - | - | - | - |

---

## 项目目录结构

- 参考：`项目结构说明.md`

## 项目 git commit 规范

- 参考：`md/Git提交规范.md`

> 注：auto-commit.sh 自动生成提交信息：
> feat: step22.md - 改造PDF解析服务，合并pdfjs-dist文本提取+图片OCR识别

## ✅ 关键适配说明

1. pdfjs-dist：完全复用已有集成，零修改、零配置侵入
2. 知识库：原生文本 + OCR 文本合并，完美支撑 PDF 知识库全量内容提取
