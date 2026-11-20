import { useEffect, useState } from 'react';
import {
  CalendarPlus,
  Check,
  CheckCircle2,
  Circle,
  Download,
  Lock,
  ShieldCheck,
  Unlock,
} from 'lucide-react';
import { ProgressTrendChart } from './ProgressTrendChart';
import { ResilientImage } from './ResilientImage';
import {
  buildGoogleCalendarUrl,
  downloadPracticeBlockIcs,
  formatScheduleLabel,
  getDefaultPracticeSchedule,
} from '../utils/calendarInvite';
import type {
  ClientProfile,
  ClinicianProfile,
  HomeworkAssignment,
  PracticeBlockSchedule,
} from '../types/care';

interface ClientPortalProps {
  clinician: ClinicianProfile;
  clients: ClientProfile[];
  assignments: HomeworkAssignment[];
  activeToken: string;
  onSelectToken: (token: string) => void;
  onToggleTask: (
    assignmentId: string,
    taskId: string,
    completed?: boolean,
    reflectionResponse?: string
  ) => Promise<HomeworkAssignment>;
  onSubmitAssignment: (
    assignmentId: string,
    payload: {
      moodRating: number;
      difficultyRating: number;
      overallReflection: string;
    }
  ) => Promise<void>;
  onShowToast?: (msg: string) => void;
}

const MOOD_LABELS = [
  { value: 1, label: '1 · Struggling' },
  { value: 2, label: '2 · Tense' },
  { value: 3, label: '3 · Mixed' },
  { value: 4, label: '4 · Steady' },
  { value: 5, label: '5 · Grounded' },
];

