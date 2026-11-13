import React, { useEffect, useMemo, useState } from 'react';
import { Download, RotateCcw, ShieldAlert } from 'lucide-react';
import { BodyMapSvg } from './components/BodyMapSvg';
import { LogVitalsModal } from './components/LogVitalsModal';
import { ProtocolsView } from './components/ProtocolsView';
import { RoutinePanel } from './components/RoutinePanel';
import { SystemInspector } from './components/SystemInspector';
import { TrendCharts } from './components/TrendCharts';
import {
  BODY_SYSTEMS,
  MISSION_ENVIRONMENTS,
  SEED_ROUTINE_TASKS,
  SEED_ULTRASOUND_EXAMS,
  SEED_VITAL_READINGS,
} from './data/spaceMedicine';
import type {
  BodySystemId,
  MissionEnvironmentId,
  RoutineTask,
  SystemEvaluation,
  UltrasoundExam,
  VitalReading,
} from './types/health';
import {
  buildStoreAndForwardPacket,
  computeHazardProfile,
  computeRadiationSummary,
  computeReadinessSummary,
  evaluateBloodPressure,
  evaluateEclssStatus,
  evaluateHrpRisks,
  evaluateIndicator,
  evaluateSystemStatus,
  statusMeta,
} from './utils/healthEngine';

type AppTab = 'body-map' | 'trends' | 'routine' | 'protocols';

const STORAGE_KEY = 'astramed_console_v1';

interface PersistedState {
  environmentId: MissionEnvironmentId;
  readings: VitalReading[];
  tasks: RoutineTask[];
  exams: UltrasoundExam[];
}

function loadInitialState(): PersistedState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (
        parsed.environmentId &&
        Array.isArray(parsed.readings) &&
        parsed.readings.length > 0 &&
        Array.isArray(parsed.tasks) &&
        Array.isArray(parsed.exams)
      ) {
        return {
          environmentId: parsed.environmentId,
          readings: parsed.readings,
          tasks: parsed.tasks,
          exams: parsed.exams,
        };
      }
    }
  } catch {
    // Fallback to deterministic seed state
  }
  return {
    environmentId: 'orbital-station',
    readings: SEED_VITAL_READINGS,
    tasks: SEED_ROUTINE_TASKS,
    exams: SEED_ULTRASOUND_EXAMS,
  };
}

