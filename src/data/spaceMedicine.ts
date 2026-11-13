import type {
  BodySystemInfo,
  HazardDetail,
  IndicatorDefinition,
  IndicatorKey,
  MissionEnvironment,
  RoutineTask,
  UltrasoundExam,
  VitalReading,
} from '../types/health';

export const MISSION_ENVIRONMENTS: MissionEnvironment[] = [
  {
    id: 'orbital-station',
    name: 'Orbital Space Station (LEO)',
    shortLabel: 'Orbital Station',
    gravityLabel: '0.00 g (Microgravity)',
    gravityG: 0,
    commDelayLabel: 'Real-time (< 1s)',
    commDelayMinutes: 0,
    cabinCo2Ppm: 2800,
    dailyRadiationBaselineMsv: 0.45,
    summary:
      'Continuous free-fall induces cephalad fluid shift, bone mineral resorption, and 16 orbital sunrises every 24 hours.',
    primaryRisks: [
      'Spaceflight-Associated Neuro-ocular Syndrome (SANS)',
      'Circadian misalignment from 90-minute orbital daylight cycles',
      'Elevated cabin CO2 pockets requiring airflow verification',
    ],
    hazardWeights: {
      radiation: 42,
      isolation: 55,
      distance: 15,
      gravity: 92,
      environment: 64,
    },
    protocolEmphasis:
      'Maintain 2-hour daily ARED + treadmill loading and verify sleep mask & blue-spectrum lighting schedule.',
  },
  {
    id: 'lunar-base',
    name: 'Lunar South Pole Habitat (Artemis)',
    shortLabel: 'Lunar Base',
    gravityLabel: '0.16 g (Lunar Partial)',
    gravityG: 0.16,
    commDelayLabel: '1.3 s one-way',
    commDelayMinutes: 0.02,
    cabinCo2Ppm: 2200,
    dailyRadiationBaselineMsv: 0.95,
    summary:
      'Partial lunar gravity reduces musculoskeletal unloading slightly compared to 0g, while abrasive regolith dust and solar particle events elevate respiratory and radiation risks.',
    primaryRisks: [
      'Lunar regolith silicate dust inhalation after airlock repressurization',
      'Solar Particle Event (SPE) acute radiation monitoring',
      'Orthostatic shifts during suited surface traverses',
    ],
    hazardWeights: {
      radiation: 76,
      isolation: 62,
      distance: 32,
      gravity: 68,
      environment: 82,
    },
    protocolEmphasis:
      'Perform post-EVA airway/skin inspection for regolith particulates and check personal dosimeter prior to sleep.',
  },
  {
    id: 'deep-space-transit',
    name: 'Deep Space Transit (Mars Craft)',
    shortLabel: 'Deep Space',
    gravityLabel: '0.00 g (Transit Free-Fall)',
    gravityG: 0,
    commDelayLabel: '14.5 min one-way',
    commDelayMinutes: 14.5,
    cabinCo2Ppm: 3100,
    dailyRadiationBaselineMsv: 1.85,
    summary:
      'Beyond Earth’s magnetosphere, galactic cosmic rays (GCR) and multi-minute communication delays require autonomous medical triage and rigorous behavioral self-care.',
    primaryRisks: [
      'Galactic Cosmic Ray (GCR) cumulative immune and vascular burden',
      'Autonomous medical decision-making without live ground consult',
      'Prolonged confinement and Earth-out-of-view behavioral strain',
    ],
    hazardWeights: {
      radiation: 95,
      isolation: 90,
      distance: 94,
      gravity: 92,
      environment: 74,
    },
    protocolEmphasis:
      'Execute weekly autonomous ultrasound self-scans and log behavioral mood check-ins without relying on real-time Earth support.',
  },
  {
    id: 'planetary-rover',
    name: 'Pressurized Surface Rover / EVA',
    shortLabel: 'Rover / EVA',
    gravityLabel: '0.16–0.38 g (Surface Ops)',
    gravityG: 0.38,
    commDelayLabel: 'Variable (Relay)',
    commDelayMinutes: 6,
    cabinCo2Ppm: 3400,
    dailyRadiationBaselineMsv: 1.35,
    summary:
      'High-exertion suited EVA operations and cramped rover life support elevate thermal stress, dehydration, glucose demand, and decompression vigilance.',
    primaryRisks: [
      'Thermal retention and dehydration inside pressurized EVA suit',
      'Blood glucose depletion during 6-hour physical traverse',
      'Elevated rover cabin CO2 during multi-crew sleep cycles',
    ],
    hazardWeights: {
      radiation: 80,
      isolation: 74,
      distance: 65,
      gravity: 54,
      environment: 89,
    },
    protocolEmphasis:
      'Verify pre-EVA hydration, post-traverse blood glucose, and core temperature recovery within 30 minutes of suit doffing.',
  },
];

