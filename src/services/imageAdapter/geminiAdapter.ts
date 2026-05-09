import { GoogleGenAI } from '@google/genai';
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

/**
 * Google Gemini Image Generation Adapter
 * Supports Gemini 2.5 Flash Image model
 */
export class GeminiAdapter extends BaseImageAdapter {
  readonly provider = 'gemini';
  private genAI: GoogleGenAI;

  protected supportedFeatures: AdapterFeature[] = [
    'generation',
    'editing',
    'segmentation',
    'reference-images',
    'mask-editing',
    'temperature-control',
    'seed-control',
    'multi-image-generation',
  ];

  constructor(config: ProviderConfig) {
    super(config);
    this.genAI = new GoogleGenAI({ apiKey: config.apiKey });
  }

  get model(): string {
    return this.config.model;
  }

  async generateImage(request: GenerateImageRequest): Promise<GenerateImageResponse> {
    try {
      const contents: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
        { text: request.prompt },
      ];

      // Add reference images if provided
      if (request.referenceImages && request.referenceImages.length > 0) {
        request.referenceImages.forEach((image) => {
          contents.push({
            inlineData: {
              mimeType: 'image/png',
              data: this.stripDataUri(image),
            },
          });
        });
      }

      const response = await this.genAI.models.generateContent({
        model: this.model,
        contents,
        // Gemini supports these parameters indirectly via the SDK
        // temperature and seed are handled at the request level if needed
      });

      const images: string[] = [];

      // Handle potential missing candidates or parts
      const candidate = response.candidates?.[0];
      if (!candidate || !candidate.content?.parts) {
        return { images: [] };
      }

      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          images.push(part.inlineData.data);
        }
      }

      return {
        images,
        metadata: {
          model: this.model,
          seed: request.seed,
        },
      };
    } catch (error) {
      console.error('Gemini generation error:', error);
      throw new AdapterError(
        `Failed to generate image with Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.provider,
        'GENERATION_ERROR',
        error
      );
    }
  }

  async editImage(request: EditImageRequest): Promise<EditImageResponse> {
    try {
      const contents: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
        { text: this.buildEditPrompt(request) },
        {
          inlineData: {
            mimeType: 'image/png',
            data: this.stripDataUri(request.originalImage),
          },
        },
      ];

      // Add reference images if provided
      if (request.referenceImages && request.referenceImages.length > 0) {
        request.referenceImages.forEach((image) => {
          contents.push({
            inlineData: {
              mimeType: 'image/png',
              data: this.stripDataUri(image),
            },
          });
        });
      }

      // Add mask image if provided
      if (request.maskImage) {
        contents.push({
          inlineData: {
            mimeType: 'image/png',
            data: this.stripDataUri(request.maskImage),
          },
        });
      }

      const response = await this.genAI.models.generateContent({
        model: this.model,
        contents,
      });

      const images: string[] = [];

      const candidate = response.candidates?.[0];
      if (!candidate || !candidate.content?.parts) {
        return { images: [] };
      }

      for (const part of candidate.content.parts) {
        if (part.inlineData?.data) {
          images.push(part.inlineData.data);
        }
      }

      return {
        images,
        metadata: {
          model: this.model,
          seed: request.seed,
        },
      };
    } catch (error) {
      console.error('Gemini editing error:', error);
      throw new AdapterError(
        `Failed to edit image with Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.provider,
        'EDIT_ERROR',
        error
      );
    }
  }

  async segmentImage(request: SegmentationRequest): Promise<SegmentationResponse> {
    try {
      const prompt = [
        {
          text: `Analyze this image and create a segmentation mask for: ${request.query}

Return a JSON object with this exact structure:
{
  "masks": [
    {
      "label": "description of the segmented object",
      "box_2d": [x, y, width, height],
      "mask": "base64-encoded binary mask image"
    }
  ]
}

Only segment the specific object or region requested. The mask should be a binary PNG where white pixels (255) indicate the selected region and black pixels (0) indicate the background.`,
        },
        {
          inlineData: {
            mimeType: 'image/png',
            data: this.stripDataUri(request.image),
          },
        },
      ];

      const response = await this.genAI.models.generateContent({
        model: this.model,
        contents: prompt,
      });

      const candidate = response.candidates?.[0];
      if (!candidate || !candidate.content?.parts?.[0]?.text) {
        throw new Error('No segmentation result returned');
      }

      const responseText = candidate.content.parts[0].text;

      // Try to extract JSON from markdown code block if present
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonText = jsonMatch ? jsonMatch[1] : responseText;

      const parsed = JSON.parse(jsonText) as SegmentationResponse;
      return parsed;
    } catch (error) {
      console.error('Gemini segmentation error:', error);
      throw new AdapterError(
        `Failed to segment image with Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.provider,
        'SEGMENTATION_ERROR',
        error
      );
    }
  }

  private buildEditPrompt(request: EditImageRequest): string {
    const maskInstruction = request.maskImage
      ? '\n\nIMPORTANT: Apply changes ONLY where the mask image shows white pixels (value 255). Leave all other areas completely unchanged. Respect the mask boundaries precisely and maintain seamless blending at the edges.'
      : '';

    return `Edit this image according to the following instruction: ${request.instruction}

Maintain the original image's lighting, perspective, and overall composition. Make the changes look natural and seamlessly integrated.${maskInstruction}

Preserve image quality and ensure the edit looks professional and realistic.`;
  }
}
