import React from 'react';

interface DOrangeBrandProps {
  variant?: 'light' | 'dark' | 'corporate';
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
  logoUrl?: string; // Prepared for official uploaded brand asset
}

/**
 * Componente oficial de identidade corporativa D'OR@NGE.
 * Segue a paleta corporativa premium (#17191F Grafite, #FFFFFF, #C5A46D Dourado discreto, #667085).
 * Não utiliza monogramas fictícios ou ícones laranjas inventados quando a logo oficial não estiver disponível.
 */
export const DOrangeBrand: React.FC<DOrangeBrandProps> = ({
  variant = 'corporate',
  size = 'md',
  showSubtitle = true,
  className = '',
  logoUrl,
}) => {
  // Se houver arquivo de logo oficial fornecido
  if (logoUrl) {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <img
          src={logoUrl}
          alt="D'OR@NGE"
          className={
            size === 'sm'
              ? 'h-6 object-contain'
              : size === 'lg'
              ? 'h-11 object-contain'
              : 'h-8 object-contain'
          }
        />
        {showSubtitle && (
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#667085]">
            White-Label
          </span>
        )}
      </div>
    );
  }

  // Renderização tipográfica elegante oficial quando não há imagem estática externa
  const isDark = variant === 'dark';
  const textColor = isDark ? 'text-white' : 'text-[#17191F]';
  const goldColor = '#C5A46D';

  const fontSizes = {
    sm: 'text-sm tracking-wider',
    md: 'text-base sm:text-lg tracking-wider',
    lg: 'text-xl sm:text-2xl tracking-widest',
  };

  return (
    <div className={`flex flex-col select-none ${className}`}>
      <div className="flex items-baseline gap-1.5 leading-none">
        <span
          className={`font-display font-extrabold ${fontSizes[size]} ${textColor} uppercase`}
        >
          D'OR<span style={{ color: goldColor }}>@</span>NGE
        </span>
        <span
          className="text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase"
          style={{ color: goldColor }}
        >
          BUSINESS AI
        </span>
      </div>

      {showSubtitle && (
        <span className="text-[9px] uppercase tracking-widest text-[#667085] font-medium mt-0.5">
          Tecnologia SaaS White-Label
        </span>
      )}
    </div>
  );
};
