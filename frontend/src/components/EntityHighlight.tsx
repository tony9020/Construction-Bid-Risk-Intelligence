import React, { useMemo } from 'react';
import { ExtractedEntity } from '../types/bid';

interface EntityHighlightProps {
  rawText: string;
  entities: ExtractedEntity[];
}

export const EntityHighlight: React.FC<EntityHighlightProps> = ({ rawText, entities }) => {
  // Get highlight style based on risk level
  const getHighlightStyle = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH':
        return 'bg-red-900/50 text-red-200 rounded px-0.5';
      case 'MEDIUM':
        return 'bg-amber-900/50 text-amber-200 rounded px-0.5';
      case 'LOW':
        return 'bg-green-900/50 text-green-200 rounded px-0.5';
      default:
        return 'bg-slate-700/50 text-slate-200 rounded px-0.5';
    }
  };

  // Escape regex special characters in context strings
  const escapeRegex = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Process text to add highlights
  const processedText = useMemo(() => {
    if (!rawText || entities.length === 0) {
      return rawText;
    }

    let processedContent = rawText;
    const replacements: Array<{ start: number; end: number; replacement: string }> = [];

    // Sort entities by context length (longest first) to avoid overlapping replacements
    const sortedEntities = [...entities].sort((a, b) => b.context.length - a.context.length);

    sortedEntities.forEach((entity, entityIndex) => {
      const context = entity.context;
      if (!context || !processedContent.includes(context)) {
        return; // Skip if context not found
      }

      // Find all occurrences of this context
      const regex = new RegExp(escapeRegex(context), 'g');
      let match;
      let occurrenceCount = 0;

      while ((match = regex.exec(processedContent)) !== null) {
        // Only highlight the first occurrence to avoid excessive highlighting
        if (occurrenceCount === 0) {
          const start = match.index;
          const end = start + match[0].length;
          
          // Create tooltip content
          const tooltipContent = `${entity.entity_type} · ${entity.value} · ${entity.risk_level}`;
          
          // Create highlighted element with tooltip
          const replacement = `<mark class="${getHighlightStyle(entity.risk_level)}" title="${tooltipContent}">${context}</mark>`;
          
          replacements.push({ start, end, replacement });
        }
        occurrenceCount++;
      }
    });

    // Sort replacements by start position (reverse order to avoid index shifting)
    replacements.sort((a, b) => b.start - a.start);

    // Apply replacements
    let result = processedContent;
    replacements.forEach(({ start, end, replacement }) => {
      result = result.slice(0, start) + replacement + result.slice(end);
    });

    return result;
  }, [rawText, entities]);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      {/* Sticky header */}
      <div className="sticky top-0 bg-slate-800 pb-4 mb-4 border-b border-slate-700 z-10">
        <div className="flex justify-between items-center">
          <h3 className="text-slate-400 text-sm font-medium">Source document</h3>
          <div className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">
            {entities.length} entities highlighted
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div 
        className="max-h-[600px] overflow-y-auto pr-2"
        style={{
          // Custom scrollbar styling
          scrollbarWidth: 'thin',
          scrollbarColor: '#475569 #1e293b',
        }}
      >
        <div 
          className="font-mono text-sm text-slate-300 leading-relaxed whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: processedText }}
        />
      </div>

      {/* Custom scrollbar styles for Webkit browsers */}
      <style jsx>{`
        div::-webkit-scrollbar {
          width: 6px;
        }
        div::-webkit-scrollbar-track {
          background: #1e293b;
          border-radius: 3px;
        }
        div::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 3px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
        
        mark {
          cursor: help;
          transition: all 0.2s ease;
        }
        
        mark:hover {
          filter: brightness(1.2);
        }
      `}</style>
    </div>
  );
};
