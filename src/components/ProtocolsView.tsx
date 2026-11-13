import React, { useState } from 'react';
import { Search } from 'lucide-react';
import {
  BODY_SYSTEMS,
  INDICATOR_DEFINITIONS,
  NASA_FIVE_HAZARDS,
} from '../data/spaceMedicine';
import type { BodySystemId, IndicatorKey, MissionEnvironment } from '../types/health';

interface ProtocolsViewProps {
  environment: MissionEnvironment;
  onSelectSystemFromProtocol: (systemId: BodySystemId) => void;
}

export const ProtocolsView: React.FC<ProtocolsViewProps> = ({
  environment,
  onSelectSystemFromProtocol,
}) => {
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLowerCase();

  const filteredIndicators = (Object.keys(INDICATOR_DEFINITIONS) as IndicatorKey[]).filter(
    (k) => {
      const def = INDICATOR_DEFINITIONS[k];
      return (
        !normalized ||
        def.label.toLowerCase().includes(normalized) ||
        def.spaceflightFactor.toLowerCase().includes(normalized) ||
        def.examMethod.toLowerCase().includes(normalized)
      );
    }
  );

  return (
    <section aria-label="NASA Human Research Program Hazards and Self-Exam Protocols" className="space-y-6">
      {/* Five Spaceflight Hazards */}
      <div className="bg-[#0F1522] border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800/80">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              Five Hazards of Human Spaceflight
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Grounded in NASA Human Research Program (HRP) risk frameworks · Active Context: {environment.name}
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400">
            Comm Latency: {environment.commDelayLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {NASA_FIVE_HAZARDS.map((hazard) => (
            <article
              key={hazard.key}
              className="bg-[#0A0F1A] border border-slate-800 rounded-md p-4 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-100">{hazard.name}</h3>
                  <span className="text-xs font-mono text-cyan-400 tabular-nums">
                    {environment.hazardWeights[hazard.key]}% load
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {hazard.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <ul className="space-y-1 text-xs text-slate-300">
                  {hazard.keyMitigations.map((m, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-mono" aria-hidden="true">
                        •
                      </span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {hazard.affectedSystems.map((sysId) => {
                    const sys = BODY_SYSTEMS.find((s) => s.id === sysId);
                    if (!sys) return null;
                    return (
                      <button
                        key={sysId}
                        type="button"
                        onClick={() => onSelectSystemFromProtocol(sysId)}
                        className="text-xs font-mono text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
                      >
                        {sys.name.split(' ')[0]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Indicator Measurement Encyclopedia */}
      <div className="bg-[#0F1522] border border-slate-800 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              Self-Measurement Reference & Thresholds
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Plain-language instructions for performing accurate onboard checks without ground assistance.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter indicators..."
              aria-label="Filter clinical indicators"
              className="w-full pl-8 pr-3 py-1.5 bg-[#090D16] border border-slate-700 rounded-md text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-2.5 pr-4 font-medium">Indicator</th>
                <th className="py-2.5 pr-4 font-medium">Nominal Range</th>
                <th className="py-2.5 pr-4 font-medium">Onboard Exam Method</th>
                <th className="py-2.5 font-medium">Spaceflight Effect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredIndicators.map((key) => {
                const def = INDICATOR_DEFINITIONS[key];
                return (
                  <tr key={key} className="align-top">
                    <td className="py-3 pr-4 font-medium text-slate-100 whitespace-nowrap">
                      {def.label}
                    </td>
                    <td className="py-3 pr-4 font-mono tabular-nums text-emerald-400 whitespace-nowrap">
                      {def.nominalMin}–{def.nominalMax} {def.unit}
                    </td>
                    <td className="py-3 pr-4 text-slate-300 leading-relaxed min-w-[220px]">
                      {def.examMethod}
                    </td>
                    <td className="py-3 text-slate-300 leading-relaxed min-w-[220px]">
                      {def.spaceflightFactor}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredIndicators.length === 0 && (
            <p className="text-xs text-slate-400 py-6 text-center">
              No indicators match &ldquo;{query}&rdquo;.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
