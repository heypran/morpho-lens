import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

const MetricsCard: React.FC<MetricsCardProps> = ({ title, value, subValue, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'text-blue-400 bg-blue-400/10',
    green: 'text-green-400 bg-green-400/10',
    purple: 'text-purple-400 bg-purple-400/10',
    orange: 'text-orange-400 bg-orange-400/10',
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all duration-300 backdrop-blur-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="text-slate-400 font-medium text-sm uppercase tracking-wider">{title}</div>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-3xl font-bold text-white font-mono tracking-tight">{value}</div>
      {subValue && <div className="text-slate-500 text-sm mt-1">{subValue}</div>}
    </div>
  );
};

export default MetricsCard;