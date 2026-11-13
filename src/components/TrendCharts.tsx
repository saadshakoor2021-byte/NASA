import React, { useState } from 'react';
import { INDICATOR_DEFINITIONS, NASA_FIVE_HAZARDS } from '../data/spaceMedicine';
import type {
  HazardKey,
  IndicatorKey,
  MissionEnvironment,
  VitalReading,
} from '../types/health';

interface TrendChartsProps {
  readings: VitalReading[];
  hazardProfile: Record<HazardKey, number>;
  environment: MissionEnvironment;
}

type ChartMetricKey = IndicatorKey | 'cabinCo2Ppm';

const CHART_METRICS: Array<{ key: ChartMetricKey; tabLabel: string }> = [
  { key: 'systolicBp', tabLabel: 'BP (Sys)' },
  { key: 'heartRate', tabLabel: 'Heart Rate' },
  { key: 'bloodGlucose', tabLabel: 'Glucose' },
  { key: 'bodyTemp', tabLabel: 'Temp' },
  { key: 'sleepHours', tabLabel: 'Sleep' },
  { key: 'moodScore', tabLabel: 'Mood' },
  { key: 'radiationDose', tabLabel: 'Radiation' },
  { key: 'cabinCo2Ppm', tabLabel: 'Cabin CO2' },
];

function getMetricMeta(key: ChartMetricKey) {
  if (key === 'cabinCo2Ppm') {
    return {
      label: 'ECLSS Cabin CO2',
      unit: 'ppm',
      precision: 0,
      nominalMin: 1500,
      nominalMax: 3000,
      step: 100,
    };
  }
  return INDICATOR_DEFINITIONS[key];
}

function getMetricValue(r: VitalReading, key: ChartMetricKey): number {
  if (key === 'cabinCo2Ppm') {
    return r.cabinCo2Ppm ?? 2600;
  }
  return r[key];
}