export const NASA_FIVE_HAZARDS: HazardDetail[] = [
  {
    key: 'radiation',
    name: 'Space Radiation',
    shortLabel: 'Radiation',
    description:
      'Ionizing galactic cosmic rays and solar particle events damage cellular DNA, impair lymphocytes, and accelerate vascular stiffness.',
    affectedSystems: ['immune', 'cardio', 'ocular', 'neuro'],
    keyMitigations: [
      'Track personal active dosimetry daily (mSv)',
      'Relocate to water-shielded storm shelter during Solar Particle Events',
      'Maintain antioxidant-rich nutrition and ocular lens checks',
    ],
  },
  {
    key: 'isolation',
    name: 'Isolation & Confinement',
    shortLabel: 'Isolation',
    description:
      'Small living volumes, unchanging crew dynamics, and disrupted light cues drive circadian drift, sleep fragmentation, and mood strain.',
    affectedSystems: ['neuro', 'immune', 'metabolic'],
    keyMitigations: [
      'Adhere to 480nm morning blue-light enrichment and evening dim-out',
      'Protect a 7.5–8.5 hour consolidated sleep block',
      'Log daily mood & cognitive check-ins for early behavioral intervention',
    ],
  },
  {
    key: 'distance',
    name: 'Distance from Earth',
    shortLabel: 'Distance',
    description:
      'One-way light-time delays up to 22 minutes prevent real-time flight surgeon telemedicine, requiring crew self-diagnosis and treatment.',
    affectedSystems: ['cardio', 'metabolic', 'immune', 'ocular'],
    keyMitigations: [
      'Store offline clinical decision trees and ultrasound reference loops',
      'Use automated trend thresholds to flag drift before symptoms escalate',
      'Assemble store-and-forward medical packets for ground flight surgeons',
    ],
  },
  {
    key: 'gravity',
    name: 'Altered Gravity Fields',
    shortLabel: 'Gravity',
    description:
      'Weightlessness shifts ~2 liters of fluid toward the head, unloads weight-bearing bone (~1–1.5% loss/month), and reduces cardiac stroke volume.',
    affectedSystems: ['ocular', 'cardio', 'musculoskeletal', 'neuro'],
    keyMitigations: [
      'Perform daily resistive loading (ARED) and aerobic ergometry',
      'Use lower-body negative pressure or fluid-loading protocols pre-entry',
      'Conduct periodic optic nerve sheath and jugular vein ultrasound scans',
    ],
  },
  {
    key: 'environment',
    name: 'Hostile Closed Environments',
    shortLabel: 'Closed Cabin',
    description:
      'Recycled cabin air accumulates CO2, volatile organics, and particulate dust while altered microbial flora challenge skin and mucosal immunity.',
    affectedSystems: ['respiratory', 'immune', 'neuro'],
    keyMitigations: [
      'Monitor CO2 partial pressure alongside headache or mood shifts',
      'Inspect HEPA filters and clean skin folds after exercise',
      'Run rapid surface/airway swabs if rash or sinus congestion persists',
    ],
  },
];

export const INDICATOR_DEFINITIONS: Record<IndicatorKey, IndicatorDefinition> = {
  systolicBp: {
    key: 'systolicBp',
    label: 'Systolic Blood Pressure',
    unit: 'mmHg',
    precision: 0,
    nominalMin: 95,
    nominalMax: 129,
    criticalLow: 85,
    criticalHigh: 150,
    inputMin: 60,
    inputMax: 240,
    step: 1,
    examMethod: 'Seated/restrained upper-arm cuff at heart level after 5 min rest.',
    spaceflightFactor:
      'Microgravity blunts baroreceptor reflexes and alters arterial compliance.',
  },
  diastolicBp: {
    key: 'diastolicBp',
    label: 'Diastolic Blood Pressure',
    unit: 'mmHg',
    precision: 0,
    nominalMin: 60,
    nominalMax: 84,
    criticalLow: 50,
    criticalHigh: 98,
    inputMin: 35,
    inputMax: 150,
    step: 1,
    examMethod: 'Measured simultaneously with systolic cuff; keep arm supported.',
    spaceflightFactor:
      'Elevated diastolic pressure can signal vascular resistance or stress.',
  },
  heartRate: {
    key: 'heartRate',
    label: 'Resting Heart Rate',
    unit: 'bpm',
    precision: 0,
    nominalMin: 50,
    nominalMax: 85,
    criticalLow: 40,
    criticalHigh: 110,
    inputMin: 30,
    inputMax: 220,
    step: 1,
    examMethod: 'Optical wrist sensor or 3-lead ECG chest strap upon waking.',
    spaceflightFactor:
      'Tracks cardiovascular deconditioning, hydration status, and fever.',
  },
  bloodGlucose: {
    key: 'bloodGlucose',
    label: 'Blood Glucose',
    unit: 'mg/dL',
    precision: 0,
    nominalMin: 70,
    nominalMax: 125,
    criticalLow: 58,
    criticalHigh: 180,
    inputMin: 30,
    inputMax: 450,
    step: 1,
    examMethod: 'Fasting fingerstick capillary strip or continuous interstitial patch.',
    spaceflightFactor:
      'Microgravity and reduced sleep increase insulin resistance; EVAs risk hypoglycemia.',
  },
  bodyTemp: {
    key: 'bodyTemp',
    label: 'Body Temperature',
    unit: '°C',
    precision: 1,
    nominalMin: 36.1,
    nominalMax: 37.5,
    criticalLow: 35.4,
    criticalHigh: 38.3,
    inputMin: 33.0,
    inputMax: 42.0,
    step: 0.1,
    examMethod: 'Tympanic or temporal artery thermometer (zero-mercury digital).',
    spaceflightFactor:
      'Spaceflight elevates baseline core temp ~0.5°C due to impaired convective cooling.',
  },
  sleepHours: {
    key: 'sleepHours',
    label: 'Daily Sleep Duration',
    unit: 'hrs',
    precision: 1,
    nominalMin: 6.5,
    nominalMax: 9.0,
    criticalLow: 5.0,
    criticalHigh: 11.0,
    inputMin: 0,
    inputMax: 16,
    step: 0.5,
    examMethod: 'Wrist actigraphy log confirmed with morning sleep-diary entry.',
    spaceflightFactor:
      'Orbital sunrises, cabin fan noise, and elevated CO2 frequently compress REM sleep.',
  },
  moodScore: {
    key: 'moodScore',
    label: 'Mood & Behavioral Readiness',
    unit: '/10',
    precision: 0,
    nominalMin: 7,
    nominalMax: 10,
    criticalLow: 4,
    inputMin: 1,
    inputMax: 10,
    step: 1,
    examMethod: 'Self-rated 1–10 Affect & Cognitive Clarity check before duty shift.',
    spaceflightFactor:
      'Isolation, confinement, and workload spikes degrade executive focus and crew cohesion.',
  },
  radiationDose: {
    key: 'radiationDose',
    label: 'Daily Radiation Dose',
    unit: 'mSv',
    precision: 2,
    nominalMin: 0.1,
    nominalMax: 1.5,
    criticalHigh: 4.0,
    inputMin: 0,
    inputMax: 50,
    step: 0.05,
    examMethod: 'Read crew active personal dosimeter (REM/HERA unit) every 24h.',
    spaceflightFactor:
      'Deep space transit and solar events elevate ionizing exposure above LEO baseline.',
  },
};

