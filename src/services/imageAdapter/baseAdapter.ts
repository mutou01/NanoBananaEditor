import {
  IImageAdapter,
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
 * Abstract base class for image generation adapters
 * Implements common functionality and defines required interface
 */
export abstract class BaseImageAdapter implements IImageAdapter {
  protected config: ProviderConfig;

  abstract readonly provider: string;
  abstract readonly model: string;

  // Features supported by this adapter
  protected abstract supportedFeatures: AdapterFeature[];

  constructor(config: ProviderConfig) {
    this.validateConfig(config);
    this.config = config;
  }

  /**
   * Validate provider configuration
   */
  protected validateConfig(config: ProviderConfig): void {
    const errors: string[] = [];

    if (!config.provider) {
      errors.push('Provider is required');
    }

    if (!config.apiUrl) {
      errors.push('API URL is required');
    } else {
      try {
        new URL(config.apiUrl);
      } catch {
        errors.push(`Invalid API URL: ${config.apiUrl}`);
      }
    }

    if (!config.apiKey) {
      errors.push('API Key is required');
    }

    if (!config.model) {
      errors.push('Model is required');
    }

    if (errors.length > 0) {
      throw new AdapterError(
        `Invalid configuration for ${config.provider}: ${errors.join(', ')}`,
        config.provider || 'unknown'
      );
    }
  }

  /**
   * Check if a specific feature is supported
   */
  supportsFeature(feature: AdapterFeature): boolean {
    return this.supportedFeatures.includes(feature);
  }

  /**
   * Get default parameters merged with request parameters
   */
  protected mergeWithDefaults<T extends Record<string, unknown>>(
    requestParams: T
  ): T & Record<string, unknown> {
    return {
      ...this.config.defaultParams,
      ...requestParams,
    } as T & Record<string, unknown>;
  }

  /**
   * Check if the adapter has a default params configuration
   */
  protected hasDefaultParams(): boolean {
    return this.config.defaultParams !== undefined;
  }

  /**
   * Remove data URI prefix from base64 string
   */
  protected stripDataUri(base64String: string): string {
    if (base64String.includes('base64,')) {
      return base64String.split('base64,')[1];
    }
    return base64String;
  }

  /**
   * Add data URI prefix to base64 string
   */
  protected addDataUri(base64String: string, mimeType: string = 'image/png'): string {
    if (base64String.startsWith('data:')) {
      return base64String;
    }
    return `data:${mimeType};base64,${base64String}`;
  }

  /**
   * Abstract method for image generation
   */
  abstract generateImage(request: GenerateImageRequest): Promise<GenerateImageResponse>;

  /**
   * Abstract method for image editing
   */
  abstract editImage(request: EditImageRequest): Promise<EditImageResponse>;

  /**
   * Optional method for image segmentation
   * Default implementation throws error
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  segmentImage(request: SegmentationRequest): Promise<SegmentationResponse> {
    throw new AdapterError(
      'Segmentation is not supported by this provider',
      this.provider,
      'FEATURE_NOT_SUPPORTED'
    );
  }

  /**
   * Make HTTP request with error handling
   */
  protected async makeRequest(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new AdapterError(
          `API request failed: ${response.status} ${response.statusText} - ${errorText}`,
          this.provider,
          `HTTP_${response.status}`
        );
      }

      return response;
    } catch (error) {
      if (error instanceof AdapterError) {
        throw error;
      }

      throw new AdapterError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.provider,
        'NETWORK_ERROR',
        error
      );
    }
  }

  /**
   * Parse SSE (Server-Sent Events) stream
   */
  protected async *parseSSEStream<T>(stream: ReadableStream<Uint8Array>): AsyncGenerator<T> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            try {
              yield JSON.parse(data) as T;
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
