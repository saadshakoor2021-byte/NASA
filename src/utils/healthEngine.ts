import {
  BODY_SYSTEMS,
  CAREER_RADIATION_BASELINE_MSV,
  INDICATOR_DEFINITIONS,
  MISSION_ENVIRONMENTS,
  NASA_CAREER_LIMIT_MSV,
  NASA_HRP_RISKS,
} from '../data/spaceMedicine';
import type {
  BodySystemId,
  EclssEvaluation,
  HazardKey,
  HealthStatus,
  HrpRiskEvaluation,
  IndicatorEvaluation,
  IndicatorKey,
  MissionEnvironmentId,
  RadiationSummary,
  RoutineTask,
  SystemEvaluation,
  UltrasoundExam,
  VitalReading,
  VitalValidationResult,
} from '../types/health';

const STATUS_PRIORITY: Record<HealthStatus, number> = {
  nominal: 0,
  monitor: 1,
  action: 2,
};

export function statusMeta(status: HealthStatus): { label: string; glyph: string } {
  switch (status) {
    case 'nominal':
      return { label: 'Nominal', glyph: '●' };
    case 'monitor':
      return { label: 'Monitor', glyph: '▲' };
    case 'action':
      return { label: 'Action Required', glyph: '✖' };
  }
}

export function evaluateIndicator(
  key: IndicatorKey,
  value: number,
  environmentId: MissionEnvironmentId = 'orbital-station'
): IndicatorEvaluation {
  const def = INDICATOR_DEFINITIONS[key];
  const env = MISSION_ENVIRONMENTS.find((e) => e.id === environmentId);

  // Environment-adjusted threshold awareness (e.g. radiation baseline in deep space)
  let nominalMax = def.nominalMax;
  if (key === 'radiationDose' && env && env.dailyRadiationBaselineMsv > 1.5) {
    nominalMax = 2.2;
  }

  const isCriticalLow = def.criticalLow !== undefined && value < def.criticalLow;
  const isCriticalHigh = def.criticalHigh !== undefined && value > def.criticalHigh;

  if (isCriticalLow || isCriticalHigh) {
    const meta = statusMeta('action');
    const direction = isCriticalLow ? 'below critical threshold' : 'above critical threshold';
    return {
      status: 'action',
      statusLabel: meta.label,
      glyph: meta.glyph,
      summary: `${def.label} (${value.toFixed(def.precision)} ${def.unit}) is ${direction}.`,
      recommendation: getIndicatorActionAdvice(key, value < def.nominalMin ? 'low' : 'high', 'action', env?.commDelayMinutes ?? 0),
    };
  }

  if (value < def.nominalMin || value > nominalMax) {
    const meta = statusMeta('monitor');
    const direction = value < def.nominalMin ? 'below nominal range' : 'above nominal range';
    return {
      status: 'monitor',
      statusLabel: meta.label,
      glyph: meta.glyph,
      summary: `${def.label} (${value.toFixed(def.precision)} ${def.unit}) is slightly ${direction}.`,
      recommendation: getIndicatorActionAdvice(key, value < def.nominalMin ? 'low' : 'high', 'monitor', env?.commDelayMinutes ?? 0),
    };
  }

  const meta = statusMeta('nominal');
  return {
    status: 'nominal',
    statusLabel: meta.label,
    glyph: meta.glyph,
    summary: `${def.label} is within expected spaceflight nominal band (${def.nominalMin}–${nominalMax} ${def.unit}).`,
    recommendation: 'Continue scheduled mission monitoring.',
  };
}