export const BODY_SYSTEMS: BodySystemInfo[] = [
  {
    id: 'neuro',
    name: 'Neurological & Behavioral',
    anatomicalRegion: 'Cranium & Central Nervous System',
    primaryFunction:
      'Regulates circadian rhythm, cognitive reaction speed, mood stability, and vestibular spatial orientation.',
    linkedIndicators: ['sleepHours', 'moodScore'],
    linkedHazards: ['isolation', 'gravity', 'environment', 'distance'],
    spaceflightImpact:
      'Loss of gravitational down-cue triggers early space motion sickness; 90-minute orbital light cycles and cabin CO2 impair sleep architecture and mood.',
    whyExamNeeded:
      'Subtle cognitive slowing or sleep debt precedes operational errors during docking, robotics, and EVA tasks.',
    howToMeasure: [
      'Log morning actigraphy sleep duration immediately after waking.',
      'Complete the 1–10 Mood & Cognitive Readiness scale before shift briefing.',
      'Check cabin CO2 reading (< 3000 ppm target) if experiencing morning headache.',
    ],
    flightSurgeonTriggers: [
      'Sleep duration drops below 5.0 hrs for two consecutive mission days.',
      'Mood & Readiness score <= 4/10 or persistent irritability/withdrawal.',
      'Unexplained visual aura, severe headache, or persistent disorientation.',
    ],
    countermeasures: [
      'Use 480nm blue-enriched task lighting during the first 2 hours after wake.',
      'Avoid high-caffeine intake within 8 hours of scheduled sleep block.',
      'Engage in private family/ground audio link and structured downtime.',
    ],
  },
  {
    id: 'ocular',
    name: 'Ocular & Vestibular (SANS)',
    anatomicalRegion: 'Orbits, Optic Nerve & Inner Ear',
    primaryFunction:
      'Maintains visual acuity, retinal perfusion, intracranial pressure balance, and balance reflexes.',
    linkedIndicators: ['systolicBp', 'radiationDose'],
    linkedHazards: ['gravity', 'radiation'],
    spaceflightImpact:
      'Cephalad fluid shift raises intracranial venous pressure, flattening the posterior globe and swelling the optic disc (SANS). Cosmic rays also raise long-term lens opacity risk.',
    whyExamNeeded:
      'Early optic nerve sheath distension is painless; regular self-tonometry and ocular ultrasound detect changes before permanent hyperopic shift occurs.',
    howToMeasure: [
      'Perform near-vision acuity grid test (Amsler grid) once weekly.',
      'Capture ocular ultrasound image across closed eyelid with sterile gel pad.',
      'Measure Optic Nerve Sheath Diameter (ONSD) 3 mm behind the globe.',
    ],
    flightSurgeonTriggers: [
      'Measured Optic Nerve Sheath Diameter >= 5.8 mm or asymmetric swelling.',
      'New blurry near vision, metamorphopsia (wavy grid lines), or eye pain.',
      'Sudden flashes of light beyond typical cosmic-ray phosphenes.',
    ],
    countermeasures: [
      'Complete scheduled Lower Body Negative Pressure (LBNP) fluid-redistribution sessions.',
      'Verify B-vitamin/folate nutrition protocol (1-carbon metabolism pathway).',
      'Use protective goggles during regolith transfer or bright solar operations.',
    ],
  },
  {
    id: 'cardio',
    name: 'Cardiovascular & Vascular',
    anatomicalRegion: 'Heart, Carotid & Internal Jugular System',
    primaryFunction:
      'Delivers oxygenated blood across tissues, regulates blood pressure, and preserves orthostatic tolerance.',
    linkedIndicators: ['systolicBp', 'diastolicBp', 'heartRate'],
    linkedHazards: ['gravity', 'radiation', 'distance'],
    spaceflightImpact:
      'Reduced gravitational workload shrinks plasma volume by 10–15%, remodels cardiac muscle, and can cause stagnant or retrograde internal jugular vein flow.',
    whyExamNeeded:
      'Monitors vascular stiffness, orthostatic readiness prior to landing/EVA, and early blood-flow stasis risks.',
    howToMeasure: [
      'Rest restrained in neutral posture for 5 minutes before cuff inflation.',
      'Keep upper-arm cuff aligned precisely with heart mid-level (4th intercostal space).',
      'Run quarterly jugular vein Doppler ultrasound check for flow direction.',
    ],
    flightSurgeonTriggers: [
      'Systolic BP >= 145 mmHg or <= 85 mmHg on repeat check after 15 min rest.',
      'Resting Heart Rate > 100 bpm without recent exercise or caffeine.',
      'Dizziness, chest tightness, or stagnant venous flow on ultrasound.',
    ],
    countermeasures: [
      'Complete 30–45 minutes of daily cycle ergometry or treadmill aerobic loading.',
      'Maintain 2.5 L/day fluid intake with electrolyte balance.',
      'Perform salt-and-fluid loading protocol 24h prior to gravitational re-entry.',
    ],
  },
  {
    id: 'respiratory',
    name: 'Respiratory & Cabin Airway',
    anatomicalRegion: 'Upper Airway, Bronchi & Lungs',
    primaryFunction:
      'Exchanges O2 and CO2 and filters airborne particulates in sealed spacecraft habitats.',
    linkedIndicators: ['bodyTemp', 'heartRate'],
    linkedHazards: ['environment', 'gravity'],
    spaceflightImpact:
      'Without natural convection in 0g, exhaled CO2 forms localized pockets unless fans circulate air. On lunar/planetary bases, silicate regolith dust irritates airways.',
    whyExamNeeded:
      'Detects early hypercapnia symptoms, airway inflammation from dust exposure, or respiratory infection.',
    howToMeasure: [
      'Verify sleep-station ventilation airflow before closing crew quarters door.',
      'Monitor resting respiratory ease and body temperature if nasal congestion appears.',
      'Inspect HEPA pre-filters after suit doffing and airlock cycles.',
    ],
    flightSurgeonTriggers: [
      'Fever >= 38.0°C paired with persistent cough or shortness of breath.',
      'Cabin CO2 exposure > 5000 ppm accompanied by throbbing headache.',
      'Wheezing or acute throat irritation following EVA regolith cleanup.',
    ],
    countermeasures: [
      'Run personal sleep-bay circulation fan continuously.',
      'Follow wet-wipe and vacuum containment procedures in suitlock.',
      'Wear P100 particulate respirator when servicing dust-exposed filters.',
    ],
  },
  {
    id: 'metabolic',
    name: 'Metabolic & Thermoregulation',
    anatomicalRegion: 'Endocrine Pancreas, Liver & Core Thermal Control',
    primaryFunction:
      'Stabilizes blood glucose energy supply, nutrient absorption, and core body temperature.',
    linkedIndicators: ['bloodGlucose', 'bodyTemp'],
    linkedHazards: ['environment', 'isolation', 'gravity'],
    spaceflightImpact:
      'Microgravity shifts baseline core temperature upward (~0.5°C) because heat cannot rise via buoyancy; altered diet and sleep debt can induce mild insulin resistance.',
    whyExamNeeded:
      'Prevents hypoglycemic fatigue during strenuous EVAs and detects early metabolic stress or fever.',
    howToMeasure: [
      'Take fasting capillary blood glucose reading prior to morning meal.',
      'Record tympanic temperature at the same morning window to track personal baseline.',
      'Note post-EVA hydration and carbohydrate intake in mission log.',
    ],
    flightSurgeonTriggers: [
      'Fasting blood glucose < 60 mg/dL or >= 160 mg/dL on repeat test.',
      'Core temperature >= 38.2°C or unexplained chills/diaphoresis.',
      'Persistent nausea, inability to retain fluids, or rapid weight drop.',
    ],
    countermeasures: [
      'Consume balanced complex carbohydrates 60 min prior to heavy EVA or ARED sessions.',
      'Use liquid-cooling garment properly during suited traverses.',
      'Ensure vitamin D3 supplementation (800–1000 IU/day) for endocrine & bone support.',
    ],
  },
  {
    id: 'musculoskeletal',
    name: 'Musculoskeletal & Bone Density',
    anatomicalRegion: 'Lumbar Spine, Femur & Anti-Gravity Muscle Groups',
    primaryFunction:
      'Supports posture, locomotion, calcium homeostasis, and mechanical load transfer.',
    linkedIndicators: ['sleepHours', 'bloodGlucose'],
    linkedHazards: ['gravity', 'distance'],
    spaceflightImpact:
      'Without weight-bearing gravity, trabecular bone loses 1–1.5% mineral density per month, releasing urinary calcium (raising renal stone risk) and weakening postural extensors.',
    whyExamNeeded:
      'Consistent tracking of resistive exercise and hydration prevents irreversible bone loss and painful kidney stones mid-mission.',
    howToMeasure: [
      'Log resistive exercise load (ARED squats, deadlifts, heel raises) daily.',
      'Monitor lower-back stiffness or joint pain after sleep or suited work.',
      'Check urine hydration color (pale straw) and log daily fluid volume.',
    ],
    flightSurgeonTriggers: [
      'Acute flank/groin pain or visible blood in urine (renal stone alert).',
      'Sharp lumbar or shoulder joint pain limiting resistive exercise for > 48h.',
      'Progressive muscle weakness during standardized grip/squat checks.',
    ],
    countermeasures: [
      'Complete 60+ minutes of ARED high-load resistive training 6 days/week.',
      'Drink >= 2.5 L water daily to dilute urinary calcium excretion.',
      'Maintain adequate dietary potassium and protein intake.',
    ],
  },
  {
    id: 'immune',
    name: 'Immune & Radiation Defense',
    anatomicalRegion: 'Lymphatic System, Bone Marrow & Skin Barrier',
    primaryFunction:
      'Protects against opportunistic pathogens, viral reactivation, and radiation-induced cellular injury.',
    linkedIndicators: ['radiationDose', 'bodyTemp'],
    linkedHazards: ['radiation', 'environment', 'isolation'],
    spaceflightImpact:
      'Chronic radiation, cortisol from isolation, and microgravity blunt T-cell proliferation and can reactivate latent herpesviruses (e.g., shingles) or cause persistent skin rashes.',
    whyExamNeeded:
      'Early detection of skin lesions, fever, or elevated cumulative radiation enables timely antiviral care or shelter protocols.',
    howToMeasure: [
      'Read personal active radiation dosimeter (mSv) every 24 hours.',
      'Inspect skin folds, forearms, and neck visually for redness or vesicular rash.',
      'Log core temperature immediately if malaise or swollen lymph nodes occur.',
    ],
    flightSurgeonTriggers: [
      'Daily radiation dose > 3.5 mSv or Solar Particle Event shelter alert.',
      'Fever >= 38.0°C with painful/blistering dermatomal rash or spreading erythema.',
      'Unhealed skin abrasion showing warmth, pus, or red streaks.',
    ],
    countermeasures: [
      'Move to highest-shielded habitat module (water/polyethylene walls) during SPE alerts.',
      'Sanitize shared exercise grips and use mild barrier emollients for dry cabin skin.',
      'Report suspicious skin changes via encrypted dermatology photo packet.',
    ],
  },
];

