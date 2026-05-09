/**
 * Prompt Templates Module
 * Professional e-commerce image generation prompt templates
 */

// E-commerce templates
export {
  EcommerceTemplates,
  WHITE_BG_TEMPLATE,
  LIFESTYLE_SCENE_TEMPLATE,
  ABSTRACT_SCENE_TEMPLATE,
  FEATURE_SHOWCASE_TEMPLATE,
  USER_SCENARIO_TEMPLATE,
  DETAIL_MACRO_TEMPLATE,
  generateCompleteShotList,
  quickPrompt,
} from './ecommerceTemplates';

// Enhancer
export {
  PromptEnhancer,
  enhancePrompt,
  enhanceEditInstruction,
  detectBestTemplate,
  createAutoEnhancedOptions,
  QUALITY_BOOSTERS,
  STYLE_BOOSTERS,
  ECOMMERCE_TEMPLATES,
} from './enhancer';

// Re-export types
export type { PromptEnhancementOptions } from '../imageAdapter/types';
