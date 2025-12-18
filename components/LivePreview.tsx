
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, SparklesIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { explainExtractedImage } from '../services/gemini';

export interface ExtractedItem {
  id: string;
  label: string;
  dataUrl: string;
  description: string;
}

interface LivePreviewProps {
  originalImage: string | null;
  items: ExtractedItem[];
  isLoading: boolean;
  isFocused: boolean;
  onReset: () => void;
}

const ExplanationPanel = ({ item, onClose }: { item: ExtractedItem, onClose: () => void }) => {
    const [explanation, setExplanation] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getExp = async () => {
            setLoading(true);
            const exp = await explainExtractedImage(item.dataUrl.split(',')[1], item.label);
            setExplanation(exp);
            setLoading(false);
        };
        getExp();
    }, [item]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#121214] border border-zinc-800 w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-cyan-400" />
                        <h2 className="text-lg font-bold text-white tracking-tight">{item.label} Analysis</h2>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-8">
                    <div className="md:w-1/2 flex items-center justify-center bg-zinc-950 rounded-xl p-4 border border-zinc-900">
                        <img src={item.dataUrl} alt={item.label} className="max-w-full max-h-[40vh] md:max-h-full object-contain rounded" />
                    </div>
                    <div className="md:w-1/2">
                        {loading ? (
                            <div className="space-y-4">
                                <div className="h-4 bg-zinc-800 rounded w-3/4 animate-pulse"></div>
                                <div className="h-4 bg-zinc-800 rounded w-full animate-pulse"></div>
                                <div className="h-4 bg-zinc-800 rounded w-5/6 animate-pulse"></div>
                                <div className="h-4 bg-zinc-800 rounded w-2/3 animate-pulse"></div>
                            </div>
                        ) : (
                            <div className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                {explanation}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const LivePreview: React.FC<LivePreviewProps> = ({ originalImage, items, isLoading, isFocused, onReset }) => {
    const [selectedItem, setSelectedItem] = useState<ExtractedItem | null>(null);

    return (
        <div className={`
            fixed z-40 flex flex-col
            rounded-lg overflow-hidden border border-zinc-800 bg-[#0E0E10] shadow-2xl
            transition-all duration-700 cubic-bezier(0.2, 0.8, 0.2, 1)
            ${isFocused
              ? 'inset-2 md:inset-4 opacity-100 scale-100'
              : 'top-1/2 left-1/2 w-0 h-0 opacity-0 pointer-events-none'
            }
        `}>
            {/* Header */}
            <div className="bg-[#121214] px-6 py-4 flex items-center justify-between border-b border-zinc-800 shrink-0">
                <div className="flex items-center space-x-4">
                    <button onClick={onReset} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors text-xs font-mono">
                        <XMarkIcon className="w-4 h-4" />
                        EXIT SCAN
                    </button>
                    <div className="h-4 w-px bg-zinc-800"></div>
                    <div className="flex items-center gap-2">
                        <MagnifyingGlassIcon className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                            {isLoading ? 'Scanning Page...' : `${items.length} Elements Discovered`}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden bg-black">
                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                        <div className="relative w-24 h-24">
                            <div className="absolute inset-0 border-2 border-cyan-500/20 rounded-full animate-ping"></div>
                            <div className="absolute inset-0 border-t-2 border-cyan-500 rounded-full animate-spin"></div>
                        </div>
                        <p className="text-cyan-400 font-mono text-sm tracking-[0.2em] animate-pulse">INITIALIZING NEURAL EXTRACTION</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                        {/* Source Side */}
                        <div className="w-full md:w-1/2 bg-zinc-950/50 p-6 flex items-center justify-center border-b md:border-b-0 md:border-r border-zinc-800 relative">
                             <div className="absolute top-4 left-4 text-[10px] font-mono text-zinc-600 uppercase">Source Page</div>
                             {originalImage && <img src={originalImage} className="max-w-full max-h-full object-contain opacity-40 grayscale" alt="Original" />}
                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                 <div className="w-full h-full p-6 relative">
                                    {/* Extraction Grid Overlay could go here */}
                                 </div>
                             </div>
                        </div>

                        {/* Results Side */}
                        <div className="w-full md:w-1/2 p-6 overflow-y-auto space-y-6 bg-zinc-900/10">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {items.map((item) => (
                                    <div 
                                        key={item.id}
                                        className="group relative bg-[#121214] border border-zinc-800 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all cursor-pointer flex flex-col"
                                        onClick={() => setSelectedItem(item)}
                                    >
                                        <div className="aspect-video bg-black flex items-center justify-center p-4">
                                            <img src={item.dataUrl} alt={item.label} className="max-w-full max-h-full object-contain" />
                                        </div>
                                        <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
                                            <div>
                                                <h4 className="text-xs font-bold text-white truncate">{item.label}</h4>
                                                <p className="text-[10px] text-zinc-500 truncate mt-1">{item.description}</p>
                                            </div>
                                            <div className="p-2 rounded-lg bg-zinc-800 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <InformationCircleIcon className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {items.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-3">
                                    <InformationCircleIcon className="w-12 h-12 opacity-20" />
                                    <p className="text-sm font-mono uppercase tracking-widest">No visual elements detected</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {selectedItem && <ExplanationPanel item={selectedItem} onClose={() => setSelectedItem(null)} />}
        </div>
    );
};