export const SEED_VITAL_READINGS: VitalReading[] = [
  {
    id: 'vr-md-33',
    missionDay: 33,
    timestamp: '2026-11-04T07:15:00Z',
    environment: 'orbital-station',
    systolicBp: 118,
    diastolicBp: 76,
    heartRate: 64,
    bloodGlucose: 92,
    bodyTemp: 36.8,
    sleepHours: 7.5,
    moodScore: 8,
    radiationDose: 0.44,
    notes: 'Baseline wake vitals; ARED lower body completed.',
  },
  {
    id: 'vr-md-34',
    missionDay: 34,
    timestamp: '2026-11-05T07:20:00Z',
    environment: 'orbital-station',
    systolicBp: 120,
    diastolicBp: 77,
    heartRate: 66,
    bloodGlucose: 95,
    bodyTemp: 36.9,
    sleepHours: 7.0,
    moodScore: 8,
    radiationDose: 0.46,
  },
  {
    id: 'vr-md-35',
    missionDay: 35,
    timestamp: '2026-11-06T07:10:00Z',
    environment: 'orbital-station',
    systolicBp: 121,
    diastolicBp: 78,
    heartRate: 67,
    bloodGlucose: 98,
    bodyTemp: 37.0,
    sleepHours: 6.5,
    moodScore: 7,
    radiationDose: 0.48,
  },
  {
    id: 'vr-md-36',
    missionDay: 36,
    timestamp: '2026-11-07T07:30:00Z',
    environment: 'orbital-station',
    systolicBp: 124,
    diastolicBp: 80,
    heartRate: 70,
    bloodGlucose: 102,
    bodyTemp: 37.1,
    sleepHours: 6.0,
    moodScore: 7,
    radiationDose: 0.52,
    notes: 'Cargo transfer workload; slightly shortened sleep block.',
  },
  {
    id: 'vr-md-37',
    missionDay: 37,
    timestamp: '2026-11-08T07:25:00Z',
    environment: 'orbital-station',
    systolicBp: 122,
    diastolicBp: 79,
    heartRate: 68,
    bloodGlucose: 96,
    bodyTemp: 37.0,
    sleepHours: 7.0,
    moodScore: 8,
    radiationDose: 0.49,
  },
  {
    id: 'vr-md-38',
    missionDay: 38,
    timestamp: '2026-11-09T07:18:00Z',
    environment: 'orbital-station',
    systolicBp: 126,
    diastolicBp: 81,
    heartRate: 72,
    bloodGlucose: 108,
    bodyTemp: 37.1,
    sleepHours: 6.5,
    moodScore: 7,
    radiationDose: 0.55,
  },
  {
    id: 'vr-md-39',
    missionDay: 39,
    timestamp: '2026-11-10T07:22:00Z',
    environment: 'orbital-station',
    systolicBp: 128,
    diastolicBp: 83,
    heartRate: 74,
    bloodGlucose: 112,
    bodyTemp: 37.2,
    sleepHours: 6.0,
    moodScore: 6,
    radiationDose: 0.62,
    notes: 'Noticed mild morning sinus fullness; verified crew bay fan.',
  },
  {
    id: 'vr-md-40',
    missionDay: 40,
    timestamp: '2026-11-11T07:15:00Z',
    environment: 'orbital-station',
    systolicBp: 125,
    diastolicBp: 80,
    heartRate: 69,
    bloodGlucose: 101,
    bodyTemp: 37.0,
    sleepHours: 7.5,
    moodScore: 8,
    radiationDose: 0.47,
  },
  {
    id: 'vr-md-41',
    missionDay: 41,
    timestamp: '2026-11-12T07:12:00Z',
    environment: 'orbital-station',
    systolicBp: 123,
    diastolicBp: 78,
    heartRate: 66,
    bloodGlucose: 97,
    bodyTemp: 36.9,
    sleepHours: 7.5,
    moodScore: 8,
    radiationDose: 0.45,
  },
  {
    id: 'vr-md-42',
    missionDay: 42,
    timestamp: '2026-11-13T07:10:00Z',
    environment: 'orbital-station',
    systolicBp: 124,
    diastolicBp: 79,
    heartRate: 68,
    bloodGlucose: 99,
    bodyTemp: 37.0,
    sleepHours: 7.0,
    moodScore: 8,
    radiationDose: 0.46,
    notes: 'Morning baseline nominal prior to science payload run.',
  },
];

