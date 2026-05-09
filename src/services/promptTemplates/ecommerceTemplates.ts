/**
 * E-commerce Image Generation Prompt Templates
 * Professional templates for cross-border e-commerce product photography
 * Optimized for AI image generation models (GPT-Image, DALL-E, Gemini)
 */

// =============================================================================
// Common Style Specifications (Shared across all templates)
// =============================================================================

const NEGATIVE_PROMPTS = 'blurry, low quality, distorted, deformed, ugly, duplicate, watermark, signature, text error, cropped, out of frame, worst quality, low resolution, oversaturated, underexposed';

// =============================================================================
// Template 1: White Background Product Shot (白底图)
// =============================================================================

export const WHITE_BG_TEMPLATE = {
  name: 'White Background Product Shot',
  nameCN: '白底图',
  description: 'Clean product showcase on pure white background',
  prompt: (productDescription: string) =>
    `Professional e-commerce product photography of ${productDescription}, ` +
    `pure white background RGB(255,255,255), clean studio shot, ` +
    `left-front 45° soft natural lighting, 4K ultra HD quality, ` +
    `product shown in full view, sharp focus, clear product edges, ` +
    `commercial photography style, pristine white backdrop, ` +
    `high-end product catalog aesthetic, crisp details, ` +
    `minimalist composition, centered product placement. ` +
    `Negative: ${NEGATIVE_PROMPTS}`,

  params: {
    size: '1024x1024',
    quality: 'hd',
  },
};

// =============================================================================
// Template 2: Lifestyle Scene Shot (场景图 - 具象生活场景)
// =============================================================================

export const LIFESTYLE_SCENE_TEMPLATE = {
  name: 'Lifestyle Scene',
  nameCN: '场景图-具象生活场景',
  description: 'Product in real-life usage environment',
  prompt: (productDescription: string, sceneType: string) =>
    `Premium lifestyle product photography of ${productDescription} ` +
    `in ${sceneType}, authentic living space, natural interior setting, ` +
    `soft diffused lighting enhancing product texture, ` +
    `left-front 45° natural light direction, realistic shadows, ` +
    `fresh bright color palette with pastel tones, ` +
    `4K ultra HD quality, commercial e-commerce aesthetic, ` +
    `cozy atmosphere, harmonious color coordination, ` +
    `product as focal point, contextual storytelling, ` +
    `high-end magazine editorial style. ` +
    `Negative: ${NEGATIVE_PROMPTS}`,

  params: {
    size: '1024x1024',
    quality: 'hd',
  },
};

// =============================================================================
// Template 3: Abstract Texture Scene (场景图 - 抽象质感场景)
// =============================================================================

export const ABSTRACT_SCENE_TEMPLATE = {
  name: 'Abstract Texture Scene',
  nameCN: '场景图-抽象质感场景',
  description: 'Artistic abstract background highlighting product texture',
  prompt: (productDescription: string, textureTheme: string) =>
    `Artistic commercial product photography of ${productDescription}, ` +
    `abstract ${textureTheme} background, soft gradient tones, ` +
    `minimalist aesthetic, premium texture showcase, ` +
    `left-front 45° soft lighting, subtle reflections, ` +
    `fresh bright light color scheme, pastel backdrop, ` +
    `4K ultra HD, sophisticated composition, ` +
    `contemporary art photography style, ` +
    `product emphasized through contrast, elegant simplicity, ` +
    `high-end brand campaign visual. ` +
    `Negative: ${NEGATIVE_PROMPTS}`,

  params: {
    size: '1024x1024',
    quality: 'hd',
  },
};

// =============================================================================
// Template 4: Feature/Benefit Showcase (卖点图)
// =============================================================================

