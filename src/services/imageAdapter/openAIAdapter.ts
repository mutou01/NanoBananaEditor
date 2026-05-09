import { BaseImageAdapter } from './baseAdapter';
import {
  GenerateImageRequest,
  GenerateImageResponse,
  EditImageRequest,
  EditImageResponse,
  SegmentationRequest,
  SegmentationResponse,
  ProviderConfig,
  AdapterFeature,
  AdapterError,
} from './types';
import { enhancePrompt, enhanceEditInstruction } from '../promptTemplates/enhancer';

/**
 * OpenAI / GPT Image Generation Adapter
 * Supports gpt-image-2 and compatible OpenAI-style APIs
 * Compatible with endpoints like https://api.openai.com/v1/images/generations
 */
export class OpenAIAdapter extends BaseImageAdapter {
  readonly provider = 'openai';

  // OpenAI features may vary based on the actual model being used
  protected supportedFeatures: AdapterFeature[] = [
    'generation',
    'editing', // Some OpenAI models support editing
    'reference-images', // gpt-image-2 supports reference images
    'mask-editing', // DALL-E 2 supports mask editing
    'temperature-control',
    'seed-control',
    'multi-image-generation',
  ];

  constructor(config: ProviderConfig) {
    super(config);
  }

  get model(): string {
    return this.config.model;
  }

  /**
   * Check if the configured endpoint supports a specific feature
   * This allows runtime feature detection
   */
  private isFeatureAvailable(feature: AdapterFeature): boolean {
    // gpt-image-2 specific capabilities
    if (this.model === 'gpt-image-2') {
      // gpt-image-2 supports these features
      const gptImage2Features: AdapterFeature[] = [
        'generation',
        'editing',
        'reference-images',
        'temperature-control',
        'seed-control',
        'multi-image-generation',
      ];
      return gptImage2Features.includes(feature);
    }

    // DALL-E 2/3 specific capabilities
    if (this.model.includes('dall-e')) {
      if (this.model.includes('dall-e-2')) {
        return ['generation', 'editing', 'mask-editing', 'multi-image-generation'].includes(feature);
      }
      // DALL-E 3
      return ['generation', 'multi-image-generation'].includes(feature);
    }

    return this.supportedFeatures.includes(feature);
  }

  override supportsFeature(feature: AdapterFeature): boolean {
    return this.isFeatureAvailable(feature);
  }