export const SEED_ROUTINE_TASKS: RoutineTask[] = [
  {
    id: 'task-morning-vitals',
    title: 'Morning Restrained Vitals & Fasting Glucose',
    category: 'Measurement',
    scheduleWindow: '07:00 – 07:30 GMT',
    durationMin: 10,
    points: 25,
    systemId: 'cardio',
    instruction:
      'Measure seated/restrained blood pressure, resting HR, tympanic temp, and fasting fingerstick glucose before breakfast.',
    environments: [
      'orbital-station',
      'lunar-base',
      'deep-space-transit',
      'planetary-rover',
    ],
    completedToday: true,
  },
  {
    id: 'task-circadian-light',
    title: '480nm Morning Light Exposure & Sleep Log',
    category: 'Circadian',
    scheduleWindow: '07:30 – 08:30 GMT',
    durationMin: 15,
    points: 20,
    systemId: 'neuro',
    instruction:
      'Activate blue-enriched wake lighting for 30 min and record actigraphy sleep duration + mood check-in.',
    environments: [
      'orbital-station',
      'lunar-base',
      'deep-space-transit',
    ],
    completedToday: true,
  },
  {
    id: 'task-ared-loading',
    title: 'ARED Resistive & Aerobic Countermeasure',
    category: 'Exercise',
    scheduleWindow: '11:00 – 12:30 GMT',
    durationMin: 75,
    points: 40,
    systemId: 'musculoskeletal',
    instruction:
      'Complete squats, deadlifts, and heel raises on resistive hardware followed by 30 min cycle ergometry; hydrate 750 mL afterward.',
    environments: [
      'orbital-station',
      'lunar-base',
      'deep-space-transit',
    ],
    completedToday: false,
  },
  {
    id: 'task-ocular-ultrasound',
    title: 'Ocular Optic Nerve Sheath (SANS) Check',
    category: 'Measurement',
    scheduleWindow: '15:00 – 15:20 GMT',
    durationMin: 20,
    points: 35,
    systemId: 'ocular',
    instruction:
      'Run weekly Amsler grid near-vision check and log orbital ultrasound ONSD measurement (< 5.8 mm nominal).',
    environments: [
      'orbital-station',
      'deep-space-transit',
    ],
    completedToday: false,
  },
  {
    id: 'task-cabin-dust-check',
    title: 'Airlock HEPA & Regolith Skin Inspection',
    category: 'Environment',
    scheduleWindow: '17:30 – 17:45 GMT',
    durationMin: 15,
    points: 25,
    systemId: 'respiratory',
    instruction:
      'Check cabin CO2 partial pressure, inspect suitlock dust seals, and examine exposed skin/airways for irritation.',
    environments: [
      'lunar-base',
      'planetary-rover',
      'orbital-station',
      'deep-space-transit',
    ],
    completedToday: false,
  },
  {
    id: 'task-dosimetry-sync',
    title: 'Active Radiation Dosimeter Readout',
    category: 'Measurement',
    scheduleWindow: '20:30 – 20:40 GMT',
    durationMin: 10,
    points: 20,
    systemId: 'immune',
    instruction:
      'Sync personal REM/HERA dosimeter daily mSv total and inspect skin folds for rash or erythema.',
    environments: [
      'orbital-station',
      'lunar-base',
      'deep-space-transit',
      'planetary-rover',
    ],
    completedToday: false,
  },
];