function getIndicatorActionAdvice(
  key: IndicatorKey,
  dir: 'low' | 'high',
  severity: 'monitor' | 'action',
  commDelayMin: number
): string {
  const consultSuffix =
    commDelayMin >= 5
      ? ' Transmit store-and-forward medical packet to Flight Surgeon immediately.'
      : ' Notify Flight Surgeon / Crew Medical Officer.';

  switch (key) {
    case 'systolicBp':
    case 'diastolicBp':
      if (dir === 'low') {
        return severity === 'action'
          ? `Recline/brace, hydrate 500 mL electrolyte solution, and repeat BP in 10 min.${consultSuffix}`
          : 'Increase electrolyte fluid intake and avoid rapid posture shifts.';
      }
      return severity === 'action'
        ? `Rest quietly for 15 min, check cabin CO2, and repeat cuff measurement.${consultSuffix}`
        : 'Re-check after 15 min calm rest and verify cuff alignment at heart level.';

    case 'heartRate':
      if (dir === 'low') {
        return 'Verify sensor contact; assess for dizziness or fatigue.';
      }
      return severity === 'action'
        ? `Pause exertion, hydrate 500 mL, check temperature and ECG trace.${consultSuffix}`
        : 'Log recent caffeine or exercise timing and repeat resting HR in 30 min.';

    case 'bloodGlucose':
      if (dir === 'low') {
        return severity === 'action'
          ? `Consume 15–20 g fast-acting carbohydrate gel immediately and re-test in 15 min.${consultSuffix}`
          : 'Eat complex carbohydrate snack prior to next EVA or resistive session.';
      }
      return severity === 'action'
        ? `Hydrate with water, check ketone strip if symptomatic, and repeat fasting glucose.${consultSuffix}`
        : 'Review sleep quality and carbohydrate timing; re-test fasting tomorrow.';

    case 'bodyTemp':
      if (dir === 'low') {
        return 'Check suit/cabin thermal control and warm core with dry layers.';
      }
      return severity === 'action'
        ? `Check for infection, skin rash, or suit overheating; cool cabin/hydrate and repeat in 30 min.${consultSuffix}`
        : 'Monitor for respiratory or skin symptoms; verify sleep bay airflow.';

    case 'sleepHours':
      return severity === 'action'
        ? `Severe sleep deficit (< 5h): defer precision EVA/robotics if possible and schedule circadian recovery nap.${consultSuffix}`
        : 'Check cabin CO2 & noise levels; prioritize 480nm morning light and wind-down.';

    case 'moodScore':
      return severity === 'action'
        ? `Elevated behavioral strain: schedule private crew decompression time and ground behavioral support link.${consultSuffix}`
        : 'Protect personal rest time and check workload balance with crew commander.';

    case 'radiationDose':
      return severity === 'action'
        ? `High radiation readout: verify Solar Particle Event status and relocate to shielded storm shelter.${consultSuffix}`
        : 'Elevated daily dose: limit unshielded EVA duration and track cumulative mSv.';
  }
}

export function evaluateBloodPressure(
  systolic: number,
  diastolic: number,
  environmentId: MissionEnvironmentId = 'orbital-station'
): IndicatorEvaluation {
  const sysEval = evaluateIndicator('systolicBp', systolic, environmentId);
  const diaEval = evaluateIndicator('diastolicBp', diastolic, environmentId);
  return STATUS_PRIORITY[sysEval.status] >= STATUS_PRIORITY[diaEval.status]
    ? sysEval
    : diaEval;
}

