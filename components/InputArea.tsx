
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useCallback, useState } from 'react';
import { DocumentIcon, DocumentMagnifyingGlassIcon, CpuChipIcon, ArrowLeftIcon, PlayIcon } from '@heroicons/react/24/outline';

interface InputAreaProps {
  onGenerate: (page: number, file: File) => void;
  isGenerating: boolean;
  disabled?: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onGenerate, isGenerating, disabled = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      alert("Please upload an image or PDF document.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isGenerating) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [disabled, isGenerating]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (!disabled && !isGenerating) {
      setIsDragging(true);
    }
  }, [disabled, isGenerating]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleStartScan = () => {
    if (selectedFile) {
      onGenerate(pageNumber, selectedFile);
    }
  };

  const resetSelection = () => {
    setSelectedFile(null);
    setPageNumber(1);
  };

  // Step 1: File Upload
  if (!selectedFile) {
    return (
      <div className="w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className={`relative group transition-all duration-300 ${isDragging ? 'scale-[1.01]' : ''}`}>
          <label
            className={`
              relative flex flex-col items-center justify-center
              h-64 sm:h-72
              bg-zinc-900/30 
              backdrop-blur-sm
              rounded-2xl border border-dashed
              cursor-pointer overflow-hidden
              transition-all duration-300
              ${isDragging 
                ? 'border-cyan-500 bg-zinc-900/50 shadow-[inset_0_0_20px_rgba(34,211,238,0.1)]' 
                : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900/40'
              }
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '32px 32px'}}>
            </div>
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
              <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center transition-transform duration-500 ${isDragging ? 'scale-110' : 'group-hover:-translate-y-1'}`}>
                <div className="absolute inset-0 rounded-2xl bg-zinc-800 border border-zinc-700 shadow-xl flex items-center justify-center">
                  <DocumentMagnifyingGlassIcon className={`w-10 h-10 text-zinc-300 transition-all duration-300 ${isDragging ? '-translate-y-1 text-cyan-400' : ''}`} />
                </div>
              </div>

              <div className="space-y-2 px-6">
                <h3 className="text-2xl sm:text-3xl text-zinc-100 font-bold tracking-tighter">
                  Drop file to <span className="text-cyan-400">Scan</span>
                </h3>
                <p className="text-zinc-500 text-sm font-light tracking-wide">
                  Select a PDF or High-Res Image to begin extraction
                </p>
              </div>
            </div>

            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>
      </div>
    );
  }

  // Step 2: Page Selection
  return (
    <div className="w-full max-w-xl mx-auto animate-in zoom-in-95 fade-in duration-300">
      <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
        
        <div className="flex flex-col items-center space-y-8">
          {/* File Card */}
          <div className="flex items-center gap-4 bg-zinc-800/50 border border-zinc-700/50 p-4 rounded-xl w-full">
            <div className="p-3 bg-cyan-500/10 rounded-lg">
              <DocumentIcon className="w-8 h-8 text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-zinc-100 font-medium truncate text-sm">{selectedFile.name}</h4>
              <p className="text-zinc-500 text-xs mt-0.5 uppercase tracking-wider font-mono">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type.split('/')[1].toUpperCase()}
              </p>
            </div>
            <button 
              onClick={resetSelection}
              disabled={isGenerating}
              className="p-2 text-zinc-500 hover:text-white transition-colors hover:bg-zinc-700/50 rounded-lg"
              title="Change File"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="w-full space-y-6">
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] ml-1">Specify Page Number</label>
                {selectedFile.type === 'application/pdf' ? (
                  <span className="text-[10px] text-zinc-600 italic">Enter the page index to scan</span>
                ) : (
                  <span className="text-[10px] text-cyan-500/50 italic">Image detected: defaults to 1</span>
                )}
              </div>
              <input 
                type="number" 
                min="1" 
                value={pageNumber}
                disabled={isGenerating || selectedFile.type.startsWith('image/')}
                onChange={(e) => setPageNumber(parseInt(e.target.value) || 1)}
                className="bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-4 text-white w-full text-center text-2xl font-bold focus:outline-none focus:border-cyan-500 transition-all focus:ring-1 focus:ring-cyan-500/20 disabled:opacity-50"
                placeholder="1"
              />
            </div>

            <button
              onClick={handleStartScan}
              disabled={isGenerating}
              className={`
                w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold tracking-tight transition-all
                ${isGenerating 
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                  : 'bg-cyan-500 hover:bg-cyan-400 text-zinc-950 shadow-lg shadow-cyan-500/20 active:scale-[0.98]'
                }
              `}
            >
              {isGenerating ? (
                <>
                  <CpuChipIcon className="w-5 h-5 animate-spin" />
                  ANALYZING PAGE {pageNumber}...
                </>
              ) : (
                <>
                  <PlayIcon className="w-5 h-5 fill-current" />
                  SCAN PAGE {pageNumber}
                </>
              )}
            </button>
          </div>

          <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-medium">
            Step 2 of 2: Neural Recognition
          </p>
        </div>
      </div>
    </div>
  );
};
