# Repository Guidelines

## Project Structure & Module Organization
- `src/components/`: React components
  - `src/components/ui/`: Reusable UI components (Button, Input, Textarea, etc.)
  - `src/components/PromptComposer.tsx`: Prompt input and tool selection panel
  - `src/components/ImageCanvas.tsx`: Interactive canvas with Konva.js for image display and mask painting
  - `src/components/HistoryPanel.tsx`: Generation history and variant management
  - `src/components/Header.tsx`: Application header and navigation
  - `src/components/InfoModal.tsx`: About modal with links and information
  - `src/components/MaskOverlay.tsx`: Mask painting overlay component
  - `src/components/PromptHints.tsx`: Prompt quality tips and suggestions
  - `src/components/ImagePreviewModal.tsx`: Image preview modal
- `src/services/`: External service integrations
  - `src/services/imageAdapter/`: Unified image generation adapter architecture
    - `types.ts`: Common type definitions for all providers
    - `baseAdapter.ts`: Abstract base class for all adapters
    - `geminiAdapter.ts`: Google Gemini implementation
    - `openAIAdapter.ts`: OpenAI/Custom provider implementation
    - `factory.ts`: Adapter factory for dynamic provider selection
    - `index.ts`: Module exports
  - `src/services/promptTemplates/`: E-commerce prompt enhancement system
    - `ecommerceTemplates.ts`: Professional e-commerce photography templates
    - `enhancer.ts`: Prompt enhancement engine with quality boosters
    - `index.ts`: Module exports
  - `src/services/geminiService.ts`: (Legacy) Google Gemini AI API client
  - `src/services/cacheService.ts`: IndexedDB caching layer for offline asset access
  - `src/services/imageProcessing.ts`: Image manipulation utilities
- `src/store/`: Zustand state management
  - `src/store/useAppStore.ts`: Global application state and actions
- `src/hooks/`: Custom React hooks
  - `src/hooks/useImageGeneration.ts`: Image generation and editing logic with React Query
  - `src/hooks/useKeyboardShortcuts.ts`: Keyboard navigation and shortcuts
- `src/utils/`: Utility functions
  - `src/utils/cn.ts`: Tailwind class name merging utility (clsx + tailwind-merge)
  - `src/utils/imageUtils.ts`: Image processing helpers and ID generation
- `src/types/`: TypeScript type definitions
  - `src/types/index.ts`: Core type definitions (Asset, Generation, Edit, Project, etc.)
- Root configuration files:
  - `vite.config.ts`: Vite build configuration
  - `tailwind.config.js`: Tailwind CSS configuration with custom banana color theme
  - `eslint.config.js`: ESLint configuration with TypeScript and React rules
  - `tsconfig.json`: TypeScript project references
  - `tsconfig.app.json`: Application TypeScript configuration
  - `tsconfig.node.json`: Node-specific TypeScript configuration
  - `postcss.config.js`: PostCSS configuration for Tailwind
  - `index.html`: HTML entry point

## Build, Test, and Development Commands
- Install dependencies: `npm install`
- Start development server: `npm run dev` (runs Vite dev server on default port 5173)
- Build for production: `npm run build` (creates optimized build in `dist/`)
- Preview production build: `npm run preview`
- Run ESLint: `npm run lint`
- Type checking: Uses TypeScript compiler via IDE or `npx tsc --noEmit`

## Before Completing a Task
- Run `npm run lint` to check for ESLint errors
- Ensure TypeScript compiles without errors
- Test keyboard shortcuts functionality
- Verify responsive design on mobile viewport

## Coding Style & Naming Conventions
- TypeScript/React: ESLint + Prettier enforced via `eslint.config.js`
- **Components**: PascalCase (e.g., `PromptComposer.tsx`, `ImageCanvas.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useImageGeneration.ts`, `useKeyboardShortcuts.ts`)
- **Utilities**: camelCase (e.g., `cn.ts`, `imageUtils.ts`)
- **Types/Interfaces**: PascalCase (e.g., `Asset`, `Generation`, `Edit`, `Project`)
- **File names**: Kebab-case or PascalCase depending on content (components use PascalCase)
- Keep components focused and under 200 lines where possible
- Use strict TypeScript typing with proper interface definitions
- Prefer functional components with hooks over class components
- Use Tailwind CSS for styling with custom `banana` color theme for branding

## Key Dependencies & Patterns
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS v3 with custom color palette (banana yellow accent)
- **State Management**: 
  - Zustand for global application state
  - React Query (TanStack Query) for server state and API calls
- **Canvas**: Konva.js for interactive image display and mask painting
- **AI Integration**: Google Generative AI SDK (`@google/genai`) with Gemini 2.5 Flash Image
- **Storage**: IndexedDB via `idb-keyval` for offline asset caching
- **UI Components**: Radix UI primitives for accessible components
- **Icons**: Lucide React
- **Utilities**: 
  - `clsx` + `tailwind-merge` for class name handling
  - `class-variance-authority` for component variants
  - `fabric` for advanced canvas operations

