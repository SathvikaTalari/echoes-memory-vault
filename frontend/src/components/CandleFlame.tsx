import React from 'react';

interface CandleFlameProps {
  isLit?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  colorType?: 'cempasuchil_gold' | 'classic_amber' | 'eternal_white' | 'violet_prayer';
  onToggle?: () => void;
  showWax?: boolean;
}

export const CandleFlame: React.FC<CandleFlameProps> = ({
  isLit = true,
  size = 'md',
  colorType = 'cempasuchil_gold',
  onToggle,
  showWax = true
}) => {
  const sizeMap = {
    sm: { flame: 'w-4 h-6', aura: 'w-10 h-10', wax: 'w-6 h-10', base: 'w-8' },
    md: { flame: 'w-6 h-9', aura: 'w-16 h-16', wax: 'w-8 h-16', base: 'w-10' },
    lg: { flame: 'w-8 h-12', aura: 'w-24 h-24', wax: 'w-10 h-24', base: 'w-14' },
    hero: { flame: 'w-12 h-16', aura: 'w-36 h-36', wax: 'w-14 h-32', base: 'w-20' },
  };

  const colorPalettes = {
    cempasuchil_gold: {
      core: 'from-amber-100 via-amber-400 to-orange-600',
      aura: 'bg-amber-500/20 shadow-amber-500/40',
      wax: 'bg-gradient-to-b from-amber-100 to-amber-300 border-amber-400/40'
    },
    classic_amber: {
      core: 'from-yellow-100 via-amber-400 to-amber-700',
      aura: 'bg-amber-400/20 shadow-amber-400/30',
      wax: 'bg-gradient-to-b from-stone-200 to-amber-200 border-amber-300/40'
    },
    eternal_white: {
      core: 'from-white via-amber-200 to-sky-300',
      aura: 'bg-amber-100/25 shadow-white/40',
      wax: 'bg-gradient-to-b from-white to-stone-200 border-stone-300/50'
    },
    violet_prayer: {
      core: 'from-violet-100 via-fuchsia-400 to-purple-800',
      aura: 'bg-purple-600/20 shadow-purple-500/40',
      wax: 'bg-gradient-to-b from-purple-100 to-purple-300 border-purple-400/40'
    }
  };

  const currentSize = sizeMap[size];
  const currentColors = colorPalettes[colorType] || colorPalettes.cempasuchil_gold;

  return (
    <div 
      onClick={onToggle}
      className={`relative inline-flex flex-col items-center select-none ${onToggle ? 'cursor-pointer group' : ''}`}
      title={isLit ? 'Flame glowing in remembrance' : 'Click to light candle'}
    >
      {/* Flame aura and glowing particles */}
      <div className="relative flex items-center justify-center">
        {isLit && (
          <>
            {/* Outer pulsating warm halo */}
            <div 
              className={`absolute rounded-full ${currentSize.aura} ${currentColors.aura} blur-md animate-pulse-glow transition-all duration-700 pointer-events-none`}
            />

            {/* Inner flickering flame body */}
            <div 
              className={`relative z-10 ${currentSize.flame} rounded-[50%_50%_35%_35%] bg-gradient-to-t ${currentColors.core} shadow-candle-md animate-flicker`}
              style={{
                borderRadius: '50% 50% 35% 35% / 60% 60% 40% 40%',
                transformOrigin: 'bottom center',
              }}
            >
              {/* White-hot flame center */}
              <div 
                className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-3 bg-white rounded-full opacity-90 blur-[0.5px]"
              />
            </div>
          </>
        )}

        {/* Unlit wick */}
        {!isLit && (
          <div className="h-4 flex items-end">
            <div className="w-0.5 h-3 bg-stone-700 rounded-full" />
          </div>
        )}
      </div>

      {/* Wick connection */}
      {isLit && (
        <div className="w-0.5 h-1.5 bg-stone-900 rounded-full -mt-0.5 z-0" />
      )}

      {/* Wax Candle Cylinder */}
      {showWax && (
        <div className="relative flex flex-col items-center">
          {/* Top lip of candle wax with dip */}
          <div className={`${currentSize.base} h-2 rounded-[50%] bg-amber-100/90 border border-amber-300/40 shadow-inner -mb-1 z-10`} />
          
          {/* Candle column */}
          <div 
            className={`${currentSize.wax} rounded-b-sm border-x border-b ${currentColors.wax} shadow-lg relative overflow-hidden`}
          >
            {/* Subtle melted wax drips */}
            <div className="absolute top-0 left-1 w-1 h-3 bg-white/40 rounded-full" />
            <div className="absolute top-0 right-2 w-1.5 h-5 bg-white/30 rounded-full" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/30 pointer-events-none" />
          </div>

          {/* Candle holder base / plate */}
          <div className={`${currentSize.base} h-1.5 rounded-full bg-gradient-to-r from-amber-900 via-amber-700 to-amber-950 shadow-md border border-amber-600/30 -mt-0.5`} />
        </div>
      )}
    </div>
  );
};
