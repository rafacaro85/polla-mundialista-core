import React from 'react';

export const BrandLogo = () => {
  return (
    <div className="relative flex items-center justify-center w-10 h-10">
      <div className="w-full h-full border-2 border-white transform rotate-45 bg-transparent"
        style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
      </div>
      <div className="absolute w-3 h-3 bg-[#00E676] rounded-full shadow-[0_0_15px_rgba(0,230,118,0.5)]"></div>
    </div>
  );
};
