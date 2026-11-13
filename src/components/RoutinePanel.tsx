import React from 'react';
import { Award, CheckSquare, Flame, Square } from 'lucide-react';
import type { BodySystemId, MissionEnvironment, RoutineTask } from '../types/health';

interface RoutinePanelProps {
  tasks: RoutineTask[];
  environment: MissionEnvironment;
  adherencePct: number;
  earnedPoints: number;
  streakDays: number;
  onToggleTask: (taskId: string) => void;
  onInspectSystem: (systemId: BodySystemId) => void;
}

export const RoutinePanel: React.FC<RoutinePanelProps> = ({
  tasks,
  environment,
  adherencePct,
  earnedPoints,
  streakDays,
  onToggleTask,
  onInspectSystem,
}) => {
  const activeTasks = tasks.filter((t) => t.environments.includes(environment.id));
  const completedCount = activeTasks.filter((t) => t.completedToday).length;

  return (
    <section aria-label="Mission Health Routine and Countermeasures" className="space-y-5">
      {/* Gamified Countermeasure Adherence Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0F1522] border border-slate-800 rounded-lg p-4">
          <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            Daily Countermeasure Adherence
          </p>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-semibold tabular-nums text-slate-100">
              {adherencePct}%
            </span>
            <span className="text-xs font-mono text-slate-400 tabular-nums">
              {completedCount} / {activeTasks.length} completed
            </span>
          </div>
          <div className="mt-2.5 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-200"
              style={{ width: `${adherencePct}%` }}
            />
          </div>
        </div>

        <div className="bg-[#0F1522] border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Readiness Points Today
            </p>
            <Award className="w-4 h-4 text-cyan-400" aria-hidden="true" />
          </div>
          <div className="mt-1.5 flex items-baseline">
            <span className="text-2xl font-mono font-semibold tabular-nums text-slate-100">
              {earnedPoints}
            </span>
            <span className="text-xs font-mono text-slate-400 ml-1.5">PTS</span>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Earned by completing scheduled exams & exercise countermeasures
          </p>
        </div>

        <div className="bg-[#0F1522] border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Consecutive Logging Streak
            </p>
            <Flame className="w-4 h-4 text-amber-400" aria-hidden="true" />
          </div>
          <div className="mt-1.5 flex items-baseline">
            <span className="text-2xl font-mono font-semibold tabular-nums text-slate-100">
              {streakDays}
            </span>
            <span className="text-xs font-mono text-slate-400 ml-1.5">DAYS</span>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Active telemetry streak for {environment.shortLabel}
          </p>
        </div>
      </div>

      {/* Scheduled Mission Routine Prompts */}
      <div className="bg-[#0F1522] border border-slate-800 rounded-lg divide-y divide-slate-800/80">
        <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Scheduled Countermeasure & Self-Exam Routine
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tailored for {environment.name} · {environment.gravityLabel}
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400">
            Active Tasks: {activeTasks.length}
          </span>
        </div>

        {activeTasks.map((task) => (
          <div
            key={task.id}
            className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <button
                type="button"
                onClick={() => onToggleTask(task.id)}
                aria-pressed={task.completedToday}
                aria-label={`${task.completedToday ? 'Mark incomplete' : 'Mark complete'}: ${task.title}`}
                className="mt-0.5 text-cyan-400 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded shrink-0"
              >
                {task.completedToday ? (
                  <CheckSquare className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Square className="w-5 h-5 text-slate-500" />
                )}
              </button>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
                  <span>{task.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{task.scheduleWindow}</span>
                  <span aria-hidden="true">·</span>
                  <span>{task.durationMin} min</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-cyan-400">+{task.points} pts</span>
                </div>
                <h3
                  className={`text-sm font-semibold mt-1 ${
                    task.completedToday ? 'text-slate-400 line-through' : 'text-slate-100'
                  }`}
                >
                  {task.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{task.instruction}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 pl-8 sm:pl-0">
              <button
                type="button"
                onClick={() => onInspectSystem(task.systemId)}
                className="px-3 py-1.5 text-xs font-medium bg-[#090D16] hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                Inspect System
              </button>
              <button
                type="button"
                onClick={() => onToggleTask(task.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  task.completedToday
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                    : 'bg-cyan-400 text-slate-950 font-semibold hover:bg-cyan-300'
                }`}
              >
                {task.completedToday ? 'Completed' : 'Complete'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
