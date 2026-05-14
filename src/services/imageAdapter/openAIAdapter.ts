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
  ImageGenerationModel,
} from './types';
import { enhancePrompt, enhanceEditInstruction } from '../promptTemplates/enhancer';
import { compressImageToSize } from '../../utils/imageUtils';

/**
 * OpenAI / GPT Image Generation Adapter
 * Supports gpt-image-2 and gpt-5.5 models
 * - gpt-image-2: Traditional OpenAI Image API (/v1/images/edits)
 * - gpt-5.5: OpenAI Responses API (/v1/responses) with image generation capabilities
 */
export class OpenAIAdapter extends BaseImageAdapter {
  readonly provider = 'openai';

  // OpenAI features may vary based on the actual model being used
  protected supportedFeatures: AdapterFeature[] = [
    'generation',
    'editing',
    'reference-images',
    'mask-editing',
    'temperature-control',
    'seed-control',
    'multi-image-generation',
    'model-selection', // Supports runtime model switching between gpt-image-2 and gpt-5.5
  ];

  constructor(config: ProviderConfig) {
    super(config);
  }

  /**
   * Get model-specific API URL from configuration
   */
  private getModelApiUrl(model: ImageGenerationModel): string {
    if (model === 'gpt-image-2') {
      return this.config.modelConfig?.gptImage2ApiUrl ||
        this.config.apiUrl.replace('/generations', '/edits');
    }
    if (model === 'gpt-5.5') {
      return this.config.modelConfig?.gpt55ApiUrl || 'https://api.ppinfra.com/openai/v1/responses';
    }
    return this.config.apiUrl;
  }

  /**
   * Get model-specific API key from configuration
   */
  private getModelApiKey(model: ImageGenerationModel): string {
    if (model === 'gpt-image-2') {
      return this.config.modelConfig?.gptImage2ApiKey || this.config.apiKey;
    }
    if (model === 'gpt-5.5') {
      return this.config.modelConfig?.gpt55ApiKey || this.config.apiKey;
    }
    return this.config.apiKey;
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
      const gptImage2Features: AdapterFeature[] = [
        'generation',
        'editing',
        'reference-images',
        'temperature-control',
        'seed-control',
        'multi-image-generation',
        'model-selection',
      ];
      return gptImage2Features.includes(feature);
    }