## Environment Variables
- Copy `.env.example` to `.env` for local development

### Provider Selection
- `VITE_IMAGE_PROVIDER`: Choose the image generation provider (`gemini`, `openai`, `custom`)

### Gemini Provider (Default)
- `VITE_GEMINI_API_KEY`: Google AI Studio API key
- `VITE_GEMINI_MODEL`: Model name (default: `gemini-2.5-flash-image-preview`)

### OpenAI/Custom Provider
- `VITE_IMAGE_API_URL`: API endpoint URL (e.g., `https://freeapi.dgbmc.top/v1/images/generations`)
- `VITE_IMAGE_API_KEY`: API key for the service
- `VITE_IMAGE_MODEL`: Model name (e.g., `gpt-image-2`)

### Default Parameters (Optional)
- `VITE_IMAGE_DEFAULT_SIZE`: Default image size (`1024x1024`, `1024x1536`, `1536x1024`)
- `VITE_IMAGE_DEFAULT_TEMPERATURE`: Creativity control (0.0 - 1.0)
- `VITE_IMAGE_DEFAULT_N`: Number of images to generate per request

Note: In production, API calls should go through a backend proxy

## Testing Guidelines
- Ensure `npm run lint` passes without errors
- Run TypeScript checks to ensure type safety
- Test keyboard shortcuts (see README for full list):
  - `Cmd/Ctrl + Enter`: Generate/Apply Edit
  - `Shift + R`: Re-roll variants
  - `E`: Switch to Edit mode
  - `G`: Switch to Generate mode
  - `M`: Switch to Select/Mask mode
  - `H`: Toggle history panel
  - `P`: Toggle prompt panel
- Test responsive design at various viewport sizes
- Verify canvas zoom and pan functionality
- Test mask painting with different brush sizes

## Security & Config Tips
- Never commit the `.env` file with API keys
- Use `.env.example` as a template for required environment variables
- API calls are currently client-side (implement backend proxy for production)
- Generated images include SynthID watermarks via Gemini API

## Project Features
- **Text-to-Image Generation**: Create images from descriptive prompts using Gemini
- **Conversational Editing**: Modify images using natural language instructions
- **Region-Aware Selection**: Paint masks to target specific areas for editing
- **Reference Images**: Support up to 2 reference images for generation and editing
- **Generation History**: Track all creations with full undo/redo and branching
- **Variant Comparison**: Generate and compare multiple versions side-by-side
- **Keyboard Shortcuts**: Efficient workflow with comprehensive hotkeys
- **Mobile Optimized**: Responsive design for all devices
- **Offline Caching**: IndexedDB storage for asset access without internet

## Image Adapter Architecture

The project uses a unified adapter architecture for "plug-and-play" model support:

### Adding a New Provider

1. **Create a new adapter** in `src/services/imageAdapter/`:
```typescript
export class MyProviderAdapter extends BaseImageAdapter {
  readonly provider = 'myprovider';
  protected supportedFeatures: AdapterFeature[] = ['generation', 'editing'];

  async generateImage(request: GenerateImageRequest): Promise<GenerateImageResponse> {
    // Implementation
  }

  async editImage(request: EditImageRequest): Promise<EditImageResponse> {
    // Implementation
  }
}
```

2. **Register in the factory** (`src/services/imageAdapter/factory.ts`):
```typescript
case 'myprovider':
  return new MyProviderAdapter(config);
```

3. **Add environment variables** to `.env.example`:
```
VITE_IMAGE_PROVIDER=myprovider
VITE_MYPROVIDER_API_URL=
VITE_MYPROVIDER_API_KEY=
VITE_MYPROVIDER_MODEL=
```

### Adapter Features

Adapters can declare support for features via `supportedFeatures`:
- `generation`: Basic image generation
- `editing`: Image editing capabilities
- `segmentation`: Automatic mask generation
- `reference-images`: Support for reference/style images
- `mask-editing`: Support for mask-based editing
- `temperature-control`: Creativity/quality parameter
- `seed-control`: Reproducible generation
- `multi-image-generation`: Generate multiple images at once

### Usage in Components

```typescript
import { getImageAdapter, useAdapterInfo } from '../services/imageAdapter';

// Get adapter info
const { provider, model, supportsEditing } = useAdapterInfo();

// Use adapter directly
const adapter = getImageAdapter();
const result = await adapter.generateImage({ prompt: "A red apple" });
```

## License
- **License**: GNU Affero General Public License v3.0 (AGPL-3.0)
- Copyright 2025 Mark Fulton
- Free to use for personal and commercial projects with proper attribution
- Any modifications must be shared under the same license
