import React, { useState } from 'react';
import { LucideIcon, Info, X } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'purple' | 'orange';
  infoContent?: {
    description: string;
    calculation?: string;
    example?: string;
  };
}

const MetricsCard: React.FC<MetricsCardProps> = ({ title, value, subValue, icon: Icon, color = 'blue', infoContent }) => {
  const [showInfo, setShowInfo] = useState(false);

  const colorClasses = {
    blue: 'text-blue-400 bg-blue-400/10',
    green: 'text-green-400 bg-green-400/10',
    purple: 'text-purple-400 bg-purple-400/10',
    orange: 'text-orange-400 bg-orange-400/10',
  };

  return (
    <div className="relative bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all duration-300 backdrop-blur-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="text-slate-400 font-medium text-sm uppercase tracking-wider">{title}</div>
          {infoContent && (
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-3xl font-bold text-white font-mono tracking-tight">{value}</div>
      {subValue && <div className="text-slate-500 text-sm mt-1">{subValue}</div>}

      {/* Info Modal */}
      {showInfo && infoContent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowInfo(false)}>
          <div
            className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-white font-semibold text-lg">{title}</h4>
              <button
                onClick={() => setShowInfo(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-slate-300 font-medium mb-2">Description:</div>
                <div className="text-slate-400 leading-relaxed">{infoContent.description}</div>
              </div>
              {infoContent.calculation && (
                <div>
                  <div className="text-slate-300 font-medium mb-2">Calculation:</div>
                  <div className="text-slate-400 font-mono bg-slate-950 p-3 rounded border border-slate-800 text-xs">
                    {infoContent.calculation}
                  </div>
                </div>
              )}
              {infoContent.example && (
                <div>
                  <div className="text-slate-300 font-medium mb-2">Example:</div>
                  <div className="text-slate-400 leading-relaxed">{infoContent.example}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsCard;