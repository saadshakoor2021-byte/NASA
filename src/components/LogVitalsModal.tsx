import React, { useEffect, useRef, useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { BODY_SYSTEMS, INDICATOR_DEFINITIONS } from '../data/spaceMedicine';
import type {
  BodySystemId,
  HealthStatus,
  IndicatorKey,
  MissionEnvironmentId,
  UltrasoundExam,
  VitalReading,
} from '../types/health';
import { evaluateIndicator, validateVitalInput } from '../utils/healthEngine';

interface LogVitalsModalProps {
  isOpen: boolean;
  initialTab?: 'vitals' | 'imaging';
  initialSystemId?: BodySystemId;
  nextMissionDay: number;
  latestReading: VitalReading | undefined;
  environmentId: MissionEnvironmentId;
  onClose: () => void;
  onSaveVitals: (reading: VitalReading) => void;
  onSaveExam: (exam: UltrasoundExam) => void;
}

const SAMPLE_SCAN_PRESETS: Array<{
  id: string;
  label: string;
  systemId: BodySystemId;
  examType: string;
  caliperMm: number;
  note: string;
  svg: string;
}> = [
  {
    id: 'preset-onsd',
    label: 'Ocular ONSD Ultrasound',
    systemId: 'ocular',
    examType: 'Ocular ONSD Ultrasound (OD/OS)',
    caliperMm: 5.4,
    note: 'Bilateral optic nerve sheath check at 3 mm posterior to globe.',
    svg: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="190" viewBox="0 0 320 190"><rect width="320" height="190" fill="#060a11"/><path d="M160 8 L300 175 L20 175 Z" fill="#0d1522" stroke="#1e293b"/><ellipse cx="160" cy="76" rx="52" ry="44" fill="#0f172a" stroke="#64748b" stroke-width="2"/><path d="M147 118 L140 175 M173 118 L180 175" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4 3"/><line x1="143" y1="145" x2="177" y2="145" stroke="#22d3ee" stroke-width="2"/><text x="12" y="20" fill="#94a3b8" font-family="monospace" font-size="10">OCULAR B-SCAN // CAPTURE</text><text x="12" y="180" fill="#22d3ee" font-family="monospace" font-size="10">ONSD CALIPER: 5.4 mm</text></svg>`
    )}`,
  },
  {
    id: 'preset-cardiac',
    label: 'Parasternal Cardiac Echo',
    systemId: 'cardio',
    examType: 'Parasternal Long-Axis Cardiac Echo',
    caliperMm: 46.5,
    note: 'Left ventricular end-diastolic diameter measured via handheld probe.',
    svg: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="190" viewBox="0 0 320 190"><rect width="320" height="190" fill="#060a11"/><path d="M160 8 L300 175 L20 175 Z" fill="#0d1522" stroke="#1e293b"/><ellipse cx="160" cy="96" rx="64" ry="38" fill="#131c2e" stroke="#64748b" stroke-width="2"/><line x1="115" y1="96" x2="205" y2="96" stroke="#22d3ee" stroke-width="2" stroke-dasharray="4 2"/><text x="12" y="20" fill="#94a3b8" font-family="monospace" font-size="10">CARDIAC ECHO // PLAX</text><text x="12" y="180" fill="#22d3ee" font-family="monospace" font-size="10">LVEDD: 46.5 mm</text></svg>`
    )}`,
  },
  {
    id: 'preset-dermal',
    label: 'Dermal / Skin Rash Macro',
    systemId: 'immune',
    examType: 'Forearm Dermatological Macro Photo',
    caliperMm: 12.0,
    note: 'Localized dry erythema near EVA wrist seal; zero vesicles observed.',
    svg: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="190" viewBox="0 0 320 190"><rect width="320" height="190" fill="#0a0f18"/><rect x="60" y="36" width="200" height="118" rx="8" fill="#1e293b" stroke="#475569"/><circle cx="160" cy="95" r="24" fill="#f59e0b" fill-opacity="0.24" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3 3"/><line x1="136" y1="95" x2="184" y2="95" stroke="#22d3ee" stroke-width="1.5"/><text x="12" y="20" fill="#94a3b8" font-family="monospace" font-size="10">DERMAL MACRO // OPTICAL</text><text x="12" y="180" fill="#f59e0b" font-family="monospace" font-size="10">DIAMETER: 12.0 mm</text></svg>`
    )}`,
  },
];

const ORDERED_FIELDS: IndicatorKey[] = [
  'systolicBp',
  'diastolicBp',
  'heartRate',
  'bloodGlucose',
  'bodyTemp',
  'sleepHours',
  'moodScore',
  'radiationDose',
];

export const LogVitalsModal: React.FC<LogVitalsModalProps> = ({
  isOpen,
  initialTab = 'vitals',
  initialSystemId = 'ocular',
  nextMissionDay,
  latestReading,
  environmentId,
  onClose,
  onSaveVitals,
  onSaveExam,
}) => {
  const [activeTab, setActiveTab] = useState<'vitals' | 'imaging'>(initialTab);
  const [formValues, setFormValues] = useState<Record<IndicatorKey, string>>({
    systolicBp: String(latestReading?.systolicBp ?? 120),
    diastolicBp: String(latestReading?.diastolicBp ?? 78),
    heartRate: String(latestReading?.heartRate ?? 66),
    bloodGlucose: String(latestReading?.bloodGlucose ?? 96),
    bodyTemp: String(latestReading?.bodyTemp ?? 36.9),
    sleepHours: String(latestReading?.sleepHours ?? 7.0),
    moodScore: String(latestReading?.moodScore ?? 8),
    radiationDose: String(latestReading?.radiationDose ?? 0.48),
  });
  const [cabinCo2Ppm, setCabinCo2Ppm] = useState(
    String(latestReading?.cabinCo2Ppm ?? 2620)
  );
  const [cabinO2Pct, setCabinO2Pct] = useState(
    String(latestReading?.cabinO2Pct ?? 21.1)
  );
  const [speAlert, setSpeAlert] = useState(false);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Partial<Record<IndicatorKey, string>>>({});

  // Imaging exam state
  const [examSystemId, setExamSystemId] = useState<BodySystemId>(initialSystemId);
  const [examType, setExamType] = useState('Ocular ONSD Ultrasound (OD/OS)');
  const [examImageUrl, setExamImageUrl] = useState(SAMPLE_SCAN_PRESETS[0].svg);
  const [caliperMm, setCaliperMm] = useState('5.4');
  const [examStatus, setExamStatus] = useState<HealthStatus>('nominal');
  const [examNote, setExamNote] = useState(SAMPLE_SCAN_PRESETS[0].note);
  const [examError, setExamError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setExamSystemId(initialSystemId);
      setErrors({});
      setExamError(null);
      setCameraError(null);
    } else {
      stopCamera();
    }
  }, [isOpen, initialTab, initialSystemId]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }

  async function startCamera() {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera capture is unavailable in this browser context. Upload an image file or select a preset scan.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setCameraError('Camera permission denied or no camera device detected. Upload a file or use a calibrated preset.');
    }
  }

  function captureCameraFrame() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 190;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setExamImageUrl(canvas.toDataURL('image/png'));
    }
    stopCamera();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setExamImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  if (!isOpen) return null;

  function handleVitalsSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validateVitalInput(formValues);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    const parsedCo2 = Number(cabinCo2Ppm);
    const parsedO2 = Number(cabinO2Pct);

    const reading: VitalReading = {
      id: `vr-md-${nextMissionDay}-${Date.now()}`,
      missionDay: nextMissionDay,
      timestamp: new Date().toISOString(),
      environment: environmentId,
      systolicBp: Number(formValues.systolicBp),
      diastolicBp: Number(formValues.diastolicBp),
      heartRate: Number(formValues.heartRate),
      bloodGlucose: Number(formValues.bloodGlucose),
      bodyTemp: Number(formValues.bodyTemp),
      sleepHours: Number(formValues.sleepHours),
      moodScore: Number(formValues.moodScore),
      radiationDose: Number(formValues.radiationDose),
      cabinCo2Ppm: Number.isFinite(parsedCo2) && parsedCo2 > 0 ? parsedCo2 : 2600,
      cabinO2Pct: Number.isFinite(parsedO2) && parsedO2 > 0 ? parsedO2 : 21.0,
      cabinPressureKpa: latestReading?.cabinPressureKpa ?? 101.2,
      speAlert,
      sourceSummary: 'Wearable + Medical Cuff + REM Dosimeter + ECLSS',
      notes: notes.trim() || undefined,
    };

    onSaveVitals(reading);
    setNotes('');
    setSpeAlert(false);
    onClose();
  }

  function handleExamSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!examType.trim()) {
      setExamError('Exam type is required.');
      return;
    }
    if (!examNote.trim()) {
      setExamError('Please enter brief observation findings.');
      return;
    }
    const parsedCaliper = caliperMm.trim() === '' ? undefined : Number(caliperMm);
    if (parsedCaliper !== undefined && (!Number.isFinite(parsedCaliper) || parsedCaliper <= 0)) {
      setExamError('Caliper measurement must be a positive number.');
      return;
    }

    const exam: UltrasoundExam = {
      id: `exam-${Date.now()}`,
      missionDay: nextMissionDay,
      timestamp: new Date().toISOString(),
      systemId: examSystemId,
      examType: examType.trim(),
      imageUrl: examImageUrl,
      findingsNote: examNote.trim(),
      selfAssessment: examStatus,
      caliperMm: parsedCaliper,
    };

    onSaveExam(exam);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="log-modal-title"
    >
      <div className="w-full max-w-2xl bg-[#0F1522] border border-slate-700 rounded-lg overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div>
            <h2 id="log-modal-title" className="text-lg font-semibold text-slate-100">
              Log Self-Assessment · Mission Day {nextMissionDay}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter physiological telemetry or attach an ultrasound / visual exam image.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close measurement modal"
            className="p-2 text-slate-400 hover:text-slate-100 rounded-md hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switch Tabs */}
        <div className="px-5 pt-3 border-b border-slate-800 flex gap-2" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'vitals'}
            onClick={() => setActiveTab('vitals')}
            className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'vitals'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Vital Signs Entry
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'imaging'}
            onClick={() => setActiveTab('imaging')}
            className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'imaging'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Ultrasound & Camera Exam
          </button>
        </div>

        {/* Tab 1: Vital Signs Form */}
        {activeTab === 'vitals' ? (
          <form onSubmit={handleVitalsSubmit} noValidate className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ORDERED_FIELDS.map((key) => {
                const def = INDICATOR_DEFINITIONS[key];
                const rawVal = formValues[key];
                const numericVal = Number(rawVal);
                const liveEval =
                  rawVal !== '' && Number.isFinite(numericVal)
                    ? evaluateIndicator(key, numericVal, environmentId)
                    : null;
                const fieldErr = errors[key];

                return (
                  <div key={key} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor={`vital-${key}`}
                        className="text-xs font-medium text-slate-200"
                      >
                        {def.label}{' '}
                        <span className="font-mono text-slate-400">({def.unit})</span>
                      </label>
                      {liveEval && !fieldErr && (
                        <span
                          className={`text-xs font-mono ${
                            liveEval.status === 'action'
                              ? 'text-rose-400'
                              : liveEval.status === 'monitor'
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                          }`}
                        >
                          {liveEval.glyph} {liveEval.statusLabel}
                        </span>
                      )}
                    </div>

                    <input
                      id={`vital-${key}`}
                      type="number"
                      step={def.step}
                      value={rawVal}
                      onChange={(e) => {
                        setFormValues((prev) => ({ ...prev, [key]: e.target.value }));
                        if (errors[key]) {
                          setErrors((prev) => ({ ...prev, [key]: undefined }));
                        }
                      }}
                      aria-invalid={Boolean(fieldErr)}
                      className={`w-full px-3 py-2 bg-[#090D16] border rounded-md text-sm font-mono tabular-nums text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                        fieldErr ? 'border-rose-500' : 'border-slate-700'
                      }`}
                    />

                    {fieldErr ? (
                      <p className="text-xs text-rose-400" role="alert">
                        {fieldErr}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400">
                        Nominal: {def.nominalMin}–{def.nominalMax} {def.unit}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Integrated ECLSS & Space Weather Inputs */}
            <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label htmlFor="vital-co2" className="block text-xs font-medium text-slate-200 mb-1">
                  ECLSS Cabin CO2 <span className="font-mono text-slate-400">(ppm)</span>
                </label>
                <input
                  id="vital-co2"
                  type="number"
                  step={50}
                  min={300}
                  max={10000}
                  value={cabinCo2Ppm}
                  onChange={(e) => setCabinCo2Ppm(e.target.value)}
                  className="w-full px-3 py-2 bg-[#090D16] border border-slate-700 rounded-md text-sm font-mono tabular-nums text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
              <div>
                <label htmlFor="vital-o2" className="block text-xs font-medium text-slate-200 mb-1">
                  Cabin O2 <span className="font-mono text-slate-400">(%)</span>
                </label>
                <input
                  id="vital-o2"
                  type="number"
                  step={0.1}
                  min={15}
                  max={30}
                  value={cabinO2Pct}
                  onChange={(e) => setCabinO2Pct(e.target.value)}
                  className="w-full px-3 py-2 bg-[#090D16] border border-slate-700 rounded-md text-sm font-mono tabular-nums text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
              <label className="flex items-center gap-2 px-3 py-2 bg-[#090D16] border border-slate-700 rounded-md text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={speAlert}
                  onChange={(e) => setSpeAlert(e.target.checked)}
                  className="rounded border-slate-600 text-cyan-400 focus:ring-cyan-400"
                />
                <span>Solar Particle Event (SPE) Alert</span>
              </label>
            </div>

            <div>
              <label htmlFor="vital-notes" className="block text-xs font-medium text-slate-200 mb-1">
                Session Context / Symptoms (Optional)
              </label>
              <input
                id="vital-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Post-EVA measurement, mild nasal congestion..."
                className="w-full px-3 py-2 bg-[#090D16] border border-slate-700 rounded-md text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setFormValues({
                    systolicBp: '126',
                    diastolicBp: '82',
                    heartRate: '73',
                    bloodGlucose: '104',
                    bodyTemp: '37.1',
                    sleepHours: '6.5',
                    moodScore: '7',
                    radiationDose: '1.15',
                  });
                  setCabinCo2Ppm('3400');
                  setCabinO2Pct('20.9');
                  setNotes('Synced from wearable strap, cuff, personal dosimeter, and cabin ECLSS.');
                  setErrors({});
                }}
                className="px-3 py-2 text-xs font-medium text-cyan-300 hover:text-cyan-200 bg-[#090D16] border border-slate-700 rounded-md transition-colors"
              >
                Pull Sensor Snapshot
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors"
                >
                  Save Telemetry
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Tab 2: Imaging & Ultrasound Exam */
          <form onSubmit={handleExamSubmit} className="p-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              {SAMPLE_SCAN_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setExamSystemId(preset.systemId);
                    setExamType(preset.examType);
                    setExamImageUrl(preset.svg);
                    setCaliperMm(String(preset.caliperMm));
                    setExamNote(preset.note);
                    setExamError(null);
                  }}
                  className="px-3 py-1.5 text-xs bg-[#090D16] border border-slate-700 hover:border-cyan-500/60 text-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  Load {preset.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div className="space-y-2">
                <div className="border border-slate-700 rounded-md overflow-hidden bg-black aspect-[16/10] flex items-center justify-center">
                  {cameraActive ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={examImageUrl}
                      alt="Selected ultrasound or camera exam preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-md cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>

                  {!cameraActive ? (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-md transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                      Use Camera
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={captureCameraFrame}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-cyan-400 text-slate-950 rounded-md transition-colors"
                    >
                      Capture Frame
                    </button>
                  )}
                </div>

                {cameraError && (
                  <p className="text-xs text-amber-300" role="status">
                    {cameraError}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label htmlFor="exam-system" className="block text-xs font-medium text-slate-200 mb-1">
                    Body System
                  </label>
                  <select
                    id="exam-system"
                    value={examSystemId}
                    onChange={(e) => setExamSystemId(e.target.value as BodySystemId)}
                    className="w-full px-3 py-2 bg-[#090D16] border border-slate-700 rounded-md text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    {BODY_SYSTEMS.map((sys) => (
                      <option key={sys.id} value={sys.id}>
                        {sys.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="exam-type" className="block text-xs font-medium text-slate-200 mb-1">
                    Exam Type
                  </label>
                  <input
                    id="exam-type"
                    type="text"
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    className="w-full px-3 py-2 bg-[#090D16] border border-slate-700 rounded-md text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="exam-caliper" className="block text-xs font-medium text-slate-200 mb-1">
                      Caliper (mm)
                    </label>
                    <input
                      id="exam-caliper"
                      type="number"
                      step="0.1"
                      value={caliperMm}
                      onChange={(e) => setCaliperMm(e.target.value)}
                      className="w-full px-3 py-2 bg-[#090D16] border border-slate-700 rounded-md text-sm font-mono tabular-nums text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="exam-status" className="block text-xs font-medium text-slate-200 mb-1">
                      Assessment
                    </label>
                    <select
                      id="exam-status"
                      value={examStatus}
                      onChange={(e) => setExamStatus(e.target.value as HealthStatus)}
                      className="w-full px-3 py-2 bg-[#090D16] border border-slate-700 rounded-md text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    >
                      <option value="nominal">Nominal</option>
                      <option value="monitor">Monitor</option>
                      <option value="action">Action Required</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="exam-notes" className="block text-xs font-medium text-slate-200 mb-1">
                    Visual Findings Note
                  </label>
                  <textarea
                    id="exam-notes"
                    rows={3}
                    value={examNote}
                    onChange={(e) => setExamNote(e.target.value)}
                    className="w-full px-3 py-2 bg-[#090D16] border border-slate-700 rounded-md text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
              </div>
            </div>

            {examError && (
              <p className="text-xs text-rose-400" role="alert">
                {examError}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors"
              >
                Attach Exam Record
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
