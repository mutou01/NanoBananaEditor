/**
 * Image Adapter Types
 * Unified type definitions for all image generation providers
 */

// Prompt enhancement options
export interface PromptEnhancementOptions {
  enabled?: boolean;
  template?: 'white' | 'lifestyle' | 'abstract' | 'feature' | 'user' | 'detail' | 'auto';
  additionalContext?: string;
  quality?: 'standard' | 'hd' | 'premium';
  style?: 'photorealistic' | 'illustration' | '3d' | 'auto';
  size?: ImageSize;
}

// Common request interfaces
export interface GenerateImageRequest {
  prompt: string;
  referenceImages?: string[]; // base64 array without data URI prefix
  temperature?: number;
  seed?: number;
  size?: ImageSize;
  n?: number; // number of images to generate
  enhance?: PromptEnhancementOptions; // Optional prompt enhancement
}

export interface EditImageRequest {
  instruction: string;
  originalImage: string; // base64 without data URI prefix
  referenceImages?: string[]; // base64 array without data URI prefix
  maskImage?: string; // base64 without data URI prefix
  temperature?: number;
  seed?: number;
  size?: ImageSize;
  enhance?: PromptEnhancementOptions; // Optional instruction enhancement
}

export interface SegmentationRequest {
  image: string; // base64 without data URI prefix
  query: string;
}

// Common response interfaces
export interface GenerateImageResponse {
  images: string[]; // base64 encoded images
  metadata?: {
    model?: string;
    seed?: number;
    finishReason?: string;
    usage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
  };
}

export interface EditImageResponse {
  images: string[]; // base64 encoded images
  metadata?: {
    model?: string;
    seed?: number;
    finishReason?: string;
  };
}

export interface SegmentationResponse {
  masks: Array<{
    label: string;
    box_2d: [number, number, number, number]; // x, y, width, height
    mask: string; // base64 encoded binary mask image
  }>;
}

// Image size options
export type ImageSize =
  | '1024x1024'
  | '1024x1536'
  | '1536x1024'
  | 'auto'
  | `${number}x${number}`;

// Provider configuration
export interface ProviderConfig {
  provider: 'gemini' | 'openai' | 'custom';
  apiUrl: string;
  apiKey: string;
  model: string;
  defaultParams?: {
    temperature?: number;
    size?: ImageSize;
    n?: number;
  };
  // Provider-specific options
  options?: Record<string, unknown>;
}

// Adapter interface that all providers must implement
export interface IImageAdapter {
  readonly provider: string;
  readonly model: string;

  generateImage(request: GenerateImageRequest): Promise<GenerateImageResponse>;
  editImage(request: EditImageRequest): Promise<EditImageResponse>;
  segmentImage?(request: SegmentationRequest): Promise<SegmentationResponse>;

  // Check if the adapter supports a specific feature
  supportsFeature(feature: AdapterFeature): boolean;
}

// Features that adapters may support
export type AdapterFeature =
  | 'generation'
  | 'editing'
  | 'segmentation'
  | 'reference-images'
  | 'mask-editing'
  | 'temperature-control'
  | 'seed-control'
  | 'multi-image-generation';

// Configuration validation result
export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
}

// Error types
export class AdapterError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly code?: string,
    public readonly rawError?: unknown
  ) {
    super(message);
    this.name = 'AdapterError';
  }
}

export class ConfigurationError extends Error {
  constructor(message: string, public readonly missingVars?: string[]) {
    super(message);
    this.name = 'ConfigurationError';
  }
}
