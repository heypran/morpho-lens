import React from 'react';
import clsx from 'clsx';

interface RiskBadgeProps {
  verdict: string;
}

const RiskBadge: React.FC<RiskBadgeProps> = ({ verdict }) => {
  const styles = {
    'Safe': 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)]',
    'Moderate': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]',
    'High Risk': 'bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.2)]',
    'Degen': 'bg-red-600/10 text-red-500 border-red-600/20 shadow-[0_0_15px_rgba(220,38,38,0.3)]',
  };

  const defaultStyle = 'bg-slate-800 text-slate-400';

  return (
    <span className={clsx(
      "px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider border backdrop-blur-sm",
      styles[verdict as keyof typeof styles] || defaultStyle
    )}>
      {verdict}
    </span>
  );
};

export default RiskBadge;