export function evaluateSystemStatus(
  systemId: BodySystemId,
  latestReading: VitalReading | undefined,
  environmentId: MissionEnvironmentId
): SystemEvaluation {
  const system = BODY_SYSTEMS.find((s) => s.id === systemId);
  if (!system || !latestReading) {
    const meta = statusMeta('nominal');
    return {
      systemId,
      status: 'nominal',
      statusLabel: meta.label,
      glyph: meta.glyph,
      headline: 'Awaiting initial vital telemetry.',
      actions: ['Log baseline vital measurements to activate automated system evaluation.'],
    };
  }

  let worstStatus: HealthStatus = 'nominal';
  const actions: string[] = [];
  const findings: string[] = [];

  for (const key of system.linkedIndicators) {
    const val = latestReading[key];
    const evalResult = evaluateIndicator(key, val, environmentId);
    if (STATUS_PRIORITY[evalResult.status] > STATUS_PRIORITY[worstStatus]) {
      worstStatus = evalResult.status;
    }
    if (evalResult.status !== 'nominal') {
      findings.push(evalResult.summary);
      actions.push(evalResult.recommendation);
    }
  }

  // Cross-source ECLSS & Solar Particle Event correlation
  const eclss = evaluateEclssStatus(latestReading, environmentId);
  if ((systemId === 'respiratory' || systemId === 'neuro') && eclss.status !== 'nominal') {
    if (STATUS_PRIORITY[eclss.status] > STATUS_PRIORITY[worstStatus]) {
      worstStatus = eclss.status;
    }
    findings.push(`ECLSS Cabin CO2 elevated (${eclss.co2Ppm} ppm).`);
    actions.push('Verify sleep-bay circulation fans and inspect CO2 scrubber status.');
  }

  if ((systemId === 'immune' || systemId === 'ocular') && latestReading.speAlert) {
    worstStatus = 'action';
    findings.push('Active Solar Particle Event (SPE) radiation spike flagged by personal dosimeter.');
    actions.push('Relocate immediately to water/polyethylene-shielded storm shelter.');
  }

  const meta = statusMeta(worstStatus);
  const headline =
    findings.length > 0
      ? findings[0]
      : `All linked ${system.name.toLowerCase()} indicators are within nominal mission limits.`;

  if (actions.length === 0) {
    actions.push(system.countermeasures[0]);
  }

  return {
    systemId,
    status: worstStatus,
    statusLabel: meta.label,
    glyph: meta.glyph,
    headline,
    actions,
  };
}

export function validateVitalInput(
  input: Partial<Record<IndicatorKey, string | number>>
): VitalValidationResult {
  const errors: Partial<Record<IndicatorKey, string>> = {};
  const keys = Object.keys(INDICATOR_DEFINITIONS) as IndicatorKey[];

  for (const key of keys) {
    const def = INDICATOR_DEFINITIONS[key];
    const raw = input[key];
    if (raw === undefined || raw === '' || raw === null) {
      errors[key] = `${def.label} is required.`;
      continue;
    }
    const num = typeof raw === 'number' ? raw : Number(raw);
    if (!Number.isFinite(num)) {
      errors[key] = `${def.label} must be a valid number.`;
      continue;
    }
    if (num < def.inputMin || num > def.inputMax) {
      errors[key] = `Enter ${def.inputMin}–${def.inputMax} ${def.unit}.`;
    }
  }

  const sysNum = Number(input.systolicBp);
  const diaNum = Number(input.diastolicBp);
  if (
    !errors.systolicBp &&
    !errors.diastolicBp &&
    Number.isFinite(sysNum) &&
    Number.isFinite(diaNum) &&
    diaNum >= sysNum
  ) {
    errors.diastolicBp = 'Diastolic BP must be lower than Systolic BP.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function computeHazardProfile(
  latestReading: VitalReading | undefined,
  tasks: RoutineTask[],
  environmentId: MissionEnvironmentId
): Record<HazardKey, number> {
  const env =
    MISSION_ENVIRONMENTS.find((e) => e.id === environmentId) ??
    MISSION_ENVIRONMENTS[0];
  const base = { ...env.hazardWeights };

  if (!latestReading) {
    return base;
  }

  // Adjust exposure score dynamically based on latest physiological response & adherence
  const envTasks = tasks.filter((t) => t.environments.includes(environmentId));
  const completedCount = envTasks.filter((t) => t.completedToday).length;
  const adherenceRatio = envTasks.length > 0 ? completedCount / envTasks.length : 0.5;
  const mitigationReduction = Math.round(adherenceRatio * 14);

  const sleepPenalty = latestReading.sleepHours < 6.5 ? 12 : 0;
  const moodPenalty = latestReading.moodScore < 7 ? 12 : 0;
  const radPenalty = latestReading.radiationDose > 1.5 ? 15 : 0;
  const tempPenalty = latestReading.bodyTemp > 37.5 ? 10 : 0;

  return {
    radiation: clampScore(base.radiation + radPenalty - Math.round(mitigationReduction * 0.5)),
    isolation: clampScore(base.isolation + sleepPenalty + moodPenalty - mitigationReduction),
    distance: clampScore(base.distance),
    gravity: clampScore(base.gravity - mitigationReduction),
    environment: clampScore(base.environment + tempPenalty - Math.round(mitigationReduction * 0.6)),
  };
}

function clampScore(n: number): number {
  return Math.max(8, Math.min(100, n));
}

export function computeReadinessSummary(
  readings: VitalReading[],
  tasks: RoutineTask[],
  environmentId: MissionEnvironmentId
): {
  overallStatus: HealthStatus;
  activeAlerts: number;
  completedTasks: number;
  totalTasks: number;
  adherencePct: number;
  earnedPoints: number;
  streakDays: number;
} {
  const latest = readings[readings.length - 1];
  const systemStatuses = BODY_SYSTEMS.map((sys) =>
    evaluateSystemStatus(sys.id, latest, environmentId)
  );

  let worst: HealthStatus = 'nominal';
  let activeAlerts = 0;

  for (const s of systemStatuses) {
    if (s.status !== 'nominal') activeAlerts += 1;
    if (STATUS_PRIORITY[s.status] > STATUS_PRIORITY[worst]) {
      worst = s.status;
    }
  }

  const envTasks = tasks.filter((t) => t.environments.includes(environmentId));
  const completedTasks = envTasks.filter((t) => t.completedToday).length;
  const totalTasks = envTasks.length;
  const adherencePct =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;
  const earnedPoints = envTasks
    .filter((t) => t.completedToday)
    .reduce((sum, t) => sum + t.points, 0);

  // Mission logging streak derived from consecutive logged mission days
  const sortedDays = [...new Set(readings.map((r) => r.missionDay))].sort(
    (a, b) => b - a
  );
  let streakDays = 0;
  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0 || sortedDays[i - 1] - sortedDays[i] === 1) {
      streakDays += 1;
    } else {
      break;
    }
  }

  return {
    overallStatus: worst,
    activeAlerts,
    completedTasks,
    totalTasks,
    adherencePct,
    earnedPoints,
    streakDays,
  };
}

