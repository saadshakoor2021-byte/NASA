import React from 'react';
import { BODY_SYSTEMS } from '../data/spaceMedicine';
import type { BodySystemId, HealthStatus, SystemEvaluation } from '../types/health';

interface BodyMapSvgProps {
  selectedSystem: BodySystemId;
  onSelectSystem: (id: BodySystemId) => void;
  evaluations: Record<BodySystemId, SystemEvaluation>;
}

const STATUS_STYLES: Record<
  HealthStatus,
  { stroke: string; fill: string; text: string }
> = {
  nominal: {
    stroke: '#10B981',
    fill: 'rgba(16, 185, 129, 0.20)',
    text: 'text-emerald-400',
  },
  monitor: {
    stroke: '#F59E0B',
    fill: 'rgba(245, 158, 11, 0.25)',
    text: 'text-amber-400',
  },
  action: {
    stroke: '#F43F5E',
    fill: 'rgba(244, 63, 94, 0.28)',
    text: 'text-rose-400',
  },
};

// Centered at x = 220 inside a 440x430 viewBox so both left and right callouts have 115px clear margin
const HOTSPOTS: Array<{
  id: BodySystemId;
  shortName: string;
  cx: number;
  cy: number;
  labelX: number;
  labelY: number;
  align: 'left' | 'right';
}> = [
  { id: 'neuro', shortName: 'Neuro & Sleep', cx: 220, cy: 48, labelX: 314, labelY: 42, align: 'left' },
  { id: 'ocular', shortName: 'Ocular (SANS)', cx: 210, cy: 64, labelX: 124, labelY: 64, align: 'right' },
  { id: 'respiratory', shortName: 'Airway & Lungs', cx: 240, cy: 146, labelX: 314, labelY: 136, align: 'left' },
  { id: 'cardio', shortName: 'Cardiovascular', cx: 214, cy: 154, labelX: 124, labelY: 154, align: 'right' },
  { id: 'metabolic', shortName: 'Metabolic & Temp', cx: 224, cy: 204, labelX: 314, labelY: 204, align: 'left' },
  { id: 'immune', shortName: 'Immune & Skin', cx: 162, cy: 196, labelX: 124, labelY: 236, align: 'right' },
  { id: 'musculoskeletal', shortName: 'Bone & Muscle', cx: 244, cy: 318, labelX: 314, labelY: 318, align: 'left' },
];