export function ClientPortal({
  clinician,
  clients,
  assignments,
  activeToken,
  onSelectToken,
  onToggleTask,
  onSubmitAssignment,
  onShowToast,
}: ClientPortalProps) {
  const activeAssignment =
    assignments.find((a) => a.uniqueToken === activeToken) ||
    assignments.find((a) => a.status === 'pushed') ||
    assignments[0];

  const client = clients.find((c) => c.id === activeAssignment?.clientId);

  const [isLocked, setIsLocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);

  const [moodRating, setMoodRating] = useState<number>(4);
  const [difficultyRating, setDifficultyRating] = useState<number>(2);
  const [overallReflection, setOverallReflection] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [calendarAdded, setCalendarAdded] = useState(false);
  const [clientSchedule, setClientSchedule] = useState<PracticeBlockSchedule>(
    () =>
      activeAssignment?.practiceSchedule ||
      getDefaultPracticeSchedule(activeAssignment?.estimatedMinutes || 10)
  );

  useEffect(() => {
    if (!activeAssignment) return;
    const map: Record<string, string> = {};
    for (const t of activeAssignment.tasks) {
      map[t.id] = t.reflectionResponse || '';
    }
    setTaskNotes(map);
    setMoodRating(activeAssignment.moodRating || 4);
    setDifficultyRating(activeAssignment.difficultyRating || 2);
    setOverallReflection(activeAssignment.overallReflection || '');
    setJustSubmitted(false);
    setCalendarAdded(false);
    setClientSchedule(
      activeAssignment.practiceSchedule ||
        getDefaultPracticeSchedule(activeAssignment.estimatedMinutes || 10)
    );
    setPinInput('');
    setPinError(null);
  }, [activeAssignment?.id]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    if (pinInput.trim() === client.accessPin) {
      setIsLocked(false);
      setPinError(null);
      setPinInput('');
    } else {
      setPinError('Passcode does not match. Please try again.');
    }
  };

  const handleTaskBlur = async (taskId: string) => {
    if (!activeAssignment) return;
    setSavingTaskId(taskId);
    try {
      await onToggleTask(
        activeAssignment.id,
        taskId,
        undefined,
        taskNotes[taskId] ?? ''
      );
    } finally {
      setTimeout(() => setSavingTaskId(null), 600);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignment) return;
    setIsSubmitting(true);
    try {
      await onSubmitAssignment(activeAssignment.id, {
        moodRating,
        difficultyRating,
        overallReflection,
      });
      setJustSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activeAssignment || !client) {
    return (
      <div className="max-w-[900px] mx-auto px-6 py-16 text-center">
        <p className="text-sm text-[#57534E]">
          No active client worksheet link found.
        </p>
      </div>
    );
  }

  const completedCount = activeAssignment.tasks.filter(
    (t) => t.completed
  ).length;
  const totalCount = activeAssignment.tasks.length;
  const progressPct =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="max-w-[980px] mx-auto px-6 py-8 space-y-6">
      {/* Secure Unique Link Banner */}
      <div className="bg-white border border-[#E6E2DA] rounded-2xl p-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <ShieldCheck
            className="w-4 h-4 text-[#2045C8] shrink-0"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#151B2E]">
              Private Client Worksheet Link
            </p>
            <p className="font-mono text-xs text-[#57534E] truncate">
              ?clientLink={activeAssignment.uniqueToken}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs text-[#57534E] flex items-center gap-2">
            <span className="hidden sm:inline">Preview link</span>
            <select
              value={activeAssignment.uniqueToken}
              onChange={(e) => onSelectToken(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-medium bg-[#FAF9F6] border border-[#E6E2DA] rounded-lg text-[#151B2E] focus:outline-none focus:ring-2 focus:ring-[#2045C8]"
            >
              {assignments.map((a) => {
                const c = clients.find((item) => item.id === a.clientId);
                return (
                  <option key={a.id} value={a.uniqueToken}>
                    {c?.name} — {a.title.slice(0, 32)}
                  </option>
                );
              })}
            </select>
          </label>

          <button
            type="button"
            onClick={() => setIsLocked((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#151B2E] bg-[#FAF9F6] hover:bg-[#F3F1EC] border border-[#E6E2DA] rounded-lg whitespace-nowrap shrink-0"
          >
            {isLocked ? (
              <>
                <Unlock className="w-3.5 h-3.5" aria-hidden="true" />
                <span>PIN Screen Active</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Lock with PIN</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isLocked ? (
        <div className="bg-white border border-[#E6E2DA] rounded-2xl p-8 sm:p-12 max-w-md mx-auto text-center">
          <div className="w-11 h-11 rounded-full bg-[#F3F1EC] text-[#151B2E] flex items-center justify-center mx-auto mb-4">
            <Lock className="w-5 h-5" aria-hidden="true" />
          </div>
          <h1 className="font-display text-xl font-bold text-[#151B2E]">
            Verify your private link
          </h1>
          <p className="mt-2 text-sm text-[#57534E]">
            Enter the 4-digit passcode shared by {clinician.name} to view and
            submit your homework.
          </p>
          <p className="mt-1 text-xs font-mono text-[#78716C] tabular-nums">
            Session passcode for {client.preferredName}: {client.accessPin}
          </p>

          <form onSubmit={handleUnlock} className="mt-6 space-y-3">
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="4-digit PIN"
              aria-label="4-digit passcode"
              className="w-full text-center font-mono tracking-[0.4em] text-lg py-2.5 px-4 bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2045C8]"
            />
            {pinError && (
              <p className="text-xs text-[#DC2626]">{pinError}</p>
            )}
            <button
              type="submit"
              className="w-full py-2.5 text-sm font-medium text-white bg-[#2045C8] hover:bg-[#1938A8] rounded-lg transition-colors"
            >
              Unlock Worksheet
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* Calm Greeting & Progress Summary */}
          <section className="bg-white border border-[#E6E2DA] rounded-2xl p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="text-xs font-medium text-[#B83B67]">
                  Welcome back, {client.preferredName} · {activeAssignment.modality}
                </p>
                <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#151B2E] text-balance">
                  {activeAssignment.title}
                </h1>
                <p className="mt-1 text-xs text-[#57534E] tabular-nums">
                  Next session: {client.nextSessionDate} · Estimated ~
                  {activeAssignment.estimatedMinutes} min per practice
                </p>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <p className="text-xs text-[#57534E]">Worksheet progress</p>
                <p className="font-mono text-2xl font-bold text-[#151B2E] tabular-nums">
                  {completedCount}/{totalCount} tasks ({progressPct}%)
                </p>
              </div>
            </div>

            {/* Clean Progress Bar */}
            <div className="mt-5 h-2 w-full bg-[#F3F1EC] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2045C8] transition-all duration-200"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Clinician Walkthrough Note */}
            <div className="mt-6 pt-6 border-t border-[#E6E2DA] flex items-start gap-3.5">
              <ResilientImage
                src={clinician.avatarUrl}
                alt={clinician.name}
                className="w-10 h-10 rounded-full object-cover border border-[#E6E2DA] shrink-0"
              />
              <div>
                <p className="text-xs font-medium text-[#151B2E]">
                  Note from {clinician.name}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[#44403C]">
                  {activeAssignment.walkthroughNotes ||
                    'Take these gently at your own pace this week.'}
                </p>
              </div>
            </div>

            {activeAssignment.clinicianFeedback && (
              <div className="mt-4 p-4 rounded-xl bg-[#FDF2F6] border border-[#F5D0DF]">
                <p className="text-xs font-medium text-[#9D2652]">
                  Clinician Review Response
                </p>
                <p className="mt-1 text-sm text-[#151B2E]">
                  {activeAssignment.clinicianFeedback}
                </p>
              </div>
            )}
          </section>

          {/* Add Practice Block to Calendar — for clients who forget their homework */}
          <section className="bg-white border border-[#E6E2DA] rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-xs font-medium text-[#2045C8]">
                  <CalendarPlus className="w-4 h-4" aria-hidden="true" />
                  <span>Practice Block Reminder</span>
                </div>
                <h2 className="font-display text-base font-semibold text-[#151B2E]">
                  Add a dedicated practice block to your calendar
                </h2>
                <p className="text-xs text-[#57534E]">
                  Save a gentle {clientSchedule.durationMinutes}-minute reminder
                  with your private worksheet link and exercises inside so
                  it&rsquo;s easy to remember mid-week.
                </p>
              </div>

              <span className="font-mono text-xs text-[#2045C8] bg-[#EEF2FF] px-3 py-1.5 rounded-lg border border-[#2045C8]/20">
                {formatScheduleLabel(clientSchedule)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <label className="text-xs text-[#57534E] flex flex-col gap-1">
                <span>Start Date</span>
                <input
                  type="date"
                  value={clientSchedule.startDate}
                  onChange={(e) =>
                    setClientSchedule((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="px-3 py-2 text-xs font-medium bg-[#FAF9F6] border border-[#E6E2DA] rounded-lg text-[#151B2E] font-mono focus:outline-none focus:ring-2 focus:ring-[#2045C8]"
                />
              </label>

              <label className="text-xs text-[#57534E] flex flex-col gap-1">
                <span>Preferred Time</span>
                <input
                  type="time"
                  value={clientSchedule.time}
                  onChange={(e) =>
                    setClientSchedule((prev) => ({
                      ...prev,
                      time: e.target.value,
                    }))
                  }
                  className="px-3 py-2 text-xs font-medium bg-[#FAF9F6] border border-[#E6E2DA] rounded-lg text-[#151B2E] font-mono focus:outline-none focus:ring-2 focus:ring-[#2045C8]"
                />
              </label>

              <label className="text-xs text-[#57534E] flex flex-col gap-1">
                <span>Repeat</span>
                <select
                  value={clientSchedule.repeat}
                  onChange={(e) =>
                    setClientSchedule((prev) => ({
                      ...prev,
                      repeat: e.target.value as PracticeBlockSchedule['repeat'],
                    }))
                  }
                  className="px-3 py-2 text-xs font-medium bg-[#FAF9F6] border border-[#E6E2DA] rounded-lg text-[#151B2E] focus:outline-none focus:ring-2 focus:ring-[#2045C8]"
                >
                  <option value="3x-week">3x/week (Mon, Wed, Fri)</option>
                  <option value="daily">Daily (5 days)</option>
                  <option value="once">One-time reminder</option>
                </select>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              {calendarAdded ? (
                <p className="text-xs font-medium text-[#15803D] inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  <span>
                    Practice Block added — reminder includes your private
                    worksheet link.
                  </span>
                </p>
              ) : (
                <span className="text-xs text-[#78716C]">
                  Works with Apple Calendar, Google Calendar, and Outlook
                </span>
              )}

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    downloadPracticeBlockIcs({
                      assignment: activeAssignment,
                      schedule: clientSchedule,
                      client,
                      clinician,
                    });
                    setCalendarAdded(true);
                    onShowToast?.('Practice Block added (.ics downloaded)');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#2045C8] hover:bg-[#1938A8] rounded-lg transition-colors whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Add to Calendar (.ics)</span>
                </button>

                <a
                  href={buildGoogleCalendarUrl({
                    assignment: activeAssignment,
                    schedule: clientSchedule,
                    client,
                    clinician,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setCalendarAdded(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#151B2E] bg-[#FAF9F6] hover:bg-[#F3F1EC] border border-[#E6E2DA] rounded-lg transition-colors whitespace-nowrap"
                >
                  <CalendarPlus
                    className="w-3.5 h-3.5 text-[#2045C8]"
                    aria-hidden="true"
                  />
                  <span>Add to Google Calendar</span>
                </a>
              </div>
            </div>
          </section>

          {/* Interactive Exercises Checklist */}
          <section className="space-y-4">
            <h2 className="font-display text-base font-semibold text-[#151B2E]">
              Your Exercises
            </h2>

            {activeAssignment.tasks.map((task, idx) => {
              const isDone = task.completed;
              return (
                <div
                  key={task.id}
                  className={`rounded-2xl border p-6 transition-colors duration-150 ${
                    isDone
                      ? 'bg-[#FAF9F6] border-[#D6D3CD]'
                      : 'bg-white border-[#E6E2DA]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        onToggleTask(
                          activeAssignment.id,
                          task.id,
                          !isDone,
                          taskNotes[task.id] ?? ''
                        )
                      }
                      aria-label={
                        isDone
                          ? `Mark "${task.title}" incomplete`
                          : `Mark "${task.title}" complete`
                      }
                      className="mt-0.5 shrink-0 text-[#2045C8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2045C8] rounded-full"
                    >
                      {isDone ? (
                        <CheckCircle2
                          className="w-6 h-6 text-[#15803D]"
                          aria-hidden="true"
                        />
                      ) : (
                        <Circle
                          className="w-6 h-6 text-[#A8A29E] hover:text-[#2045C8]"
                          aria-hidden="true"
                        />
                      )}
                    </button>

                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs text-[#57534E] font-mono tabular-nums">
                          Exercise 0{idx + 1} · {task.frequency}
                        </span>
                        <span
                          className={`text-xs font-medium ${
                            isDone ? 'text-[#15803D]' : 'text-[#57534E]'
                          }`}
                        >
                          {isDone ? 'Completed' : 'To practice'}
                        </span>
                      </div>

                      <h3
                        className={`font-display text-lg font-semibold ${
                          isDone ? 'text-[#57534E]' : 'text-[#151B2E]'
                        }`}
                      >
                        {task.title}
                      </h3>

                      <p className="text-sm leading-relaxed text-[#44403C]">
                        {task.instruction}
                      </p>

                      <div className="pt-2">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <label
                            htmlFor={`reflection-${task.id}`}
                            className="text-xs font-medium text-[#151B2E]"
                          >
                            {task.promptQuestion}
                          </label>
                          {savingTaskId === task.id && (
                            <span className="text-[11px] text-[#15803D] inline-flex items-center gap-1">
                              <Check className="w-3 h-3" aria-hidden="true" />
                              <span>Saved</span>
                            </span>
                          )}
                        </div>
                        <textarea
                          id={`reflection-${task.id}`}
                          rows={2}
                          value={taskNotes[task.id] ?? ''}
                          onChange={(e) =>
                            setTaskNotes((prev) => ({
                              ...prev,
                              [task.id]: e.target.value,
                            }))
                          }
                          onBlur={() => handleTaskBlur(task.id)}
                          placeholder="Jot down a few honest sentences when you practice..."
                          className="w-full p-3 text-sm bg-white border border-[#E6E2DA] rounded-xl text-[#151B2E] focus:outline-none focus:ring-2 focus:ring-[#2045C8]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Submit Check-In Form */}
          <section className="bg-white border border-[#E6E2DA] rounded-2xl p-6 sm:p-8">
            <h2 className="font-display text-lg font-semibold text-[#151B2E]">
              Between-Session Check-In & Submission
            </h2>
            <p className="mt-1 text-sm text-[#57534E]">
              Share how your week felt overall so {clinician.name} can review
              before your next session.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <div>
                <p className="text-xs font-medium text-[#151B2E] mb-2.5">
                  Overall emotional steadiness this week
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {MOOD_LABELS.map((item) => {
                    const active = moodRating === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setMoodRating(item.value)}
                        className={`px-3 py-2.5 text-xs font-medium rounded-xl border transition-colors text-center whitespace-nowrap ${
                          active
                            ? 'bg-[#151B2E] text-white border-[#151B2E]'
                            : 'bg-[#FAF9F6] text-[#151B2E] border-[#E6E2DA] hover:bg-[#F3F1EC]'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="difficulty-range"
                  className="flex items-center justify-between text-xs font-medium text-[#151B2E] mb-2"
                >
                  <span>How manageable did these exercises feel?</span>
                  <span className="font-mono tabular-nums text-[#57534E]">
                    {difficultyRating}/5 (1 = Gentle, 5 = Challenging)
                  </span>
                </label>
                <input
                  id="difficulty-range"
                  type="range"
                  min={1}
                  max={5}
                  value={difficultyRating}
                  onChange={(e) => setDifficultyRating(Number(e.target.value))}
                  className="w-full accent-[#2045C8]"
                />
              </div>

              <div>
                <label
                  htmlFor="overall-reflection"
                  className="block text-xs font-medium text-[#151B2E] mb-1.5"
                >
                  Anything you want to unpack next session?
                </label>
                <textarea
                  id="overall-reflection"
                  rows={3}
                  value={overallReflection}
                  onChange={(e) => setOverallReflection(e.target.value)}
                  placeholder="Optional: moments that felt surprisingly steady, or points where you got stuck..."
                  className="w-full p-3 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl text-[#151B2E] focus:outline-none focus:ring-2 focus:ring-[#2045C8]"
                />
              </div>

              {justSubmitted || activeAssignment.status === 'completed' ? (
                <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-[#15803D]">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    <span>
                      Submitted securely to {clinician.name}. You can still
                      update reflections anytime before session.
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-medium text-[#151B2E] bg-white border border-[#E6E2DA] rounded-lg hover:bg-[#FAF9F6] whitespace-nowrap"
                  >
                    Update Submission
                  </button>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-[#2045C8] hover:bg-[#1938A8] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap"
                  >
                    {isSubmitting
                      ? 'Submitting...'
                      : 'Submit Completed Assignment'}
                  </button>
                </div>
              )}
            </form>
          </section>

          {/* Client Longitudinal Progress View */}
          <section className="bg-white border border-[#E6E2DA] rounded-2xl p-6 sm:p-8">
            <h2 className="font-display text-base font-semibold text-[#151B2E]">
              My Progress Over Time
            </h2>
            <p className="mt-1 text-xs text-[#57534E] mb-5">
              Consistency builds over small weekly practices — every reflection
              counts.
            </p>
            <ProgressTrendChart points={client.weeklyProgress} />
          </section>
        </>
      )}
    </div>
  );
}
