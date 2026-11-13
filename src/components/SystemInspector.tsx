import React from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  ShieldAlert,
  Stethoscope,
} from 'lucide-react';
import {
  BODY_SYSTEMS,
  INDICATOR_DEFINITIONS,
  NASA_FIVE_HAZARDS,
} from '../data/spaceMedicine';
import type {
  BodySystemId,
  MissionEnvironment,
  SystemEvaluation,
  UltrasoundExam,
  VitalReading,
} from '../types/health';
import { evaluateIndicator } from '../utils/healthEngine';

interface SystemInspectorProps {
  systemId: BodySystemId;
  evaluation: SystemEvaluation;
  latestReading: VitalReading | undefined;
  environment: MissionEnvironment;
  exams: UltrasoundExam[];
  onOpenExamLogger: (systemId: BodySystemId) => void;
}

export const SystemInspector: React.FC<SystemInspectorProps> = ({
  systemId,
  evaluation,
  latestReading,
  environment,
  exams,
  onOpenExamLogger,
}) => {
  const system = BODY_SYSTEMS.find((s) => s.id === systemId) ?? BODY_SYSTEMS[0];
  const linkedExams = exams.filter((e) => e.systemId === system.id);

  const statusBannerStyle =
    evaluation.status === 'action'
      ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
      : evaluation.status === 'monitor'
        ? 'bg-amber-950/35 border-amber-500/40 text-amber-200'
        : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200';

  const statusTextColor =
    evaluation.status === 'action'
      ? 'text-rose-400'
      : evaluation.status === 'monitor'
        ? 'text-amber-400'
        : 'text-emerald-400';

  return (
    <section
      aria-label={`${system.name} Assessment`}
      className="bg-[#0F1522] border border-slate-800 rounded-lg p-5 flex flex-col gap-5"
    >
      {/* Header & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <p className="text-xs font-mono text-slate-400">
            {system.anatomicalRegion} · {environment.shortLabel}
          </p>
          <h2 className="text-xl font-semibold text-slate-100 mt-1">{system.name}</h2>
          <p className="text-sm text-slate-300 mt-1.5 leading-relaxed max-w-2xl">
            {system.primaryFunction}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenExamLogger(system.id)}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <Camera className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
          Attach Scan / Exam
        </button>
      </div>

      {/* Diagnostic Status Readout */}
      <div className={`border rounded-md p-3.5 ${statusBannerStyle}`}>
        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs font-mono font-semibold ${statusTextColor}`}>
            {evaluation.glyph} {evaluation.statusLabel.toUpperCase()}
          </span>
          <span className="text-xs font-mono text-slate-400">
            Comm Link: {environment.commDelayLabel}
          </span>
        </div>
        <p className="text-sm font-medium mt-1">{evaluation.headline}</p>
        <ul className="mt-2 space-y-1 text-xs text-slate-200/90">
          {evaluation.actions.map((act, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span aria-hidden="true" className="text-cyan-400 font-mono">
                ›
              </span>
              <span>{act}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Live Linked Indicators */}
      {latestReading && (
        <div>
          <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2.5">
            Latest Linked Measurements (Mission Day {latestReading.missionDay})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {system.linkedIndicators.map((key) => {
              const def = INDICATOR_DEFINITIONS[key];
              const value = latestReading[key];
              const indEval = evaluateIndicator(key, value, environment.id);
              const tone =
                indEval.status === 'action'
                  ? 'text-rose-400'
                  : indEval.status === 'monitor'
                    ? 'text-amber-400'
                    : 'text-emerald-400';

              return (
                <div
                  key={key}
                  className="bg-[#0A0F1A] border border-slate-800 rounded-md p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-400 truncate">{def.label}</span>
                    <span className={`text-xs font-mono whitespace-nowrap shrink-0 ${tone}`}>
                      {indEval.glyph} {indEval.statusLabel}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-baseline">
                    <span className="text-2xl font-mono font-semibold tabular-nums text-slate-100">
                      {value.toFixed(def.precision)}
                    </span>
                    <span className="text-xs font-mono text-slate-400 ml-1.5">{def.unit}</span>
                  </div>
                  <p className="text-xs font-mono text-slate-400 mt-1">
                    Nominal: {def.nominalMin}–{def.nominalMax} {def.unit}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Spaceflight Impact & Why Exam Matters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        <div className="bg-[#0B101B] border border-slate-800/90 rounded-md p-3.5">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1.5">
            <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Spaceflight Hazard Impact</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{system.spaceflightImpact}</p>
          <p className="text-xs text-slate-400 mt-2.5">
            Contributing Hazards:{' '}
            {system.linkedHazards
              .map((hk) => NASA_FIVE_HAZARDS.find((h) => h.key === hk)?.shortLabel ?? hk)
              .join(' · ')}
          </p>
        </div>

        <div className="bg-[#0B101B] border border-slate-800/90 rounded-md p-3.5">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1.5">
            <Stethoscope className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Why This Self-Exam Is Critical</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{system.whyExamNeeded}</p>
        </div>
      </div>

      {/* Step-by-Step Self-Measurement & Escalation Guidance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        <div>
          <h3 className="flex items-center gap-1.5 text-xs font-mono text-slate-300 uppercase tracking-wider mb-2">
            <ClipboardCheck className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
            How to Measure in Space
          </h3>
          <ol className="space-y-1.5 text-xs text-slate-300 leading-relaxed list-decimal list-inside">
            {system.howToMeasure.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>

        <div>
          <h3 className="flex items-center gap-1.5 text-xs font-mono text-slate-300 uppercase tracking-wider mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            When to Contact Flight Surgeon
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed">
            {system.flightSurgeonTriggers.map((trig, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-amber-400 font-mono" aria-hidden="true">
                  ▲
                </span>
                <span>{trig}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="flex items-center gap-1.5 text-xs font-mono text-slate-300 uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            Preventative Actions
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed">
            {system.countermeasures.map((cm, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-mono" aria-hidden="true">
                  •
                </span>
                <span>{cm}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Linked Ultrasound / Visual Exam Records */}
      {linkedExams.length > 0 && (
        <div className="pt-3 border-t border-slate-800/80">
          <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2.5">
            Recent Imaging & Visual Checks ({linkedExams.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {linkedExams.map((exam) => (
              <div
                key={exam.id}
                className="bg-[#0A0F1A] border border-slate-800 rounded-md p-3 flex gap-3 items-start"
              >
                <img
                  src={exam.imageUrl}
                  alt={`${exam.examType} captured on Mission Day ${exam.missionDay}`}
                  referrerPolicy="no-referrer"
                  className="w-28 h-20 object-cover rounded border border-slate-700 shrink-0 bg-slate-900"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-slate-100 truncate">
                      {exam.examType}
                    </span>
                    <span className="text-xs font-mono text-slate-400 shrink-0">
                      MD-{exam.missionDay}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">{exam.findingsNote}</p>
                  {exam.caliperMm !== undefined && (
                    <p className="text-xs font-mono text-cyan-400 mt-1">
                      Caliper Measurement: {exam.caliperMm} mm
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
