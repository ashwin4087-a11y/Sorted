import React from 'react';

interface SortedLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  variant?: 'full' | 'symbol-only' | 'wordmark-only';
  className?: string;
}

/**
 * Official SORTED Symbol
 * Generated from the standalone symbol reference (Image 1):
 * - Isometric hexagon structure
 * - Top navy slab with crisp inner notch
 * - 3 layered white paper document sheets with dark navy separators
 * - Interlocking soft green ribbon path (#5FA579)
 * - Warm golden amber indicator tab (#EDB23E)
 * - Deep navy foundation slab (#082C52)
 */
export const SortedSymbol: React.FC<{ size?: number | string; className?: string }> = ({
  size = 48,
  className = ''
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="SORTED Administrative Symbol"
    >
      {/* 1. Base Navy Foundation (Bottom loop of the S) */}
      {/* Bottom base left facet */}
      <path
        d="M20 152 L100 198 L100 206 L20 160 Z"
        fill="#041A30"
      />
      {/* Bottom base right facet */}
      <path
        d="M100 198 L180 152 L180 160 L100 206 Z"
        fill="#082C52"
      />
      {/* Bottom base upper-surface */}
      <path
        d="M20 152 L100 198 L144 173 L64 127 Z"
        fill="#062544"
      />

      {/* 2. Three White Administrative Document Sheets on Left */}
      {/* Sheet 3 (Lowest Sheet) */}
      <path
        d="M20 134 L88 173 L100 166 L32 127 Z"
        fill="#FFFFFF"
      />
      <path
        d="M20 134 L88 173 L88 179 L20 140 Z"
        fill="#E2ECF5"
      />
      {/* Navy gap between Sheet 2 and 3 */}
      <path
        d="M20 140 L88 179 L88 185 L20 146 Z"
        fill="#062544"
      />

      {/* Sheet 2 (Middle Sheet) */}
      <path
        d="M20 112 L88 151 L100 144 L32 105 Z"
        fill="#FFFFFF"
      />
      <path
        d="M20 112 L88 151 L88 157 L20 118 Z"
        fill="#E2ECF5"
      />
      {/* Navy gap between Sheet 1 and 2 */}
      <path
        d="M20 118 L88 157 L88 163 L20 124 Z"
        fill="#062544"
      />

      {/* Sheet 1 (Top Sheet) */}
      <path
        d="M20 90 L88 129 L100 122 L32 83 Z"
        fill="#FFFFFF"
      />
      <path
        d="M20 90 L88 129 L88 135 L20 96 Z"
        fill="#E2ECF5"
      />
      {/* Navy gap under Top Slab */}
      <path
        d="M20 96 L88 135 L88 141 L20 102 Z"
        fill="#062544"
      />

      {/* 3. Top Dark Navy Slab */}
      {/* Left vertical facet */}
      <path
        d="M20 66 L20 78 L88 117 L88 105 Z"
        fill="#051C33"
      />
      {/* Top face of navy slab */}
      <path
        d="M100 20 L20 66 L88 105 L168 59 Z"
        fill="#082C52"
      />
      {/* Inner cutout notch vertical face (White reflective inner wall) */}
      <path
        d="M88 105 L156 66 L156 82 L88 121 Z"
        fill="#FFFFFF"
      />
      {/* Right vertical facet of top slab */}
      <path
        d="M168 59 L180 66 L180 84 L168 77 Z"
        fill="#0A3460"
      />

      {/* 4. Golden Amber Indicator Tab (#EDB23E) */}
      {/* Isometric parallelogram on the right */}
      <path
        d="M150 82 L186 102 L186 144 L150 124 Z"
        fill="#EDB23E"
      />
      <path
        d="M150 124 L186 144 L186 147 L150 127 Z"
        fill="#D69B2A"
      />

      {/* 5. Interlocking Soft Sage Green Ribbon (#5FA579) */}
      {/* Diagonal upper section extending out from notch */}
      <path
        d="M88 105 L124 126 L148 112 L112 91 Z"
        fill="#5FA579"
      />
      {/* Shaded top-left edge of green ribbon */}
      <path
        d="M88 105 L124 126 L124 132 L88 111 Z"
        fill="#4A8860"
      />
      {/* Vertical ribbon band on the front-right facet */}
      <path
        d="M124 126 L148 112 L148 174 L124 188 Z"
        fill="#5FA579"
      />
      {/* Dark right facet of bottom block behind green ribbon */}
      <path
        d="M148 112 L172 98 L172 156 L148 174 Z"
        fill="#062544"
      />
    </svg>
  );
};

