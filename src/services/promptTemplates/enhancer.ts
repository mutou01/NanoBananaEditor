/**
 * Prompt Enhancer
 * Enhances user prompts with professional e-commerce photography templates
 */

import { PromptEnhancementOptions } from '../imageAdapter/types';

// =============================================================================
// Quality Boosters
// =============================================================================

export const QUALITY_BOOSTERS = {
  standard: 'professional quality, clear image',
  hd: '4K ultra HD, high detail, sharp focus, premium quality',
  premium: '8K ultra HD, extreme detail, masterful composition, award-winning commercial photography, magazine quality',
};

export const STYLE_BOOSTERS = {
  photorealistic: 'photorealistic, shot on professional camera, realistic lighting, true-to-life colors',
  illustration: 'digital illustration, clean vector style, modern graphic design, flat design aesthetic',
  '3d': '3D render, octane render, blender, C4D, realistic materials, studio lighting setup',
  auto: '', // Will be determined by context
};

const NEGATIVE_PROMPTS = 'blurry, low quality, distorted, deformed, ugly, duplicate, watermark, signature, text error, cropped, out of frame, worst quality, low resolution, oversaturated, underexposed, amateur photography';

// =============================================================================
// E-commerce Templates
// =============================================================================

export const ECOMMERCE_TEMPLATES = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  white: (product: string, _context?: string) =>
    `Professional e-commerce product photography of ${product}, ` +
    `pure white background RGB(255,255,255), clean studio shot, ` +
    `left-front 45° soft natural lighting, 4K ultra HD quality, ` +
    `product shown in full view, sharp focus, clear product edges, ` +
    `commercial photography style, pristine white backdrop, ` +
    `high-end product catalog aesthetic, crisp details, minimalist composition, ` +
    `centered product placement. Negative: ${NEGATIVE_PROMPTS}`,

  lifestyle: (product: string, context?: string) =>
    `Premium lifestyle product photography of ${product} ` +
    `in ${context || 'modern living space'}, authentic environment, natural setting, ` +
    `soft diffused lighting enhancing product texture, ` +
    `left-front 45° natural light direction, realistic shadows, ` +
    `fresh bright color palette with pastel tones, 4K ultra HD quality, ` +
    `commercial e-commerce aesthetic, cozy atmosphere, ` +
    `harmonious color coordination, product as focal point, contextual storytelling. ` +
    `Negative: ${NEGATIVE_PROMPTS}`,

  abstract: (product: string, context?: string) =>
    `Artistic commercial product photography of ${product}, ` +
    `abstract ${context || 'gradient pastel'} background, soft gradient tones, ` +
    `minimalist aesthetic, premium texture showcase, ` +
    `left-front 45° soft lighting, subtle reflections, ` +
    `fresh bright light color scheme, pastel backdrop, 4K ultra HD, ` +
    `sophisticated composition, contemporary art photography style, ` +
    `product emphasized through contrast, elegant simplicity, ` +
    `high-end brand campaign visual. Negative: ${NEGATIVE_PROMPTS}`,

  feature: (product: string, context?: string) =>
    `Professional feature showcase photography of ${product}, ` +
    `highlighting key selling points, ${context || 'clean modern layout'} composition, ` +
    `consistent bright color palette, premium commercial style, ` +
    `left-front 45° natural soft lighting, 4K ultra HD quality, sharp details, ` +
    `coordinated pastel tones, visual consistency, ` +
    `e-commerce conversion optimized, professional product marketing visual, ` +
    `clear focal emphasis on featured aspects. Negative: ${NEGATIVE_PROMPTS}`,

  user: (product: string, context?: string) =>
    `Authentic lifestyle photography of user with ${product}, ` +
    `in ${context || 'real-world usage scenario'}, natural pose, candid moment capture, ` +
    `genuine interaction, soft natural lighting from left-front 45°, ` +
    `relatable everyday scenario, believable environment, ` +
    `bright fresh color grading, 4K ultra HD quality, commercial authenticity, ` +
    `trustworthy presentation, social proof visual, warm and inviting atmosphere, ` +
    `product in active use. Negative: ${NEGATIVE_PROMPTS}`,

  detail: (product: string, context?: string) =>
    `Ultra-detailed macro product photography of ${product}, ` +
    `extreme close-up on ${context || 'material texture and craftsmanship'}, ` +
    `intricate texture reveal, material quality showcase, fine craftsmanship details, ` +
    `left-front 45° soft directional lighting, shallow depth of field, ` +
    `selective focus, 4K ultra HD resolution, premium tactile visualization, ` +
    `surface texture clarity, micro-detail emphasis, ` +
    `luxury product detail shot, commercial catalog macro style. ` +
    `Negative: ${NEGATIVE_PROMPTS}`,

  auto: (product: string, context?: string) => {
    // Auto-detect template based on keywords in prompt
    const lowerPrompt = product.toLowerCase();
    if (lowerPrompt.includes('white background') || lowerPrompt.includes('pure white') || lowerPrompt.includes('isolated')) {
      return ECOMMERCE_TEMPLATES.white(product, context);
    }
    if (lowerPrompt.includes('detail') || lowerPrompt.includes('close-up') || lowerPrompt.includes('macro') || lowerPrompt.includes('texture')) {
      return ECOMMERCE_TEMPLATES.detail(product, context);
    }
    if (lowerPrompt.includes('user') || lowerPrompt.includes('person') || lowerPrompt.includes('model') || lowerPrompt.includes('holding')) {
      return ECOMMERCE_TEMPLATES.user(product, context);
    }
    if (lowerPrompt.includes('abstract') || lowerPrompt.includes('gradient') || lowerPrompt.includes('minimalist')) {
      return ECOMMERCE_TEMPLATES.abstract(product, context);
    }
    if (lowerPrompt.includes('feature') || lowerPrompt.includes('benefit') || lowerPrompt.includes('selling point')) {
      return ECOMMERCE_TEMPLATES.feature(product, context);
    }
    // Default to lifestyle
    return ECOMMERCE_TEMPLATES.lifestyle(product, context);
  },
};