export default function App() {
  const initial = useMemo(() => loadInitialState(), []);

  const [activeTab, setActiveTab] = useState<AppTab>('body-map');
  const [environmentId, setEnvironmentId] = useState<MissionEnvironmentId>(
    initial.environmentId
  );
  const [selectedSystem, setSelectedSystem] = useState<BodySystemId>('cardio');
  const [readings, setReadings] = useState<VitalReading[]>(initial.readings);
  const [tasks, setTasks] = useState<RoutineTask[]>(initial.tasks);
  const [exams, setExams] = useState<UltrasoundExam[]>(initial.exams);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'vitals' | 'imaging'>('vitals');
  const [modalSystemId, setModalSystemId] = useState<BodySystemId>('ocular');
  const [packetNotice, setPacketNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      const payload: PersistedState = {
        environmentId,
        readings,
        tasks,
        exams,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [environmentId, readings, tasks, exams]);

  const environment =
    MISSION_ENVIRONMENTS.find((e) => e.id === environmentId) ?? MISSION_ENVIRONMENTS[0];

  const sortedReadings = useMemo(
    () => [...readings].sort((a, b) => a.missionDay - b.missionDay),
    [readings]
  );
  const latestReading = sortedReadings[sortedReadings.length - 1];
  const nextMissionDay = latestReading ? latestReading.missionDay + 1 : 1;

  const systemEvaluations = useMemo(() => {
    const map = {} as Record<BodySystemId, SystemEvaluation>;
    for (const sys of BODY_SYSTEMS) {
      map[sys.id] = evaluateSystemStatus(sys.id, latestReading, environmentId);
    }
    return map;
  }, [latestReading, environmentId]);

  const hazardProfile = useMemo(
    () => computeHazardProfile(latestReading, tasks, environmentId),
    [latestReading, tasks, environmentId]
  );

  const readiness = useMemo(
    () => computeReadinessSummary(sortedReadings, tasks, environmentId),
    [sortedReadings, tasks, environmentId]
  );

  const radiation = useMemo(
    () => computeRadiationSummary(sortedReadings),
    [sortedReadings]
  );

  const eclss = useMemo(
    () => evaluateEclssStatus(latestReading, environmentId),
    [latestReading, environmentId]
  );

  const hrpRisks = useMemo(
    () => evaluateHrpRisks(sortedReadings, tasks, environmentId),
    [sortedReadings, tasks, environmentId]
  );

  const overallMeta = statusMeta(readiness.overallStatus);
  const overallTone =
    readiness.overallStatus === 'action'
      ? 'text-rose-400'
      : readiness.overallStatus === 'monitor'
        ? 'text-amber-400'
        : 'text-emerald-400';

  const bpEval = latestReading
    ? evaluateBloodPressure(
        latestReading.systolicBp,
        latestReading.diastolicBp,
        environmentId
      )
    : null;
  const hrEval = latestReading
    ? evaluateIndicator('heartRate', latestReading.heartRate, environmentId)
    : null;
  const glucoseEval = latestReading
    ? evaluateIndicator('bloodGlucose', latestReading.bloodGlucose, environmentId)
    : null;
  const sleepEval = latestReading
    ? evaluateIndicator('sleepHours', latestReading.sleepHours, environmentId)
    : null;

  function handleSaveVitals(newReading: VitalReading) {
    setReadings((prev) => [...prev, newReading]);
  }

  function handleSaveExam(newExam: UltrasoundExam) {
    setExams((prev) => [newExam, ...prev]);
    setSelectedSystem(newExam.systemId);
  }

  function handleToggleTask(taskId: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, completedToday: !t.completedToday } : t
      )
    );
  }

  function handleResetDemo() {
    setEnvironmentId('orbital-station');
    setReadings(SEED_VITAL_READINGS);
    setTasks(SEED_ROUTINE_TASKS);
    setExams(SEED_ULTRASOUND_EXAMS);
    setSelectedSystem('cardio');
    setPacketNotice(null);
  }

  function handleExportPacket() {
    const packet = buildStoreAndForwardPacket(
      sortedReadings,
      exams,
      tasks,
      environmentId
    );
    const blob = new Blob([JSON.stringify(packet, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `astramed-packet-md${latestReading?.missionDay ?? 1}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setPacketNotice(
      `Medical packet exported for MD-${latestReading?.missionDay ?? 1} (${environment.commDelayMinutes >= 5 ? 'store-and-forward autonomous mode' : 'real-time flight surgeon sync'}).`
    );
  }

  function openVitalsModal() {
    setModalTab('vitals');
    setModalSystemId(selectedSystem);
    setModalOpen(true);
  }

  function openExamModalForSystem(sysId: BodySystemId) {
    setModalTab('imaging');
    setModalSystemId(sysId);
    setModalOpen(true);
  }

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="border-b border-slate-800/90 bg-[#0A0F1A]">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('body-map');
            }}
            className="text-lg font-display font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded"
          >
            AstraMed
          </a>

          <nav
            aria-label="Primary sections"
            className="hidden md:flex items-center gap-6"
          >
            {(
              [
                { id: 'body-map', label: 'Body Map' },
                { id: 'trends', label: 'Trends' },
                { id: 'routine', label: 'Routine' },
                { id: 'protocols', label: 'Protocols' },
              ] as const
            ).map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`py-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                    isActive
                      ? 'border-cyan-400 text-slate-100'
                      : 'border-transparent text-slate-400 hover:text-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={openVitalsModal}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Log Vitals
            </button>
          </div>
        </div>

        {/* Mobile navigation row */}
        <nav
          aria-label="Mobile sections"
          className="md:hidden border-t border-slate-800/80 px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto"
        >
          {(
            [
              { id: 'body-map', label: 'Body Map' },
              { id: 'trends', label: 'Trends' },
              { id: 'routine', label: 'Routine' },
              { id: 'protocols', label: 'Protocols' },
            ] as const
          ).map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="flex-1 max-w-[1380px] w-full mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Workspace Telemetry & Environment Ribbon */}
        <section
          aria-label="Mission Environment and Status"
          className="bg-[#0F1522] border border-slate-800 rounded-lg p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4"
        >
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <div>
              <h1 className="text-base sm:text-lg font-semibold text-slate-100">
                Crew Self-Assessment Console
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400 mt-0.5">
                <span className={overallTone}>
                  {overallMeta.glyph} {overallMeta.label}
                </span>
                <span aria-hidden="true">·</span>
                <span>Mission Day {latestReading?.missionDay ?? 1}</span>
                <span aria-hidden="true">·</span>
                <span>{environment.gravityLabel}</span>
                <span aria-hidden="true">·</span>
                <span>Comm: {environment.commDelayLabel}</span>
              </div>
            </div>
          </div>

          {/* Environment Switcher + Reset */}
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="grid grid-cols-2 sm:flex items-center gap-1 p-1 bg-[#090D16] border border-slate-800 rounded-md"
              role="group"
              aria-label="Mission Environment"
            >
              {MISSION_ENVIRONMENTS.map((env) => {
                const isSelected = environmentId === env.id;
                return (
                  <button
                    key={env.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setEnvironmentId(env.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-100 border border-transparent'
                    }`}
                  >
                    {env.shortLabel}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleExportPacket}
              aria-label="Export medical packet"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-cyan-300 hover:text-cyan-200 bg-[#090D16] border border-slate-800 hover:border-cyan-500/50 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              Export Packet
            </button>

            <button
              type="button"
              onClick={handleResetDemo}
              aria-label="Reset demo data"
              title="Reset demo telemetry"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-slate-400 hover:text-slate-100 bg-[#090D16] border border-slate-800 hover:border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Reset
            </button>
          </div>
        </section>

        {packetNotice && (
          <div
            role="status"
            className="bg-cyan-950/35 border border-cyan-500/40 rounded-lg px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-cyan-200"
          >
            <span>{packetNotice}</span>
            <button
              type="button"
              onClick={() => setPacketNotice(null)}
              className="font-mono text-cyan-300 hover:text-cyan-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {(radiation.speActive || eclss.status === 'action') && (
          <div
            role="alert"
            className="bg-rose-950/45 border border-rose-500/50 rounded-lg p-4 flex items-start gap-3 text-rose-100"
          >
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1 text-xs">
              <p className="font-mono font-semibold text-rose-300 uppercase">
                ✖ Immediate Crew Safety Advisory
              </p>
              {radiation.speActive && (
                <p>
                  Solar Particle Event (SPE) spike detected ({radiation.latestDailyMsv.toFixed(2)} mSv/day). Relocate to water/polyethylene-shielded storm shelter and suspend unshielded EVA.
                </p>
              )}
              {eclss.status === 'action' && <p>{eclss.summary}</p>}
            </div>
          </div>
        )}

        {/* 4-Column Core Physiological Strip */}
        {latestReading && (
          <section
            aria-label="Latest Vital Indicators"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {/* Card 1: Blood Pressure */}
            <div className="bg-[#0F1522] border border-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Blood Pressure
                </span>
                {bpEval && (
                  <span
                    className={`text-xs font-mono whitespace-nowrap shrink-0 ${
                      bpEval.status === 'action'
                        ? 'text-rose-400'
                        : bpEval.status === 'monitor'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                    }`}
                  >
                    {bpEval.glyph} {bpEval.statusLabel}
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex items-baseline">
                <span className="text-2xl font-mono font-semibold tabular-nums text-slate-100">
                  {latestReading.systolicBp}/{latestReading.diastolicBp}
                </span>
                <span className="text-xs font-mono text-slate-400 ml-1.5">mmHg</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Target: 95–129 / 60–84 mmHg
              </p>
            </div>

            {/* Card 2: Resting Heart Rate & Core Temp */}
            <div className="bg-[#0F1522] border border-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Heart Rate & Core Temp
                </span>
                {hrEval && (
                  <span
                    className={`text-xs font-mono whitespace-nowrap shrink-0 ${
                      hrEval.status === 'action'
                        ? 'text-rose-400'
                        : hrEval.status === 'monitor'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                    }`}
                  >
                    {hrEval.glyph} {hrEval.statusLabel}
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex items-baseline gap-3">
                <div>
                  <span className="text-2xl font-mono font-semibold tabular-nums text-slate-100">
                    {latestReading.heartRate}
                  </span>
                  <span className="text-xs font-mono text-slate-400 ml-1">bpm</span>
                </div>
                <span className="text-slate-600 font-mono">·</span>
                <div>
                  <span className="text-xl font-mono font-semibold tabular-nums text-slate-200">
                    {latestReading.bodyTemp.toFixed(1)}
                  </span>
                  <span className="text-xs font-mono text-slate-400 ml-1">°C</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Radiation: {latestReading.radiationDose.toFixed(2)} mSv/day
              </p>
            </div>

            {/* Card 3: Blood Glucose */}
            <div className="bg-[#0F1522] border border-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Blood Glucose
                </span>
                {glucoseEval && (
                  <span
                    className={`text-xs font-mono whitespace-nowrap shrink-0 ${
                      glucoseEval.status === 'action'
                        ? 'text-rose-400'
                        : glucoseEval.status === 'monitor'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                    }`}
                  >
                    {glucoseEval.glyph} {glucoseEval.statusLabel}
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex items-baseline">
                <span className="text-2xl font-mono font-semibold tabular-nums text-slate-100">
                  {latestReading.bloodGlucose}
                </span>
                <span className="text-xs font-mono text-slate-400 ml-1.5">mg/dL</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Fasting target: 70–125 mg/dL
              </p>
            </div>

            {/* Card 4: Sleep, Mood & Adherence */}
            <div className="bg-[#0F1522] border border-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Sleep & Readiness
                </span>
                {sleepEval && (
                  <span
                    className={`text-xs font-mono whitespace-nowrap shrink-0 ${
                      sleepEval.status === 'action'
                        ? 'text-rose-400'
                        : sleepEval.status === 'monitor'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                    }`}
                  >
                    {sleepEval.glyph} {sleepEval.statusLabel}
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex items-baseline gap-3">
                <div>
                  <span className="text-2xl font-mono font-semibold tabular-nums text-slate-100">
                    {latestReading.sleepHours.toFixed(1)}
                  </span>
                  <span className="text-xs font-mono text-slate-400 ml-1">hrs</span>
                </div>
                <span className="text-slate-600 font-mono">·</span>
                <div>
                  <span className="text-xl font-mono font-semibold tabular-nums text-slate-200">
                    {latestReading.moodScore}/10
                  </span>
                  <span className="text-xs font-mono text-slate-400 ml-1">mood</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Routine: {readiness.completedTasks}/{readiness.totalTasks} tasks · {readiness.streakDays}d streak
              </p>
            </div>
          </section>
        )}

        {/* Unified ECLSS & Career Radiation Dosimetry Strip */}
        <section
          aria-label="Unified ECLSS Cabin and Career Radiation Telemetry"
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          <div className="bg-[#0F1522] border border-slate-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  ECLSS Cabin Atmosphere
                </span>
                <span
                  className={`text-xs font-mono ${
                    eclss.status === 'action'
                      ? 'text-rose-400'
                      : eclss.status === 'monitor'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                  }`}
                >
                  {eclss.glyph} {eclss.statusLabel}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">{eclss.summary}</p>
            </div>
            <div className="flex items-center gap-4 font-mono tabular-nums text-xs shrink-0">
              <div>
                <span className="text-slate-400 block">CO2</span>
                <span className="text-sm font-semibold text-slate-100">{eclss.co2Ppm} ppm</span>
              </div>
              <div>
                <span className="text-slate-400 block">O2</span>
                <span className="text-sm font-semibold text-slate-100">{eclss.o2Pct.toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-slate-400 block">Press</span>
                <span className="text-sm font-semibold text-slate-100">{eclss.pressureKpa.toFixed(1)} kPa</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0F1522] border border-slate-800 rounded-lg p-4 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Personal Dosimetry & Career Exposure Limit
              </span>
              <span
                className={`text-xs font-mono ${
                  radiation.speActive ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {radiation.speActive ? '✖ SPE Alert' : '● Space Weather Quiet'}
              </span>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 font-mono tabular-nums">
              <div className="text-xs text-slate-300">
                Mission Dose:{' '}
                <span className="text-sm font-semibold text-slate-100">
                  {radiation.missionCumulativeMsv} mSv
                </span>
                {' · '}Career:{' '}
                <span className="text-sm font-semibold text-cyan-300">
                  {radiation.careerTotalMsv} / {radiation.careerLimitMsv} mSv
                </span>
              </div>
              <span className="text-xs text-slate-400">{radiation.careerPct}% of NASA limit</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-200 ${
                  radiation.speActive ? 'bg-rose-500' : 'bg-cyan-400'
                }`}
                style={{ width: `${Math.max(2, radiation.careerPct)}%` }}
              />
            </div>
          </div>
        </section>

        {/* Active View Area */}
        {activeTab === 'body-map' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
              <div className="xl:col-span-5 bg-[#0F1522] border border-slate-800 rounded-lg p-4">
                <BodyMapSvg
                  selectedSystem={selectedSystem}
                  onSelectSystem={setSelectedSystem}
                  evaluations={systemEvaluations}
                />
              </div>

              <div className="xl:col-span-7">
                <SystemInspector
                  systemId={selectedSystem}
                  evaluation={systemEvaluations[selectedSystem]}
                  latestReading={latestReading}
                  environment={environment}
                  exams={exams}
                  onOpenExamLogger={openExamModalForSystem}
                />
              </div>
            </div>

            {/* Environment Briefing & Quick Navigation to Routine / Trends */}
            <div className="bg-[#0F1522] border border-slate-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-mono text-cyan-400 uppercase">
                  Active Habitat Briefing · {environment.name}
                </p>
                <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                  {environment.summary}
                </p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('trends')}
                  className="px-3.5 py-2 text-xs font-medium bg-[#090D16] hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  View Trend Charts
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('routine')}
                  className="px-3.5 py-2 text-xs font-medium bg-[#090D16] hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  Open Routine ({readiness.completedTasks}/{readiness.totalTasks})
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-5">
            <TrendCharts
              readings={sortedReadings}
              hazardProfile={hazardProfile}
              environment={environment}
            />

            {/* Mission Telemetry Log Table */}
            <section
              aria-label="Mission Vital Sign Log History"
              className="bg-[#0F1522] border border-slate-800 rounded-lg p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                <h2 className="text-base font-semibold text-slate-100">
                  Logged Telemetry History ({sortedReadings.length} entries)
                </h2>
                <button
                  type="button"
                  onClick={openVitalsModal}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
                >
                  Add Entry
                </button>
              </div>

              <div className="overflow-x-auto mt-3">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono">
                      <th className="py-2 pr-4 font-medium">Day</th>
                      <th className="py-2 pr-4 font-medium">BP (mmHg)</th>
                      <th className="py-2 pr-4 font-medium">HR (bpm)</th>
                      <th className="py-2 pr-4 font-medium">Glucose</th>
                      <th className="py-2 pr-4 font-medium">Temp (°C)</th>
                      <th className="py-2 pr-4 font-medium">Sleep (h)</th>
                      <th className="py-2 pr-4 font-medium">Mood</th>
                      <th className="py-2 pr-4 font-medium">Rad (mSv)</th>
                      <th className="py-2 pr-4 font-medium">CO2 (ppm)</th>
                      <th className="py-2 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 font-mono tabular-nums">
                    {[...sortedReadings].reverse().map((r) => (
                      <tr key={r.id}>
                        <td className="py-2.5 pr-4 text-cyan-300 whitespace-nowrap">
                          MD-{r.missionDay}
                        </td>
                        <td className="py-2.5 pr-4 text-slate-200 whitespace-nowrap">
                          {r.systolicBp}/{r.diastolicBp}
                        </td>
                        <td className="py-2.5 pr-4 text-slate-200">{r.heartRate}</td>
                        <td className="py-2.5 pr-4 text-slate-200">{r.bloodGlucose} mg/dL</td>
                        <td className="py-2.5 pr-4 text-slate-200">{r.bodyTemp.toFixed(1)}</td>
                        <td className="py-2.5 pr-4 text-slate-200">{r.sleepHours.toFixed(1)}</td>
                        <td className="py-2.5 pr-4 text-slate-200">{r.moodScore}/10</td>
                        <td className="py-2.5 pr-4 text-slate-200">
                          {r.radiationDose.toFixed(2)}
                        </td>
                        <td className="py-2.5 pr-4 text-slate-200">
                          {r.cabinCo2Ppm ?? '—'}
                        </td>
                        <td className="py-2.5 font-sans text-slate-400 min-w-[180px]">
                          {r.notes ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'routine' && (
          <RoutinePanel
            tasks={tasks}
            environment={environment}
            adherencePct={readiness.adherencePct}
            earnedPoints={readiness.earnedPoints}
            streakDays={readiness.streakDays}
            onToggleTask={handleToggleTask}
            onInspectSystem={(sysId) => {
              setSelectedSystem(sysId);
              setActiveTab('body-map');
            }}
          />
        )}

        {activeTab === 'protocols' && (
          <ProtocolsView
            environment={environment}
            hrpRisks={hrpRisks}
            onSelectSystemFromProtocol={(sysId) => {
              setSelectedSystem(sysId);
              setActiveTab('body-map');
            }}
          />
        )}
      </main>

      <footer className="border-t border-slate-800/80 py-4 px-4 sm:px-6 text-xs text-slate-400">
        <div className="max-w-[1380px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>
            AstraMed Crew Self-Monitoring Reference · Grounded in NASA Human Research Program hazard frameworks
          </span>
          <span className="font-mono text-slate-400">
            Active Readings: {sortedReadings.length} · Ultrasound Archive: {exams.length}
          </span>
        </div>
      </footer>

      <LogVitalsModal
        isOpen={modalOpen}
        initialTab={modalTab}
        initialSystemId={modalSystemId}
        nextMissionDay={nextMissionDay}
        latestReading={latestReading}
        environmentId={environmentId}
        onClose={() => setModalOpen(false)}
        onSaveVitals={handleSaveVitals}
        onSaveExam={handleSaveExam}
      />
    </div>
  );
}
