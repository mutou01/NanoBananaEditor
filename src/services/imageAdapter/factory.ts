import { GeminiAdapter } from './geminiAdapter';
import { OpenAIAdapter } from './openAIAdapter';
import {
  IImageAdapter,
  ProviderConfig,
  ConfigurationError,
  ConfigValidationResult,
  ImageSize,
} from './types';

/**
 * Provider type supported by the factory
 */
export type SupportedProvider = 'gemini' | 'openai' | 'custom';

/**
 * Configuration from environment variables
 */
export interface EnvironmentConfig {
  // Provider selection
  IMAGE_PROVIDER: SupportedProvider;

  // Gemini configuration
  VITE_GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;

  // OpenAI/Custom configuration
  IMAGE_API_URL?: string;
  IMAGE_API_KEY?: string;
  IMAGE_MODEL?: string;

  // Multi-model configuration for image-to-image generation
  VITE_GPT_IMAGE_2_API_URL?: string;
  VITE_GPT_IMAGE_2_API_KEY?: string;
  VITE_GPT_55_API_URL?: string;
  VITE_GPT_55_API_KEY?: string;

  // Default parameters (optional)
  IMAGE_DEFAULT_SIZE?: string;
  IMAGE_DEFAULT_TEMPERATURE?: string;
  IMAGE_DEFAULT_N?: string;
}

/**
 * Adapter Factory
 * Creates the appropriate adapter based on configuration
 */
export class AdapterFactory {
  private static adapters: Map<string, IImageAdapter> = new Map();

  /**
   * Create an adapter from environment configuration
   */
  static createFromEnvironment(env: EnvironmentConfig): IImageAdapter {
    const config = this.parseEnvironmentConfig(env);
    return this.create(config);
  }

  /**
   * Create an adapter from ProviderConfig
   */
  static create(config: ProviderConfig): IImageAdapter {
    // Validate configuration
    const validation = this.validateConfig(config);
    if (!validation.valid) {
      throw new ConfigurationError(
        `Invalid configuration: ${validation.errors.join(', ')}`,
        validation.errors
      );
    }

    // Create adapter based on provider
    switch (config.provider) {
      case 'gemini':
        return new GeminiAdapter(config);

      case 'openai':
      case 'custom':
        // Custom providers typically use OpenAI-compatible API format
        return new OpenAIAdapter(config);

      default:
        throw new ConfigurationError(`Unsupported provider: ${config.provider}`);
    }
  }

  /**
   * Get or create a singleton adapter instance
   * Useful for maintaining state across the application
   */
  static getOrCreate(config: ProviderConfig): IImageAdapter {
    const key = `${config.provider}:${config.model}:${config.apiUrl}`;

    if (!this.adapters.has(key)) {
      this.adapters.set(key, this.create(config));
    }

    return this.adapters.get(key)!;
  }

  /**
   * Clear all cached adapter instances
   */
  static clearCache(): void {
    this.adapters.clear();
  }

  /**
   * Parse environment variables into ProviderConfig
   */
  static parseEnvironmentConfig(env: EnvironmentConfig): ProviderConfig {
    const provider = env.IMAGE_PROVIDER || 'gemini';

    switch (provider) {
      case 'gemini':
        return {
          provider: 'gemini',
          apiUrl: 'https://generativelanguage.googleapis.com', // Gemini uses SDK, but we keep this for consistency
          apiKey: env.VITE_GEMINI_API_KEY || '',
          model: env.GEMINI_MODEL || 'gemini-2.5-flash-image-preview',
          defaultParams: {
            temperature: parseFloat(env.IMAGE_DEFAULT_TEMPERATURE || '0.7'),
            size: (env.IMAGE_DEFAULT_SIZE as ImageSize) || '800x800',
            n: parseInt(env.IMAGE_DEFAULT_N || '1', 10),
          },
        };

      case 'openai':
      case 'custom':
        return {
          provider,
          apiUrl: env.IMAGE_API_URL || '',
          apiKey: env.IMAGE_API_KEY || '',
          model: env.IMAGE_MODEL || 'gpt-image-2',
          defaultParams: {
            temperature: parseFloat(env.IMAGE_DEFAULT_TEMPERATURE || '0.7'),
            size: (env.IMAGE_DEFAULT_SIZE as ImageSize) || '800x800',
            n: parseInt(env.IMAGE_DEFAULT_N || '1', 10),
          },
          modelConfig: {
            gptImage2ApiUrl: env.VITE_GPT_IMAGE_2_API_URL,
            gptImage2ApiKey: env.VITE_GPT_IMAGE_2_API_KEY,
            gpt55ApiUrl: env.VITE_GPT_55_API_URL,
            gpt55ApiKey: env.VITE_GPT_55_API_KEY,
          },
        };

      default:
        throw new ConfigurationError(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Validate provider configuration
   */
  static validateConfig(config: ProviderConfig): ConfigValidationResult {
    const errors: string[] = [];

    if (!config.provider) {
      errors.push('Provider is required');
    } else if (!['gemini', 'openai', 'custom'].includes(config.provider)) {
      errors.push(`Unsupported provider: ${config.provider}`);
    }

    if (!config.apiKey) {
      errors.push('API Key is required');
    }

    if (!config.model) {
      errors.push('Model is required');
    }

    // URL validation only for OpenAI/Custom (Gemini uses SDK)
    if (config.provider !== 'gemini') {
      if (!config.apiUrl) {
        errors.push('API URL is required for OpenAI/Custom providers');
      } else {
        try {
          new URL(config.apiUrl);
        } catch {
          errors.push(`Invalid API URL: ${config.apiUrl}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate environment configuration
   */
  static validateEnvironment(env: EnvironmentConfig): ConfigValidationResult {
    const errors: string[] = [];

    const provider = env.IMAGE_PROVIDER || 'gemini';

    switch (provider) {
      case 'gemini':
        if (!env.VITE_GEMINI_API_KEY) {
          errors.push('VITE_GEMINI_API_KEY is required when using Gemini provider');
        }
        break;

      case 'openai':
      case 'custom':
        if (!env.IMAGE_API_URL) {
          errors.push('IMAGE_API_URL is required when using OpenAI/Custom provider');
        }
        if (!env.IMAGE_API_KEY) {
          errors.push('IMAGE_API_KEY is required when using OpenAI/Custom provider');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get available providers and their requirements
   */
  static getProviderInfo(): Array<{
    name: SupportedProvider;
    requiredEnvVars: string[];
    optionalEnvVars: string[];
    description: string;
  }> {
    return [
      {
        name: 'gemini',
        requiredEnvVars: ['VITE_GEMINI_API_KEY'],
        optionalEnvVars: ['GEMINI_MODEL', 'IMAGE_DEFAULT_TEMPERATURE', 'IMAGE_DEFAULT_SIZE'],
        description: 'Google Gemini 2.5 Flash Image model',
      },
      {
        name: 'openai',
        requiredEnvVars: ['IMAGE_API_URL', 'IMAGE_API_KEY'],
        optionalEnvVars: ['IMAGE_MODEL', 'IMAGE_DEFAULT_TEMPERATURE', 'IMAGE_DEFAULT_SIZE'],
        description: 'OpenAI DALL-E or GPT-Image models',
      },
      {
        name: 'custom',
        requiredEnvVars: ['IMAGE_API_URL', 'IMAGE_API_KEY'],
        optionalEnvVars: ['IMAGE_MODEL', 'IMAGE_DEFAULT_TEMPERATURE', 'IMAGE_DEFAULT_SIZE'],
        description: 'Any OpenAI-compatible API endpoint',
      },
    ];
  }
}

/**
 * Convenience function to create adapter from Vite environment
 */
export function createAdapterFromImportMetaEnv(): IImageAdapter {
  const env: EnvironmentConfig = {
    IMAGE_PROVIDER: (import.meta.env.VITE_IMAGE_PROVIDER as SupportedProvider) || 'gemini',
    VITE_GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY as string,
    GEMINI_MODEL: import.meta.env.VITE_GEMINI_MODEL as string,
    IMAGE_API_URL: import.meta.env.VITE_IMAGE_API_URL as string,
    IMAGE_API_KEY: import.meta.env.VITE_IMAGE_API_KEY as string,
    IMAGE_MODEL: import.meta.env.VITE_IMAGE_MODEL as string,
    VITE_GPT_IMAGE_2_API_URL: import.meta.env.VITE_GPT_IMAGE_2_API_URL as string,
    VITE_GPT_IMAGE_2_API_KEY: import.meta.env.VITE_GPT_IMAGE_2_API_KEY as string,
    VITE_GPT_55_API_URL: import.meta.env.VITE_GPT_55_API_URL as string,
    VITE_GPT_55_API_KEY: import.meta.env.VITE_GPT_55_API_KEY as string,
    IMAGE_DEFAULT_SIZE: import.meta.env.VITE_IMAGE_DEFAULT_SIZE as string,
    IMAGE_DEFAULT_TEMPERATURE: import.meta.env.VITE_IMAGE_DEFAULT_TEMPERATURE as string,
    IMAGE_DEFAULT_N: import.meta.env.VITE_IMAGE_DEFAULT_N as string,
  };

  return AdapterFactory.createFromEnvironment(env);
}

/**
 * Singleton adapter instance for application-wide use
 */
let globalAdapter: IImageAdapter | null = null;

/**
 * Get or initialize the global adapter instance
 */
export function getImageAdapter(): IImageAdapter {
  if (!globalAdapter) {
    globalAdapter = createAdapterFromImportMetaEnv();
  }
  return globalAdapter;
}

/**
 * Set a custom adapter instance (useful for testing or custom configurations)
 */
export function setImageAdapter(adapter: IImageAdapter): void {
  globalAdapter = adapter;
}

/**
 * Reset the global adapter (forces re-creation on next getImageAdapter call)
 */
export function resetImageAdapter(): void {
  globalAdapter = null;
  AdapterFactory.clearCache();
}