export const TrendCharts: React.FC<TrendChartsProps> = ({
  readings,
  hazardProfile,
  environment,
}) => {
  const [activeMetric, setActiveMetric] = useState<ChartMetricKey>('bloodGlucose');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const def = getMetricMeta(activeMetric);
  const sorted = [...readings].sort((a, b) => a.missionDay - b.missionDay);

  // SVG Time-Series Geometry
  const width = 660;
  const height = 240;
  const padLeft = 52;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 34;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const values = sorted.map((r) => getMetricValue(r, activeMetric));
  const rawMin = Math.min(...values, def.nominalMin);
  const rawMax = Math.max(...values, def.nominalMax);
  const margin = Math.max((rawMax - rawMin) * 0.18, def.step * 2);
  const yMin = Math.max(0, rawMin - margin);
  const yMax = rawMax + margin;

  const xPos = (idx: number) => {
    if (sorted.length <= 1) return padLeft + plotW / 2;
    return padLeft + (idx / (sorted.length - 1)) * plotW;
  };

  const yPos = (val: number) => {
    if (yMax === yMin) return padTop + plotH / 2;
    return padTop + ((yMax - val) / (yMax - yMin)) * plotH;
  };

  const linePoints = sorted
    .map((r, idx) => `${xPos(idx).toFixed(1)},${yPos(getMetricValue(r, activeMetric)).toFixed(1)}`)
    .join(' ');

  const nominalTopY = yPos(def.nominalMax);
  const nominalBottomY = yPos(def.nominalMin);

  const activePointIndex =
    hoveredIndex !== null && hoveredIndex < sorted.length
      ? hoveredIndex
      : sorted.length - 1;
  const activeReading = sorted[activePointIndex];

  // Radar Geometry for 5 NASA HRP Hazards (390x276 viewBox prevents side-label clipping)
  const radarW = 390;
  const radarH = 276;
  const radarCenterX = 195;
  const radarCenterY = 144;
  const radarRadius = 76;
  const hazardKeys = NASA_FIVE_HAZARDS.map((h) => h.key);

  const polarPoint = (axisIndex: number, pct: number) => {
    const angle = -Math.PI / 2 + (axisIndex * 2 * Math.PI) / hazardKeys.length;
    const r = (pct / 100) * radarRadius;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: radarCenterX + r * cos,
      y: radarCenterY + r * sin,
      labelX: radarCenterX + (radarRadius + 18) * cos,
      labelY: radarCenterY + (radarRadius + 18) * sin,
      anchor: Math.abs(cos) < 0.2 ? 'middle' : cos > 0 ? 'start' : 'end',
    } as const;
  };

  const radarPolygonPoints = hazardKeys
    .map((k, idx) => {
      const pt = polarPoint(idx, hazardProfile[k]);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
      {/* Left 8 cols: Dynamic Vital Trend Line Chart */}
      <div className="xl:col-span-8 bg-[#0F1522] border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                Physiological Time-Series Telemetry
              </h3>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                Nominal Band: {def.nominalMin}–{def.nominalMax} {def.unit} · Hover points to inspect
              </p>
            </div>
          </div>

          <div
            className="flex flex-wrap gap-1 bg-[#090D16] p-1 rounded-md border border-slate-800 self-start"
            role="tablist"
            aria-label="Select vital indicator trend"
          >
            {CHART_METRICS.map((item) => {
              const isSelected = activeMetric === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => {
                    setActiveMetric(item.key);
                    setHoveredIndex(null);
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {item.tabLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Crosshair Readout Strip */}
        {activeReading && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 mb-3 bg-[#090D16] border border-slate-800 rounded text-xs font-mono">
            <span className="text-slate-300">
              MD-{activeReading.missionDay} · {def.label}
            </span>
            <div className="flex items-center gap-4">
              <span className="text-cyan-300 font-semibold tabular-nums">
                {getMetricValue(activeReading, activeMetric).toFixed(def.precision)} {def.unit}
              </span>
              {activeMetric === 'systolicBp' && (
                <span className="text-slate-400 tabular-nums">
                  Diastolic: {activeReading.diastolicBp} mmHg
                </span>
              )}
              <span className="text-slate-400">
                Samples: {sorted.length}
              </span>
            </div>
          </div>
        )}

        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full min-w-[480px] h-auto"
            role="img"
            aria-label={`${def.label} trend chart over ${sorted.length} mission days`}
          >
            {/* Shaded Nominal Reference Band */}
            <rect
              x={padLeft}
              y={Math.max(padTop, nominalTopY)}
              width={plotW}
              height={Math.max(
                4,
                Math.min(padTop + plotH, nominalBottomY) - Math.max(padTop, nominalTopY)
              )}
              fill="rgba(16, 185, 129, 0.10)"
            />
            <line
              x1={padLeft}
              y1={nominalTopY}
              x2={padLeft + plotW}
              y2={nominalTopY}
              stroke="#10B981"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.55"
            />
            <line
              x1={padLeft}
              y1={nominalBottomY}
              x2={padLeft + plotW}
              y2={nominalBottomY}
              stroke="#10B981"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.55"
            />

            {/* Y-Axis Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((t) => {
              const y = padTop + t * plotH;
              const val = yMax - t * (yMax - yMin);
              return (
                <g key={t}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={padLeft + plotW}
                    y2={y}
                    stroke="#1E293B"
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    fill="#94A3B8"
                    fontSize="10"
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    {val.toFixed(def.precision)}
                  </text>
                </g>
              );
            })}

            {/* Primary Empirical Curve */}
            {sorted.length > 1 && (
              <polyline
                fill="none"
                stroke="#06B6D4"
                strokeWidth="2.2"
                points={linePoints}
              />
            )}

            {/* Optional Secondary Diastolic Curve when viewing BP */}
            {activeMetric === 'systolicBp' && sorted.length > 1 && (
              <polyline
                fill="none"
                stroke="#94A3B8"
                strokeWidth="1.6"
                strokeDasharray="4 3"
                points={sorted
                  .map((r, idx) => `${xPos(idx).toFixed(1)},${yPos(r.diastolicBp).toFixed(1)}`)
                  .join(' ')}
              />
            )}

            {/* Crosshair & Data Points */}
            {sorted.map((r, idx) => {
              const val = getMetricValue(r, activeMetric);
              const cx = xPos(idx);
              const cy = yPos(val);
              const isOut = val < def.nominalMin || val > def.nominalMax;
              const isActive = idx === activePointIndex;

              return (
                <g
                  key={r.id}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onFocus={() => setHoveredIndex(idx)}
                  tabIndex={0}
                  aria-label={`Mission Day ${r.missionDay}: ${val} ${def.unit}`}
                  className="cursor-pointer outline-none"
                >
                  {isActive && (
                    <line
                      x1={cx}
                      y1={padTop}
                      x2={cx}
                      y2={padTop + plotH}
                      stroke="#38BDF8"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  )}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isActive ? 5.5 : 3.8}
                    fill={isOut ? '#F59E0B' : '#06B6D4'}
                    stroke="#080C14"
                    strokeWidth="1.5"
                  />
                  {/* X-axis MD labels */}
                  {(sorted.length <= 12 || idx % 2 === 0 || idx === sorted.length - 1) && (
                    <text
                      x={cx}
                      y={height - 10}
                      textAnchor="middle"
                      fill={isActive ? '#E2E8F0' : '#94A3B8'}
                      fontSize="10"
                      fontFamily="IBM Plex Mono, monospace"
                    >
                      MD-{r.missionDay}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Right 4 cols: NASA 5-Hazard Radar Chart */}
      <div className="xl:col-span-4 bg-[#0F1522] border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-100">
            5-Hazard Exposure Profile
          </h3>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Active Habitat: {environment.shortLabel}
          </p>
        </div>

        <div className="flex items-center justify-center my-2">
          <svg
            viewBox={`0 0 ${radarW} ${radarH}`}
            className="w-full max-w-[340px] h-auto"
            role="img"
            aria-label="Radar chart of five spaceflight health hazards"
          >
            {/* Concentric Grid Polygons */}
            {[25, 50, 75, 100].map((ring) => {
              const pts = hazardKeys
                .map((_, idx) => {
                  const p = polarPoint(idx, ring);
                  return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
                })
                .join(' ');
              return (
                <polygon
                  key={ring}
                  points={pts}
                  fill="none"
                  stroke="#1E293B"
                  strokeWidth="1"
                />
              );
            })}

            {/* Radial Axes & Labels */}
            {NASA_FIVE_HAZARDS.map((hazard, idx) => {
              const outer = polarPoint(idx, 100);
              const val = hazardProfile[hazard.key];
              return (
                <g key={hazard.key}>
                  <line
                    x1={radarCenterX}
                    y1={radarCenterY}
                    x2={outer.x}
                    y2={outer.y}
                    stroke="#334155"
                    strokeWidth="1"
                  />
                  <text
                    x={outer.labelX}
                    y={outer.labelY - 2}
                    textAnchor={outer.anchor}
                    fill="#CBD5E1"
                    fontSize="10.5"
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    {hazard.shortLabel}
                  </text>
                  <text
                    x={outer.labelX}
                    y={outer.labelY + 10}
                    textAnchor={outer.anchor}
                    fill="#38BDF8"
                    fontSize="9.5"
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    {val}%
                  </text>
                </g>
              );
            })}

            {/* Active Exposure Polygon */}
            <polygon
              points={radarPolygonPoints}
              fill="rgba(6, 182, 212, 0.22)"
              stroke="#06B6D4"
              strokeWidth="2"
            />
          </svg>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-3">
          {environment.protocolEmphasis}
        </p>
      </div>
    </div>
  );
};
