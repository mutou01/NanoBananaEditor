import { useMutation } from '@tanstack/react-query';
import {
  getImageAdapter,
  GenerateImageRequest,
  EditImageRequest,
  PromptEnhancementOptions,
} from '../services/imageAdapter';
import { useAppStore } from '../store/useAppStore';
import { generateId } from '../utils/imageUtils';
import { Generation, Edit, Asset } from '../types';
import { enhanceEditInstruction } from '../services/promptTemplates';

/**
 * Hook for image generation using the unified adapter interface
 * Supports multiple providers (Gemini, OpenAI, Custom) through configuration
 */
export const useImageGeneration = () => {
  const { addGeneration, setIsGenerating, setCanvasImage, setCurrentProject, currentProject } = useAppStore();

  const generateMutation = useMutation({
    mutationFn: async (request: GenerateImageRequest) => {
      const adapter = getImageAdapter();

      // Check if adapter supports the required features
      if (!adapter.supportsFeature('generation')) {
        throw new Error(`Provider ${adapter.provider} does not support image generation`);
      }

      const response = await adapter.generateImage(request);
      return response;
    },
    onMutate: () => {
      setIsGenerating(true);
    },
    onSuccess: (response, request) => {
      const images = response.images;

      if (images.length > 0) {
        const adapter = getImageAdapter();
        const outputAssets: Asset[] = images.map((base64) => ({
          id: generateId(),
          type: 'output',
          url: `data:image/png;base64,${base64}`,
          mime: 'image/png',
          width: 1024,
          height: 1024,
          checksum: base64.slice(0, 32),
        }));

        // Build source assets from reference images
        const sourceAssets: Asset[] = request.referenceImages
          ? request.referenceImages.map((img) => ({
              id: generateId(),
              type: 'original' as const,
              url: img.startsWith('data:') ? img : `data:image/png;base64,${img}`,
              mime: 'image/png',
              width: 1024,
              height: 1024,
              checksum: img.slice(0, 32),
            }))
          : [];

        const generation: Generation = {
          id: generateId(),
          prompt: request.prompt,
          parameters: {
            seed: request.seed,
            temperature: request.temperature,
          },
          sourceAssets,
          outputAssets,
          modelVersion: `${adapter.provider}/${adapter.model}`,
          timestamp: Date.now(),
        };

        addGeneration(generation);
        setCanvasImage(outputAssets[0].url);

        // Create project if none exists
        if (!currentProject) {
          const newProject = {
            id: generateId(),
            title: 'Untitled Project',
            generations: [generation],
            edits: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          setCurrentProject(newProject);
        }
      }
      setIsGenerating(false);
    },
    onError: (error) => {
      console.error('Generation failed:', error);
      setIsGenerating(false);
    },
  });

  return {
    generate: generateMutation.mutate,
    isGenerating: generateMutation.isPending,
    error: generateMutation.error,
  };
};

/**
 * Hook for image editing using the unified adapter interface
 */
export const useImageEditing = () => {
  const {
    addEdit,
    setIsGenerating,
    setCanvasImage,
    canvasImage,
    uploadedImages,
    editReferenceImages,
    brushStrokes,
    selectedGenerationId,
    selectedSourceImage,
    currentProject,
    seed,
    temperature,
  } = useAppStore();

  const editMutation = useMutation({
    mutationFn: async ({ instruction, enhance }: { instruction: string; enhance?: PromptEnhancementOptions }) => {
      const adapter = getImageAdapter();

      // Check if adapter supports editing
      if (!adapter.supportsFeature('editing')) {
        throw new Error(`Provider ${adapter.provider} does not support image editing`);
      }

      // Source image priority: 1) user selected, 2) uploaded image, 3) canvas image
      // This follows user intuition: uploaded image is the intended source by default
      const sourceImage = selectedSourceImage || uploadedImages[0] || canvasImage;
      if (!sourceImage) throw new Error('No image to edit');

      // Convert canvas image to base64
      const base64Image = sourceImage.includes('base64,')
        ? sourceImage.split('base64,')[1]
        : sourceImage;

      // Get reference images for style guidance
      let referenceImages = editReferenceImages
        .filter((img) => img.includes('base64,'))
        .map((img) => img.split('base64,')[1]);

      let maskImage: string | undefined;
      let maskedReferenceImage: string | undefined;

      // Create mask from brush strokes if any exist
      if (brushStrokes.length > 0) {
        // Create a temporary image to get actual dimensions
        const tempImg = new Image();
        tempImg.src = sourceImage;
        await new Promise<void>((resolve) => {
          tempImg.onload = () => resolve();
        });

        // Create mask canvas with exact image dimensions
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = tempImg.width;
        canvas.height = tempImg.height;

        // Fill with black (unmasked areas)
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw white strokes (masked areas)
        ctx.strokeStyle = 'white';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        brushStrokes.forEach((stroke) => {
          if (stroke.points.length >= 4) {
            ctx.lineWidth = stroke.brushSize;
            ctx.beginPath();
            ctx.moveTo(stroke.points[0], stroke.points[1]);

            for (let i = 2; i < stroke.points.length; i += 2) {
              ctx.lineTo(stroke.points[i], stroke.points[i + 1]);
            }
            ctx.stroke();
          }
        });

        // Convert mask to base64
        const maskDataUrl = canvas.toDataURL('image/png');
        maskImage = maskDataUrl.split('base64,')[1];

        // Create masked reference image (original image with mask overlay)
        const maskedCanvas = document.createElement('canvas');
        const maskedCtx = maskedCanvas.getContext('2d')!;
        maskedCanvas.width = tempImg.width;
        maskedCanvas.height = tempImg.height;

        // Draw original image
        maskedCtx.drawImage(tempImg, 0, 0);

        // Draw mask overlay with transparency
        maskedCtx.globalCompositeOperation = 'source-over';
        maskedCtx.globalAlpha = 0.4;
        maskedCtx.fillStyle = '#A855F7';

        brushStrokes.forEach((stroke) => {
          if (stroke.points.length >= 4) {
            maskedCtx.lineWidth = stroke.brushSize;
            maskedCtx.strokeStyle = '#A855F7';
            maskedCtx.lineCap = 'round';
            maskedCtx.lineJoin = 'round';
            maskedCtx.beginPath();
            maskedCtx.moveTo(stroke.points[0], stroke.points[1]);

            for (let i = 2; i < stroke.points.length; i += 2) {
              maskedCtx.lineTo(stroke.points[i], stroke.points[i + 1]);
            }
            maskedCtx.stroke();
          }
        });

        maskedCtx.globalAlpha = 1;
        maskedCtx.globalCompositeOperation = 'source-over';

        const maskedDataUrl = maskedCanvas.toDataURL('image/png');
        maskedReferenceImage = maskedDataUrl.split('base64,')[1];

        // Add the masked image as a reference for the model
        referenceImages = [maskedReferenceImage, ...referenceImages];
      }

      // Enhance instruction with e-commerce templates if enabled
      const enhancedInstruction = enhance?.enabled 
        ? enhanceEditInstruction(instruction, enhance)
        : instruction;

      if (enhance?.enabled) {
        console.log('Edit instruction enhanced from:', instruction);
        console.log('To:', enhancedInstruction);
      }

      const request: EditImageRequest = {
        instruction: enhancedInstruction,
        originalImage: base64Image,
        referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
        maskImage,
        temperature,
        seed: seed ?? undefined,
        enhance,
      };

      const response = await adapter.editImage(request);
      return { response, maskedReferenceImage };
    },
    onMutate: () => {
      setIsGenerating(true);
    },
    onSuccess: ({ response, maskedReferenceImage }, variables) => {
      const images = response.images;

      if (images.length > 0) {
        const outputAssets: Asset[] = images.map((base64) => ({
          id: generateId(),
          type: 'output',
          url: `data:image/png;base64,${base64}`,
          mime: 'image/png',
          width: 1024,
          height: 1024,
          checksum: base64.slice(0, 32),
        }));

        // Create mask reference asset if we have one
        const maskReferenceAsset: Asset | undefined = maskedReferenceImage
          ? {
              id: generateId(),
              type: 'mask',
              url: `data:image/png;base64,${maskedReferenceImage}`,
              mime: 'image/png',
              width: 1024,
              height: 1024,
              checksum: maskedReferenceImage.slice(0, 32),
            }
          : undefined;

        const edit: Edit = {
          id: generateId(),
          parentGenerationId:
            selectedGenerationId ||
            currentProject?.generations[currentProject.generations.length - 1]?.id ||
            '',
          maskAssetId: brushStrokes.length > 0 ? generateId() : undefined,
          maskReferenceAsset,
          instruction: variables.instruction,
          outputAssets,
          timestamp: Date.now(),
        };

        addEdit(edit);

        // Automatically load the edited image in the canvas
        const { selectEdit, selectGeneration } = useAppStore.getState();
        setCanvasImage(outputAssets[0].url);
        selectEdit(edit.id);
        selectGeneration(null);
      }
      setIsGenerating(false);
    },
    onError: (error) => {
      console.error('Edit failed:', error);
      setIsGenerating(false);
    },
  });

  return {
    edit: editMutation.mutate,
    isEditing: editMutation.isPending,
    error: editMutation.error,
  };
};

/**
 * Hook for image segmentation using the unified adapter interface
 * Falls back gracefully if the provider doesn't support segmentation
 */
export const useImageSegmentation = () => {
  const { setIsGenerating } = useAppStore();

  const segmentMutation = useMutation({
    mutationFn: async ({ image, query }: { image: string; query: string }) => {
      const adapter = getImageAdapter();

      // Check if adapter supports segmentation
      if (!adapter.supportsFeature('segmentation')) {
        throw new Error(`Provider ${adapter.provider} does not support image segmentation`);
      }

      // Only call segmentImage if the adapter implements it
      if (!adapter.segmentImage) {
        throw new Error('Segmentation method not available on this adapter');
      }

      const base64Image = image.includes('base64,') ? image.split('base64,')[1] : image;

      const response = await adapter.segmentImage({
        image: base64Image,
        query,
      });

      return response;
    },
    onMutate: () => {
      setIsGenerating(true);
    },
    onSuccess: () => {
      setIsGenerating(false);
    },
    onError: (error) => {
      console.error('Segmentation failed:', error);
      setIsGenerating(false);
    },
  });

  return {
    segment: segmentMutation.mutate,
    isSegmenting: segmentMutation.isPending,
    error: segmentMutation.error,
  };
};

/**
 * Hook to get information about the current adapter and its capabilities
 */
export const useAdapterInfo = () => {
  const adapter = getImageAdapter();

  return {
    provider: adapter.provider,
    model: adapter.model,
    supportsGeneration: adapter.supportsFeature('generation'),
    supportsEditing: adapter.supportsFeature('editing'),
    supportsSegmentation: adapter.supportsFeature('segmentation'),
    supportsReferenceImages: adapter.supportsFeature('reference-images'),
    supportsMaskEditing: adapter.supportsFeature('mask-editing'),
    supportsTemperature: adapter.supportsFeature('temperature-control'),
    supportsSeed: adapter.supportsFeature('seed-control'),
    supportsMultiImage: adapter.supportsFeature('multi-image-generation'),
  };
};
