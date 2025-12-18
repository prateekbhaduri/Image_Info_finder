
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useRef } from 'react';
import { Hero } from './components/Hero';
import { InputArea } from './components/InputArea';
import { LivePreview, ExtractedItem } from './components/LivePreview';
import { detectVisualElements } from './services/gemini';

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

const App: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const getPageImage = async (file: File, pageNum: number): Promise<string> => {
    if (file.type.startsWith('image/')) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
        });
    }

    if (!window.pdfjsLib) throw new Error("PDF Library missing");

    const data = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data }).promise;
    
    const pageCount = pdf.numPages;
    const actualPageNum = Math.min(Math.max(1, pageNum), pageCount);
    
    const page = await pdf.getPage(actualPageNum);
    const viewport = page.getViewport({ scale: 2.0 }); // High res for extraction
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context!, viewport }).promise;
    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const handleScan = async (pageNumber: number, file?: File) => {
    if (!file) return;

    setIsGenerating(true);
    setShowPreview(true);
    setExtractedItems([]);

    try {
      const pageDataUrl = await getPageImage(file, pageNumber);
      setOriginalImage(pageDataUrl);

      // 1. Detection call
      const base64ForGemini = pageDataUrl.split(',')[1];
      const detections = await detectVisualElements(base64ForGemini);

      // 2. Client-side cropping
      const img = new Image();
      img.src = pageDataUrl;
      await new Promise(r => img.onload = r);

      const items: ExtractedItem[] = [];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      for (const det of detections) {
        const [ymin, xmin, ymax, xmax] = det.box_2d;
        
        // Convert normalized to pixel coordinates
        const left = (xmin / 1000) * img.width;
        const top = (ymin / 1000) * img.height;
        const width = ((xmax - xmin) / 1000) * img.width;
        const height = ((ymax - ymin) / 1000) * img.height;

        canvas.width = width;
        canvas.height = height;
        ctx?.clearRect(0, 0, width, height);
        ctx?.drawImage(img, left, top, width, height, 0, 0, width, height);

        items.push({
            id: crypto.randomUUID(),
            label: det.label,
            dataUrl: canvas.toDataURL('image/jpeg', 0.9),
            description: det.description
        });
      }

      setExtractedItems(items);

    } catch (error) {
      console.error("Scanning failed:", error);
      alert("Extraction failed. Check the console for details.");
      setShowPreview(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setShowPreview(false);
    setIsGenerating(false);
    setExtractedItems([]);
    setOriginalImage(null);
  };

  return (
    <div className="h-[100dvh] bg-zinc-950 bg-dot-grid text-zinc-50 selection:bg-cyan-500/30 overflow-y-auto overflow-x-hidden relative flex flex-col">
      <div 
        className={`
          min-h-full flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 relative z-10 
          transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1)
          ${showPreview 
            ? 'opacity-0 scale-95 blur-sm pointer-events-none' 
            : 'opacity-100 scale-100 blur-0'
          }
        `}
      >
        <div className="flex-1 flex flex-col justify-center items-center w-full py-12 md:py-20">
          <div className="text-center relative z-10 max-w-6xl mx-auto px-4 pt-8 mb-12">
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold tracking-tighter text-white mb-6 leading-[1.1]">
              Image Info <br/>
              <span className="underline decoration-4 decoration-cyan-500 underline-offset-4 md:underline-offset-8 text-white">Extractor</span>.
            </h1>
            <p className="text-base sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed font-light">
              Deep-scan documents to identify and extract visual assets. Powered by Gemini 3's advanced spatial reasoning for pixel-perfect extraction.
            </p>
          </div>

          <div className="w-full flex justify-center mb-8">
              <InputArea onGenerate={handleScan} isGenerating={isGenerating} disabled={showPreview} />
          </div>
        </div>
        
        <div className="flex-shrink-0 pb-12 w-full mt-auto flex flex-col items-center">
            <a 
              href="https://x.com/ammaar" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-zinc-600 hover:text-zinc-400 text-xs font-mono transition-colors"
            >
              Created by @ammaar
            </a>
        </div>
      </div>

      <LivePreview
        originalImage={originalImage}
        items={extractedItems}
        isLoading={isGenerating}
        isFocused={showPreview}
        onReset={handleReset}
      />
    </div>
  );
};

export default App;
