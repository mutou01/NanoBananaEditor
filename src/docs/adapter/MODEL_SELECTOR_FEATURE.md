# 图生图模型选择器功能文档

> **功能版本**: v1.0  
> **最后更新**: 2026-05-12  
> **相关文件**: `PromptComposer.tsx`, `openAIAdapter.ts`, `factory.ts`, `types.ts`, `useAppStore.ts`

---

## 1. 功能概述

本功能实现了在**图生图（Image-to-Image）**模式下，允许用户在两种 AI 模型之间进行选择：

| 模型 | API 类型 | 端点 | 特点 |
|------|---------|------|------|
| **gpt-image-2** | OpenAI Image API | `/v1/images/edits` | 专用图像编辑 API，支持 mask、reference images |
| **gpt-5.5** | OpenAI Responses API | `/v1/responses` | 通用响应 API，支持文本+图像混合输入 |

### 1.1 用户交互流程

```
用户进入图生图模式
    ↓
点击"Generate from Image"按钮右侧的下拉三角
    ↓
弹出模型选择下拉框
    ↓
选择 gpt-image-2 或 gpt-5.5
    ↓
按钮下方显示当前选中模型徽章
    ↓
点击生成 → 调用对应模型的 API
```

---

## 2. 技术栈

### 2.1 核心技术

| 层级 | 技术 | 用途 |
|------|------|------|
| **前端框架** | React 18 + TypeScript | UI 组件开发 |
| **状态管理** | Zustand | 全局状态（选中模型、生成状态等） |
| **数据获取** | TanStack Query (React Query) | API 请求管理、加载状态 |
| **HTTP 请求** | Fetch API | 调用 OpenAI API |
| **样式** | Tailwind CSS | UI 样式 |
| **图标** | Lucide React | 界面图标 |

### 2.2 适配器模式架构

```
┌─────────────────────────────────────────────────────────────┐
│                     UI Layer (PromptComposer.tsx)            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ModelSelector (按钮组 + 下拉菜单)                    │   │
│  │  - 使用 useAppStore 读写 selectedModel               │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ dispatch
┌──────────────────────────▼──────────────────────────────────┐
│              Hook Layer (useImageGeneration.ts)              │
│  - edit() 接收 model 参数                                   │
│  - 调用 adapter.editImage() 传入 model                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│           Adapter Layer (openAIAdapter.ts)                   │
│  - editImage() 根据 model 路由到不同实现                      │
│  - editImageWithGPTImage2() → 调用 Image API                 │
│  - editImageWithGPT55() → 调用 Responses API               │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              API Layer (OpenAI Endpoints)                   │
│  - gpt-image-2: https://freeapi.dgbmc.top/v1/images/edits  │
│  - gpt-5.5: https://api.ppinfra.com/openai/v1/responses    │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 代码架构详解

### 3.1 状态管理 (useAppStore.ts)

```typescript
interface AppState {
  // 新增：模型选择状态
  selectedModel: 'gpt-image-2' | 'gpt-5.5';
  
  // 新增：设置方法
  setSelectedModel: (model: 'gpt-image-2' | 'gpt-5.5') => void;
}

// 默认值
selectedModel: 'gpt-image-2'
```

### 3.2 类型定义 (types.ts)

```typescript
// 支持的模型类型
export type ImageGenerationModel = 'gpt-image-2' | 'gpt-5.5';

// 模型专用配置
export interface ModelSpecificConfig {
  gptImage2ApiUrl?: string;
  gptImage2ApiKey?: string;
  gpt55ApiUrl?: string;
  gpt55ApiKey?: string;
}

// 扩展请求接口
export interface EditImageRequest {
  instruction: string;
  originalImage: string;
  // ... 其他字段
  model?: ImageGenerationModel; // ← 新增：模型选择
}

// 扩展 ProviderConfig
export interface ProviderConfig {
  // ... 原有字段
  modelConfig?: ModelSpecificConfig; // ← 新增：多模型配置
}
```

### 3.3 适配器实现 (openAIAdapter.ts)

#### 3.3.1 入口方法

```typescript
async editImage(request: EditImageRequest): Promise<EditImageResponse> {
  const targetModel: ImageGenerationModel = request.model || 'gpt-image-2';
  
  if (targetModel === 'gpt-5.5') {
    return this.editImageWithGPT55(request);
  }
  return this.editImageWithGPTImage2(request);
}
```

#### 3.3.2 配置读取辅助方法

```typescript
private getModelApiUrl(model: ImageGenerationModel): string {
  if (model === 'gpt-image-2') {
    return this.config.modelConfig?.gptImage2ApiUrl ||
           this.config.apiUrl.replace('/generations', '/edits');
  }
  if (model === 'gpt-5.5') {
    return this.config.modelConfig?.gpt55ApiUrl || 
           'https://api.ppinfra.com/openai/v1/responses';
  }
  return this.config.apiUrl;
}

