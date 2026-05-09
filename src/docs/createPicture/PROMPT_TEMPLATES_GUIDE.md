# E-commerce Image Generation Prompt Templates Guide

## 概述

本项目为跨境电商场景提供了专业的 AI 图像生成提示词模板系统，支持**文生图**和**图生图**两种模式，确保生成的图片质量符合商业电商标准。

## 生成模式

### 文生图 (Text-to-Image)
通过文本描述生成全新图像，适用于：
- 新产品创意展示
- 概念设计可视化
- 快速草图生成

### 图生图 (Image-to-Image)
基于已有图片进行修改和再生成，适用于：
- 现有产品图优化
- 背景替换/场景转换
- 风格迁移和美化
- 多角度变体生成

## 素材类型模板

### 1. 白底图 (White Background)
**用途**: 商品主图，用于平台展示和详情页首图
**特点**:
- 纯白色背景 RGB(255, 255, 255)
- 左前方 45° 柔和自然光
- 4K 超高清画质
- 商品全貌清晰展示

**文生图示例**:
```typescript
const request: GenerateImageRequest = {
  prompt: "premium wireless bluetooth headphones, matte black finish",
  enhance: {
    enabled: true,
    template: 'white',
    quality: 'hd'
  }
};
```

**图生图示例**:
```typescript
const request: EditImageRequest = {
  instruction: "change background to pure white, professional studio lighting",
  originalImage: base64Image,
  enhance: {
    enabled: true,
    template: 'white',
    quality: 'hd'
  }
};
```

### 2. 场景图 - 具象生活场景 (Lifestyle)
**用途**: 展示商品在实际使用环境中的效果
**特点**:
- 真实生活空间背景
- 柔和散射光影
- 温馨氛围营造
- 突出商品质感

**文生图示例**:
```typescript
const request: GenerateImageRequest = {
  prompt: "ergonomic office chair",
  enhance: {
    enabled: true,
    template: 'lifestyle',
    additionalContext: 'modern minimalist home office',
    quality: 'hd'
  }
};
```

**图生图示例**:
```typescript
const request: EditImageRequest = {
  instruction: "place in modern home office, soft natural lighting",
  originalImage: base64Image,
  enhance: {
    enabled: true,
    template: 'lifestyle',
    quality: 'hd'
  }
};
```

### 3. 场景图 - 抽象质感场景 (Abstract)
**用途**: 高端品牌形象展示，突出设计感
**特点**:
- 抽象渐变背景
- 极简美学风格
- 强调商品轮廓和材质
- 品牌视觉一致性

**文生图示例**:
```typescript
const request: GenerateImageRequest = {
  prompt: "luxury skincare product set, glass bottles with gold accents",
  enhance: {
    enabled: true,
    template: 'abstract',
    additionalContext: 'soft marble texture with rose gold gradient',
    quality: 'premium'
  }
};
```

**图生图示例**:
```typescript
const request: EditImageRequest = {
  instruction: "abstract gradient background, minimalist aesthetic",
  originalImage: base64Image,
  enhance: {
    enabled: true,
    template: 'abstract',
    quality: 'premium'
  }
};
```

### 4. 卖点图 (Feature Showcase)
**用途**: 突出商品核心卖点和功能特点
**特点**:
- 清晰的卖点展示布局
- 与套图整体色调一致
- 视觉焦点突出
- 电商转化优化

**文生图示例**:
```typescript
const request: GenerateImageRequest = {
  prompt: "smart fitness watch with health monitoring features",
  enhance: {
    enabled: true,
    template: 'feature',
    additionalContext: 'centered product with feature callout highlights',
    quality: 'hd'
  }
};
```

**图生图示例**:
```typescript
const request: EditImageRequest = {
  instruction: "highlight key features, clean modern layout",
  originalImage: base64Image,
  enhance: {
    enabled: true,
    template: 'feature',
    quality: 'hd'
  }
};
```

### 5. 用户使用图 (User Scenario)
**用途**: 展示真实使用场景，增强可信度
**特点**:
- 真实用户互动场景
- 自然姿态抓拍
- 温馨使用氛围
- 社交证明视觉

**文生图示例**:
```typescript
const request: GenerateImageRequest = {
  prompt: "portable blender for smoothies",
  enhance: {
    enabled: true,
    template: 'user',
    additionalContext: 'young professional woman in modern kitchen preparing breakfast',
    quality: 'hd'
  }
};
```

**图生图示例**:
```typescript
const request: EditImageRequest = {
  instruction: "show person using the product in real kitchen",
  originalImage: base64Image,
  enhance: {
    enabled: true,
    template: 'user',
    quality: 'hd'
  }
};
```

