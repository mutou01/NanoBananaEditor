/**
 * Image Adapter Module
 * Unified interface for multiple image generation providers
 *
 * Usage:
 * ```typescript
 * import { getImageAdapter, AdapterFactory } from './services/imageAdapter';
 *
 * // Get adapter from environment configuration
 * const adapter = getImageAdapter();
 *
 * // Generate image
 * const result = await adapter.generateImage({
 *   prompt: "A red apple on a wooden table",
 *   temperature: 0.7
 * });
 *
 * // Check supported features
 * if (adapter.supportsFeature('mask-editing')) {
 *   // Use mask editing
 * }
 * ```
 */

// Types
export type {
  GenerateImageRequest,
  GenerateImageResponse,
  EditImageRequest,
  EditImageResponse,
  SegmentationRequest,
  SegmentationResponse,
  ProviderConfig,
  AdapterFeature,
  IImageAdapter,
  ConfigValidationResult,
  PromptEnhancementOptions,
} from './types';

// Errors
export { AdapterError, ConfigurationError } from './types';

// Base class
export { BaseImageAdapter } from './baseAdapter';

// Implementations
export { GeminiAdapter } from './geminiAdapter';
export { OpenAIAdapter } from './openAIAdapter';

// Factory and utilities
export {
  AdapterFactory,
  createAdapterFromImportMetaEnv,
  getImageAdapter,
  setImageAdapter,
  resetImageAdapter,
} from './factory';

// Provider type and environment config
export type { SupportedProvider, EnvironmentConfig } from './factory';