private getModelApiKey(model: ImageGenerationModel): string {
  if (model === 'gpt-image-2') {
    return this.config.modelConfig?.gptImage2ApiKey || this.config.apiKey;
  }
  if (model === 'gpt-5.5') {
    return this.config.modelConfig?.gpt55ApiKey || this.config.apiKey;
  }
  return this.config.apiKey;
}
```

#### 3.3.3 gpt-image-2 实现 (Image API)

```typescript
private async editImageWithGPTImage2(request: EditImageRequest): Promise<EditImageResponse> {
  // 1. 使用 FormData 格式
  const formData = new FormData();
  formData.append('model', 'gpt-image-2');
  formData.append('prompt', enhancedInstruction);
  formData.append('image', originalImageBlob, 'image.png');
  
  // 2. 可选参数
  if (request.maskImage) {
    formData.append('mask', maskBlob, 'mask.png');
  }
  if (request.referenceImages) {
    request.referenceImages.forEach((img, index) => {
      formData.append(`reference_image_${index}`, blob, `reference_${index}.png`);
    });
  }
  
  // 3. 从配置获取 URL 和 Key
  const editUrl = this.getModelApiUrl('gpt-image-2');
  const apiKey = this.getModelApiKey('gpt-image-2');
  
  // 4. 发送请求
  const response = await fetch(editUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });
  
  // 5. 解析响应 { data: [{ b64_json: "..." }] }
  const images = data.data?.map(item => item.b64_json) || [];
  return { images, metadata: { model: 'gpt-image-2' } };
}
```

#### 3.3.4 gpt-5.5 实现 (Responses API)

```typescript
private async editImageWithGPT55(request: EditImageRequest): Promise<EditImageResponse> {
  // 1. 构建 Responses API 请求体
  const requestBody = {
    model: 'pa/gpt-5.5',
    input: [
      {
        role: 'user',
        content: [
          { type: 'input_text', text: enhancedInstruction },
          { type: 'input_image', image_url: `data:image/png;base64,${request.originalImage}` },
        ],
      },
    ],
    instructions: 'You are an expert image editor...',
    temperature: request.temperature ?? 0.7,
    max_output_tokens: 4096,
  };
  
  // 2. 添加参考图
  if (request.referenceImages) {
    request.referenceImages.forEach(img => {
      requestBody.input[0].content.push({
        type: 'input_image',
        image_url: `data:image/png;base64,${img}`,
      });
    });
  }
  
  // 3. 添加 mask（作为额外图像）
  if (request.maskImage) {
    requestBody.input[0].content.push({
      type: 'input_image',
      image_url: `data:image/png;base64,${request.maskImage}`,
    });
    // 在 prompt 中说明 mask 用途
  }
  
  // 4. 从配置获取 URL 和 Key
  const apiUrl = this.getModelApiUrl('gpt-5.5');
  const apiKey = this.getModelApiKey('gpt-5.5');
  
  // 5. 发送请求
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });
  
  // 6. 解析响应 { output: [{ content: [{ text: "...base64..." }] }] }
  // 需要从文本中提取 base64 图像数据
  const images = extractBase64FromOutput(data.output);
  return { images, metadata: { model: 'gpt-5.5' } };
}
```

### 3.4 UI 组件 (PromptComposer.tsx)

#### 3.4.1 模型选择器结构

```tsx
{/* 仅在图生图模式显示 */}
{selectedTool === 'generate' && generationMode === 'image' ? (
  <div className="relative" ref={modelDropdownRef}>
    {/* 按钮组：主按钮 + 下拉触发器 */}
    <div className="flex w-full h-14 rounded-lg overflow-hidden">
      
      {/* 主生成按钮 */}
      <Button onClick={handleGenerate} className="flex-1 rounded-r-none">
        <Wand2 className="h-4 w-4 mr-2" />
        Generate from Image
      </Button>
      
      {/* 分隔线 */}
      <div className="w-px bg-black/15 my-2" />
      
      {/* 下拉触发按钮 */}
      <button 
        onClick={() => setShowModelDropdown(!showModelDropdown)}
        className="w-11 bg-yellow-400 hover:bg-yellow-300"
      >
        <ChevronDown className={cn('h-4 w-4', showModelDropdown && 'rotate-180')} />
      </button>
    </div>
    
    {/* 下拉菜单 */}
    {showModelDropdown && (
      <div className="absolute top-full right-0 mt-1.5 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50">
        <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-800">
          选择生图模型
        </div>
        
        {/* gpt-image-2 选项 */}
        <button onClick={() => setSelectedModel('gpt-image-2')}>
          <div className="model-icon gpt-image">GPT</div>
          <span>gpt-image-2</span>
          {selectedModel === 'gpt-image-2' && <Check className="h-4 w-4" />}
        </button>
        
        {/* gpt-5.5 选项 */}
        <button onClick={() => setSelectedModel('gpt-5.5')}>
          <div className="model-icon gpt-55">GPT</div>
          <span>gpt-5.5</span>
          {selectedModel === 'gpt-5.5' && <Check className="h-4 w-4" />}
        </button>
      </div>
    )}
    
    {/* 当前选中模型徽章 */}
    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-400/15 border border-yellow-400/30 rounded-full text-xs text-yellow-400">
      <Box className="h-3 w-3" />
      <span>{selectedModel}</span>
    </div>
  </div>
) : (
  /* 文生图/编辑模式：普通按钮 */
  <Button onClick={handleGenerate}>Generate</Button>
)}
```

#### 3.4.2 点击外部关闭下拉菜单

```typescript
const [showModelDropdown, setShowModelDropdown] = useState(false);
const modelDropdownRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
      setShowModelDropdown(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);