### 6. 细节图 (Detail/Macro)
**用途**: 展示材质纹理和工艺细节
**特点**:
- 微距特写拍摄
- 材质纹理清晰
- 浅景深效果
- 精湛工艺展示

**文生图示例**:
```typescript
const request: GenerateImageRequest = {
  prompt: "handcrafted leather wallet",
  enhance: {
    enabled: true,
    template: 'detail',
    additionalContext: 'stitching detail and leather grain texture',
    quality: 'premium'
  }
};
```

**图生图示例**:
```typescript
const request: EditImageRequest = {
  instruction: "extreme close-up on material texture, shallow depth of field",
  originalImage: base64Image,
  enhance: {
    enabled: true,
    template: 'detail',
    quality: 'premium'
  }
};
```

## 快速使用方式

### 方式 1: 在 UI 中切换模式

在 Prompt Panel 中选择生成模式：

```
[文生图] [图生图]
```

- **文生图**: 直接输入描述，可选上传风格参考图
- **图生图**: 必须上传源图片，输入修改描述

### 方式 2: 自动检测模板

```typescript
import { createAutoEnhancedOptions } from './services/promptTemplates';

// 文生图
const request: GenerateImageRequest = {
  prompt: "wireless earbuds with white background",
  enhance: createAutoEnhancedOptions("wireless earbuds with white background")
};

// 图生图
const request: EditImageRequest = {
  instruction: "change background to white",
  originalImage: base64Image,
  enhance: createAutoEnhancedOptions("change background to white")
};
```

### 方式 3: 手动指定模板

**文生图**:
```typescript
const request: GenerateImageRequest = {
  prompt: "your product description",
  enhance: {
    enabled: true,
    template: 'white',  // 'white' | 'lifestyle' | 'abstract' | 'feature' | 'user' | 'detail' | 'auto'
    additionalContext: 'optional context for scene type',
    quality: 'hd',      // 'standard' | 'hd' | 'premium'
    style: 'photorealistic'  // 'photorealistic' | 'illustration' | '3d' | 'auto'
  }
};
```

**图生图**:
```typescript
const request: EditImageRequest = {
  instruction: "describe modifications",  // 可为空，将使用模板默认描述
  originalImage: base64Image,
  enhance: {
    enabled: true,
    template: 'white',  // 模板决定转换风格
    quality: 'hd'
  }
};
```

**图生图 - 使用模板默认值（无需描述）**:
```typescript
const request: EditImageRequest = {
  instruction: "",  // 空描述 - 将使用模板预设的转换指导
  originalImage: base64Image,
  enhance: {
    enabled: true,
    template: 'white',  // 例如：转换为白底图风格
    quality: 'hd'
  }
};
// 等效于：instruction = "Convert to professional white background product photography..."
```

### 方式 4: 批量生成完整素材清单

```typescript
import { generateCompleteShotList } from './services/promptTemplates';

const shots = generateCompleteShotList(
  "premium stainless steel water bottle, matte blue finish",
  {
    lifestyleScenes: ['modern gym', 'outdoor hiking trail'],
    abstractThemes: ['gradient blue pastel', 'minimalist white marble'],
    features: [
      { feature: 'vacuum insulation technology', layout: 'centered with temperature indicator' },
      { feature: 'leak-proof design', layout: 'dynamic splash effect' }
    ],
    userTypes: ['fitness enthusiast', 'office professional'],
    usageScenes: ['workout session', 'office desk'],
    detailFocuses: ['stainless steel texture', 'cap mechanism detail']
  }
);

// shots 将包含 8-10 张图片的完整拍摄方案
```

## 模板自动检测规则

系统会根据 prompt 中的关键词自动选择最合适的模板：

| 关键词 | 自动选择模板 |
|--------|-------------|
| white background, isolated, pure white | white |
| detail, close-up, macro, texture | detail |
| lifestyle, scene, in use | lifestyle |
| abstract, gradient, artistic | abstract |
| feature, benefit, showcase | feature |
| user, person, model, holding | user |
| 其他 | lifestyle (默认) |

## 文生图 vs 图生图 提示词差异

### 文生图提示词结构
```
[模板特定描述] + [产品描述] + [技术要求] + [负面提示词]
```

**示例输出**:
```
Professional e-commerce product photography of wireless headphones, 
pure white background RGB(255,255,255), clean studio shot, 
left-front 45° soft natural lighting, 4K ultra HD quality...
Negative: blurry, low quality, distorted...
```

### 图生图提示词结构
```
[模板特定转换指导] + 
Specific modifications: [用户指令] +
Technical Requirements: [质量要求]
```

**示例输出** (选择 "white" 模板):
```
Transform this image to have a pure white background (RGB 255,255,255). 
The main subject should be clearly visible with professional studio lighting...

Specific modifications: change background to white

Technical Requirements:
- 4K ultra HD, high detail, sharp focus...
```