export const BodyMapSvg: React.FC<BodyMapSvgProps> = ({
  selectedSystem,
  onSelectSystem,
  evaluations,
}) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Anatomical Vector Stage */}
      <div className="relative bg-[#0B101B] border border-slate-800 rounded-lg p-4 flex flex-col items-center justify-center">
        <div className="w-full flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
          <span>ANATOMICAL SELF-CHECK MAP</span>
          <span>SELECT REGION</span>
        </div>

        <svg
          viewBox="0 0 440 430"
          className="w-full max-w-[440px] h-auto select-none"
          role="img"
          aria-label="Interactive human anatomical health diagram"
        >
          <defs>
            <pattern id="grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="#1E293B"
                strokeWidth="0.6"
                opacity="0.55"
              />
            </pattern>
          </defs>

          <rect x="0" y="0" width="440" height="430" fill="url(#grid-pattern)" rx="6" />

          {/* Calibration axis ticks */}
          <line x1="220" y1="12" x2="220" y2="418" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 4" />
          <line x1="20" y1="215" x2="420" y2="215" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 4" />

          {/* Human Body Silhouette (shifted +60 on X) */}
          <g fill="#121A2A" stroke="#334155" strokeWidth="1.6">
            {/* Head & Neck */}
            <ellipse cx="220" cy="58" rx="26" ry="32" />
            <path d="M208 88 L208 106 L232 106 L232 88 Z" />
            {/* Torso */}
            <path d="M174 114 Q220 102 266 114 L272 195 L256 266 L184 266 L168 195 Z" />
            {/* Left Arm */}
            <path d="M174 116 L150 184 L142 252 L158 255 L170 194 L180 140 Z" />
            {/* Right Arm */}
            <path d="M266 116 L290 184 L298 252 L282 255 L270 194 L260 140 Z" />
            {/* Pelvis & Legs */}
            <path d="M184 266 L216 266 L212 346 L206 410 L186 410 L184 344 Z" />
            <path d="M224 266 L256 266 L256 344 L254 410 L234 410 L228 346 Z" />
          </g>

          {/* 1. Neurological (Brain) */}
          <g onClick={() => onSelectSystem('neuro')} className="cursor-pointer">
            <path
              d="M201 50 C201 34, 239 34, 239 50 C239 58, 231 62, 220 62 C209 62, 201 58, 201 50 Z"
              fill={
                selectedSystem === 'neuro'
                  ? STATUS_STYLES[evaluations.neuro.status].fill
                  : 'rgba(6, 182, 212, 0.14)'
              }
              stroke={
                selectedSystem === 'neuro'
                  ? '#06B6D4'
                  : STATUS_STYLES[evaluations.neuro.status].stroke
              }
              strokeWidth={selectedSystem === 'neuro' ? 2.2 : 1.4}
            />
          </g>

          {/* 2. Ocular (Eyes) */}
          <g onClick={() => onSelectSystem('ocular')} className="cursor-pointer">
            <ellipse
              cx="210"
              cy="64"
              rx="6"
              ry="4"
              fill={STATUS_STYLES[evaluations.ocular.status].fill}
              stroke={
                selectedSystem === 'ocular'
                  ? '#06B6D4'
                  : STATUS_STYLES[evaluations.ocular.status].stroke
              }
              strokeWidth={selectedSystem === 'ocular' ? 2.2 : 1.4}
            />
            <ellipse
              cx="230"
              cy="64"
              rx="6"
              ry="4"
              fill={STATUS_STYLES[evaluations.ocular.status].fill}
              stroke={
                selectedSystem === 'ocular'
                  ? '#06B6D4'
                  : STATUS_STYLES[evaluations.ocular.status].stroke
              }
              strokeWidth={selectedSystem === 'ocular' ? 2.2 : 1.4}
            />
          </g>

          {/* 3. Respiratory (Lungs) */}
          <g onClick={() => onSelectSystem('respiratory')} className="cursor-pointer">
            <path
              d="M216 122 C196 124, 188 148, 192 172 C202 174, 212 170, 216 164 Z"
              fill={STATUS_STYLES[evaluations.respiratory.status].fill}
              stroke={
                selectedSystem === 'respiratory'
                  ? '#06B6D4'
                  : STATUS_STYLES[evaluations.respiratory.status].stroke
              }
              strokeWidth={selectedSystem === 'respiratory' ? 2.2 : 1.3}
            />
            <path
              d="M224 122 C244 124, 252 148, 248 172 C238 174, 228 170, 224 164 Z"
              fill={STATUS_STYLES[evaluations.respiratory.status].fill}
              stroke={
                selectedSystem === 'respiratory'
                  ? '#06B6D4'
                  : STATUS_STYLES[evaluations.respiratory.status].stroke
              }
              strokeWidth={selectedSystem === 'respiratory' ? 2.2 : 1.3}
            />
          </g>

          {/* 4. Cardiovascular (Heart & Central Vessels) */}
          <g onClick={() => onSelectSystem('cardio')} className="cursor-pointer">
            <path
              d="M214 142 C206 138, 202 149, 208 158 L218 167 L226 156 C231 147, 224 137, 214 142 Z"
              fill={STATUS_STYLES[evaluations.cardio.status].fill}
              stroke={
                selectedSystem === 'cardio'
                  ? '#06B6D4'
                  : STATUS_STYLES[evaluations.cardio.status].stroke
              }
              strokeWidth={selectedSystem === 'cardio' ? 2.4 : 1.5}
            />
            <line
              x1="218"
              y1="104"
              x2="218"
              y2="141"
              stroke={STATUS_STYLES[evaluations.cardio.status].stroke}
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
          </g>

          {/* 5. Metabolic (Liver/Pancreas/Core) */}
          <g onClick={() => onSelectSystem('metabolic')} className="cursor-pointer">
            <rect
              x="200"
              y="188"
              width="40"
              height="28"
              rx="8"
              fill={STATUS_STYLES[evaluations.metabolic.status].fill}
              stroke={
                selectedSystem === 'metabolic'
                  ? '#06B6D4'
                  : STATUS_STYLES[evaluations.metabolic.status].stroke
              }
              strokeWidth={selectedSystem === 'metabolic' ? 2.2 : 1.4}
            />
          </g>

          {/* 6. Immune & Skin (Arm/Lymph Node) */}
          <g onClick={() => onSelectSystem('immune')} className="cursor-pointer">
            <circle
              cx="162"
              cy="196"
              r="11"
              fill={STATUS_STYLES[evaluations.immune.status].fill}
              stroke={
                selectedSystem === 'immune'
                  ? '#06B6D4'
                  : STATUS_STYLES[evaluations.immune.status].stroke
              }
              strokeWidth={selectedSystem === 'immune' ? 2.2 : 1.4}
            />
          </g>

          {/* 7. Musculoskeletal (Femur & Spine Load) */}
          <g onClick={() => onSelectSystem('musculoskeletal')} className="cursor-pointer">
            <line
              x1="220"
              y1="176"
              x2="220"
              y2="256"
              stroke={
                selectedSystem === 'musculoskeletal'
                  ? '#06B6D4'
                  : STATUS_STYLES[evaluations.musculoskeletal.status].stroke
              }
              strokeWidth="4"
              strokeLinecap="round"
            />
            <rect
              x="236"
              y="278"
              width="12"
              height="82"
              rx="5"
              fill={STATUS_STYLES[evaluations.musculoskeletal.status].fill}
              stroke={
                selectedSystem === 'musculoskeletal'
                  ? '#06B6D4'
                  : STATUS_STYLES[evaluations.musculoskeletal.status].stroke
              }
              strokeWidth={selectedSystem === 'musculoskeletal' ? 2.2 : 1.4}
            />
            <rect
              x="192"
              y="278"
              width="12"
              height="82"
              rx="5"
              fill={STATUS_STYLES[evaluations.musculoskeletal.status].fill}
              stroke={
                selectedSystem === 'musculoskeletal'
                  ? '#06B6D4'
                  : STATUS_STYLES[evaluations.musculoskeletal.status].stroke
              }
              strokeWidth={selectedSystem === 'musculoskeletal' ? 2.2 : 1.4}
            />
          </g>

          {/* Leader callout lines */}
          {HOTSPOTS.map((spot) => {
            const isSelected = selectedSystem === spot.id;
            const status = evaluations[spot.id].status;
            const strokeColor = isSelected ? '#06B6D4' : STATUS_STYLES[status].stroke;
            return (
              <g
                key={spot.id}
                onClick={() => onSelectSystem(spot.id)}
                className="cursor-pointer"
              >
                <polyline
                  points={`${spot.cx},${spot.cy} ${spot.labelX},${spot.labelY}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isSelected ? 1.6 : 1}
                  opacity={isSelected ? 1 : 0.7}
                />
                <circle
                  cx={spot.cx}
                  cy={spot.cy}
                  r={isSelected ? 4.5 : 3}
                  fill={isSelected ? '#06B6D4' : strokeColor}
                />
                <text
                  x={spot.align === 'left' ? spot.labelX + 6 : spot.labelX - 6}
                  y={spot.labelY + 3.5}
                  textAnchor={spot.align === 'left' ? 'start' : 'end'}
                  fill={isSelected ? '#F1F5F9' : '#CBD5E1'}
                  fontSize="11"
                  fontFamily="IBM Plex Mono, monospace"
                  fontWeight={isSelected ? '600' : '500'}
                >
                  {spot.shortName}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend with text + glyph (no hue-only signaling) */}
        <div className="w-full pt-3 mt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-5 text-xs font-mono">
          <span className="text-emerald-400">● Nominal</span>
          <span className="text-amber-400">▲ Monitor</span>
          <span className="text-rose-400">✖ Action Required</span>
        </div>
      </div>

      {/* Accessible Interactive Region Selector List */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2"
        role="list"
        aria-label="Anatomical body systems"
      >
        {BODY_SYSTEMS.map((sys) => {
          const ev = evaluations[sys.id];
          const isSelected = selectedSystem === sys.id;
          const style = STATUS_STYLES[ev.status];

          return (
            <button
              key={sys.id}
              type="button"
              onClick={() => onSelectSystem(sys.id)}
              aria-pressed={isSelected}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                isSelected
                  ? 'bg-[#151F30] border-cyan-500/70 text-slate-100'
                  : 'bg-[#0E1420] border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-[#121A29]'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{sys.name}</span>
                <span className={`text-xs font-mono whitespace-nowrap shrink-0 ${style.text}`}>
                  {ev.glyph} {ev.statusLabel}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{sys.anatomicalRegion}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