```

---

## 4. 环境变量配置

### 4.1 必需配置

```env
# =============================================================================
# 图生图模型专用配置（推荐）
# =============================================================================

# gpt-image-2: 传统 OpenAI Image API
VITE_GPT_IMAGE_2_API_URL=https://freeapi.dgbmc.top/v1/images/edits
VITE_GPT_IMAGE_2_API_KEY=sk-gz05xF8kN1Cq6LFLUy1UhDlTa0soVALwsAZ0lbUoCSzuoO2p

# gpt-5.5: OpenAI Responses API
VITE_GPT_55_API_URL=https://api.ppinfra.com/openai/v1/responses
VITE_GPT_55_API_KEY=sk_ErwvhZ4Z_0r5v5Btgqj2eCBY0WzPhjVJQ9RFulMza20

# =============================================================================
# 全局回退配置（可选）
# 当专用配置未设置时，使用这些值作为回退
# =============================================================================
VITE_IMAGE_API_URL=https://freeapi.dgbmc.top/v1/images/generations
VITE_IMAGE_API_KEY=
VITE_IMAGE_MODEL=gpt-image-2
```

### 4.2 配置优先级

```
调用 gpt-image-2:
  1. 优先: VITE_GPT_IMAGE_2_API_URL / VITE_GPT_IMAGE_2_API_KEY
  2. 回退: VITE_IMAGE_API_URL.replace('/generations', '/edits')
  3. 默认: 'https://freeapi.dgbmc.top/v1/images/edits'

调用 gpt-5.5:
  1. 优先: VITE_GPT_55_API_URL / VITE_GPT_55_API_KEY
  2. 回退: VITE_IMAGE_API_URL / VITE_IMAGE_API_KEY
  3. 默认: 'https://api.ppinfra.com/openai/v1/responses'
```

---

## 5. API 对比

### 5.1 请求格式对比

| 特性 | gpt-image-2 (Image API) | gpt-5.5 (Responses API) |
|------|------------------------|------------------------|
| **Content-Type** | `multipart/form-data` | `application/json` |
| **图像传输** | Blob 文件上传 | Base64 嵌入 JSON |
| **Mask 支持** | 专用 `mask` 字段 | 作为额外 `input_image` |
| **参考图** | `reference_image_{n}` 字段 | `content` 数组中的 `input_image` |
| **Prompt 位置** | `prompt` 字段 | `input[0].content[0].text` |
| **响应格式** | `{ data: [{ b64_json }] }` | `{ output: [{ content: [{ text }] }] }` |

### 5.2 代码示例对比

**gpt-image-2 (FormData)**:
```typescript
const formData = new FormData();
formData.append('prompt', 'Change background to white');
formData.append('image', imageBlob);
formData.append('mask', maskBlob); // 可选

fetch('/v1/images/edits', {
  method: 'POST',
  headers: { Authorization: `Bearer ${apiKey}` },
  body: formData,
});
```

**gpt-5.5 (JSON)**:
```typescript
const requestBody = {
  model: 'pa/gpt-5.5',
  input: [{
    role: 'user',
    content: [
      { type: 'input_text', text: 'Change background to white' },
      { type: 'input_image', image_url: 'data:image/png;base64,xxx' },
      { type: 'input_image', image_url: 'data:image/png;base64,yyy' }, // mask
    ],
  }],
};

