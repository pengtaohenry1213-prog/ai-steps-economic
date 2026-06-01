(()=>{var e={};e.id=322,e.ids=[322],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},6908:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>n.a,__next_app__:()=>m,originalPathname:()=>x,pages:()=>c,routeModule:()=>p,tree:()=>d}),s(2899),s(1506),s(5866);var r=s(3191),a=s(8716),l=s(7922),n=s.n(l),i=s(5231),o={};for(let e in i)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(o[e]=()=>i[e]);s.d(t,o);let d=["",{children:["ai-doc-analyzer",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,2899)),"/Users/taopeng/workspace/AI_2026/ai-steps-economic/my_app/app/ai-doc-analyzer/page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,1506)),"/Users/taopeng/workspace/AI_2026/ai-steps-economic/my_app/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,5866,23)),"next/dist/client/components/not-found-error"]}],c=["/Users/taopeng/workspace/AI_2026/ai-steps-economic/my_app/app/ai-doc-analyzer/page.tsx"],x="/ai-doc-analyzer/page",m={require:s,loadChunk:()=>Promise.resolve()},p=new r.AppPageRouteModule({definition:{kind:a.x.APP_PAGE,page:"/ai-doc-analyzer/page",pathname:"/ai-doc-analyzer",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},3673:(e,t,s)=>{Promise.resolve().then(s.bind(s,9986))},8827:()=>{},4474:(e,t,s)=>{Promise.resolve().then(s.t.bind(s,2994,23)),Promise.resolve().then(s.t.bind(s,6114,23)),Promise.resolve().then(s.t.bind(s,9727,23)),Promise.resolve().then(s.t.bind(s,9671,23)),Promise.resolve().then(s.t.bind(s,1868,23)),Promise.resolve().then(s.t.bind(s,4759,23))},9986:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>d});var r=s(326),a=s(7577);let l=`你是一名 AI 工程化项目分析师，擅长根据项目需求文档判定项目类型并生成配置结论。

## 你的任务

用户会提供 4 个项目相关的 Markdown 文档：
1. v1_v2_analysis.md —— v1→v2 复用分析
2. v2_init_plan.md —— v2 初始化计划
3. v2_product_roadmap.md —— v2 产品路线图
4. v1_v2_upgrade_requirements.md —— 升级需求

你的最终输出包含两部分：

---

### 输出一：项目类型判定与核心配置结论

基于以下判断标准，从「AI开发模式配置模板」中选择最匹配的项目类型：

**参考项目类型清单（14种）**：
- T1: 从0到1创新型新项目
- T2: 从0到1稳定型新项目
- T3: 成熟型新项目
- T4: 核心系统大升级 ← 已知当前目标项目匹配
- T5: 常规功能迭代
- T6: Bug修复
- T7: 技术债务清理/代码重构
- T8: 原型验证/概念演示
- T9: 线上紧急故障处理
- T10: 内部工具/脚本开发
- T11: 第三方系统集成
- T12: 数据迁移/同步
- T13: 安全加固/合规改造
- T14: 性能优化

**判断逻辑**：
1. 首先识别项目的本质特征（业务确定性、技术确定性、风险等级、影响范围）
2. 然后匹配到最合适的项目类型
3. 给出匹配理由和置信度
4. 如果是T4（核心系统大升级），给出针对该项目3个定制化调整内容

**输出格式**：
## 项目类型判定

### 判定结论
- 项目类型：[T编号] [类型名称]
- 置信度：[高/中/低]
- 匹配理由：[3-5条核心依据]

### 核心特征对比矩阵
[表格：项目特征 vs 类型定义]

### 定制化调整（如适用T4）
1. [调整内容]
2. [调整内容]
3. [调整内容]

---

### 输出二：项目主线与落地配置

基于判定结果，从对应的项目类型模板中提取并适配：

**必须包含以下5个部分**：

## 项目主线
> 一句话核心行动纲领，体现项目最高目标和约束

## 核心配置要点

### 开发模式总原则
- 业务层：[Spec/Vibe 比例]
- 技术层：[分阶段 Spec/Vibe 比例]

### 分阶段 Human Gate 等级
[表格：阶段 | 核心任务 | Human Gate等级 | 审查重点]

### 关键模块配置
[表格：模块 | 开发模式 | Human Gate等级 | 说明]

### 核心风险控制
[3-5条关键风险控制措施]

## AI 角色与阶段/模块映射

[表格：阶段/模块 | 关联AI角色 | 角色规则文件 | 说明]

---

## 输出要求

1. **语言**：全程使用中文输出
2. **风格**：专业、结构化、可直接用于项目执行
3. **深度**：输出主线和大框架，不展开细节
4. **格式**：使用 Markdown 表格和标题层级
5. **约束**：严格基于输入材料提炼，不凭空编造`,n=[{id:"type",title:"项目类型判定",description:"AI 分析输入文档，匹配项目类型",icon:"\uD83D\uDD0D"},{id:"config",title:"主线与配置",description:"输出项目主线与落地配置",icon:"⚙️"}],i=[{id:"v1_v2_analysis",name:"v1_v2_analysis.md",label:"v1→v2 复用分析",placeholder:"粘贴或拖拽上传 v1→v2 复用分析报告内容...",description:"v1 资产复用清单、技术迁移映射"},{id:"v2_init_plan",name:"v2_init_plan.md",label:"v2 初始化计划",placeholder:"粘贴或拖拽上传 v2 初始化计划内容...",description:"项目初始化、技术选型、架构设计"},{id:"v2_product_roadmap",name:"v2_product_roadmap.md",label:"v2 产品路线图",placeholder:"粘贴或拖拽上传 v2 产品路线图内容...",description:"功能规划、优先级、里程碑"},{id:"v2_upgrade_requirements",name:"v2_upgrade_requirements.md",label:"升级需求",placeholder:"粘贴或拖拽上传升级需求文档内容...",description:"升级目标、KPI、约束条件"}],o=e=>({id:e.id,label:e.label,placeholder:e.placeholder,description:e.description,content:"",status:"empty",charCount:0});function d(){let[e,t]=(0,a.useState)(i.map(o)),[s,d]=(0,a.useState)({isStreaming:!1,currentStage:"type",typeResult:"",configResult:"",currentOutput:"",error:null}),[m,p]=(0,a.useState)("type"),[u,h]=(0,a.useState)(null),f=(0,a.useRef)(null),b=(0,a.useCallback)((e,s)=>{t(t=>t.map(t=>t.id===e?{...t,content:s,status:s.trim()?"loaded":"empty",charCount:s.length}:t))},[]),g=(0,a.useCallback)((e,s)=>{if(!s.name.endsWith(".md")&&!s.type.startsWith("text/")){alert("请上传 Markdown 文件（.md）");return}let r=new FileReader;r.onload=t=>{b(e,t.target?.result)},r.onerror=()=>{t(t=>t.map(t=>t.id===e?{...t,status:"error"}:t))},r.readAsText(s)},[b]),j=(0,a.useCallback)((e,t)=>{e.preventDefault(),e.stopPropagation();let s=e.dataTransfer.files[0];s&&g(t,s)},[g]),v=(0,a.useCallback)(e=>{e.preventDefault(),e.stopPropagation()},[]),y=(0,a.useCallback)(e=>{t(t=>t.map(t=>t.id===e?{...t,content:"",status:"empty",charCount:0}:t))},[]),N=e.filter(e=>"loaded"===e.status).length,w=4===N,k=(0,a.useCallback)(async()=>{if(!w){alert("请先上传所有 4 个文档");return}let t=new AbortController;h(t),d({isStreaming:!0,currentStage:"type",typeResult:"",configResult:"",currentOutput:"",error:null}),p("type");let s=e.map(e=>`=== ${e.label} ===
${e.content}`).join("\n\n");try{let e=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"system",content:l},{role:"user",content:s}],stream:!0}),signal:t.signal});if(!e.ok)throw Error(`HTTP ${e.status}: ${e.statusText}`);let r=e.body?.getReader();if(!r)throw Error("无法读取响应流");let a=new TextDecoder,n="",i="",o=!1,c="",x="type";for(;;){let{done:e,value:t}=await r.read();if(e)break;let s=(n+=a.decode(t,{stream:!0})).split("\n");for(let e of(n=s.pop()||"",s)){if(!e.startsWith("data: "))continue;let t=e.slice(6).trim();if("[DONE]"!==t)try{let e=JSON.parse(t),s=e.choices?.[0]?.delta?.content||"";if(!s)continue;i+=s,c+=s,!o&&i.includes("## 项目主线")&&(o=!0,x="config",d(e=>({...e,currentStage:"config",typeResult:c,currentOutput:c})),p("config")),d(e=>({...e,currentOutput:"type"===x?c:i,typeResult:c,configResult:"config"===x?i.slice(i.indexOf("## 项目主线")):""}))}catch{}}}d(e=>({...e,isStreaming:!1,currentStage:"done",typeResult:c,configResult:i.slice(-1!==i.indexOf("## 项目主线")?i.indexOf("## 项目主线"):i.length),currentOutput:i}))}catch(e){"AbortError"===e.name?d(e=>({...e,isStreaming:!1})):d(t=>({...t,isStreaming:!1,error:e.message||"分析失败，请重试"}))}finally{h(null)}},[w,e]),_=(0,a.useCallback)(()=>{u?.abort()},[u]),S=(0,a.useCallback)(()=>{u?.abort(),t(i.map(o)),d({isStreaming:!1,currentStage:"type",typeResult:"",configResult:"",currentOutput:"",error:null}),p("type")},[u]),C=(0,a.useCallback)(e=>{navigator.clipboard.writeText(e)},[]),T=(0,a.useCallback)((e,t)=>{let s=new Blob([e],{type:"text/markdown"}),r=URL.createObjectURL(s),a=document.createElement("a");a.href=r,a.download=t,a.click(),URL.revokeObjectURL(r)},[]);return(0,r.jsxs)("div",{className:"min-h-screen bg-[#f8fafc]",children:[r.jsx("header",{className:"bg-white border-b border-[#e2e8f0] px-6 py-4",children:(0,r.jsxs)("div",{className:"max-w-7xl mx-auto flex items-center justify-between",children:[(0,r.jsxs)("div",{className:"flex items-center gap-3",children:[r.jsx("div",{className:"w-8 h-8 bg-[#3b82f6] rounded-lg flex items-center justify-center",children:r.jsx("span",{className:"text-white text-sm font-bold",children:"AI"})}),(0,r.jsxs)("div",{children:[r.jsx("h1",{className:"text-lg font-semibold text-[#1e293b]",children:"AI 项目文档分析工具"}),r.jsx("p",{className:"text-xs text-[#64748b]",children:"基于输入文档自动判定项目类型并生成配置结论"})]})]}),(0,r.jsxs)("div",{className:"flex items-center gap-2",children:[s.isStreaming&&(0,r.jsxs)("div",{className:"flex items-center gap-2 px-3 py-1.5 bg-[#fef3c7] rounded-lg",children:[r.jsx("div",{className:"w-2 h-2 bg-[#f59e0b] rounded-full animate-pulse"}),r.jsx("span",{className:"text-xs text-[#92400e] font-medium",children:"分析中..."})]}),r.jsx("button",{onClick:S,className:"px-3 py-1.5 text-sm text-[#64748b] hover:text-[#1e293b] hover:bg-[#f1f5f9] rounded-lg transition-colors",children:"重置"})]})]})}),(0,r.jsxs)("main",{className:"max-w-7xl mx-auto p-6",children:[(0,r.jsxs)("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-6",children:[r.jsx("div",{className:"space-y-4",children:(0,r.jsxs)("div",{className:"bg-white rounded-xl shadow-sm border border-[#e2e8f0] p-4",children:[(0,r.jsxs)("div",{className:"flex items-center justify-between mb-4",children:[r.jsx("h2",{className:"text-base font-semibold text-[#1e293b]",children:"输入文档"}),(0,r.jsxs)("span",{className:"text-xs text-[#64748b]",children:["已上传 ",N,"/4 个"]})]}),r.jsx("div",{className:"space-y-3",children:e.map(e=>r.jsx(c,{doc:e,onChange:t=>b(e.id,t),onFileUpload:t=>g(e.id,t),onDrop:t=>j(t,e.id),onDragOver:v,onClear:()=>y(e.id)},e.id))}),(0,r.jsxs)("div",{className:"mt-4 pt-4 border-t border-[#e2e8f0]",children:[r.jsx("button",{onClick:s.isStreaming?_:k,disabled:!w&&!s.isStreaming,className:`
                    w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all
                    ${w?s.isStreaming?"bg-[#ef4444] hover:bg-[#dc2626] text-white":"bg-[#3b82f6] hover:bg-[#2563eb] text-white shadow-sm":"bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed"}
                  `,children:s.isStreaming?(0,r.jsxs)("span",{className:"flex items-center justify-center gap-2",children:[r.jsx("span",{className:"w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"}),"停止分析"]}):"\uD83D\uDE80 开始 AI 分析"}),!w&&r.jsx("p",{className:"text-xs text-[#94a3b8] text-center mt-2",children:"请上传全部 4 个文档后开始分析"})]})]})}),(0,r.jsxs)("div",{className:"bg-white rounded-xl shadow-sm border border-[#e2e8f0] overflow-hidden",children:[r.jsx("div",{className:"flex border-b border-[#e2e8f0]",children:n.map(e=>(0,r.jsxs)("button",{onClick:()=>p(e.id),className:`
                    flex-1 px-4 py-3 text-sm font-medium transition-colors relative
                    ${m===e.id?"text-[#3b82f6]":"text-[#64748b] hover:text-[#1e293b]"}
                  `,children:[r.jsx("span",{className:"mr-1.5",children:e.icon}),e.title,s.isStreaming&&s.currentStage===e.id&&r.jsx("span",{className:"ml-1.5 w-1.5 h-1.5 bg-[#3b82f6] rounded-full animate-pulse inline-block"})]},e.id))}),(0,r.jsxs)("div",{className:"p-4 min-h-[500px] max-h-[calc(100vh-280px)] overflow-y-auto",children:[!s.currentOutput&&!s.error&&(0,r.jsxs)("div",{className:"h-full flex flex-col items-center justify-center text-center py-12",children:[r.jsx("div",{className:"w-16 h-16 bg-[#f1f5f9] rounded-full flex items-center justify-center mb-4",children:r.jsx("svg",{className:"w-8 h-8 text-[#94a3b8]",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:1.5,d:"M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"})})}),r.jsx("p",{className:"text-[#64748b] text-sm font-medium mb-1",children:"等待分析"}),r.jsx("p",{className:"text-[#94a3b8] text-xs",children:"上传文档后点击「开始 AI 分析」"})]}),s.error&&r.jsx("div",{className:"p-4 bg-[#fef2f2] rounded-lg border border-[#fecaca]",children:(0,r.jsxs)("div",{className:"flex items-start gap-2",children:[r.jsx("span",{className:"text-[#ef4444] text-lg",children:"⚠️"}),(0,r.jsxs)("div",{children:[r.jsx("p",{className:"text-sm font-medium text-[#991b1b]",children:"分析失败"}),r.jsx("p",{className:"text-xs text-[#b91c1c] mt-1",children:s.error})]})]})}),s.currentOutput&&(0,r.jsxs)("div",{children:[(0,r.jsxs)("div",{className:"flex items-center gap-2 mb-4",children:[(0,r.jsxs)("button",{onClick:()=>C("type"===m?s.typeResult:s.configResult||s.currentOutput),className:"px-3 py-1.5 text-xs text-[#64748b] hover:text-[#1e293b] hover:bg-[#f1f5f9] rounded-lg transition-colors flex items-center gap-1",children:[r.jsx("svg",{className:"w-3.5 h-3.5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"})}),"复制"]}),(0,r.jsxs)("button",{onClick:()=>T(s.currentOutput,`项目分析结果_${new Date().toISOString().slice(0,10)}.md`),className:"px-3 py-1.5 text-xs text-[#64748b] hover:text-[#1e293b] hover:bg-[#f1f5f9] rounded-lg transition-colors flex items-center gap-1",children:[r.jsx("svg",{className:"w-3.5 h-3.5",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"})}),"下载"]}),s.isStreaming&&(0,r.jsxs)("span",{className:"ml-auto flex items-center gap-1.5 text-xs text-[#3b82f6]",children:[r.jsx("span",{className:"w-1.5 h-1.5 bg-[#3b82f6] rounded-full animate-pulse"}),"生成中..."]})]}),r.jsx("article",{className:"prose prose-sm max-w-none",children:r.jsx(x,{content:"type"===m?s.typeResult:s.configResult||s.currentOutput})}),r.jsx("div",{ref:f})]})]})]})]}),s.isStreaming&&r.jsx("div",{className:"mt-4 bg-white rounded-xl shadow-sm border border-[#e2e8f0] p-4",children:r.jsx("div",{className:"flex items-center gap-4",children:n.map((e,t)=>(0,r.jsxs)("div",{className:"flex items-center gap-2",children:[r.jsx("div",{className:`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                      ${s.currentStage===e.id?"bg-[#3b82f6] text-white ring-4 ring-[#3b82f6]/20":0===t?"bg-[#22c55e] text-white":"bg-[#e2e8f0] text-[#94a3b8]"}
                    `,children:t+1}),r.jsx("span",{className:`text-sm ${s.currentStage===e.id?"text-[#1e293b] font-medium":"text-[#94a3b8]"}`,children:e.title}),t<n.length-1&&r.jsx("div",{className:`w-12 h-px ${s.currentStage===e.id||0===t?"bg-[#3b82f6]":"bg-[#e2e8f0]"}`})]},e.id))})})]})]})}function c({doc:e,onChange:t,onFileUpload:s,onDrop:l,onDragOver:n,onClear:i}){let[o,d]=(0,a.useState)(!1),[c,x]=(0,a.useState)("paste"),m=(0,a.useRef)(null);return(0,r.jsxs)("div",{className:`
        rounded-lg border-2 transition-all
        ${{empty:"border-[#e2e8f0]",loaded:"border-[#22c55e] bg-[#f0fdf4]",error:"border-[#ef4444] bg-[#fef2f2]"}[e.status]}
        ${o?"border-[#3b82f6] bg-[#eff6ff]":""}
      `,onDrop:l,onDragOver:n,onDragEnter:()=>d(!0),onDragLeave:()=>d(!1),children:[(0,r.jsxs)("div",{className:"px-3 py-2 border-b border-[#e2e8f0]/50 flex items-center justify-between",children:[(0,r.jsxs)("div",{className:"flex items-center gap-2",children:[r.jsx("span",{className:`w-2 h-2 rounded-full ${"loaded"===e.status?"bg-[#22c55e]":"bg-[#e2e8f0]"}`}),r.jsx("span",{className:"text-sm font-medium text-[#1e293b]",children:e.label})]}),(0,r.jsxs)("div",{className:"flex items-center gap-2",children:[r.jsx("span",{className:`text-xs px-1.5 py-0.5 rounded ${"loaded"===e.status?"bg-[#22c55e]/10 text-[#16a34a]":"bg-[#f1f5f9] text-[#64748b]"}`,children:e.charCount>0?`${(e.charCount/1e3).toFixed(1)}k 字符`:({empty:"未上传",loaded:"已上传",error:"上传失败"})[e.status]}),(0,r.jsxs)("div",{className:"flex rounded overflow-hidden",children:[r.jsx("button",{onClick:()=>x("paste"),className:`px-2 py-0.5 text-xs ${"paste"===c?"bg-[#3b82f6] text-white":"bg-[#f1f5f9] text-[#64748b]"}`,children:"粘贴"}),r.jsx("button",{onClick:()=>x("upload"),className:`px-2 py-0.5 text-xs ${"upload"===c?"bg-[#3b82f6] text-white":"bg-[#f1f5f9] text-[#64748b]"}`,children:"上传"})]}),"loaded"===e.status&&r.jsx("button",{onClick:i,className:"text-[#94a3b8] hover:text-[#ef4444] transition-colors",children:r.jsx("svg",{className:"w-4 h-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M6 18L18 6M6 6l12 12"})})})]})]}),r.jsx("div",{className:"p-2",children:"paste"===c?r.jsx("textarea",{ref:m,value:e.content,onChange:e=>t(e.target.value),placeholder:e.placeholder,className:"w-full h-24 px-2 py-1.5 text-xs text-[#1e293b] placeholder-[#94a3b8] resize-none focus:outline-none bg-transparent",style:{fontFamily:"ui-monospace, monospace"}}):(0,r.jsxs)("label",{className:`
              flex flex-col items-center justify-center h-24 border-2 border-dashed rounded cursor-pointer
              ${o?"border-[#3b82f6] bg-[#eff6ff]":"border-[#e2e8f0] hover:border-[#cbd5e1]"}
            `,children:[r.jsx("svg",{className:"w-6 h-6 text-[#94a3b8] mb-1",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:1.5,d:"M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"})}),(0,r.jsxs)("span",{className:"text-xs text-[#94a3b8]",children:["拖拽 .md 文件或 ",r.jsx("span",{className:"text-[#3b82f6]",children:"点击上传"})]}),r.jsx("span",{className:"text-xs text-[#94a3b8] mt-0.5",children:e.description}),r.jsx("input",{type:"file",accept:".md,text/markdown,text/plain",className:"hidden",onChange:e=>{let t=e.target.files?.[0];t&&s(t)}})]})})]})}function x({content:e}){let t=e.split("\n"),s=[],a=!1,l=[],n=[],i=0,o=()=>{0!==l.length&&(s.push(r.jsx("div",{className:"overflow-x-auto my-3",children:(0,r.jsxs)("table",{className:"min-w-full text-xs border-collapse",children:[r.jsx("thead",{children:r.jsx("tr",{className:"bg-[#f8fafc]",children:n.map((e,t)=>r.jsx("th",{className:"px-3 py-2 text-left font-medium text-[#64748b] border-b border-[#e2e8f0]",children:d(e)},t))})}),r.jsx("tbody",{children:l.map((e,t)=>r.jsx("tr",{className:"hover:bg-[#f8fafc]/50",children:e.map((e,t)=>r.jsx("td",{className:"px-3 py-2 text-[#1e293b] border-b border-[#e2e8f0]",children:d(e)},t))},t))})]})},`table-${s.length}`)),l=[],n=[],a=!1)},d=e=>e.replace(/\*\*(.+?)\*\*/g,'<strong class="font-semibold">$1</strong>').replace(/`(.+?)`/g,'<code class="px-1 py-0.5 bg-[#f1f5f9] rounded text-[#e11d48] font-mono text-[11px]">$1</code>').replace(/✅/g,'<span class="text-[#22c55e]">✅</span>').replace(/⚠️/g,'<span class="text-[#f59e0b]">⚠️</span>').replace(/❌/g,'<span class="text-[#ef4444]">❌</span>');for(;i<t.length;){let e=t[i];if(e.includes("|")&&e.trim().startsWith("|")){a||(o(),a=!0);let t=e.split("|").filter(e=>e.trim()).map(e=>e.trim());if(t.every(e=>/^[-:]+$/.test(e))){i++;continue}0===n.length&&0===l.length?n=t:l.push(t),i++;continue}if(o(),e.startsWith("#### "))s.push(r.jsx("h4",{className:"text-sm font-semibold text-[#1e293b] mt-4 mb-2",children:e.slice(5)},i));else if(e.startsWith("### "))s.push(r.jsx("h3",{className:"text-sm font-semibold text-[#1e293b] mt-5 mb-2",children:e.slice(4)},i));else if(e.startsWith("## "))s.push(r.jsx("h2",{className:"text-base font-semibold text-[#1e293b] mt-6 mb-3 pb-1.5 border-b border-[#e2e8f0]",children:e.slice(3)},i));else if(e.startsWith("# "))s.push(r.jsx("h1",{className:"text-lg font-semibold text-[#1e293b] mt-6 mb-3",children:e.slice(2)},i));else if(e.match(/^[-*] /))s.push(r.jsx("li",{className:"text-sm text-[#1e293b] ml-4 list-disc list-inside leading-relaxed",children:r.jsx("span",{dangerouslySetInnerHTML:{__html:d(e.replace(/^[-*] /,""))}})},i));else if(e.match(/^\d+\. /))s.push(r.jsx("li",{className:"text-sm text-[#1e293b] ml-4 list-decimal list-inside leading-relaxed",children:r.jsx("span",{dangerouslySetInnerHTML:{__html:d(e.replace(/^\d+\. /,""))}})},i));else if(e.startsWith("```")){let e=[];for(i++;i<t.length&&!t[i].startsWith("```");)e.push(t[i]),i++;s.push(r.jsx("pre",{className:"bg-[#1e293b] text-[#e2e8f0] rounded-lg p-3 my-3 overflow-x-auto text-xs font-mono leading-relaxed",children:r.jsx("code",{children:e.join("\n")})},i))}else e.startsWith("> ")?s.push(r.jsx("blockquote",{className:"border-l-4 border-[#3b82f6] pl-3 py-0.5 my-2 bg-[#eff6ff] rounded-r text-xs text-[#3b82f6]",children:e.slice(2)},i)):e.match(/^---+$/)?s.push(r.jsx("hr",{className:"my-4 border-[#e2e8f0]"},i)):e.trim()?s.push(r.jsx("p",{className:"text-sm text-[#1e293b] leading-relaxed my-1",children:r.jsx("span",{dangerouslySetInnerHTML:{__html:d(e)}})},i)):s.push(r.jsx("div",{className:"h-2"},i));i++}return o(),r.jsx(r.Fragment,{children:s})}},2899:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>r});let r=(0,s(8570).createProxy)(String.raw`/Users/taopeng/workspace/AI_2026/ai-steps-economic/my_app/app/ai-doc-analyzer/page.tsx#default`)},1506:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>l,metadata:()=>a});var r=s(9510);s(7272);let a={title:"AI 项目文档分析工具",description:"基于输入文档自动判定项目类型并生成配置结论"};function l({children:e}){return r.jsx("html",{lang:"zh-CN",children:r.jsx("body",{children:e})})}},7272:()=>{}};var t=require("../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[819],()=>s(6908));module.exports=r})();