## 质量等级说明

| 等级 | 描述 | 适用场景 |
|------|------|---------|
| standard | 标准质量，清晰图像 | 快速预览、草图 |
| hd | 4K 超高清，高细节度 | 电商主图、详情页 |
| premium | 8K 极高精度，商业摄影级 | 品牌广告、高端展示 |

## 风格选项

| 风格 | 描述 |
|------|------|
| photorealistic | 照片级真实感，专业相机拍摄效果 |
| illustration | 数字插画，矢量风格，现代平面设计 |
| 3d | 3D 渲染效果，Octane/C4D 风格 |

## 在 React 组件中使用

```typescript
import { useImageGeneration, useImageEditing } from '../hooks/useImageGeneration';
import { useAppStore } from '../store/useAppStore';

function ProductImageGenerator() {
  const { generate } = useImageGeneration();
  const { edit } = useImageEditing();
  const { 
    generationMode, 
    selectedTemplate, 
    enhanceEnabled,
    uploadedImages,
    canvasImage 
  } = useAppStore();

  const handleGenerate = async (productDesc: string) => {
    if (generationMode === 'image') {
      // 图生图模式
      await edit({
        instruction: productDesc,
        enhance: {
          enabled: enhanceEnabled,
          template: selectedTemplate,
          quality: 'hd'
        }
      });
    } else {
      // 文生图模式
      await generate({
        prompt: productDesc,
        enhance: {
          enabled: enhanceEnabled,
          template: selectedTemplate,
          quality: 'hd'
        }
      });
    }
  };

  return (
    <div>
      <button onClick={() => handleGenerate('wireless headphones')}>
        {generationMode === 'image' ? 'Generate from Image' : 'Generate'}
      </button>
    </div>
  );
}
```

## 图生图使用流程

### 方式 A: 使用模板默认转换（推荐）
1. **切换到图生图模式**: 点击 "图生图" 按钮
2. **上传源图片**: 上传区域显示 "Source Image (Required)"
3. **选择模板**: 选择目标风格（如白底图、场景图等）
4. **启用模板增强**: 确保 "Enable" 已勾选（默认开启）
5. **直接点击生成**: 无需输入描述，将使用模板预设的转换规则
6. **系统提示**: 界面显示 "💡 已启用「白底图」模板，可直接生成"

### 方式 B: 自定义描述
1. **切换到图生图模式**: 点击 "图生图" 按钮
2. **上传源图片**: 上传区域显示 "Source Image (Required)"
3. **选择模板**: 选择目标风格
4. **输入修改描述**: 如 "change background to white studio"
5. **点击 Generate from Image**: 结合模板指导 + 自定义描述生成

### 方式 C: 使用图像尺寸 / 比例功能

图生图模式支持选择输出图片的尺寸和宽高比例，在 Generate 按钮正上方可找到该功能区域。

**操作步骤**:
1. **切换到图生图模式**: 点击 "图生图" 按钮
2. **上传源图片**: 上传源图片到画布
3. **选择尺寸比例**: 在 "Image Size / Aspect Ratio" 区域选择以下选项之一：
   - **Auto**: 保持原始图片尺寸（默认）
   - **1:1**: 生成正方形图片 (1024×1024)，等宽高比
   - **3:4**: 生成竖版图片 (768×1024)，高度大于宽度
4. **点击 Generate from Image**: 生成指定尺寸的图片

**尺寸说明**:

| 选项 | 尺寸 | 描述 | Prompt 增强 |
|------|------|------|-------------|
| Auto | 原始尺寸 | 保持源图片的原始宽高比例 | 无额外 prompt |
| 1:1 | 1024×1024 | 正方形，等宽高 | 添加 "square format, 1:1 aspect ratio, equal width and height" |
| 3:4 | 768×1024 | 竖版，高度大于宽度 | 添加 "portrait format, 3:4 aspect ratio, taller than wide" |

**代码示例**:
```typescript
// 选择 1:1 尺寸
const request: EditImageRequest = {
  instruction: "change background to white",
  originalImage: base64Image,
  enhance: {
    enabled: true,
    template: 'white',
    size: '1024x1024'  // 1:1 尺寸
  }
};
// 实际发送的 prompt 会增强为：
// "change background to white, square format, 1:1 aspect ratio, equal width and height"
```

**UI 展示**:
- 三个按钮：Auto、1:1、3:4
- 选中按钮显示黄色高亮背景
- 右侧显示当前选中尺寸的详细说明
- 底部文字提示各选项的具体含义

## History & Variants 面板功能

### 滚动加载所有历史缩略图

