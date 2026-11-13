export type MissionEnvironmentId =
  | 'orbital-station'
  | 'lunar-base'
  | 'deep-space-transit'
  | 'planetary-rover';

export type BodySystemId =
  | 'neuro'
  | 'ocular'
  | 'cardio'
  | 'respiratory'
  | 'metabolic'
  | 'musculoskeletal'
  | 'immune';

export type HealthStatus = 'nominal' | 'monitor' | 'action';

export type IndicatorKey =
  | 'systolicBp'
  | 'diastolicBp'
  | 'heartRate'
  | 'bloodGlucose'
  | 'bodyTemp'
  | 'sleepHours'
  | 'moodScore'
  | 'radiationDose';

export type HazardKey =
  | 'radiation'
  | 'isolation'
  | 'distance'
  | 'gravity'
  | 'environment';

export interface VitalReading {
  id: string;
  missionDay: number;
  timestamp: string;
  environment: MissionEnvironmentId;
  systolicBp: number;
  diastolicBp: number;
  heartRate: number;
  bloodGlucose: number;
  bodyTemp: number;
  sleepHours: number;
  moodScore: number;
  radiationDose: number;
  notes?: string;
}

export interface MissionEnvironment {
  id: MissionEnvironmentId;
  name: string;
  shortLabel: string;
  gravityLabel: string;
  gravityG: number;
  commDelayLabel: string;
  commDelayMinutes: number;
  cabinCo2Ppm: number;
  dailyRadiationBaselineMsv: number;
  summary: string;
  primaryRisks: string[];
  hazardWeights: Record<HazardKey, number>;
  protocolEmphasis: string;
}

export interface BodySystemInfo {
  id: BodySystemId;
  name: string;
  anatomicalRegion: string;
  primaryFunction: string;
  linkedIndicators: IndicatorKey[];
  linkedHazards: HazardKey[];
  spaceflightImpact: string;
  whyExamNeeded: string;
  howToMeasure: string[];
  flightSurgeonTriggers: string[];
  countermeasures: string[];
}

export interface IndicatorDefinition {
  key: IndicatorKey;
  label: string;
  unit: string;
  precision: number;
  nominalMin: number;
  nominalMax: number;
  criticalLow?: number;
  criticalHigh?: number;
  inputMin: number;
  inputMax: number;
  step: number;
  examMethod: string;
  spaceflightFactor: string;
}

export interface RoutineTask {
  id: string;
  title: string;
  category: 'Measurement' | 'Exercise' | 'Circadian' | 'Environment';
  scheduleWindow: string;
  durationMin: number;
  points: number;
  systemId: BodySystemId;
  instruction: string;
  environments: MissionEnvironmentId[];
  completedToday: boolean;
}

export interface UltrasoundExam {
  id: string;
  missionDay: number;
  timestamp: string;
  systemId: BodySystemId;
  examType: string;
  imageUrl: string;
  findingsNote: string;
  selfAssessment: HealthStatus;
  caliperMm?: number;
}

export interface HazardDetail {
  key: HazardKey;
  name: string;
  shortLabel: string;
  description: string;
  affectedSystems: BodySystemId[];
  keyMitigations: string[];
}

export interface IndicatorEvaluation {
  status: HealthStatus;
  statusLabel: string;
  glyph: string;
  summary: string;
  recommendation: string;
}

export interface SystemEvaluation {
  systemId: BodySystemId;
  status: HealthStatus;
  statusLabel: string;
  glyph: string;
  headline: string;
  actions: string[];
}

export interface VitalValidationResult {
  valid: boolean;
  errors: Partial<Record<IndicatorKey, string>>;
}