// =============================================================================
// Enhancer Functions
// =============================================================================

/**
 * Enhance a generation prompt with e-commerce templates
 */
export function enhancePrompt(
  originalPrompt: string,
  options: PromptEnhancementOptions = {}
): string {
  const { enabled = false, template = 'auto', additionalContext, quality = 'hd', style = 'photorealistic' } = options;

  if (!enabled) {
    // Even without template, add basic quality boosters
    const qualityBoost = QUALITY_BOOSTERS[quality] || QUALITY_BOOSTERS.hd;
    const styleBoost = STYLE_BOOSTERS[style] || STYLE_BOOSTERS.photorealistic;

    return `${originalPrompt}, ${qualityBoost}, ${styleBoost}. Negative: ${NEGATIVE_PROMPTS}`;
  }

  // Use template enhancement
  const templateFn = ECOMMERCE_TEMPLATES[template] || ECOMMERCE_TEMPLATES.auto;
  return templateFn(originalPrompt, additionalContext);
}

/**
 * Enhance an edit instruction with professional guidance
 * Supports template-specific instructions for image-to-image generation
 * Allows empty instructions - will use template defaults
 */
export function enhanceEditInstruction(
  originalInstruction: string,
  options: PromptEnhancementOptions = {}
): string {
  const { enabled = false, template = 'auto', quality = 'hd' } = options;

  if (!enabled) {
    return originalInstruction || 'Apply professional enhancement to this image';
  }

  const qualityBoost = QUALITY_BOOSTERS[quality] || QUALITY_BOOSTERS.hd;
  const hasInstruction = originalInstruction && originalInstruction.trim().length > 0;

  // Template-specific guidance for image-to-image editing
  const templateGuidance: Record<string, { full: string; brief: string }> = {
    white: {
      full: `Transform this image to have a pure white background (RGB 255,255,255). The main subject should be clearly visible with professional studio lighting from left-front 45° angle. Ensure clean edges and crisp details suitable for e-commerce product catalogs.`,
      brief: `Convert to professional white background product photography with left-front 45° studio lighting.`
    },
    
    lifestyle: {
      full: `Transform this image to place the subject in a realistic lifestyle setting. Use soft natural lighting from left-front 45° angle, create a cozy authentic atmosphere with harmonious pastel color tones. The scene should feel believable and relatable for e-commerce product showcase.`,
      brief: `Convert to lifestyle scene with natural lighting and cozy authentic atmosphere.`
    },
    
    abstract: {
      full: `Transform this image with an abstract artistic background featuring soft gradient tones. Use minimalist aesthetic with left-front 45° soft lighting and subtle reflections. The composition should emphasize the product through elegant contrast with pastel backdrop.`,
      brief: `Convert to abstract artistic background with gradient tones and minimalist aesthetic.`
    },
    
    feature: {
      full: `Transform this image to highlight key features and selling points. Use clean modern layout with consistent bright color palette. Apply left-front 45° natural soft lighting with sharp details. Ensure visual consistency and clear focal emphasis on featured aspects.`,
      brief: `Highlight key features with clean layout and consistent bright color palette.`
    },
    
    user: {
      full: `Transform this image to show the product being used by a person in a real-world scenario. Capture a natural candid moment with soft lighting from left-front 45°. Create a warm, relatable, and trustworthy atmosphere that serves as social proof for the product.`,
      brief: `Show product in use by a person in real-world scenario with natural candid moment.`
    },
    
    detail: {
      full: `Transform this image to an extreme close-up showing intricate texture and craftsmanship details. Use shallow depth of field with selective focus from left-front 45° soft directional lighting. Emphasize material quality and fine surface texture clarity.`,
      brief: `Convert to extreme close-up macro shot emphasizing texture and craftsmanship details.`
    },
    
    auto: {
      full: `Transform this image based on the requested changes. Use professional commercial photography standards with left-front 45° soft natural lighting, 4K ultra HD quality, and maintain consistent style throughout.`,
      brief: `Apply professional commercial photography enhancement with soft natural lighting.`
    },
  };

  const guidance = templateGuidance[template] || templateGuidance.auto;
  
  // Use brief version when no instruction provided, full version when instruction exists
  const mainGuidance = hasInstruction ? guidance.full : guidance.brief;

  if (hasInstruction) {
    return `${mainGuidance}

Specific modifications: ${originalInstruction}

Technical Requirements:
- ${qualityBoost}
- Maintain original subject identity and key characteristics
- Preserve natural lighting direction and quality
- Ensure seamless integration of changes
- Apply professional e-commerce photography standards`;
  } else {
    // Empty instruction - use template default with brief guidance
    return `${mainGuidance}

Technical Requirements:
- ${qualityBoost}
- Maintain original subject identity and key characteristics
- Preserve natural lighting direction and quality
- Ensure seamless integration of changes
- Apply professional e-commerce photography standards`;
  }
}