History & Variants 面板支持显示**所有**生成的历史图片，不再限制只显示最近 2 张：

- **文生图 (G1, G2, G3...)**: 以 `G` 前缀标记，按生成顺序编号
- **图生图 (E1, E2, E3...)**: 以 `E` 前缀标记，按编辑顺序编号
- **滚动查看**: 当历史图片超过 4 张时，面板内出现滚动条
- **实时计数**: 标题显示总历史数 `All History (X)`，下方显示 `X gen, Y edit` 统计

### 删除变体图功能

支持从内存中删除不需要的历史图片：

**操作步骤**:
1. 将鼠标悬停在任意历史缩略图上
2. 右上角出现红色删除按钮（×）
3. 点击删除按钮，弹出确认对话框
4. 点击 "Delete" 确认删除，或点击 "Cancel" 取消

**删除规则**:
- 删除文生图：从 `generations` 数组中移除，如果是当前选中项则清除画布
- 删除图生图：从 `edits` 数组中移除，如果是当前选中项则清除画布
- 删除后历史编号自动更新（G1, G2... 或 E1, E2...）

## 图生图参考图选取规则

图生图功能使用上传的图片作为源图 (`originalImage`)，遵循以下选取规则：

### 源图选取优先级

1. **Canvas 图片优先**: 如果画布上已有图片（`canvasImage`），优先使用画布图片作为源图
2. **上传图片备选**: 如果画布为空，使用 `uploadedImages` 数组中的第一张图片作为源图
3. **必须存在源图**: 如果两者都为空，抛出错误 "No image to edit"

### 参考图 (Reference Images) 处理

图生图模式还支持额外的风格参考图：

- **编辑参考图 (`editReferenceImages`)**: 用于风格指导，最多 2 张
- **遮罩参考图**: 如果使用遮罩编辑工具，会生成遮罩叠加图作为参考

### 实际调用示例

```typescript
const editMutation = useMutation({
  mutationFn: async ({ instruction, enhance }) => {
    const adapter = getImageAdapter();

    // 1. 选取源图 (优先级: canvasImage > uploadedImages[0])
    const sourceImage = canvasImage || uploadedImages[0];
    if (!sourceImage) throw new Error('No image to edit');

    // 2. 转换为 base64
    const base64Image = sourceImage.includes('base64,')
      ? sourceImage.split('base64,')[1]
      : sourceImage;

    // 3. 获取风格参考图
    let referenceImages = editReferenceImages
      .filter((img) => img.includes('base64,'))
      .map((img) => img.split('base64,')[1]);

    // 4. 如果使用遮罩，添加遮罩参考图
    if (brushStrokes.length > 0) {
      // 生成遮罩并添加到 referenceImages
      referenceImages = [maskedReferenceImage, ...referenceImages];
    }

    // 5. 调用 API
    const request: EditImageRequest = {
      instruction: enhancedInstruction,
      originalImage: base64Image,  // 源图（必需）
      referenceImages: referenceImages.length > 0 ? referenceImages : undefined,  // 参考图（可选）
      maskImage,  // 遮罩（可选）
      temperature,
      seed: seed ?? undefined,
      enhance,
    };

    return await adapter.editImage(request);
  }
});
```

### 源图与参考图的区别

| 类型 | 字段名 | 作用 | 必需性 |
|------|--------|------|--------|
| 源图 | `originalImage` | 作为基础图像进行编辑 | 必需 |
| 参考图 | `referenceImages` | 提供风格/内容指导 | 可选 |
| 遮罩 | `maskImage` | 指定编辑区域 | 可选 |

**API 端点差异**:
- 文生图: `POST /v1/images/generations` (JSON)
- 图生图: `POST /v1/images/edits` (multipart/form-data，字段名 `image`)

## 注意事项

1. **模板增强默认开启**: UI 中默认勾选 "Enable"
2. **自动检测**: 使用 `template: 'auto'` 让系统根据 prompt 自动选择最佳模板
3. **additionalContext**: 文生图用于提供场景类型的额外描述；图生图该参数不生效
4. **质量等级**: 建议电商主图使用 `'hd'`，品牌广告使用 `'premium'`
5. **图生图必须上传图片**: 未上传图片时点击生成会提示错误
6. **图生图描述可为空**: 当启用模板增强时，允许不输入描述，将使用模板默认转换规则
7. **referenceImages vs originalImage**:
   - 文生图: `referenceImages` 作为风格参考（可选）
   - 图生图: `originalImage` 作为源图（必需）

## 自定义模板

如需添加新的电商模板，请在 `src/services/promptTemplates/ecommerceTemplates.ts` 中添加新的模板定义，并在 `enhancer.ts` 中添加对应的 `templateGuidance`。
