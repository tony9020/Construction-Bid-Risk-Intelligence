import React from 'react';
import { BidAnalysis } from '../types/bid';
import { RiskHeatmap } from './RiskHeatmap';
import { EntityHighlight } from './EntityHighlight';

interface DashboardProps {
  analysis: BidAnalysis;
}

export const Dashboard: React.FC<DashboardProps> = ({ analysis }) => {
  // Calculate statistics
  const totalEntities = analysis.entities.length;
  const highRiskCount = analysis.entities.filter(e => e.risk_level === 'HIGH').length;
  const needsReviewCount = analysis.entities.filter(e => e.risk_level === 'HIGH' || e.risk_level === 'MEDIUM').length;

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h1 className="text-white text-2xl font-semibold">
          {analysis.project_name}
        </h1>
        <div className="bg-slate-700 text-slate-300 text-sm px-3 py-1 rounded-full">
          {analysis.total_pages} pages analyzed
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="text-slate-400 text-sm mb-2">Total entities</div>
          <div className="text-blue-400 text-3xl font-bold">{totalEntities}</div>
        </div>
        
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="text-slate-400 text-sm mb-2">High risk items</div>
          <div className="text-red-400 text-3xl font-bold">{highRiskCount}</div>
        </div>
        
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="text-slate-400 text-sm mb-2">Needs review</div>
          <div className="text-amber-400 text-3xl font-bold">{needsReviewCount}</div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Risk Heatmap - Left side (3 columns on large screens) */}
        <div className="lg:col-span-3">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-white text-lg font-semibold mb-6">Risk Analysis</h2>
            <RiskHeatmap entities={analysis.entities} />
          </div>
        </div>

        {/* Entity Highlight - Right side (2 columns on large screens) */}
        <div className="lg:col-span-2">
          <EntityHighlight 
            rawText={analysis.raw_text} 
            entities={analysis.entities} 
          />
        </div>
      </div>
    </div>
  );
};