fetch('/v1/responses', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify(requestBody),
});
```

---

## 6. 错误处理

### 6.1 适配器层错误

```typescript
try {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new AdapterError(
      `API request failed: ${response.status} ${response.statusText}`,
      this.provider,
      `HTTP_${response.status}`
    );
  }
} catch (error) {
  if (error instanceof AdapterError) throw error;
  throw new AdapterError(
    `Network error: ${error.message}`,
    this.provider,
    'NETWORK_ERROR',
    error
  );
}
```

### 6.2 Hook 层错误处理

```typescript
const editMutation = useMutation({
  mutationFn: async ({ instruction, model }) => { ... },
  onError: (error) => {
    console.error('Edit failed:', error);
    setIsGenerating(false);
    // 可在此添加 toast 通知
  },
});
```

---

## 7. 扩展指南

### 7.1 添加新模型

假设要添加 `gpt-6` 模型：

**1. 更新类型 (types.ts)**:
```typescript
export type ImageGenerationModel = 'gpt-image-2' | 'gpt-5.5' | 'gpt-6';

export interface ModelSpecificConfig {
  // ... 现有配置
  gpt6ApiUrl?: string;
  gpt6ApiKey?: string;
}
```

**2. 更新环境变量 (.env.example)**:
```env
VITE_GPT_6_API_URL=https://api.example.com/v1/responses
VITE_GPT_6_API_KEY=sk_xxx
```

**3. 更新适配器 (openAIAdapter.ts)**:
```typescript
async editImage(request: EditImageRequest): Promise<EditImageResponse> {
  if (targetModel === 'gpt-6') {
    return this.editImageWithGPT6(request);
  }
  // ... 现有路由
}

private async editImageWithGPT6(request: EditImageRequest): Promise<EditImageResponse> {
  // 实现 gpt-6 调用逻辑
}

private getModelApiUrl(model: ImageGenerationModel): string {
  if (model === 'gpt-6') {
    return this.config.modelConfig?.gpt6ApiUrl || 'https://api.example.com/v1/responses';
  }
  // ... 现有逻辑
}
```

**4. 更新 UI (PromptComposer.tsx)**:
```tsx
{/* 在 dropdown 中添加新选项 */}
<button onClick={() => setSelectedModel('gpt-6')}>
  <div className="model-icon gpt-6">GPT</div>
  <span>gpt-6</span>
  {selectedModel === 'gpt-6' && <Check className="h-4 w-4" />}
</button>
```

**5. 更新工厂 (factory.ts)**:
```typescript
modelConfig: {
  // ... 现有配置
  gpt6ApiUrl: env.VITE_GPT_6_API_URL,
  gpt6ApiKey: env.VITE_GPT_6_API_KEY,
}
```

---

## 8. 调试技巧

### 8.1 查看当前配置

```typescript
// 在浏览器控制台运行
const adapter = getImageAdapter();
console.log('Provider:', adapter.provider);
console.log('Model:', adapter.model);
console.log('Config:', adapter.config);
```

### 8.2 检查环境变量

```typescript
// 验证 Vite 环境变量
console.log('GPT_IMAGE_2_KEY:', import.meta.env.VITE_GPT_IMAGE_2_API_KEY);
console.log('GPT_55_KEY:', import.meta.env.VITE_GPT_55_API_KEY);
```

### 8.3 网络请求监控

在 DevTools Network 面板中过滤：
- `edits` - 查看 gpt-image-2 请求
- `responses` - 查看 gpt-5.5 请求

---

## 9. 已知限制

| 限制 | 说明 |
|------|------|
| **模型切换后需重新生成** | 切换模型不会自动重新生成，需要手动点击按钮 |
| **gpt-5.5 mask 作为参考图** | Responses API 没有专用 mask 字段，mask 作为普通图像传入 |
| **响应格式差异** | 两种模型的响应格式不同，需要分别解析 |
| **环境变量热更新** | Vite 环境变量修改后需要重启开发服务器 |

---

## 10. 相关文档链接

- [OpenAI&Gemini_API_Interface_Doc.md](./OpenAI&Gemini_API_Interface_Doc.md) - API 接口详细说明
- [AGENTS.md](../../../../AGENTS.md) - 项目整体架构指南
- [OpenAI Image API Docs](https://platform.openai.com/docs/api-reference/images/createEdit)
- [OpenAI Responses API Docs](https://platform.openai.com/docs/api-reference/responses)

---

## 11. 变更历史

| 日期 | 版本 | 变更内容 |
|------|------|---------|
| 2026-05-11 | v1.0 | 初始实现：支持 gpt-image-2 和 gpt-5.5 模型选择 |

---

**文档结束**