export function computeRadiationSummary(readings: VitalReading[]): RadiationSummary {
  const missionCumulativeMsv = Number(
    readings.reduce((sum, r) => sum + r.radiationDose, 0).toFixed(2)
  );
  const careerTotalMsv = Number(
    (CAREER_RADIATION_BASELINE_MSV + missionCumulativeMsv).toFixed(2)
  );
  const careerPct = Number(
    Math.min(100, (careerTotalMsv / NASA_CAREER_LIMIT_MSV) * 100).toFixed(1)
  );
  const latest = readings[readings.length - 1];
  const latestDailyMsv = latest?.radiationDose ?? 0;
  const speActive = Boolean(latest?.speAlert) || latestDailyMsv > 3.5;

  return {
    missionCumulativeMsv,
    careerBaselineMsv: CAREER_RADIATION_BASELINE_MSV,
    careerTotalMsv,
    careerLimitMsv: NASA_CAREER_LIMIT_MSV,
    careerPct,
    latestDailyMsv,
    speActive,
  };
}

export function evaluateEclssStatus(
  latestReading: VitalReading | undefined,
  environmentId: MissionEnvironmentId
): EclssEvaluation {
  const env =
    MISSION_ENVIRONMENTS.find((e) => e.id === environmentId) ??
    MISSION_ENVIRONMENTS[0];
  const co2Ppm = latestReading?.cabinCo2Ppm ?? env.cabinCo2Ppm;
  const o2Pct = latestReading?.cabinO2Pct ?? 21.0;
  const pressureKpa = latestReading?.cabinPressureKpa ?? 101.3;

  let status: HealthStatus = 'nominal';
  let summary = 'Cabin atmosphere, O2 partial pressure, and CO2 scrubbing are nominal.';

  if (co2Ppm >= 4500 || o2Pct < 19.5 || o2Pct > 23.5 || pressureKpa < 95) {
    status = 'action';
    summary = `Critical ECLSS excursion: CO2 ${co2Ppm} ppm · O2 ${o2Pct.toFixed(1)}% · ${pressureKpa.toFixed(1)} kPa.`;
  } else if (co2Ppm >= 3000) {
    status = 'monitor';
    summary = `Elevated cabin CO2 (${co2Ppm} ppm); verify module airflow and scrubber bed.`;
  }

  const meta = statusMeta(status);
  return {
    status,
    statusLabel: meta.label,
    glyph: meta.glyph,
    co2Ppm,
    o2Pct,
    pressureKpa,
    summary,
  };
}