// Deterministic SVG data-URI medical scan previews so zero external URLs are needed
function makeUltrasoundSvgDataUri(
  title: string,
  subtitle: string,
  caliperText: string,
  variant: 'ocular' | 'jugular' | 'skin'
): string {
  const shape =
    variant === 'ocular'
      ? `<ellipse cx="160" cy="76" rx="52" ry="44" fill="#0f172a" stroke="#64748b" stroke-width="2" />
         <path d="M148 118 L142 175 M172 118 L178 175" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4 3" />
         <line x1="145" y1="145" x2="175" y2="145" stroke="#22d3ee" stroke-width="2" />
         <circle cx="145" cy="145" r="3" fill="#22d3ee" />
         <circle cx="175" cy="145" r="3" fill="#22d3ee" />`
      : variant === 'jugular'
        ? `<path d="M40 85 Q160 65 280 90" fill="none" stroke="#94a3b8" stroke-width="18" opacity="0.45" />
           <path d="M40 85 Q160 65 280 90" fill="none" stroke="#0f172a" stroke-width="12" />
           <path d="M70 83 L120 80 L110 75 M120 80 L110 86" stroke="#22d3ee" stroke-width="2" fill="none" />
           <rect x="135" y="112" width="120" height="32" fill="#0f172a" stroke="#334155" stroke-width="1" />
           <path d="M142 135 Q165 118 188 134 T245 130" stroke="#38bdf8" stroke-width="2" fill="none" />`
        : `<rect x="75" y="45" width="170" height="105" rx="6" fill="#1e293b" stroke="#475569" stroke-width="1.5" />
           <circle cx="160" cy="98" r="22" fill="#f59e0b" fill-opacity="0.22" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3 3" />
           <line x1="138" y1="98" x2="182" y2="98" stroke="#22d3ee" stroke-width="1.5" />`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="190" viewBox="0 0 320 190">
    <rect width="320" height="190" fill="#060a11"/>
    <path d="M160 8 L300 175 L20 175 Z" fill="#0d1522" stroke="#1e293b" stroke-width="1"/>
    ${shape}
    <text x="12" y="20" fill="#94a3b8" font-family="monospace" font-size="10">${title}</text>
    <text x="12" y="34" fill="#64748b" font-family="monospace" font-size="9">${subtitle}</text>
    <text x="12" y="180" fill="#22d3ee" font-family="monospace" font-size="10">${caliperText}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SEED_ULTRASOUND_EXAMS: UltrasoundExam[] = [
  {
    id: 'us-md-40-ocular',
    missionDay: 40,
    timestamp: '2026-11-11T15:10:00Z',
    systemId: 'ocular',
    examType: 'Ocular ONSD Ultrasound (OD/OS)',
    imageUrl: makeUltrasoundSvgDataUri(
      'OCULAR B-SCAN // 12L-RS',
      'MD-40 · ORBITAL STATION',
      'CALIPER ONSD: 5.1 mm (NOMINAL < 5.8)',
      'ocular'
    ),
    findingsNote:
      'Optic nerve sheath diameter 5.1 mm bilaterally; posterior globe contour symmetric with zero choroidal folds.',
    selfAssessment: 'nominal',
    caliperMm: 5.1,
  },
  {
    id: 'us-md-38-jugular',
    missionDay: 38,
    timestamp: '2026-11-09T14:30:00Z',
    systemId: 'cardio',
    examType: 'Internal Jugular Vein Doppler',
    imageUrl: makeUltrasoundSvgDataUri(
      'IJV COLOR DOPPLER // L-NECK',
      'MD-38 · ORBITAL STATION',
      'ANTEGRADE FLOW: +14.2 cm/s',
      'jugular'
    ),
    findingsNote:
      'Antegrade venous return preserved after LBNP session; no stagnant echogenicity observed.',
    selfAssessment: 'nominal',
    caliperMm: 14.2,
  },
];
