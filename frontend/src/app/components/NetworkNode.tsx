import { motion } from 'motion/react';

type NetworkNodeProps = {
  title: string;
  fi: number;
  tfi: number;
  regime: number;
  isMain?: boolean;
};

export default function NetworkNode({ title, fi, tfi, regime, isMain }: NetworkNodeProps) {
  const getRegimeColor = (value: number) => {
    if (value < 0.25) return 'from-emerald-400 to-emerald-600';
    if (value < 0.5) return 'from-yellow-400 to-yellow-600';
    if (value < 0.75) return 'from-orange-400 to-orange-600';
    return 'from-red-400 to-red-600';
  };

  const getRegimeLabel = (value: number) => {
    if (value < 0.25) return 'Stable';
    if (value < 0.5) return 'Watch';
    if (value < 0.75) return 'Alert';
    return 'Critical';
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`bg-gradient-to-br ${getRegimeColor(regime)} rounded-xl shadow-lg p-6 ${
        isMain ? 'w-80' : 'w-64'
      } text-white ring-1 ring-white/10`}
    >
      <h3 className={`font-bold mb-4 ${isMain ? 'text-xl text-center' : 'text-lg'}`}>
        {title}
      </h3>
      <div className="grid grid-cols-3 gap-2">
        <div
          id={isMain ? 'metric-fi' : undefined}
          className="bg-white/15 rounded-lg p-2.5 backdrop-blur-sm text-center"
        >
          <div className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">FI</div>
          <div className="text-sm font-bold mt-0.5">{fi.toFixed(3)}</div>
        </div>
        <div
          id={isMain ? 'metric-tfi' : undefined}
          className="bg-white/15 rounded-lg p-2.5 backdrop-blur-sm text-center"
        >
          <div className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">TFI</div>
          <div className="text-sm font-bold mt-0.5">{tfi.toFixed(3)}</div>
        </div>
        <div
          id={isMain ? 'metric-regime' : undefined}
          className="bg-white/15 rounded-lg p-2.5 backdrop-blur-sm text-center"
        >
          <div className="text-[10px] uppercase tracking-wider opacity-80 font-semibold">Regime</div>
          <div className="text-[11px] font-bold mt-0.5 leading-tight">{getRegimeLabel(regime)}</div>
        </div>
      </div>
    </motion.div>
  );
}