export const FEATURE_SHOWCASE_TEMPLATE = {
  name: 'Feature Benefit Showcase',
  nameCN: '卖点图',
  description: 'Highlight product selling points with clean layout',
  prompt: (productDescription: string, feature: string, layout: string) =>
    `Professional feature showcase photography of ${productDescription}, ` +
    `highlighting: ${feature}, ${layout} composition, ` +
    `consistent bright color palette across series, ` +
    `clean modern layout, premium commercial style, ` +
    `left-front 45° natural soft lighting, ` +
    `4K ultra HD quality, sharp details, ` +
    `coordinated pastel tones, visual consistency, ` +
    `e-commerce conversion optimized, ` +
    `professional product marketing visual, ` +
    `clear focal emphasis on featured aspect. ` +
    `Negative: ${NEGATIVE_PROMPTS}`,

  params: {
    size: '1024x1024',
    quality: 'hd',
  },
};

// =============================================================================
// Template 5: User Usage Scenario (用户使用图)
// =============================================================================

export const USER_SCENARIO_TEMPLATE = {
  name: 'User Usage Scenario',
  nameCN: '用户使用图',
  description: 'Real user interacting with product in authentic scene',
  prompt: (productDescription: string, userType: string, usageScene: string) =>
    `Authentic lifestyle photography of ${userType} using ${productDescription}, ` +
    `in ${usageScene}, real-world application, natural pose, ` +
    `candid moment capture, genuine interaction, ` +
    `soft natural lighting from left-front 45°, ` +
    `relatable everyday scenario, believable environment, ` +
    `bright fresh color grading, 4K ultra HD quality, ` +
    `commercial authenticity, trustworthy presentation, ` +
    `social proof visual, user-generated-content aesthetic, ` +
    `warm and inviting atmosphere, product in active use. ` +
    `Negative: ${NEGATIVE_PROMPTS}`,

  params: {
    size: '1024x1024',
    quality: 'hd',
  },
};

// =============================================================================
// Template 6: Detail/Macro Close-up (细节图)
// =============================================================================

