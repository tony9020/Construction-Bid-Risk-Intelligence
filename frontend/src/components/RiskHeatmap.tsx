import React from 'react';
import { ExtractedEntity } from '../types/bid';

interface RiskHeatmapProps {
  entities: ExtractedEntity[];
}

export const RiskHeatmap: React.FC<RiskHeatmapProps> = ({ entities }) => {
  // Group entities by risk level
  const highRiskEntities = entities.filter(e => e.risk_level === 'HIGH');
  const mediumRiskEntities = entities.filter(e => e.risk_level === 'MEDIUM');
  const lowRiskEntities = entities.filter(e => e.risk_level === 'LOW');

  // Sort entities within each risk level: MONEY → DATE → LAW
  const sortEntities = (entityList: ExtractedEntity[]) => {
    const typeOrder = { 'MONEY': 0, 'DATE': 1, 'LAW': 2 };
    return [...entityList].sort((a, b) => typeOrder[a.entity_type] - typeOrder[b.entity_type]);
  };

  const sortedHigh = sortEntities(highRiskEntities);
  const sortedMedium = sortEntities(mediumRiskEntities);
  const sortedLow = sortEntities(lowRiskEntities);

  // Get entity type styling
  const getEntityTypeStyle = (type: string) => {
    switch (type) {
      case 'MONEY':
        return 'bg-blue-900 text-blue-300';
      case 'DATE':
        return 'bg-purple-900 text-purple-300';
      case 'LAW':
        return 'bg-orange-900 text-orange-300';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  // Get risk level border style
  const getRiskBorderStyle = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH':
        return 'border-red-500';
      case 'MEDIUM':
        return 'border-amber-500';
      case 'LOW':
        return 'border-green-500';
      default:
        return 'border-slate-500';
    }
  };

  // Render entity card
  const renderEntityCard = (entity: ExtractedEntity, index: number) => (
    <div
      key={`${entity.entity_type}-${entity.page_number}-${index}`}
      className={`bg-slate-800 border border-slate-700 rounded-lg p-4 border-l-4 ${getRiskBorderStyle(
        entity.risk_level
      )} transition-all duration-300 hover:shadow-lg`}
      style={{
        animation: `fadeInUp 0.5s ease-out ${index * 60}ms both`,
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`font-mono text-xs uppercase px-2 py-0.5 rounded ${getEntityTypeStyle(
          entity.entity_type
        )}`}>
          {entity.entity_type}
        </span>
      </div>
      
      <div className="text-white font-semibold text-lg mt-2">
        {entity.value}
      </div>
      
      <div className="text-slate-400 text-xs mt-2 line-clamp-2 leading-relaxed">
        {entity.context}
      </div>
      
      <div className="text-slate-600 text-xs mt-2">
        Found on page {entity.page_number}
      </div>
    </div>
  );

  // Render risk column
  const renderRiskColumn = (
    title: string,
    entities: ExtractedEntity[],
    headerStyle: string,
    emptyMessage: string
  ) => (
    <div className="flex flex-col space-y-4">
      <div className={`px-3 py-2 rounded-lg text-center font-medium ${headerStyle}`}>
        {title}
        <span className="ml-2 text-sm opacity-75">({entities.length})</span>
      </div>
      
      <div className="flex flex-col space-y-3 min-h-[200px]">
        {entities.length > 0 ? (
          entities.map((entity, index) => renderEntityCard(entity, index))
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-slate-600 italic text-sm">{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {renderRiskColumn(
        'HIGH RISK',
        sortedHigh,
        'bg-red-900 text-red-300 border border-red-700',
        'No high risk items detected'
      )}
      
      {renderRiskColumn(
        'MEDIUM RISK',
        sortedMedium,
        'bg-amber-900 text-amber-300 border border-amber-700',
        'No medium risk items detected'
      )}
      
      {renderRiskColumn(
        'LOW RISK',
        sortedLow,
        'bg-green-900 text-green-300 border border-green-700',
        'No low risk items detected'
      )}
      
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};