export function evaluateHrpRisks(
  readings: VitalReading[],
  tasks: RoutineTask[],
  environmentId: MissionEnvironmentId
): HrpRiskEvaluation[] {
  const latest = readings[readings.length - 1];
  const eclss = evaluateEclssStatus(latest, environmentId);
  const rad = computeRadiationSummary(readings);
  const env =
    MISSION_ENVIRONMENTS.find((e) => e.id === environmentId) ??
    MISSION_ENVIRONMENTS[0];
  const envTasks = tasks.filter((t) => t.environments.includes(environmentId));
  const aredDone = envTasks.find((t) => t.id === 'task-ared-loading')?.completedToday ?? true;

  return NASA_HRP_RISKS.map((risk) => {
    let worst: HealthStatus = 'nominal';
    let driverNote = 'Mitigated by current telemetry and countermeasure compliance.';

    for (const sysId of risk.linkedSystems) {
      const sysEval = evaluateSystemStatus(sysId, latest, environmentId);
      if (STATUS_PRIORITY[sysEval.status] > STATUS_PRIORITY[worst]) {
        worst = sysEval.status;
        driverNote = sysEval.headline;
      }
    }

    if (risk.id === 'risk-carcinogenesis' && (rad.speActive || rad.careerPct >= 50)) {
      worst = rad.speActive ? 'action' : 'monitor';
      driverNote = `Career dose ${rad.careerTotalMsv}/${rad.careerLimitMsv} mSv (${rad.careerPct}%).`;
    } else if ((risk.id === 'risk-bone-fracture' || risk.id === 'risk-muscle-atrophy') && !aredDone && env.gravityG < 0.25) {
      if (STATUS_PRIORITY.monitor > STATUS_PRIORITY[worst]) {
        worst = 'monitor';
        driverNote = 'Daily ARED resistive countermeasure not yet completed in low-gravity habitat.';
      }
    } else if (risk.id === 'risk-eclss-design' && eclss.status !== 'nominal') {
      worst = eclss.status;
      driverNote = eclss.summary;
    }

    const meta = statusMeta(worst);
    return {
      ...risk,
      status: worst,
      statusLabel: meta.label,
      glyph: meta.glyph,
      driverNote,
    };
  });
}

export function buildStoreAndForwardPacket(
  readings: VitalReading[],
  exams: UltrasoundExam[],
  tasks: RoutineTask[],
  environmentId: MissionEnvironmentId
) {
  const latest = readings[readings.length - 1];
  const env =
    MISSION_ENVIRONMENTS.find((e) => e.id === environmentId) ??
    MISSION_ENVIRONMENTS[0];
  const readiness = computeReadinessSummary(readings, tasks, environmentId);
  const eclss = evaluateEclssStatus(latest, environmentId);
  const radiation = computeRadiationSummary(readings);
  const systems = BODY_SYSTEMS.map((s) =>
    evaluateSystemStatus(s.id, latest, environmentId)
  );
  const hrpRisks = evaluateHrpRisks(readings, tasks, environmentId);

  return {
    packetVersion: '1.0',
    generatedAtUtc: new Date().toISOString(),
    missionEnvironment: {
      id: env.id,
      name: env.name,
      gravity: env.gravityLabel,
      commDelayMinutes: env.commDelayMinutes,
      autonomousModeRequired: env.commDelayMinutes >= 5,
    },
    readinessSummary: readiness,
    eclssTelemetry: eclss,
    radiationDosimetry: radiation,
    latestVitals: latest ?? null,
    systemEvaluations: systems,
    hrpRiskAssessments: hrpRisks.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.statusLabel,
      driverNote: r.driverNote,
    })),
    attachedUltrasoundExams: exams.map((ex) => ({
      id: ex.id,
      missionDay: ex.missionDay,
      systemId: ex.systemId,
      examType: ex.examType,
      caliperMm: ex.caliperMm,
      selfAssessment: ex.selfAssessment,
      findingsNote: ex.findingsNote,
    })),
  };
}

