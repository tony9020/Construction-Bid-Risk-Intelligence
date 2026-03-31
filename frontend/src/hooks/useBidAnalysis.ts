import { useState, useCallback } from 'react';
import { BidAnalysis } from '../types/bid';

interface UseBidAnalysisReturn {
  data: BidAnalysis | null;
  loading: boolean;
  error: string | null;
  analyze: (file: File) => Promise<void>;
  reset: () => void;
}

export const useBidAnalysis = (): UseBidAnalysisReturn => {
  const [data, setData] = useState<BidAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (file: File) => {
    // Reset state
    setData(null);
    setError(null);
    setLoading(true);

    // Validate file
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file only');
      setLoading(false);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('Making API request to: http://localhost:8000/analyze');
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('Error data:', errorData);
        let errorMessage = 'Analysis failed';

        switch (response.status) {
          case 400:
            errorMessage = errorData.error || 'Could not extract text from this PDF';
            break;
          case 422:
            errorMessage = errorData.error || 'AI returned unexpected data format';
            break;
          case 502:
            errorMessage = errorData.error || 'Gemini API error — check your API key';
            break;
          case 500:
            errorMessage = errorData.error || 'Internal server error';
            break;
          default:
            errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        }

        throw new Error(errorMessage);
      }

      const result: BidAnalysis = await response.json();
      console.log('Analysis result:', result);
      console.log('Result type:', typeof result);
      console.log('Has entities:', result.entities && Array.isArray(result.entities));
      console.log('Entity count:', result.entities?.length);
      console.log('Project name:', result.project_name);
      setData(result);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.log('Caught error:', err);
      console.log('Error message:', errorMessage);
      setError(errorMessage);
    } finally {
      console.log('Finally block - setting loading to false');
      console.log('Current data state:', data);
      console.log('Current error state:', error);
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    analyze,
    reset,
  };
};
