import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Project, Generation, Edit, SegmentationMask, BrushStroke } from '../types';
import { generateId } from '../utils/imageUtils';

interface AppState {
  // Current project
  currentProject: Project | null;
  
  // Canvas state
  canvasImage: string | null;
  canvasZoom: number;
  canvasPan: { x: number; y: number };
  
  // Upload state
  uploadedImages: string[];
  editReferenceImages: string[];
  
  // Brush strokes for painting masks
  brushStrokes: BrushStroke[];
  brushSize: number;
  showMasks: boolean;
  
  // Generation state
  isGenerating: boolean;
  currentPrompt: string;
  temperature: number;
  seed: number | null;
  
  // History and variants
  selectedGenerationId: string | null;
  selectedEditId: string | null;
  showHistory: boolean;
  
  // Panel visibility
  showPromptPanel: boolean;
  
  // UI state
  selectedTool: 'generate' | 'edit' | 'mask';
  
  // Prompt template state
  selectedTemplate: 'auto' | 'white' | 'lifestyle' | 'abstract' | 'feature' | 'user' | 'detail';
  enhanceEnabled: boolean;
  
  // Generation mode: text-to-image or image-to-image
  generationMode: 'text' | 'image';
  
  // Source image selection for image-to-image mode
  // When null, use uploadedImages[0] as default (new priority)
  // When set, use canvasImage as source (user manually selected)
  selectedSourceImage: string | null;
  
  // Image size/aspect ratio for generation
  selectedSize: 'auto' | '1:1' | '3:4';

  // Model selection for image-to-image generation
  selectedModel: 'gpt-image-2' | 'gpt-5.5';

  // Actions
  setCurrentProject: (project: Project | null) => void;
  
  setSelectedTemplate: (template: 'auto' | 'white' | 'lifestyle' | 'abstract' | 'feature' | 'user' | 'detail') => void;
  setEnhanceEnabled: (enabled: boolean) => void;
  setGenerationMode: (mode: 'text' | 'image') => void;
  setSelectedSourceImage: (url: string | null) => void;
  setSelectedSize: (size: 'auto' | '1:1' | '3:4') => void;
  setSelectedModel: (model: 'gpt-image-2' | 'gpt-5.5') => void;
  setCanvasImage: (url: string | null) => void;
  setCanvasZoom: (zoom: number) => void;
  setCanvasPan: (pan: { x: number; y: number }) => void;
  
  addUploadedImage: (url: string) => void;
  removeUploadedImage: (index: number) => void;
  clearUploadedImages: () => void;
  
  addEditReferenceImage: (url: string) => void;
  removeEditReferenceImage: (index: number) => void;
  clearEditReferenceImages: () => void;
  
  addBrushStroke: (stroke: BrushStroke) => void;
  clearBrushStrokes: () => void;
  setBrushSize: (size: number) => void;
  setShowMasks: (show: boolean) => void;
  
  setIsGenerating: (generating: boolean) => void;
  setCurrentPrompt: (prompt: string) => void;
  setTemperature: (temp: number) => void;
  setSeed: (seed: number | null) => void;
  
  addGeneration: (generation: Generation) => void;
  addEdit: (edit: Edit) => void;
  removeGeneration: (id: string) => void;
  removeEdit: (id: string) => void;
  selectGeneration: (id: string | null) => void;
  selectEdit: (id: string | null) => void;
  setShowHistory: (show: boolean) => void;
  
  setShowPromptPanel: (show: boolean) => void;
  
  setSelectedTool: (tool: 'generate' | 'edit' | 'mask') => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentProject: null,
      canvasImage: null,
      canvasZoom: 1,
      canvasPan: { x: 0, y: 0 },
      
      uploadedImages: [],
      editReferenceImages: [],
      
      brushStrokes: [],
      brushSize: 20,
      showMasks: true,
      
      isGenerating: false,
      currentPrompt: '',
      temperature: 0.7,
      seed: null,
      
      selectedGenerationId: null,
      selectedEditId: null,
      showHistory: true,
      
      showPromptPanel: true,
      
      selectedTool: 'generate',
      
      // Prompt template initial state
      selectedTemplate: 'auto',
      enhanceEnabled: true,
      
      // Generation mode initial state (default to text-to-image)
      generationMode: 'text',
      