/**
 * Auto-detect the best template based on prompt content
 */
export function detectBestTemplate(prompt: string): PromptEnhancementOptions['template'] {
  const lower = prompt.toLowerCase();

  if (lower.includes('white background') || lower.includes('isolated') || lower.includes('pure white')) {
    return 'white';
  }
  if (lower.includes('detail') || lower.includes('close-up') || lower.includes('macro') || lower.includes('texture')) {
    return 'detail';
  }
  if (lower.includes('lifestyle') || lower.includes('scene') || lower.includes('in use')) {
    return 'lifestyle';
  }
  if (lower.includes('abstract') || lower.includes('gradient') || lower.includes('artistic')) {
    return 'abstract';
  }
  if (lower.includes('feature') || lower.includes('benefit') || lower.includes('showcase')) {
    return 'feature';
  }
  if (lower.includes('user') || lower.includes('person') || lower.includes('model')) {
    return 'user';
  }

  return 'auto';
}

/**
 * Create enhanced options with auto-detected template
 */
export function createAutoEnhancedOptions(
  prompt: string,
  baseOptions?: Partial<PromptEnhancementOptions>
): PromptEnhancementOptions {
  return {
    enabled: true,
    template: detectBestTemplate(prompt),
    quality: 'hd',
    style: 'photorealistic',
    ...baseOptions,
  };
}

// =============================================================================
// Export
// =============================================================================

export const PromptEnhancer = {
  enhancePrompt,
  enhanceEditInstruction,
  detectBestTemplate,
  createAutoEnhancedOptions,
  QUALITY_BOOSTERS,
  STYLE_BOOSTERS,
  ECOMMERCE_TEMPLATES,
};

export default PromptEnhancer;