/**
 * Official SORTED Wordmark
 * Generated from the standalone wordmark reference (Image 2):
 * - Heavy, bold geometric grotesque typography
 * - Solid administrative dark navy (#062544 / #082C52)
 * - Distinctive rounded outer corners on S, O, R, T, E, D
 */
export const SortedWordmark: React.FC<{ height?: number | string; className?: string }> = ({
  height = 42,
  className = ''
}) => {
  return (
    <svg
      height={height}
      viewBox="0 0 620 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
      aria-label="SORTED Wordmark"
    >
      {/* --- LETTER S --- */}
      <path
        d="M 18,52 
           C 18,36 30,22 56,22 
           L 84,22 
           C 98,22 108,28 108,40 
           L 108,44 
           L 84,44 
           L 84,40 
           C 84,36 78,34 68,34 
           L 56,34 
           C 42,34 38,40 38,48 
           C 38,58 48,62 66,66 
           L 78,69 
           C 98,73 108,82 108,96 
           C 108,112 96,124 70,124 
           L 40,124 
           C 24,124 16,116 16,104 
           L 16,98 
           L 40,98 
           L 40,104 
           C 40,110 46,112 56,112 
           L 70,112 
           C 82,112 86,106 86,100 
           C 86,90 76,86 58,82 
           L 46,79 
           C 28,75 18,66 18,52 Z"
        fill="#082C52"
      />

      {/* --- LETTER O --- */}
      <path
        d="M 118,73 
           C 118,38 134,22 168,22 
           C 202,22 218,38 218,73 
           C 218,108 202,124 168,124 
           C 134,124 118,108 118,73 Z 
           M 140,73 
           C 140,96 148,111 168,111 
           C 188,111 196,96 196,73 
           C 196,50 188,35 168,35 
           C 148,35 140,50 140,73 Z"
        fill="#082C52"
      />

      {/* --- LETTER R --- */}
      <path
        d="M 230,24 
           L 278,24 
           C 300,24 316,34 316,56 
           C 316,70 306,80 292,84 
           L 320,124 
           L 294,124 
           L 268,86 
           L 252,86 
           L 252,124 
           L 230,124 
           L 230,24 Z 
           M 252,36 
           L 252,74 
           L 274,74 
           C 288,74 294,68 294,55 
           C 294,42 288,36 274,36 
           L 252,36 Z"
        fill="#082C52"
      />

      {/* --- LETTER T --- */}
      <path
        d="M 328,24 
           L 410,24 
           L 410,38 
           L 380,38 
           L 380,124 
           L 358,124 
           L 358,38 
           L 328,38 
           L 328,24 Z"
        fill="#082C52"
      />

      {/* --- LETTER E --- */}
      <path
        d="M 424,24 
           L 498,24 
           L 498,37 
           L 446,37 
           L 446,67 
           L 492,67 
           L 492,80 
           L 446,80 
           L 446,111 
           L 500,111 
           L 500,124 
           L 424,124 
           L 424,24 Z"
        fill="#082C52"
      />

      {/* --- LETTER D --- */}
      <path
        d="M 514,24 
           L 560,24 
           C 594,24 614,40 614,74 
           C 614,108 594,124 560,124 
           L 514,124 
           L 514,24 Z 
           M 536,37 
           L 536,111 
           L 556,111 
           C 580,111 592,98 592,74 
           C 592,50 580,37 556,37 
           L 536,37 Z"
        fill="#082C52"
      />
    </svg>
  );
};

/**
 * Full Composite Brand Lockup: Symbol + Wordmark
 */
export const SortedLogo: React.FC<SortedLogoProps> = ({
  size = 'md',
  variant = 'full',
  className = ''
}) => {
  const pixelDimensions = {
    sm: { symbol: 32, textH: 24, gap: 'gap-2.5' },
    md: { symbol: 42, textH: 32, gap: 'gap-3.5' },
    lg: { symbol: 54, textH: 40, gap: 'gap-4' },
    xl: { symbol: 68, textH: 52, gap: 'gap-5' },
    hero: { symbol: 96, textH: 72, gap: 'gap-6' }
  }[size];

  if (variant === 'symbol-only') {
    return <SortedSymbol size={pixelDimensions.symbol} className={className} />;
  }

  if (variant === 'wordmark-only') {
    return <SortedWordmark height={pixelDimensions.textH} className={className} />;
  }

  return (
    <div className={`inline-flex items-center ${pixelDimensions.gap} select-none ${className}`}>
      <SortedSymbol size={pixelDimensions.symbol} />
      <SortedWordmark height={pixelDimensions.textH} />
    </div>
  );
};