      // Source image selection initial state (null = use uploaded image as default)
      selectedSourceImage: null,
      
      // Image size initial state (default to 1:1 for 800x800)
      selectedSize: '1:1',

      // Model selection initial state (default to gpt-image-2)
      selectedModel: 'gpt-image-2',

      // Actions
      setCurrentProject: (project) => set({ currentProject: project }),
      setCanvasImage: (url) => set({ canvasImage: url }),
      setCanvasZoom: (zoom) => set({ canvasZoom: zoom }),
      setCanvasPan: (pan) => set({ canvasPan: pan }),
      
      addUploadedImage: (url) => set((state) => ({ 
        uploadedImages: [...state.uploadedImages, url] 
      })),
      removeUploadedImage: (index) => set((state) => ({ 
        uploadedImages: state.uploadedImages.filter((_, i) => i !== index) 
      })),
      clearUploadedImages: () => set({ uploadedImages: [] }),
      
      addEditReferenceImage: (url) => set((state) => ({ 
        editReferenceImages: [...state.editReferenceImages, url] 
      })),
      removeEditReferenceImage: (index) => set((state) => ({ 
        editReferenceImages: state.editReferenceImages.filter((_, i) => i !== index) 
      })),
      clearEditReferenceImages: () => set({ editReferenceImages: [] }),
      
      addBrushStroke: (stroke) => set((state) => ({ 
        brushStrokes: [...state.brushStrokes, stroke] 
      })),
      clearBrushStrokes: () => set({ brushStrokes: [] }),
      setBrushSize: (size) => set({ brushSize: size }),
      setShowMasks: (show) => set({ showMasks: show }),
      
      setIsGenerating: (generating) => set({ isGenerating: generating }),
      setCurrentPrompt: (prompt) => set({ currentPrompt: prompt }),
      setTemperature: (temp) => set({ temperature: temp }),
      setSeed: (seed) => set({ seed: seed }),
      
      addGeneration: (generation) => set((state) => ({
        currentProject: state.currentProject ? {
          ...state.currentProject,
          generations: [...state.currentProject.generations, generation],
          updatedAt: Date.now()
        } : null
      })),
      
      addEdit: (edit) => set((state) => {
        // If no current project, create one with this edit
        if (!state.currentProject) {
          const newProject = {
            id: generateId(),
            title: 'Untitled Project',
            generations: [],
            edits: [edit],
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          return { currentProject: newProject };
        }
        // Otherwise add to existing project
        return {
          currentProject: {
            ...state.currentProject,
            edits: [...state.currentProject.edits, edit],
            updatedAt: Date.now()
          }
        };
      }),
      
      removeGeneration: (id) => set((state) => {
        if (!state.currentProject) return state;
        const newGenerations = state.currentProject.generations.filter(g => g.id !== id);
        const wasSelected = state.selectedGenerationId === id;
        return {
          currentProject: {
            ...state.currentProject,
            generations: newGenerations,
            updatedAt: Date.now()
          },
          ...(wasSelected ? { selectedGenerationId: null } : {})
        };
      }),
      
      removeEdit: (id) => set((state) => {
        if (!state.currentProject) return state;
        const newEdits = state.currentProject.edits.filter(e => e.id !== id);
        const wasSelected = state.selectedEditId === id;
        return {
          currentProject: {
            ...state.currentProject,
            edits: newEdits,
            updatedAt: Date.now()
          },
          ...(wasSelected ? { selectedEditId: null } : {})
        };
      }),
      
      selectGeneration: (id) => set({ selectedGenerationId: id }),
      selectEdit: (id) => set({ selectedEditId: id }),
      setShowHistory: (show) => set({ showHistory: show }),
      
      setShowPromptPanel: (show) => set({ showPromptPanel: show }),
      
      setSelectedTool: (tool) => set({ selectedTool: tool }),
      
      setSelectedTemplate: (template) => set({ selectedTemplate: template }),
      setEnhanceEnabled: (enabled) => set({ enhanceEnabled: enabled }),
      setGenerationMode: (mode) => set({ generationMode: mode }),
      setSelectedSourceImage: (url) => set({ selectedSourceImage: url }),
      setSelectedSize: (size) => set({ selectedSize: size }),
      setSelectedModel: (model) => set({ selectedModel: model }),
    }),
    { name: 'nano-banana-store' }
  )
);