export const DETAIL_MACRO_TEMPLATE = {
  name: 'Detail Macro Close-up',
  nameCN: '细节图',
  description: 'Material texture and craftsmanship detail shots',
  prompt: (productDescription: string, detailFocus: string) =>
    `Ultra-detailed macro product photography of ${productDescription}, ` +
    `extreme close-up on ${detailFocus}, intricate texture reveal, ` +
    `material quality showcase, fine craftsmanship details, ` +
    `left-front 45° soft directional lighting, ` +
    `shallow depth of field, selective focus, ` +
    `4K ultra HD resolution, premium tactile visualization, ` +
    `surface texture clarity, fabric weave clarity, ` +
    `micro-detail emphasis, luxury product detail shot, ` +
    `commercial catalog macro style, tactile quality demonstration. ` +
    `Negative: ${NEGATIVE_PROMPTS}`,

  params: {
    size: '1024x1024',
    quality: 'hd',
  },
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Generate complete shot list for a product
 */
export function generateCompleteShotList(productDescription: string, options: {
  lifestyleScenes?: string[];
  abstractThemes?: string[];
  features?: Array<{ feature: string; layout: string }>;
  userTypes?: string[];
  usageScenes?: string[];
  detailFocuses?: string[];
} = {}): Array<{ type: string; nameCN: string; prompt: string; params: object }> {
  const {
    lifestyleScenes = ['modern living room', 'minimalist bedroom'],
    abstractThemes = ['gradient pastel', 'soft marble texture'],
    features = [{ feature: 'premium quality', layout: 'centered product with feature callout' }],
    userTypes = ['young professional woman', 'stylish man'],
    usageScenes = ['home office', 'outdoor patio'],
    detailFocuses = ['texture surface', 'stitching detail'],
  } = options;

  const shots = [];

  // 1. White background (1 shot)
  shots.push({
    type: WHITE_BG_TEMPLATE.name,
    nameCN: WHITE_BG_TEMPLATE.nameCN,
    prompt: WHITE_BG_TEMPLATE.prompt(productDescription),
    params: WHITE_BG_TEMPLATE.params,
  });

  // 2. Lifestyle scenes (2 shots)
  lifestyleScenes.forEach((scene) => {
    shots.push({
      type: LIFESTYLE_SCENE_TEMPLATE.name,
      nameCN: LIFESTYLE_SCENE_TEMPLATE.nameCN,
      prompt: LIFESTYLE_SCENE_TEMPLATE.prompt(productDescription, scene),
      params: LIFESTYLE_SCENE_TEMPLATE.params,
    });
  });

  // 3. Abstract scenes (2 shots)
  abstractThemes.forEach((theme) => {
    shots.push({
      type: ABSTRACT_SCENE_TEMPLATE.name,
      nameCN: ABSTRACT_SCENE_TEMPLATE.nameCN,
      prompt: ABSTRACT_SCENE_TEMPLATE.prompt(productDescription, theme),
      params: ABSTRACT_SCENE_TEMPLATE.params,
    });
  });

  // 4. Feature showcases (2-3 shots)
  features.forEach(({ feature, layout }) => {
    shots.push({
      type: FEATURE_SHOWCASE_TEMPLATE.name,
      nameCN: FEATURE_SHOWCASE_TEMPLATE.nameCN,
      prompt: FEATURE_SHOWCASE_TEMPLATE.prompt(productDescription, feature, layout),
      params: FEATURE_SHOWCASE_TEMPLATE.params,
    });
  });

  // 5. User scenarios (1-2 shots)
  userTypes.forEach((userType, index) => {
    const scene = usageScenes[index] || usageScenes[0];
    shots.push({
      type: USER_SCENARIO_TEMPLATE.name,
      nameCN: USER_SCENARIO_TEMPLATE.nameCN,
      prompt: USER_SCENARIO_TEMPLATE.prompt(productDescription, userType, scene),
      params: USER_SCENARIO_TEMPLATE.params,
    });
  });

  // 6. Detail shots (1-2 shots)
  detailFocuses.forEach((detail) => {
    shots.push({
      type: DETAIL_MACRO_TEMPLATE.name,
      nameCN: DETAIL_MACRO_TEMPLATE.nameCN,
      prompt: DETAIL_MACRO_TEMPLATE.prompt(productDescription, detail),
      params: DETAIL_MACRO_TEMPLATE.params,
    });
  });

  return shots;
}

/**
 * Quick prompt generator for single image generation
 */
export function quickPrompt(
  template: 'white' | 'lifestyle' | 'abstract' | 'feature' | 'user' | 'detail',
  productDescription: string,
  additionalContext?: string
): string {
  const templates = {
    white: WHITE_BG_TEMPLATE,
    lifestyle: LIFESTYLE_SCENE_TEMPLATE,
    abstract: ABSTRACT_SCENE_TEMPLATE,
    feature: FEATURE_SHOWCASE_TEMPLATE,
    user: USER_SCENARIO_TEMPLATE,
    detail: DETAIL_MACRO_TEMPLATE,
  };

  const selected = templates[template];

  if (template === 'white') {
    return WHITE_BG_TEMPLATE.prompt(productDescription);
  }

  // For other templates, use additionalContext as the second parameter
  return (selected.prompt as (a: string, b: string) => string)(
    productDescription,
    additionalContext || 'default scene'
  );
}

// =============================================================================
// Export all templates
// =============================================================================

export const EcommerceTemplates = {
  whiteBackground: WHITE_BG_TEMPLATE,
  lifestyle: LIFESTYLE_SCENE_TEMPLATE,
  abstract: ABSTRACT_SCENE_TEMPLATE,
  feature: FEATURE_SHOWCASE_TEMPLATE,
  userScenario: USER_SCENARIO_TEMPLATE,
  detail: DETAIL_MACRO_TEMPLATE,
};

export default EcommerceTemplates;