  async generateImage(request: GenerateImageRequest): Promise<GenerateImageResponse> {
    try {
      // Enhance prompt with e-commerce templates if enabled
      const enhancedPrompt = enhancePrompt(request.prompt, request.enhance);

      // Log enhancement for debugging
      if (request.enhance?.enabled) {
        console.log('Prompt enhanced from:', request.prompt);
        console.log('To:', enhancedPrompt);
      }

      // Build the request body based on OpenAI API specification
      // https://platform.openai.com/docs/api-reference/images/create
      const requestBody: Record<string, unknown> = {
        model: this.model,
        prompt: enhancedPrompt,
        n: request.n ?? this.config.defaultParams?.n ?? 1,
        size: request.size ?? this.config.defaultParams?.size ?? '1024x1024',
      };

      // Add quality parameter based on enhancement options or temperature
      const qualityLevel = request.enhance?.quality || (request.temperature && request.temperature > 0.7 ? 'hd' : 'standard');
      if (qualityLevel && this.supportsFeature('temperature-control')) {
        requestBody.quality = qualityLevel === 'premium' ? 'hd' : qualityLevel;
      }

      // Handle reference images for gpt-image-2 (style reference, not img2img)
      if (request.referenceImages && request.referenceImages.length > 0) {
        if (this.supportsFeature('reference-images')) {
          // For gpt-image-2 and similar models that support reference images
          // They may be passed differently depending on the API version
          requestBody.reference_images = request.referenceImages.map((img) =>
            this.stripDataUri(img)
          );
        } else {
          console.warn(`Provider ${this.provider} model ${this.model} does not support reference images`);
        }
      }

      // Use generations endpoint for text-to-image
      const generationUrl = this.config.apiUrl.includes('/edits') 
        ? this.config.apiUrl.replace('/edits', '/generations')
        : this.config.apiUrl;

      const response = await this.makeRequest(generationUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = (await response.json()) as {
        data?: Array<{
          b64_json?: string;
          url?: string;
          revised_prompt?: string;
        }>;
        error?: {
          message: string;
          type: string;
          code: string;
        };
      };

      if (data.error) {
        throw new AdapterError(
          `OpenAI API error: ${data.error.message}`,
          this.provider,
          data.error.code
        );
      }

      if (!data.data || data.data.length === 0) {
        return { images: [] };
      }

      // Extract base64 images from response
      const images: string[] = data.data
        .map((item) => item.b64_json)
        .filter((b64): b64 is string => typeof b64 === 'string');

      return {
        images,
        metadata: {
          model: this.model,
          seed: request.seed,
          finishReason: 'success',
        },
      };
    } catch (error) {
      if (error instanceof AdapterError) {
        throw error;
      }

      console.error('OpenAI generation error:', error);
      throw new AdapterError(
        `Failed to generate image with OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.provider,
        'GENERATION_ERROR',
        error
      );
    }
  }

  async editImage(request: EditImageRequest): Promise<EditImageResponse> {
    // OpenAI image editing requires multipart/form-data
    // https://platform.openai.com/docs/api-reference/images/createEdit
    try {
      if (!this.supportsFeature('editing')) {
        throw new AdapterError(
          `Model ${this.model} does not support image editing`,
          this.provider,
          'FEATURE_NOT_SUPPORTED'
        );
      }

      // Enhance instruction with professional guidance if enabled
      const enhancedInstruction = enhanceEditInstruction(request.instruction, request.enhance);

      if (request.enhance?.enabled) {
        console.log('Instruction enhanced from:', request.instruction);
        console.log('To:', enhancedInstruction);
      }

      const formData = new FormData();
      formData.append('model', this.model);
      formData.append('prompt', enhancedInstruction);

      // Add size parameter if provided
      if (request.size || request.enhance?.size) {
        const size = request.size || request.enhance?.size;
        formData.append('size', size as string);
      }

      // Convert base64 to Blob for the original image
      const originalImageBlob = this.base64ToBlob(
        this.stripDataUri(request.originalImage),
        'image/png'
      );
      formData.append('image', originalImageBlob, 'image.png');

      // Add mask if provided
      if (request.maskImage && this.supportsFeature('mask-editing')) {
        const maskBlob = this.base64ToBlob(
          this.stripDataUri(request.maskImage),
          'image/png'
        );
        formData.append('mask', maskBlob, 'mask.png');
      }

      // Add reference images if supported
      if (request.referenceImages && request.referenceImages.length > 0) {
        if (this.supportsFeature('reference-images')) {
          request.referenceImages.forEach((img, index) => {
            const blob = this.base64ToBlob(this.stripDataUri(img), 'image/png');
            formData.append(`reference_image_${index}`, blob, `reference_${index}.png`);
          });
        }
      }

      // Determine the correct endpoint for editing
      // Some providers use /v1/images/edits instead of generations
      const editUrl = this.config.apiUrl.replace('/generations', '/edits');

      const response = await fetch(editUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new AdapterError(
          `API request failed: ${response.status} ${response.statusText} - ${errorText}`,
          this.provider,
          `HTTP_${response.status}`
        );
      }

      const data = (await response.json()) as {
        data?: Array<{
          b64_json?: string;
          url?: string;
        }>;
        error?: {
          message: string;
          type: string;
          code: string;
        };
      };

      if (data.error) {
        throw new AdapterError(
          `OpenAI API error: ${data.error.message}`,
          this.provider,
          data.error.code
        );
      }

      if (!data.data || data.data.length === 0) {
        return { images: [] };
      }

      const images: string[] = data.data
        .map((item) => item.b64_json)
        .filter((b64): b64 is string => typeof b64 === 'string');

      return {
        images,
        metadata: {
          model: this.model,
          seed: request.seed,
        },
      };
    } catch (error) {
      if (error instanceof AdapterError) {
        throw error;
      }

      console.error('OpenAI editing error:', error);
      throw new AdapterError(
        `Failed to edit image with OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.provider,
        'EDIT_ERROR',
        error
      );
    }
  }

  /**
   * OpenAI does not natively support segmentation
   * This method throws an error
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  override async segmentImage(request: SegmentationRequest): Promise<SegmentationResponse> {
    throw new AdapterError(
      'Segmentation is not supported by OpenAI adapters',
      this.provider,
      'FEATURE_NOT_SUPPORTED'
    );
  }

  /**
   * Convert base64 string to Blob
   */
  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }
}
