import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SEED_ROUTINE_TASKS,
  SEED_ULTRASOUND_EXAMS,
  SEED_VITAL_READINGS,
} from '../data/spaceMedicine';
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
  validateVitalInput,
} from './healthEngine';

test('evaluateIndicator classifies nominal, monitor, and action states accurately', () => {
  const nominalGlucose = evaluateIndicator('bloodGlucose', 96, 'orbital-station');
  assert.equal(nominalGlucose.status, 'nominal');
  assert.equal(nominalGlucose.statusLabel, 'Nominal');

  const elevatedGlucose = evaluateIndicator('bloodGlucose', 155, 'orbital-station');
  assert.equal(elevatedGlucose.status, 'monitor');
  assert.equal(elevatedGlucose.statusLabel, 'Monitor');

  const criticalGlucose = evaluateIndicator('bloodGlucose', 210, 'deep-space-transit');
  assert.equal(criticalGlucose.status, 'action');
  assert.match(criticalGlucose.recommendation, /store-and-forward/i);
});

test('evaluateBloodPressure flags the worse of systolic and diastolic', () => {
  const normal = evaluateBloodPressure(118, 76, 'orbital-station');
  assert.equal(normal.status, 'nominal');

  const highDia = evaluateBloodPressure(125, 99, 'orbital-station');
  assert.equal(highDia.status, 'action');
});

test('evaluateSystemStatus aggregates linked indicators for each body system', () => {
  const reading = {
    ...SEED_VITAL_READINGS[SEED_VITAL_READINGS.length - 1],
    sleepHours: 4.5,
  };
  const neuroEval = evaluateSystemStatus('neuro', reading, 'orbital-station');
  assert.equal(neuroEval.status, 'action');
  assert.ok(neuroEval.actions.length > 0);
});

test('validateVitalInput rejects missing, non-finite, out-of-bounds, and inverted BP values', () => {
  const validResult = validateVitalInput({
    systolicBp: 120,
    diastolicBp: 78,
    heartRate: 65,
    bloodGlucose: 95,
    bodyTemp: 36.9,
    sleepHours: 7.5,
    moodScore: 8,
    radiationDose: 0.45,
  });
  assert.equal(validResult.valid, true);

  const badResult = validateVitalInput({
    systolicBp: 90,
    diastolicBp: 110,
    heartRate: 500,
    bloodGlucose: '',
    bodyTemp: 36.9,
    sleepHours: 7.5,
    moodScore: 8,
    radiationDose: 0.45,
  });
  assert.equal(badResult.valid, false);
  assert.ok(badResult.errors.diastolicBp);
  assert.ok(badResult.errors.heartRate);
  assert.ok(badResult.errors.bloodGlucose);
});

test('computeHazardProfile reflects environment changes and countermeasure adherence', () => {
  const latest = SEED_VITAL_READINGS[SEED_VITAL_READINGS.length - 1];
  const leoProfile = computeHazardProfile(latest, SEED_ROUTINE_TASKS, 'orbital-station');
  const marsProfile = computeHazardProfile(latest, SEED_ROUTINE_TASKS, 'deep-space-transit');
  assert.ok(marsProfile.radiation > leoProfile.radiation);
  assert.ok(marsProfile.distance > leoProfile.distance);
});

test('computeReadinessSummary counts streak days and task adherence', () => {
  const summary = computeReadinessSummary(
    SEED_VITAL_READINGS,
    SEED_ROUTINE_TASKS,
    'orbital-station'
  );
  assert.equal(summary.streakDays, 10);
  assert.equal(summary.overallStatus, 'nominal');
  assert.ok(summary.earnedPoints > 0);
});

test('computeRadiationSummary aggregates mission and career dose and detects SPE alerts', () => {
  const baseline = computeRadiationSummary(SEED_VITAL_READINGS);
  assert.equal(baseline.speActive, false);
  assert.ok(baseline.careerTotalMsv > baseline.careerBaselineMsv);
  assert.ok(baseline.careerPct > 0 && baseline.careerPct < 100);

  const withSpe = [
    ...SEED_VITAL_READINGS,
    {
      ...SEED_VITAL_READINGS[SEED_VITAL_READINGS.length - 1],
      id: 'vr-spe',
      missionDay: 43,
      radiationDose: 4.2,
      speAlert: true,
    },
  ];
  const spike = computeRadiationSummary(withSpe);
  assert.equal(spike.speActive, true);
});

test('evaluateEclssStatus flags elevated CO2 and correlates with respiratory/neuro systems', () => {
  const highCo2 = {
    ...SEED_VITAL_READINGS[SEED_VITAL_READINGS.length - 1],
    cabinCo2Ppm: 4800,
  };
  const eclss = evaluateEclssStatus(highCo2, 'orbital-station');
  assert.equal(eclss.status, 'action');

  const resp = evaluateSystemStatus('respiratory', highCo2, 'orbital-station');
  assert.equal(resp.status, 'action');
  assert.match(resp.headline, /CO2/i);
});

test('evaluateHrpRisks scores all 9 NASA HRP risks dynamically', () => {
  const risks = evaluateHrpRisks(
    SEED_VITAL_READINGS,
    SEED_ROUTINE_TASKS,
    'orbital-station'
  );
  assert.equal(risks.length, 9);
  const bone = risks.find((r) => r.id === 'risk-bone-fracture');
  assert.equal(bone?.status, 'monitor');
});

test('buildStoreAndForwardPacket compiles autonomous medical packet', () => {
  const packet = buildStoreAndForwardPacket(
    SEED_VITAL_READINGS,
    SEED_ULTRASOUND_EXAMS,
    SEED_ROUTINE_TASKS,
    'deep-space-transit'
  );
  assert.equal(packet.missionEnvironment.autonomousModeRequired, true);
  assert.equal(packet.systemEvaluations.length, 7);
  assert.equal(packet.hrpRiskAssessments.length, 9);
  assert.equal(packet.attachedUltrasoundExams.length, 2);
});