    // gpt-5.5 specific capabilities via Responses API
    if (this.model === 'gpt-5.5') {
      const gpt55Features: AdapterFeature[] = [
        'generation',
        'editing',
        'reference-images',
        'model-selection',
        // Note: 'temperature-control' is not supported by gpt-5.5
      ];
      return gpt55Features.includes(feature);
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
      const requestBody: Record<string, unknown> = {
        model: this.model,
        prompt: enhancedPrompt,
        n: request.n ?? this.config.defaultParams?.n ?? 1,
        size: request.size ?? this.config.defaultParams?.size ?? '800x800',
      };

      // Add quality parameter based on enhancement options or temperature
      const qualityLevel = request.enhance?.quality || (request.temperature && request.temperature > 0.7 ? 'hd' : 'standard');
      if (qualityLevel && this.supportsFeature('temperature-control')) {
        requestBody.quality = qualityLevel === 'premium' ? 'hd' : qualityLevel;
      }

      // Handle reference images for gpt-image-2
      if (request.referenceImages && request.referenceImages.length > 0) {
        if (this.supportsFeature('reference-images')) {
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

      // Use model-specific API key if available
      const apiKey = this.model === 'gpt-image-2'
        ? this.getModelApiKey('gpt-image-2')
        : this.config.apiKey;

      const response = await this.makeRequest(generationUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
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
      const rawImages: string[] = data.data
        .map((item) => item.b64_json)
        .filter((b64): b64 is string => typeof b64 === 'string');

      // Compress images to ensure < 2MB and max dimension 800px
      const images = await Promise.all(
        rawImages.map(async (img) => {
          try {
            const compressed = await compressImageToSize(img, 2, 'image/png', 800);
            // Extract base64 from data URL
            return compressed.split('base64,')[1];
          } catch {
            // If compression fails, return original
            return img;
          }
        })
      );

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
    // Determine which model to use for editing
    const targetModel: ImageGenerationModel = request.model || 'gpt-image-2';

    if (targetModel === 'gpt-5.5') {
      return this.editImageWithGPT55(request);
    }

    return this.editImageWithGPTImage2(request);
  }

  /**
   * Edit image using gpt-image-2 via traditional OpenAI Image API
   * Uses multipart/form-data to /v1/images/edits
   */
  private async editImageWithGPTImage2(request: EditImageRequest): Promise<EditImageResponse> {
    try {
      // Enhance instruction with professional guidance if enabled
      const enhancedInstruction = enhanceEditInstruction(request.instruction, request.enhance);

      if (request.enhance?.enabled) {
        console.log('Instruction enhanced from:', request.instruction);
        console.log('To:', enhancedInstruction);
      }

      const formData = new FormData();
      formData.append('model', 'gpt-image-2');
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
      if (request.maskImage) {
        const maskBlob = this.base64ToBlob(
          this.stripDataUri(request.maskImage),
          'image/png'
        );
        formData.append('mask', maskBlob, 'mask.png');
      }

      // Add reference images if provided
      if (request.referenceImages && request.referenceImages.length > 0) {
        request.referenceImages.forEach((img, index) => {
          const blob = this.base64ToBlob(this.stripDataUri(img), 'image/png');
          formData.append(`reference_image_${index}`, blob, `reference_${index}.png`);
        });
      }

      // Get model-specific API URL and key from configuration
      const editUrl = this.getModelApiUrl('gpt-image-2');
      const apiKey = this.getModelApiKey('gpt-image-2');

      const response = await fetch(editUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
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

      const rawImages: string[] = data.data
        .map((item) => item.b64_json)
        .filter((b64): b64 is string => typeof b64 === 'string');

      // Compress images to ensure < 2MB and max dimension 800px
      const images = await Promise.all(
        rawImages.map(async (img) => {
          try {
            const compressed = await compressImageToSize(img, 2, 'image/png', 800);
            return compressed.split('base64,')[1];
          } catch {
            return img;
          }
        })
      );

      return {
        images,
        metadata: {
          model: 'gpt-image-2',
          seed: request.seed,
        },
      };
    } catch (error) {
      if (error instanceof AdapterError) {
        throw error;
      }

      console.error('OpenAI gpt-image-2 editing error:', error);
      throw new AdapterError(
        `Failed to edit image with gpt-image-2: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.provider,
        'EDIT_ERROR',
        error
      );
    }
  }

  /**
   * Edit image using gpt-5.5 via OpenAI Responses API
   * Uses JSON format to /v1/responses with image input support
   */
  private async editImageWithGPT55(request: EditImageRequest): Promise<EditImageResponse> {
    try {
      // Enhance instruction with professional guidance if enabled
      const enhancedInstruction = enhanceEditInstruction(request.instruction, request.enhance);

      if (request.enhance?.enabled) {
        console.log('GPT-5.5 Instruction enhanced from:', request.instruction);
        console.log('To:', enhancedInstruction);
      }

      // Build the request for Responses API
      // Reference: OpenAI&Gemini_API_Interface_Doc.md - Part 1: OpenAI Response API
      const requestBody: Record<string, unknown> = {
        model: 'pa/gpt-5.5', // Use the provider-specific model format
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: `${enhancedInstruction}

Please generate a modified version of the provided image based on the instructions above. Output the result as a base64-encoded PNG image.`,
              },
              {
                type: 'input_image',
                image_url: `data:image/png;base64,${request.originalImage}`,
              },
            ],
          },
        ],
        // Add size guidance in instructions for consistent output
        instructions: `You are an expert image editor. Modify the provided image according to the user's instructions.
Output format: Return a base64-encoded PNG image in your response.
${request.size === '800x800' || request.enhance?.size === '800x800' ? 'Output size: 800x800 pixels (square format)' : ''}
${request.size === '600x800' || request.enhance?.size === '600x800' ? 'Output size: 600x800 pixels (portrait format)' : ''}`,
        // Note: temperature is not supported by gpt-5.5 model via Responses API
        max_output_tokens: 4096,
      };

      // Add reference images if provided
      if (request.referenceImages && request.referenceImages.length > 0) {
        const userContent = (requestBody.input as Array<Record<string, unknown>>)[0].content as Array<Record<string, unknown>>;
        request.referenceImages.forEach((img) => {
          userContent.push({
            type: 'input_image',
            image_url: `data:image/png;base64,${this.stripDataUri(img)}`,
          });
        });
      }

      // Add mask image if provided (as additional context)
      if (request.maskImage) {
        const userContent = (requestBody.input as Array<Record<string, unknown>>)[0].content as Array<Record<string, unknown>>;
        userContent.push({
          type: 'input_image',
          image_url: `data:image/png;base64,${this.stripDataUri(request.maskImage)}`,
        });
        // Prepend mask instruction
        const textContent = userContent.find(c => c.type === 'input_text');
        if (textContent) {
          textContent.text = `A mask image is provided - the white areas in the mask indicate where changes should be applied.\n\n${textContent.text}`;
        }
      }

      // Get model-specific API URL and key from configuration
      const apiUrl = this.getModelApiUrl('gpt-5.5');
      const apiKey = this.getModelApiKey('gpt-5.5');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
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
        output?: Array<{
          type?: string;
          content?: Array<{
            type?: string;
            text?: string;
            image_url?: { url?: string };
          }>;
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

      // Extract images from Responses API output
      // The API returns images in the output array
      const images: string[] = [];

      if (data.output) {
        for (const outputItem of data.output) {
          if (outputItem.type === 'message' && outputItem.content) {
            for (const content of outputItem.content) {
              // Look for base64 image data in text content
              if (content.type === 'output_text' && content.text) {
                // Try to extract base64 image from markdown or direct base64
                const base64Match = content.text.match(/data:image\/png;base64,([A-Za-z0-9+/=]+)/);
                if (base64Match) {
                  images.push(base64Match[1]);
                } else {
                  // Try to find raw base64 (without data URI prefix)
                  const rawBase64Match = content.text.match(/^[A-Za-z0-9+/=]{100,}$/m);
                  if (rawBase64Match) {
                    images.push(rawBase64Match[0]);
                  }
                }
              }
              // Check for image_url type content
              if (content.type === 'image_url' && content.image_url?.url) {
                const url = content.image_url.url;
                if (url.startsWith('data:image')) {
                  const base64Match = url.match(/base64,(.+)$/);
                  if (base64Match) {
                    images.push(base64Match[1]);
                  }
                }
              }
            }
          }
        }
      }

      if (images.length === 0) {
        console.warn('No images found in GPT-5.5 response, returning empty result');
        return { images: [] };
      }

      // Compress images to ensure < 2MB
      const compressedImages = await Promise.all(
        images.map(async (img) => {
          try {
            const compressed = await compressImageToSize(img, 2, 'image/png');
            return compressed.split('base64,')[1];
          } catch {
            return img;
          }
        })
      );

      return {
        images: compressedImages,
        metadata: {
          model: 'gpt-5.5',
          seed: request.seed,
        },
      };
    } catch (error) {
      if (error instanceof AdapterError) {
        throw error;
      }

      console.error('OpenAI gpt-5.5 editing error:', error);
      throw new AdapterError(
        `Failed to edit image with gpt-5.5: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
