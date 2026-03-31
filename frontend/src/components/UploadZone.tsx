import React, { useCallback, useState } from 'react';
import { useBidAnalysis } from '../hooks/useBidAnalysis';

interface UploadZoneProps {
  onAnalysisComplete: () => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onAnalysisComplete }) => {
  const { analyze, loading, error, reset } = useBidAnalysis();
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string>('');

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name);
    await analyze(file);
    onAnalysisComplete();
  }, [analyze, onAnalysisComplete]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleRetry = useCallback(() => {
    reset();
    setFileName('');
  }, [reset]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-8">
        <div className="w-full max-w-md">
          <div className="border-2 border-dashed border-red-500 rounded-xl p-8 text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-400 mb-2">Upload Failed</h3>
            <p className="text-red-300 text-sm mb-6">{error}</p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-8">
        <div className="w-full max-w-md">
          <div className="border-2 border-dashed border-blue-500 rounded-xl p-8 text-center">
            <div className="mb-6">
              <div className="flex justify-center space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Gemini is analyzing your bid document...</h3>
            <p className="text-slate-500 text-sm mb-2">Extracting entities from {fileName}</p>
            <p className="text-slate-600 text-xs">Large documents may take 30–60 seconds</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-8">
      <div className="w-full max-w-md">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById('file-input')?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-blue-500 bg-slate-800/50'
              : 'border-slate-600 hover:border-blue-500 hover:bg-slate-800/50'
          }`}
        >
          <input
            id="file-input"
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-slate-300 mb-2">
            Drop your bid document here
          </h3>
          
          <p className="text-slate-500 text-sm mb-3">
            PDF files only · up to 50MB
          </p>
          
          <div className="flex items-center justify-center space-x-2">
            <span className="text-slate-600 text-xs">Powered by</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-slate-600 text-xs">Powered by Gemini 2.5 Flash</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
