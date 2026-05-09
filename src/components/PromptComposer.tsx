import React, { useState, useRef } from 'react';
import { Textarea } from './ui/Textarea';
import { Button } from './ui/Button';
import { useAppStore } from '../store/useAppStore';
import { useImageGeneration, useImageEditing } from '../hooks/useImageGeneration';
import { Upload, Wand2, Edit3, MousePointer, HelpCircle, ChevronDown, ChevronRight, RotateCcw, Sparkles } from 'lucide-react';
import { blobToBase64 } from '../utils/imageUtils';
import { PromptHints } from './PromptHints';
import { cn } from '../utils/cn';

export const PromptComposer: React.FC = () => {
  const {
    currentPrompt,
    setCurrentPrompt,
    selectedTool,
    setSelectedTool,
    temperature,
    setTemperature,
    seed,
    setSeed,
    isGenerating,
    uploadedImages,
    addUploadedImage,
    removeUploadedImage,
    clearUploadedImages,
    editReferenceImages,
    addEditReferenceImage,
    removeEditReferenceImage,
    clearEditReferenceImages,
    canvasImage,
    setCanvasImage,
    showPromptPanel,
    setShowPromptPanel,
    clearBrushStrokes,
    selectedTemplate,
    setSelectedTemplate,
    enhanceEnabled,
    setEnhanceEnabled,
    generationMode,
    setGenerationMode,
    selectedSize,
    setSelectedSize,
  } = useAppStore();

  const { generate } = useImageGeneration();
  const { edit } = useImageEditing();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showHintsModal, setShowHintsModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = () => {
    if (selectedTool === 'generate') {
      if (generationMode === 'image') {
        // Image-to-image mode: use edit API with uploaded image as source
        if (uploadedImages.length === 0) {
          alert('图生图模式需要至少1张参考图片，请先上传图片');
          return;
        }
        // Allow empty prompt when template enhancement is enabled
        if (!currentPrompt.trim() && !enhanceEnabled) {
          alert('请输入修改描述，或启用模板增强功能');
          return;
        }
        // Set canvas image to first uploaded image if not already set
        if (!canvasImage && uploadedImages[0]) {
          setCanvasImage(uploadedImages[0]);
        }
        // Build size instruction based on selected size
        let sizeInstruction = currentPrompt;
        if (selectedSize === '1:1') {
          sizeInstruction = currentPrompt
            ? `${currentPrompt}, square format, 1:1 aspect ratio, equal width and height`
            : 'Convert to square format with 1:1 aspect ratio, equal width and height';
        } else if (selectedSize === '3:4') {
          sizeInstruction = currentPrompt
            ? `${currentPrompt}, portrait format, 3:4 aspect ratio, taller than wide`
            : 'Convert to portrait format with 3:4 aspect ratio, taller than wide';
        }
        // Use edit mutation for image-to-image generation with enhance options and size
        edit({
          instruction: sizeInstruction,
          enhance: {
            enabled: enhanceEnabled,
            template: selectedTemplate,
            quality: 'hd',
            size: selectedSize === '1:1' ? '1024x1024' : selectedSize === '3:4' ? '768x1024' : '1024x1024'
          }
        });
      } else {
        // Text-to-image mode: use generate API (prompt required)
        if (!currentPrompt.trim()) return;
        
        const referenceImages = uploadedImages
          .filter(img => img.includes('base64,'))
          .map(img => img.split('base64,')[1]);
          
        generate({
          prompt: currentPrompt,
          referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
          temperature,
          seed: seed || undefined,
          enhance: {
            enabled: enhanceEnabled,
            template: selectedTemplate,
            quality: 'hd'
          }
        });
      }
    } else if (selectedTool === 'edit' || selectedTool === 'mask') {
      if (!currentPrompt.trim()) return;
      edit({ instruction: currentPrompt });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const base64 = await blobToBase64(file);
        const dataUrl = `data:${file.type};base64,${base64}`;
        
        if (selectedTool === 'generate') {
          // Add to reference images (max 2)
          if (uploadedImages.length < 2) {
            addUploadedImage(dataUrl);
          }
        } else if (selectedTool === 'edit') {
          // For edit mode, add to separate edit reference images (max 2)
          if (editReferenceImages.length < 2) {
            addEditReferenceImage(dataUrl);
          }
          // Set as canvas image if none exists
          if (!canvasImage) {
            setCanvasImage(dataUrl);
          }
        } else if (selectedTool === 'mask') {
          // For mask mode, set as canvas image immediately
          clearUploadedImages();
          addUploadedImage(dataUrl);
          setCanvasImage(dataUrl);
        }
      } catch (error) {
        console.error('Failed to upload image:', error);
      }
    }
  };

  const handleClearSession = () => {
    setCurrentPrompt('');
    clearUploadedImages();
    clearEditReferenceImages();
    clearBrushStrokes();
    setCanvasImage(null);
    setSeed(null);
    setTemperature(0.7);
    setShowClearConfirm(false);
  };

  const tools = [
    { id: 'generate', icon: Wand2, label: 'Generate', description: 'Create from text' },
    { id: 'edit', icon: Edit3, label: 'Edit', description: 'Modify existing' },
    { id: 'mask', icon: MousePointer, label: 'Select', description: 'Click to select' },
  ] as const;

  if (!showPromptPanel) {
    return (
      <div className="w-8 bg-gray-950 border-r border-gray-800 flex flex-col items-center justify-center">
        <button
          onClick={() => setShowPromptPanel(true)}
          className="w-6 h-16 bg-gray-800 hover:bg-gray-700 rounded-r-lg border border-l-0 border-gray-700 flex items-center justify-center transition-colors group"
          title="Show Prompt Panel"
        >
          <div className="flex flex-col space-y-1">
            <div className="w-1 h-1 bg-gray-500 group-hover:bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-500 group-hover:bg-gray-400 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-500 group-hover:bg-gray-400 rounded-full"></div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <>
    <div className="w-80 lg:w-72 xl:w-80 h-full bg-gray-950 border-r border-gray-800 p-6 flex flex-col space-y-6 overflow-y-auto">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-300">Mode</h3>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHintsModal(true)}
              className="h-6 w-6"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPromptPanel(false)}
              className="h-6 w-6"
              title="Hide Prompt Panel"
            >
              ×
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setSelectedTool(tool.id)}
              className={cn(
                'flex flex-col items-center p-3 rounded-lg border transition-all duration-200',
                selectedTool === tool.id
                  ? 'bg-yellow-400/10 border-yellow-400/50 text-yellow-400'
                  : 'bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-300'
              )}
            >
              <tool.icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Generation Mode Switch - Only for Generate Tool */}
      {selectedTool === 'generate' && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-300">Generation Mode</label>
          <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700">
            <button
              onClick={() => setGenerationMode('text')}
              className={cn(
                'flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-all duration-200',
                generationMode === 'text'
                  ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
                  : 'text-gray-400 hover:text-gray-300'
              )}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              文生图
            </button>
            <button
              onClick={() => setGenerationMode('image')}
              className={cn(
                'flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-all duration-200',
                generationMode === 'image'
                  ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
                  : 'text-gray-400 hover:text-gray-300'
              )}
            >
              <Upload className="h-4 w-4 mr-2" />
              图生图
            </button>
          </div>
          <p className="text-xs text-gray-500">
            {generationMode === 'text' 
              ? '✨ 文字生图：通过文本描述生成全新图像' 
              : '🖼️ 图生图：基于上传的图片进行修改和再生成'}
          </p>
        </div>
      )}

      {/* File Upload */}
      <div>
        <div>
          <label className="text-sm font-medium text-gray-300 mb-1 block">
            {selectedTool === 'generate' && generationMode === 'image'
              ? 'Source Image (Required)' 
              : selectedTool === 'generate' 
                ? 'Reference Images (Optional)' 
                : selectedTool === 'edit' 
                  ? 'Style References' 
                  : 'Upload Image'}
          </label>
          {selectedTool === 'mask' && (
            <p className="text-xs text-gray-400 mb-3">Edit an image with masks</p>
          )}
          {selectedTool === 'generate' && generationMode === 'text' && (
            <p className="text-xs text-gray-500 mb-3">Optional style reference images, up to 2 images</p>
          )}
          {selectedTool === 'generate' && generationMode === 'image' && (
            <p className="text-xs text-yellow-500/80 mb-3">Required: Upload 1 source image for image-to-image generation</p>
          )}
          {selectedTool === 'edit' && (
            <p className="text-xs text-gray-500 mb-3">
              {canvasImage ? 'Optional style references, up to 2 images' : 'Upload image to edit, up to 2 images'}
            </p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
            disabled={
              (selectedTool === 'generate' && uploadedImages.length >= 2) ||
              (selectedTool === 'edit' && editReferenceImages.length >= 2)
            }
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
          
          {/* Show uploaded images preview */}
          {((selectedTool === 'generate' && uploadedImages.length > 0) || 
            (selectedTool === 'edit' && editReferenceImages.length > 0)) && (
            <div className="mt-3 space-y-2">
              {(selectedTool === 'generate' ? uploadedImages : editReferenceImages).map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`Reference ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg border border-gray-700"
                  />
                  <button
                    onClick={() => selectedTool === 'generate' ? removeUploadedImage(index) : removeEditReferenceImage(index)}
                    className="absolute top-1 right-1 bg-gray-900/80 text-gray-400 hover:text-gray-200 rounded-full p-1 transition-colors"
                  >
                    ×
                  </button>
                  <div className="absolute bottom-1 left-1 bg-gray-900/80 text-xs px-2 py-1 rounded text-gray-300">
                    Ref {index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Prompt Input */}
      <div>
        <label className="text-sm font-medium text-gray-300 mb-3 block">
          {selectedTool === 'generate' && generationMode === 'image'
            ? `Describe how to modify the source image ${enhanceEnabled ? '(optional with template)' : ''}`
            : selectedTool === 'generate'
              ? 'Describe what you want to create'
              : 'Describe your changes'}
        </label>
        <Textarea
          value={currentPrompt}
          onChange={(e) => setCurrentPrompt(e.target.value)}
          placeholder={
            selectedTool === 'generate' && generationMode === 'image'
              ? enhanceEnabled 
                ? 'Change the background to a modern office, add professional lighting... (or leave empty to use template defaults)'
                : 'Change the background to a modern office, add professional lighting, keep the product angle...'
              : selectedTool === 'generate'
                ? 'A serene mountain landscape at sunset with a lake reflecting the golden sky...'
                : 'Make the sky more dramatic, add storm clouds...'
          }
          className="min-h-[120px] resize-none"
        />
        
        {/* Prompt Quality Indicator */}
        <button 
          onClick={() => setShowHintsModal(true)}
          className="mt-2 flex items-center text-xs hover:text-gray-400 transition-colors group"
        >
          {currentPrompt.length < 20 ? (
            <HelpCircle className="h-3 w-3 mr-2 text-red-500 group-hover:text-red-400" />
          ) : (
            <div className={cn(
              'h-2 w-2 rounded-full mr-2',
              currentPrompt.length < 50 ? 'bg-yellow-500' : 'bg-green-500'
            )} />
          )}
          <span className="text-gray-500 group-hover:text-gray-400">
            {currentPrompt.length < 20 ? 'Add detail for better results' :
             currentPrompt.length < 50 ? 'Good detail level' : 'Excellent prompt detail'}
          </span>
        </button>
      </div>

      {/* E-commerce Template Selector */}
      {selectedTool === 'generate' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300 flex items-center">
              <Sparkles className="h-4 w-4 mr-2 text-yellow-400" />
              E-commerce Template
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enhanceEnabled}
                onChange={(e) => setEnhanceEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-yellow-400 focus:ring-yellow-400"
              />
              <span className="text-xs text-gray-400">Enable</span>
            </label>
          </div>
          
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value as 'auto' | 'white' | 'lifestyle' | 'abstract' | 'feature' | 'user' | 'detail')}
            disabled={!enhanceEnabled}
            className={cn(
              'w-full h-10 px-3 bg-gray-900 border rounded-lg text-sm transition-colors',
              enhanceEnabled 
                ? 'border-gray-700 text-gray-100 cursor-pointer' 
                : 'border-gray-800 text-gray-500 cursor-not-allowed opacity-50'
            )}
          >
            <option value="auto">🎯 Auto Detect</option>
            <option value="white">⚪ White Background (白底图)</option>
            <option value="lifestyle">🏠 Lifestyle Scene (场景图-具象)</option>
            <option value="abstract">🎨 Abstract Scene (场景图-抽象)</option>
            <option value="feature">✨ Feature Showcase (卖点图)</option>
            <option value="user">👤 User Scenario (用户使用图)</option>
            <option value="detail">🔍 Detail Close-up (细节图)</option>
          </select>
          
          {enhanceEnabled && (
            <p className="text-xs text-gray-500">
              {selectedTemplate === 'auto' && 'Auto-detects best template based on your prompt keywords'}
              {selectedTemplate === 'white' && 'Pure white background, professional product catalog style'}
              {selectedTemplate === 'lifestyle' && 'Real-life usage environment, authentic atmosphere'}
              {selectedTemplate === 'abstract' && 'Gradient/marble backgrounds, high-end brand aesthetic'}
              {selectedTemplate === 'feature' && 'Highlight selling points, conversion-optimized layout'}
              {selectedTemplate === 'user' && 'Real user interaction, social proof visual'}
              {selectedTemplate === 'detail' && 'Macro close-up, texture and craftsmanship showcase'}
            </p>
          )}
        </div>
      )}

      {/* Image Size Selection - Only for Image-to-Image Mode */}
      {selectedTool === 'generate' && generationMode === 'image' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">Image Size / Aspect Ratio</label>
            <span className="text-xs text-gray-500">{selectedSize === 'auto' ? 'Auto' : selectedSize === '1:1' ? 'Square (1024×1024)' : 'Portrait (768×1024)'}</span>
          </div>
          <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700">
            <button
              onClick={() => setSelectedSize('auto')}
              className={cn(
                'flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-all duration-200',
                selectedSize === 'auto'
                  ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
                  : 'text-gray-400 hover:text-gray-300'
              )}
            >
              Auto
            </button>
            <button
              onClick={() => setSelectedSize('1:1')}
              className={cn(
                'flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-all duration-200',
                selectedSize === '1:1'
                  ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
                  : 'text-gray-400 hover:text-gray-300'
              )}
            >
              1:1
            </button>
            <button
              onClick={() => setSelectedSize('3:4')}
              className={cn(
                'flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-all duration-200',
                selectedSize === '3:4'
                  ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50'
                  : 'text-gray-400 hover:text-gray-300'
              )}
            >
              3:4
            </button>
          </div>
          <p className="text-xs text-gray-500">
            {selectedSize === 'auto' && 'Use original image dimensions'}
            {selectedSize === '1:1' && 'Generate square image (1024×1024) with equal width and height'}
            {selectedSize === '3:4' && 'Generate portrait image (768×1024) taller than wide'}
          </p>
        </div>
      )}

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={isGenerating || (
          // Text-to-image always requires prompt
          // Image-to-image requires prompt only if template enhancement is disabled
          // Edit/Mask mode always requires prompt
          selectedTool === 'generate' && generationMode === 'text'
            ? !currentPrompt.trim()
            : selectedTool === 'generate' && generationMode === 'image'
              ? !currentPrompt.trim() && !enhanceEnabled
              : !currentPrompt.trim()
        )}
        className="w-full h-14 text-base font-medium"
      >
        {isGenerating ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2" />
            {selectedTool === 'generate' && generationMode === 'image' ? 'Processing Image...' : 'Generating...'}
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4 mr-2" />
            {selectedTool === 'generate' && generationMode === 'image' 
              ? 'Generate from Image' 
              : selectedTool === 'generate' 
                ? 'Generate' 
                : 'Apply Edit'}
          </>
        )}
      </Button>
      
      {/* Hint for empty prompt in image-to-image mode */}
      {selectedTool === 'generate' && generationMode === 'image' && !currentPrompt.trim() && enhanceEnabled && (
        <p className="text-xs text-yellow-400/80 text-center">
          💡 已启用「{selectedTemplate === 'auto' ? '自动检测' : 
            selectedTemplate === 'white' ? '白底图' :
            selectedTemplate === 'lifestyle' ? '场景图' :
            selectedTemplate === 'abstract' ? '抽象场景' :
            selectedTemplate === 'feature' ? '卖点图' :
            selectedTemplate === 'user' ? '用户使用图' :
            selectedTemplate === 'detail' ? '细节图' : '自动检测'}」模板，可直接生成
        </p>
      )}

      {/* Advanced Controls */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center text-sm text-gray-400 hover:text-gray-300 transition-colors duration-200"
        >
          {showAdvanced ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
          {showAdvanced ? 'Hide' : 'Show'} Advanced Controls
        </button>
        
        <button
          onClick={() => setShowClearConfirm(!showClearConfirm)}
          className="flex items-center text-sm text-gray-400 hover:text-red-400 transition-colors duration-200 mt-2"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Clear Session
        </button>
        
        {showClearConfirm && (
          <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-xs text-gray-300 mb-3">
              Are you sure you want to clear this session? This will remove all uploads, prompts, and canvas content.
            </p>
            <div className="flex space-x-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearSession}
                className="flex-1"
              >
                Yes, Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
        
        {showAdvanced && (
          <div className="mt-4 space-y-4">
            {/* Temperature */}
            <div>
              <label className="text-xs text-gray-400 mb-2 block">
                Creativity ({temperature})
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            
            {/* Seed */}
            <div>
              <label className="text-xs text-gray-400 mb-2 block">
                Seed (optional)
              </label>
              <input
                type="number"
                value={seed || ''}
                onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Random"
                className="w-full h-8 px-2 bg-gray-900 border border-gray-700 rounded text-xs text-gray-100"
              />
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts */}
      <div className="pt-4 border-t border-gray-800">
        <h4 className="text-xs font-medium text-gray-400 mb-2">Shortcuts</h4>
        <div className="space-y-1 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>Generate</span>
            <span>⌘ + Enter</span>
          </div>
          <div className="flex justify-between">
            <span>Re-roll</span>
            <span>⇧ + R</span>
          </div>
          <div className="flex justify-between">
            <span>Edit mode</span>
            <span>E</span>
          </div>
          <div className="flex justify-between">
            <span>History</span>
            <span>H</span>
          </div>
          <div className="flex justify-between">
            <span>Toggle Panel</span>
            <span>P</span>
          </div>
        </div>
      </div>
    </div>
    {/* Prompt Hints Modal */}
    <PromptHints open={showHintsModal} onOpenChange={setShowHintsModal} />
    </>
  );
};