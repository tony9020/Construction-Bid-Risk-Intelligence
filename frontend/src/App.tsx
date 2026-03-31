import React, { useState } from 'react';
import { UploadZone } from './components/UploadZone';
import { Dashboard } from './components/Dashboard';
import { useBidAnalysis } from './hooks/useBidAnalysis';
import { BidAnalysis } from './types/bid';

type AppState = 'idle' | 'loading' | 'error' | 'success';

export const App: React.FC = () => {
  const { data, loading, error, reset } = useBidAnalysis();
  const [appState, setAppState] = useState<AppState>('idle');
  const [analysisTime, setAnalysisTime] = useState<number>(0);

  // Update app state based on hook state
  React.useEffect(() => {
    console.log('App state update:', { loading, error, data });
    if (loading) {
      setAppState('loading');
    } else if (error) {
      setAppState('error');
    } else if (data) {
      setAppState('success');
      console.log('Setting app state to success with data:', data);
    } else {
      setAppState('idle');
    }
  }, [loading, error, data]);

  const handleAnalysisComplete = (timeTaken: number) => {
    console.log('handleAnalysisComplete called with time:', timeTaken);
    console.log('Current data state in App:', data);
    console.log('Current loading state in App:', loading);
    console.log('Current error state in App:', error);
    setAnalysisTime(timeTaken);
    
    // Force state check after a short delay
    setTimeout(() => {
      console.log('Delayed state check - data:', data, 'loading:', loading, 'error:', error);
      if (data && !loading && !error) {
        console.log('Manually setting app state to success');
        setAppState('success');
      }
    }, 1000);
    
    // The actual state management is handled by the useBidAnalysis hook
  };

  const handleReset = () => {
    reset();
    setAppState('idle');
    setAnalysisTime(0);
  };

  // Render based on app state
  console.log('Rendering with appState:', appState, 'data:', data);
  if (appState === 'success' && data) {
    console.log('Rendering Dashboard with data:', data);
    return (
      <div className="min-h-screen bg-slate-900">
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={handleReset}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Analyze Another Document
          </button>
        </div>
        <Dashboard analysis={data} timeTaken={analysisTime} />
      </div>
    );
  }

  return (
    <UploadZone onAnalysisComplete={handleAnalysisComplete} />
  );
};
