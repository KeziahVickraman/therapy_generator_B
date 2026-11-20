import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CalendarPlus,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Edit3,
  Eye,
  ExternalLink,
  Loader2,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { ProgressTrendChart } from './ProgressTrendChart';
import {
  buildGoogleCalendarUrl,
  buildInviteMessageText,
  downloadPracticeBlockIcs,
  formatScheduleLabel,
  getDefaultPracticeSchedule,
} from '../utils/calendarInvite';
import type {
  AssignmentStatus,
  ClientProfile,
  ClinicianProfile,
  HomeworkAssignment,
  PracticeBlockSchedule,
  ResourceItem,
  TherapyModality,
} from '../types/care';

export type ClinicianSubTab = 'generator' | 'walkthrough' | 'sent' | 'progress';

export interface DraftTaskInput {
  title: string;
  instruction: string;
  frequency: string;
  promptQuestion: string;
}

export interface WorksheetDraft {
  title: string;
  modality: TherapyModality;
  clinicalRationale: string;
  walkthroughNotes: string;
  estimatedMinutes: number;
  tasks: DraftTaskInput[];
}

interface ClinicianWorkspaceProps {
  clinicians: ClinicianProfile[];
  selectedClinicianId: string;
  onSelectClinician: (clinicianId: string) => void;
  clients: ClientProfile[];
  assignments: HomeworkAssignment[];
  selectedClientId: string;
  onSelectClient: (clientId: string) => void;
  activeSubTab: ClinicianSubTab;
  onChangeSubTab: (subTab: ClinicianSubTab) => void;
  incomingTemplate: ResourceItem | null;
  onClearIncomingTemplate: () => void;
  onCreateAssignment: (payload: {
    clientId: string;
    title: string;
    modality: TherapyModality;
    clinicalRationale: string;
    walkthroughNotes: string;
    estimatedMinutes: number;
    status: 'walkthrough' | 'pushed';
    practiceSchedule?: PracticeBlockSchedule;
    tasks: DraftTaskInput[];
  }) => Promise<HomeworkAssignment>;
  onUpdateAssignment: (
    assignmentId: string,
    updates: Partial<HomeworkAssignment>
  ) => Promise<HomeworkAssignment>;
  onSaveClinicianReview: (
    assignmentId: string,
    clinicianFeedback: string
  ) => Promise<HomeworkAssignment>;
  onOpenClientLink: (token: string) => void;
  onCopyLink: (token: string) => void;
  onShowToast?: (msg: string) => void;
}

const MODALITIES: TherapyModality[] = [
  'CBT',
  'ACT',
  'DBT',
  'Somatic',
  'CBT-I',
  'Mindfulness',
];

const MAX_GENERATED_EXERCISES = 3;

function getStatusDisplay(status: AssignmentStatus) {
  switch (status) {
    case 'completed':
      return {
        label: 'Submitted',
        colorClass: 'text-[#15803D]',
        Icon: CheckCircle2,
      };
    case 'pushed':
      return {
        label: 'Practice Block Active',
        colorClass: 'text-[#2045C8]',
        Icon: CalendarPlus,
      };
    case 'walkthrough':
      return {
        label: 'Walkthrough Ready',
        colorClass: 'text-[#B45309]',
        Icon: Clock,
      };
    default:
      return {
        label: 'Draft',
        colorClass: 'text-[#57534E]',
        Icon: Edit3,
      };
  }
}

function buildBlankDraft(modality: TherapyModality): WorksheetDraft {
  return {
    title: '',
    modality,
    clinicalRationale: '',
    walkthroughNotes: '',
    estimatedMinutes: 10,
    tasks: [
      {
        title: '',
        instruction: '',
        frequency: '3x this week',
        promptQuestion: 'What felt most helpful or challenging while practicing?',
      },
    ],
  };
}

export function ClinicianWorkspace({
  clinicians,
  selectedClinicianId,
  onSelectClinician,
  clients,
  assignments,
  selectedClientId,
  onSelectClient,
  activeSubTab,
  onChangeSubTab,
  incomingTemplate,
  onClearIncomingTemplate,
  onCreateAssignment,
  onUpdateAssignment,
  onSaveClinicianReview,
  onOpenClientLink,
  onCopyLink,
  onShowToast,
}: ClinicianWorkspaceProps) {
  const selectedClinician =
    clinicians.find((c) => c.id === selectedClinicianId) || clinicians[0];

  const clinicianClients = useMemo(
    () =>
      clients.filter((c) =>
        selectedClinician ? c.clinicianId === selectedClinician.id : true
      ),
    [clients, selectedClinician?.id]
  );

  const selectedClient =
    clinicianClients.find((c) => c.id === selectedClientId) ||
    clinicianClients[0] ||
    clients[0];

  const clientAssignments = useMemo(
    () => assignments.filter((a) => a.clientId === selectedClient?.id),
    [assignments, selectedClient?.id]
  );

  const clinicianAssignments = useMemo(() => {
    const clientIds = new Set(clinicianClients.map((c) => c.id));
    return assignments.filter((a) => clientIds.has(a.clientId));
  }, [assignments, clinicianClients]);

  const clinicianSentAssignments = useMemo(
    () =>
      clinicianAssignments.filter(
        (a) => a.status === 'pushed' || a.status === 'completed'
      ),
    [clinicianAssignments]
  );

  // Streamlined Generator state
  const [sessionNotes, setSessionNotes] = useState(
    'Client described Sunday evening anticipatory dread ahead of weekly team standups and difficulty shutting off work email after 7 PM.'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [importedClientLabel, setImportedClientLabel] = useState<string>('');

  const [draft, setDraft] = useState<WorksheetDraft>({
    title: 'Evening Unwind & Cognitive Check-In',
    modality: selectedClient?.modality || 'CBT',
    clinicalRationale:
      'Support behavioral separation from work cues and practice evidence testing on performance worry.',
    walkthroughNotes:
      'Keep each reflection brief — two or three honest lines is plenty.',
    estimatedMinutes: 10,
    tasks: [
      {
        title: 'Write tomorrow’s top two priorities before closing laptop',
        instruction:
          'At the end of your workday, jot down two priorities on paper and close work tabs intentionally.',
        frequency: 'Daily on workdays',
        promptQuestion: 'Did writing priorities down reduce urge to re-check email?',
      },
      {
        title: 'Notice and balance one anticipatory worry thought',
        instruction:
          'Capture the exact worry sentence, then write one grounded alternative you would offer a friend.',
        frequency: '3 evenings this week',
        promptQuestion: 'How did your worry intensity shift from before to after reframing?',
      },
    ],
  });

  const [practiceSchedule, setPracticeSchedule] = useState<PracticeBlockSchedule>(
    () => getDefaultPracticeSchedule(10)
  );

  // Walkthrough, Sent & Progress state
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(
    clientAssignments[0]?.id || ''
  );
  const [editingWalkthroughTaskId, setEditingWalkthroughTaskId] = useState<string | null>(
    null
  );
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [lastSentAssignmentId, setLastSentAssignmentId] = useState<string>('');
  const [feedbackDraft, setFeedbackDraft] = useState('');
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [feedbackSavedId, setFeedbackSavedId] = useState<string | null>(null);

  useEffect(() => {
    if (clientAssignments.length > 0) {
      const stillExists = clientAssignments.some(
        (a) => a.id === selectedAssignmentId
      );
      if (!stillExists) {
        setSelectedAssignmentId(clientAssignments[0].id);
      }
    } else {
      setSelectedAssignmentId('');
    }
  }, [clientAssignments, selectedAssignmentId]);

  useEffect(() => {
    if (selectedClient && !incomingTemplate) {
      setDraft((prev) => ({
        ...prev,
        modality: selectedClient.modality,
      }));
    }
  }, [selectedClient?.id]);

  useEffect(() => {
    if (incomingTemplate && incomingTemplate.templateTasks) {
      setDraft({
        title: incomingTemplate.title,
        modality: incomingTemplate.modality,
        clinicalRationale: incomingTemplate.summary,
        walkthroughNotes: `Adapted from ${incomingTemplate.title}. Let us choose the cadence that feels realistic this week.`,
        estimatedMinutes: incomingTemplate.readMinutes || 10,
        tasks: incomingTemplate.templateTasks
          .slice(0, MAX_GENERATED_EXERCISES)
          .map((t) => ({ ...t })),
      });
      onClearIncomingTemplate();
    }
  }, [incomingTemplate, onClearIncomingTemplate]);

  const activeAssignment =
    clientAssignments.find((a) => a.id === selectedAssignmentId) ||
    clientAssignments[0];

  useEffect(() => {
    setFeedbackDraft(activeAssignment?.clinicianFeedback || '');
  }, [activeAssignment?.id, activeAssignment?.clinicianFeedback]);

  const handleImportClientDetails = (clientId: string) => {
    const target = clients.find((c) => c.id === clientId);
    if (!target) return;
    if (target.clinicianId !== selectedClinician?.id) {
      onSelectClinician(target.clinicianId);
    }
    onSelectClient(target.id);
    setSessionNotes(
      `Session ${target.sessionNumber} with ${target.name}. Focus: ${target.primaryFocus}.`
    );
    setDraft((prev) => ({
      ...prev,
      modality: target.modality,
      clinicalRationale: `${target.modality} between-session plan for ${target.name} (${target.primaryFocus}).`,
      walkthroughNotes: `${target.preferredName}, let us keep these practices gentle ahead of our ${target.nextSessionDate} session.`,
    }));
    setImportedClientLabel(
      `Imported ${target.name} · ${target.modality} · Session ${target.sessionNumber}`
    );
  };

  const handleClearFresh = () => {
    setSessionNotes('');
    setGenerateError(null);
    setImportedClientLabel('');
    setDraft(buildBlankDraft(selectedClient?.modality || 'CBT'));
  };

  const handleGenerateWithAI = async () => {
    if (!selectedClient) return;
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch('/api/ai/generate-homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: selectedClient.preferredName,
          modality: draft.modality,
          sessionNotes,
          focusGoal: selectedClient.primaryFocus,
          estimatedMinutes: draft.estimatedMinutes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate homework draft.');
      }
      setDraft((prev) => ({
        ...prev,
        title: data.title || prev.title,
        clinicalRationale: data.clinicalRationale || prev.clinicalRationale,
        walkthroughNotes: data.walkthroughNotes || prev.walkthroughNotes,
        estimatedMinutes: Number(data.estimatedMinutes) || prev.estimatedMinutes,
        tasks:
          Array.isArray(data.tasks) && data.tasks.length > 0
            ? data.tasks.slice(0, MAX_GENERATED_EXERCISES)
            : prev.tasks.slice(0, MAX_GENERATED_EXERCISES),
      }));
    } catch (err: unknown) {
      setGenerateError(
        err instanceof Error ? err.message : 'Unable to reach AI generator.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveWorksheet = async (targetStatus: 'walkthrough' | 'pushed') => {
    if (!selectedClient) return;
    const validTasks = draft.tasks
      .filter((t) => t.title.trim().length > 0)
      .slice(0, MAX_GENERATED_EXERCISES);
    if (validTasks.length === 0) return;

    const resolvedSchedule: PracticeBlockSchedule = {
      ...practiceSchedule,
      durationMinutes: draft.estimatedMinutes,
    };

    setIsSaving(true);
    try {
      const created = await onCreateAssignment({
        clientId: selectedClient.id,
        title: draft.title.trim() || 'Custom Therapy Worksheet',
        modality: draft.modality,
        clinicalRationale: draft.clinicalRationale.trim(),
        walkthroughNotes: draft.walkthroughNotes.trim(),
        estimatedMinutes: draft.estimatedMinutes,
        status: targetStatus,
        practiceSchedule: resolvedSchedule,
        tasks: validTasks,
      });
      setSelectedAssignmentId(created.id);
      if (targetStatus === 'pushed') {
        setLastSentAssignmentId(created.id);
        const inviteText = buildInviteMessageText({
          assignment: created,
          schedule: resolvedSchedule,
          client: selectedClient,
          clinician: selectedClinician,
        });
        navigator.clipboard?.writeText(inviteText).catch(() => {});
        setCopiedInviteId(created.id);
        setTimeout(() => setCopiedInviteId(null), 2400);
        onChangeSubTab('sent');
      } else {
        onChangeSubTab('walkthrough');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendPracticeBlockInvite = async (
    assignment: HomeworkAssignment
  ) => {
    const schedule =
      assignment.practiceSchedule ||
      ({
        ...practiceSchedule,
        durationMinutes: assignment.estimatedMinutes,
      } satisfies PracticeBlockSchedule);

    const updated = await onUpdateAssignment(assignment.id, {
      status: 'pushed',
      practiceSchedule: schedule,
    });
    setLastSentAssignmentId(updated.id);
    const inviteText = buildInviteMessageText({
      assignment: updated,
      schedule,
      client: selectedClient,
      clinician: selectedClinician,
    });
    navigator.clipboard?.writeText(inviteText).catch(() => {});
    setCopiedInviteId(updated.id);
    setTimeout(() => setCopiedInviteId(null), 2400);
    onChangeSubTab('sent');
  };

  const handleInlineTaskSave = async (
    assignment: HomeworkAssignment,
    taskId: string,
    field: 'title' | 'instruction' | 'frequency',
    value: string
  ) => {
    const nextTasks = assignment.tasks.map((t) =>
      t.id === taskId ? { ...t, [field]: value } : t
    );
    await onUpdateAssignment(assignment.id, { tasks: nextTasks });
  };

  const handleAddTaskToDraft = () => {
    if (draft.tasks.length >= MAX_GENERATED_EXERCISES) return;
    setDraft((prev) => ({
      ...prev,
      tasks: [
        ...prev.tasks,
        {
          title: '',
          instruction: '',
          frequency: '3x this week',
          promptQuestion: 'What felt most helpful or challenging about this practice?',
        },
      ],
    }));
  };

  const handleRemoveDraftTask = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index),
    }));
  };

  const handleSaveFeedback = async (assignmentId: string) => {
    if (!feedbackDraft.trim()) return;
    setSavingFeedback(true);
    try {
      await onSaveClinicianReview(assignmentId, feedbackDraft.trim());
      setFeedbackSavedId(assignmentId);
      setTimeout(() => setFeedbackSavedId(null), 2000);
    } finally {
      setSavingFeedback(false);
    }
  };

  if (!selectedClient || !selectedClinician) return null;

  const sentDisplayAssignment =
    clinicianSentAssignments.find((a) => a.id === lastSentAssignmentId) ||
    clinicianSentAssignments.find((a) => a.id === selectedAssignmentId) ||
    clinicianSentAssignments[0];

  const sentDisplayClient = sentDisplayAssignment
    ? clients.find((c) => c.id === sentDisplayAssignment.clientId)
    : selectedClient;

  const validDraftTasksCount = draft.tasks.filter(
    (t) => t.title.trim().length > 0
  ).length;

  return (
    <div className="max-w-[1080px] mx-auto px-6 py-8 space-y-6">
      {/* Compact Clinician Header + Tabs */}
      <section className="bg-white border border-[#E6E2DA] rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#151B2E] text-white flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4" aria-hidden="true" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor="clinician-select"
                className="text-xs font-medium text-[#57534E]"
              >
                Clinician
              </label>
              <select
                id="clinician-select"
                value={selectedClinician.id}
                onChange={(e) => onSelectClinician(e.target.value)}
                className="px-3 py-1.5 text-sm font-display font-semibold bg-[#FAF9F6] border border-[#E6E2DA] rounded-lg text-[#151B2E] focus:outline-none focus:ring-2 focus:ring-[#2045C8]"
              >
                {clinicians.map((clin) => (
                  <option key={clin.id} value={clin.id}>
                    {clin.name}
                  </option>
                ))}
              </select>
              <span className="hidden sm:inline text-xs text-[#57534E]">
                {selectedClinician.specialtyFocus || selectedClinician.credentials}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#57534E] font-mono tabular-nums">
            <span>{clinicianClients.length} clients</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#2045C8] font-medium">
              {clinicianSentAssignments.length} sent
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-[#15803D] font-medium">
              {clinicianAssignments.filter((a) => a.status === 'completed').length}{' '}
              submitted
            </span>
          </div>
        </div>

        {/* Clean Color-Coded Clinician Navigation Tabs */}
        <div
          role="tablist"
          aria-label="Clinician workspace tabs"
          className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#E6E2DA]"
        >
          {[
            {
              id: 'generator' as const,
              label: 'Homework Generator',
              activeStyle: 'bg-[#8B2952] text-white border-[#8B2952]',
            },
            {
              id: 'walkthrough' as const,
              label: 'Walkthrough & Invite',
              activeStyle: 'bg-[#0F766E] text-white border-[#0F766E]',
            },
            {
              id: 'sent' as const,
              label: 'Sent to Client',
              activeStyle: 'bg-[#2045C8] text-white border-[#2045C8]',
            },
            {
              id: 'progress' as const,
              label: 'Progress & Submissions',
              activeStyle: 'bg-[#151B2E] text-white border-[#151B2E]',
            },
          ].map((tab) => {
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChangeSubTab(tab.id)}
                className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2045C8] ${
                  active
                    ? tab.activeStyle
                    : 'bg-[#FAF9F6] text-[#44403C] border-[#E6E2DA] hover:text-[#151B2E] hover:bg-[#F3F1EC]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* TAB 1: STREAMLINED HOMEWORK GENERATOR (MAX 3 EXERCISES + CLEAR FRESH) */}
      {activeSubTab === 'generator' && (
        <section className="bg-white border border-[#E6E2DA] rounded-2xl p-6 sm:p-8 space-y-6">
          {/* Top Row: Import Client Details + Modality + Clear */}
          <div className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-[#E6E2DA]">
            <div className="flex-1 min-w-[240px]">
              <label
                htmlFor="import-client-details"
                className="block text-xs font-medium text-[#151B2E] mb-1.5"
              >
                Import Client Details
              </label>
              <select
                id="import-client-details"
                value={selectedClient.id}
                onChange={(e) => handleImportClientDetails(e.target.value)}
                className="w-full px-3 py-2 text-sm font-medium bg-[#FAF9F6] border border-[#E6E2DA] rounded-lg text-[#151B2E] focus:outline-none focus:ring-2 focus:ring-[#2045C8]"
              >
                {clinicianClients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} — {client.modality} · Session{' '}
                    {client.sessionNumber} ({client.primaryFocus})
                  </option>
                ))}
              </select>
              {importedClientLabel && (
                <p className="mt-1.5 text-xs font-medium text-[#15803D]">
                  {importedClientLabel}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs text-[#57534E] flex flex-col gap-1">
                <span>Modality</span>
                <select
                  value={draft.modality}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      modality: e.target.value as TherapyModality,
                    }))
                  }
                  className="px-2.5 py-2 text-xs font-medium bg-[#FAF9F6] border border-[#E6E2DA] rounded-lg text-[#151B2E] focus:outline-none focus:ring-2 focus:ring-[#2045C8]"
                >
                  {MODALITIES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-[#57534E] flex flex-col gap-1">
                <span>Duration</span>
                <select
                  value={draft.estimatedMinutes}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      estimatedMinutes: Number(e.target.value),
                    }))
                  }
                  className="px-2.5 py-2 text-xs font-medium bg-[#FAF9F6] border border-[#E6E2DA] rounded-lg text-[#151B2E] font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-[#2045C8]"
                >
                  <option value={5}>5 min</option>
                  <option value={10}>10 min</option>
                  <option value={15}>15 min</option>
                  <option value={20}>20 min</option>
                </select>
              </label>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-transparent select-none">
                  Reset
                </span>
                <button
                  type="button"
                  onClick={handleClearFresh}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#92400E] border border-[#F59E0B]/40 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Clear &amp; Start Fresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* Session Notes + Generate Action */}
          <div className="space-y-3">
            <label
              htmlFor="session-notes-input"
              className="block text-xs font-medium text-[#151B2E]"
            >
              Session Notes &amp; Clinical Focus (generates max 3 exercises)
            </label>
            <textarea
              id="session-notes-input"
              rows={2}
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Enter brief session themes to generate up to 3 tailored exercises..."
              className="w-full p-3 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-xl text-[#151B2E] focus:outline-none focus:ring-2 focus:ring-[#8B2952]"
            />

            {generateError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B] flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{generateError}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#57534E]">
                <span>Quick presets:</span>
                {(
                  [
                    {
                      label: 'CBT Reframe',
                      modality: 'CBT' as TherapyModality,
                      title: 'Evening Thought Catch & Compassionate Reframe',
                      rationale:
                        'Reduce post-work catastrophic forecasting by testing objective evidence.',
                      walkthrough:
                        'Aim for two short entries before Friday — keep each note under four sentences.',
                      tasks: [
                        {
                          title: 'Catch one automatic worry thought after 6:30 PM',
                          instruction:
                            'Write down the exact automatic thought verbatim and rate emotion intensity (0–100).',
                          frequency: '3 evenings this week',
                          promptQuestion:
                            'What factual counter-evidence softens this prediction?',
                        },
                        {
                          title: 'Five-minute workday closing ritual',
                          instruction:
                            'Jot tomorrow’s top two priorities on paper, close your laptop, and take a short walk.',
                          frequency: 'Daily on workdays',
                          promptQuestion:
                            'Did the ritual make it easier to transition into evening?',
                        },
                      ],
                    },
                    {
                      label: 'Somatic Grounding',
                      modality: 'Somatic' as TherapyModality,
                      title: 'Physiological Sigh & 5-4-3-2-1 Orienting',
                      rationale:
                        'Build interoceptive tolerance during mild autonomic arousal.',
                      walkthrough:
                        'Let the exhale stay twice as long as the inhale and keep your feet anchored.',
                      tasks: [
                        {
                          title: 'Two physiological sighs before stressful transitions',
                          instruction:
                            'Double inhale through the nose, followed by a slow unhurried exhale through the mouth.',
                          frequency: 'Morning & pre-commute',
                          promptQuestion:
                            'How did chest or shoulder tension shift after the second exhale?',
                        },
                        {
                          title: '5-4-3-2-1 neutral sensory scan',
                          instruction:
                            'Quietly notice 5 neutral visual shapes, 4 tactile textures, and 3 steady ambient sounds.',
                          frequency: 'When activation rises',
                          promptQuestion:
                            'Which physical anchor brought attention outward fastest?',
                        },
                      ],
                    },
                    {
                      label: 'ACT Values',
                      modality: 'ACT' as TherapyModality,
                      title: 'Values Compass & Defusion Micro-Steps',
                      rationale:
                        'Shift behavior from uncertainty-avoidance toward values-driven action.',
                      walkthrough:
                        'Focus on taking one small step aligned with your value rather than waiting to feel 100% ready.',
                      tasks: [
                        {
                          title: 'Label one "Radio Doubt" story each morning',
                          instruction:
                            'Prefix anxious self-talk with "I notice my mind is telling me the story that..." to create space.',
                          frequency: 'Daily for 5 days',
                          promptQuestion:
                            'Which repeated story showed up most often this week?',
                        },
                        {
                          title: 'Complete one 15-minute values-aligned action',
                          instruction:
                            'Take one small step rooted in Curiosity or Care even if nervousness tags along.',
                          frequency: '2x this week',
                          promptQuestion:
                            'What step did you take, and how did it feel afterward?',
                        },
                      ],
                    },
                  ] as const
                ).map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setGenerateError(null);
                      setDraft((prev) => ({
                        ...prev,
                        title: preset.title,
                        modality: preset.modality,
                        clinicalRationale: preset.rationale,
                        walkthroughNotes: preset.walkthrough,
                        tasks: preset.tasks
                          .slice(0, MAX_GENERATED_EXERCISES)
                          .map((t) => ({ ...t })),
                      }));
                    }}
                    className="px-2.5 py-1.5 text-xs font-medium text-[#151B2E] bg-[#F3F1EC] hover:bg-[#E6E2DA] border border-[#E6E2DA] rounded-md transition-colors whitespace-nowrap"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleGenerateWithAI}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#8B2952] hover:bg-[#721F42] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B2952]"
              >
                {isGenerating ? (
                  <>
                    <Loader2
                      className="w-4 h-4 animate-spin"
                      aria-hidden="true"
                    />
                    <span>Generating (Max 3)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" aria-hidden="true" />
                    <span>Generate Worksheet</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Clean Editable Worksheet Section */}
          <div className="pt-6 border-t border-[#E6E2DA] space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-semibold text-[#151B2E]">
                  Worksheet Exercises
                </h2>
                <p className="text-xs text-[#57534E] font-mono tabular-nums mt-0.5">
                  {draft.tasks.length} / {MAX_GENERATED_EXERCISES} exercises max
                </p>
              </div>
              {draft.tasks.length < MAX_GENERATED_EXERCISES && (
                <button
                  type="button"
                  onClick={handleAddTaskToDraft}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0F766E] bg-[#F0FDFA] hover:bg-[#CCFBF1] border border-[#0F766E]/30 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Add Exercise</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#151B2E] mb-1">
                  Worksheet Title
                </label>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g., Evening Thought Catch & Reframe"
                  className="w-full px-3.5 py-2 text-sm font-medium bg-[#FAF9F6] border border-[#E6E2DA] rounded-lg text-[#151B2E] focus:outline-none focus:ring-2 focus:ring-[#2045C8]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#151B2E] mb-1">
                  Note for {selectedClient.preferredName}
                </label>
                <input
                  type="text"
                  value={draft.walkthroughNotes}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      walkthroughNotes: e.target.value,
                    }))
                  }
                  placeholder="Brief encouraging guidance for your client..."
                  className="w-full px-3.5 py-2 text-sm bg-[#FAF9F6] border border-[#E6E2DA] rounded-lg text-[#151B2E] focus:outline-none focus:ring-2 focus:ring-[#2045C8]"
                />
              </div>
            </div>

            <div className="divide-y divide-[#E6E2DA] border border-[#E6E2DA] rounded-xl overflow-hidden">
              {draft.tasks.map((task, idx) => (
                <div key={idx} className="p-4 bg-[#FAF9F6] space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs font-semibold text-[#8B2952] tabular-nums">
                      0{idx + 1}. Exercise
                    </span>
                    {draft.tasks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDraftTask(idx)}
                        aria-label={`Remove exercise ${idx + 1}`}
                        className="p-1 text-[#78716C] hover:text-[#DC2626] rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDraft((prev) => ({
                          ...prev,
                          tasks: prev.tasks.map((t, i) =>
                            i === idx ? { ...t, title: val } : t
                          ),
                        }));
                      }}
                      placeholder="Exercise title..."
                      className="md:col-span-2 px-3 py-2 text-sm bg-white border border-[#E6E2DA] rounded-lg text-[#151B2E] focus:outline-none focus:ring-2 focus:ring-[#2045C8]"
                    />
                    <input
                      type="text"
                      value={task.frequency}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDraft((prev) => ({
                          ...prev,
                          tasks: prev.tasks.map((t, i) =>
                            i === idx ? { ...t, frequency: val } : t
                          ),
                        }));
                      }}
                      placeholder="Cadence (e.g., Daily)"
                      className="px-3 py-2 text-sm bg-white border border-[#E6E2DA] rounded-lg text-[#151B2E] focus:outline-none focus:ring-2 focus:ring-[#2045C8]"
                    />
                  </div>

                  <input
                    type="text"
                    value={task.instruction}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraft((prev) => ({
                        ...prev,
                        tasks: prev.tasks.map((t, i) =>
                          i === idx ? { ...t, instruction: val } : t
                        ),
                      }));
                    }}
                    placeholder="Step-by-step instruction for client..."
                    className="w-full px-3 py-2 text-sm bg-white border border-[#E6E2DA] rounded-lg text-[#151B2E] focus:outline-none focus:ring-2 focus:ring-[#2045C8]"
                  />

                  <input
                    type="text"
                    value={task.promptQuestion}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraft((prev) => ({
                        ...prev,
                        tasks: prev.tasks.map((t, i) =>
                          i === idx ? { ...t, promptQuestion: val } : t
                        ),
                      }));
                    }}
                    placeholder="Reflection question for client..."
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E6E2DA] rounded-lg text-[#44403C] focus:outline-none focus:ring-2 focus:ring-[#2045C8]"
                  />
                </div>
              ))}
            </div>

            {/* Practice Block Calendar Schedule */}
            <div className="p-4 sm:p-5 rounded-xl bg-[#FAF9F6] border border-[#E6E2DA] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Calendar
                    className="w-4 h-4 text-[#2045C8]"
                    aria-hidden="true"
                  />
                  <h3 className="font-display text-xs font-semibold text-[#151B2E]">
                    Calendar &ldquo;Practice Block&rdquo; Invite Settings
                  </h3>
                </div>
                <span className="text-xs text-[#57534E]">
                  Embeds worksheet link + PIN inside calendar reminder so{' '}
                  {selectedClient.preferredName} never forgets
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <label className="text-xs text-[#57534E] flex flex-col gap-1">
                  <span>Start Date</span>
                  <input
                    type="date"
                    value={practiceSchedule.startDate}
                    onChange={(e) =>
                      setPracticeSchedule((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className="px-3 py-2 text-xs font-medium bg-white border border-[#E6E2DA] rounded-lg text-[#151B2E] font-mono focus:outline-none focus:ring-2 focus:ring-[#2045C8]"
                  />
                </label>

                <label className="text-xs text-[#57534E] flex flex-col gap-1">
                  <span>Practice Time</span>
                  <input
                    type="time"
                    value={practiceSchedule.time}
                    onChange={(e) =>
                      setPracticeSchedule((prev) => ({
                        ...prev,
                        time: e.target.value,
                      }))
                    }
                    className="px-3 py-2 text-xs font-medium bg-white border border-[#E6E2DA] rounded-lg text-[#151B2E] font-mono focus:outline-none focus:ring-2 focus:ring-[#2045C8]"
                  />
                </label>

                <label className="text-xs text-[#57534E] flex flex-col gap-1">
                  <span>Repeat Cadence</span>
                  <select
                    value={practiceSchedule.repeat}
                    onChange={(e) =>
                      setPracticeSchedule((prev) => ({
                        ...prev,
                        repeat: e.target.value as PracticeBlockSchedule['repeat'],
                      }))
                    }
                    className="px-3 py-2 text-xs font-medium bg-white border border-[#E6E2DA] rounded-lg text-[#151B2E] focus:outline-none focus:ring-2 focus:ring-[#2045C8]"
                  >
                    <option value="3x-week">3x/week (Mon, Wed, Fri)</option>
                    <option value="daily">Daily (5 days)</option>
                    <option value="once">Single Practice Block</option>
                  </select>
                </label>

                <label className="text-xs text-[#57534E] flex flex-col gap-1">
                  <span>Reminder Alert</span>
                  <select
                    value={practiceSchedule.reminderMinutes}
                    onChange={(e) =>
                      setPracticeSchedule((prev) => ({
                        ...prev,
                        reminderMinutes: Number(e.target.value),
                      }))
                    }
                    className="px-3 py-2 text-xs font-medium bg-white border border-[#E6E2DA] rounded-lg text-[#151B2E] focus:outline-none focus:ring-2 focus:ring-[#2045C8]"
                  >
                    <option value={15}>15 min before</option>
                    <option value={30}>30 min before</option>
                    <option value={5}>5 min before</option>
                    <option value={0}>At start time</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Color-Coded Primary Action Footer */}
            <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                disabled={isSaving || validDraftTasksCount === 0}
                onClick={() => handleSaveWorksheet('walkthrough')}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#0F766E] hover:bg-[#115E59] disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Eye className="w-4 h-4" aria-hidden="true" />
                <span>Save &amp; Walkthrough</span>
              </button>

              <button
                type="button"
                disabled={isSaving || validDraftTasksCount === 0}
                onClick={() => handleSaveWorksheet('pushed')}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#2045C8] hover:bg-[#1938A8] disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <CalendarPlus className="w-4 h-4" aria-hidden="true" />
                <span>Calendar &ldquo;Practice Block&rdquo; Invite</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: IN-SESSION WALKTHROUGH & ONE-CLICK PUSH */}
      {activeSubTab === 'walkthrough' && (
        <div className="space-y-5">
          {clientAssignments.length === 0 ? (
            <div className="bg-white border border-[#E6E2DA] rounded-2xl p-10 text-center">
              <p className="text-sm text-[#57534E]">
                No worksheets created for {selectedClient.name} yet.
              </p>
              <button
                type="button"
                onClick={() => onChangeSubTab('generator')}
                className="mt-4 px-4 py-2 text-sm font-medium text-white bg-[#8B2952] rounded-lg"
              >
                Create First Worksheet
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="text-xs font-medium text-[#57534E] flex items-center gap-2.5">
                  <span>Client</span>
                  <select
                    value={selectedClient.id}
                    onChange={(e) => handleImportClientDetails(e.target.value)}
                    className="px-3 py-2 text-sm font-medium bg-white border border-[#E6E2DA] rounded-lg text-[#151B2E]"
                  >
                    {clinicianClients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-medium text-[#57534E] flex items-center gap-2.5">
                  <span>Worksheet</span>
                  <select
                    value={activeAssignment?.id || ''}
                    onChange={(e) => setSelectedAssignmentId(e.target.value)}
                    className="px-3 py-2 text-sm font-medium bg-white border border-[#E6E2DA] rounded-lg text-[#151B2E]"
                  >
                    {clientAssignments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title} ({getStatusDisplay(a.status).label})
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {activeAssignment && (
                <div className="bg-white border border-[#E6E2DA] rounded-2xl overflow-hidden">
                  <div className="p-6 sm:p-8 bg-[#FAF9F6] border-b border-[#E6E2DA]">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs text-[#57534E]">
                          In-Session Shared Walkthrough · {activeAssignment.modality} · ~
                          {activeAssignment.estimatedMinutes} min
                        </p>
                        <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-[#151B2E]">
                          {activeAssignment.title}
                        </h2>
                      </div>
                      {(() => {
                        const statusMeta = getStatusDisplay(
                          activeAssignment.status
                        );
                        const StatusIcon = statusMeta.Icon;
                        return (
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusMeta.colorClass}`}
                          >
                            <StatusIcon
                              className="w-4 h-4"
                              aria-hidden="true"
                            />
                            <span>{statusMeta.label}</span>
                          </span>
                        );
                      })()}
                    </div>

                    {activeAssignment.walkthroughNotes && (
                      <p className="mt-4 text-sm leading-relaxed text-[#151B2E] bg-white border border-[#E6E2DA] rounded-xl p-4">
                        {activeAssignment.walkthroughNotes}
                      </p>
                    )}
                  </div>

                  <div className="p-6 sm:p-8 space-y-4">
                    {activeAssignment.tasks.map((task, idx) => {
                      const isEditing = editingWalkthroughTaskId === task.id;
                      return (
                        <div
                          key={task.id}
                          className="p-5 rounded-xl border border-[#E6E2DA] bg-white"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1 flex-1 min-w-0">
                              <span className="font-mono text-xs font-medium text-[#0F766E] tabular-nums">
                                Step 0{idx + 1} · {task.frequency}
                              </span>

                              {isEditing ? (
                                <div className="mt-2 space-y-2">
                                  <input
                                    type="text"
                                    defaultValue={task.title}
                                    onBlur={(e) =>
                                      handleInlineTaskSave(
                                        activeAssignment,
                                        task.id,
                                        'title',
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-1.5 text-sm font-semibold border border-[#E6E2DA] rounded-lg"
                                  />
                                  <textarea
                                    rows={2}
                                    defaultValue={task.instruction}
                                    onBlur={(e) =>
                                      handleInlineTaskSave(
                                        activeAssignment,
                                        task.id,
                                        'instruction',
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-1.5 text-sm border border-[#E6E2DA] rounded-lg"
                                  />
                                  <input
                                    type="text"
                                    defaultValue={task.frequency}
                                    onBlur={(e) =>
                                      handleInlineTaskSave(
                                        activeAssignment,
                                        task.id,
                                        'frequency',
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-1.5 text-xs border border-[#E6E2DA] rounded-lg"
                                  />
                                </div>
                              ) : (
                                <>
                                  <h3 className="font-display text-base font-semibold text-[#151B2E]">
                                    {task.title}
                                  </h3>
                                  <p className="text-sm leading-relaxed text-[#44403C]">
                                    {task.instruction}
                                  </p>
                                </>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setEditingWalkthroughTaskId(
                                  isEditing ? null : task.id
                                )
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#0F766E] bg-[#F0FDFA] border border-[#0F766E]/30 rounded-lg whitespace-nowrap shrink-0"
                            >
                              <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>{isEditing ? 'Done' : 'Co-edit'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="px-6 py-5 sm:px-8 bg-[#151B2E] text-white flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="text-xs text-[#CBD5E1]">
                        PIN:{' '}
                        <span className="font-mono text-white tabular-nums">
                          {selectedClient.accessPin}
                        </span>
                      </p>
                      <p className="font-mono text-sm text-[#F7D9E3]">
                        ?clientLink={activeAssignment.uniqueToken}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          handleSendPracticeBlockInvite(activeAssignment)
                        }
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-[#2045C8] hover:bg-[#3158E3] text-white rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        <CalendarPlus className="w-4 h-4" aria-hidden="true" />
                        <span>
                          {activeAssignment.status === 'pushed' ||
                          activeAssignment.status === 'completed'
                            ? 'Open Calendar Invite'
                            : 'Calendar "Practice Block" Invite'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          downloadPracticeBlockIcs({
                            assignment: activeAssignment,
                            schedule:
                              activeAssignment.practiceSchedule ||
                              practiceSchedule,
                            client: selectedClient,
                            clinician: selectedClinician,
                          });
                          onShowToast?.(
                            'Downloaded .ics Practice Block calendar invite'
                          );
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        <Download className="w-4 h-4" aria-hidden="true" />
                        <span>Add to Calendar (.ics)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onOpenClientLink(activeAssignment.uniqueToken)
                        }
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-[#15803D] hover:bg-[#166534] text-white rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        <span>Open Client View</span>
                        <ExternalLink className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 3: SENT TO CLIENT PAGE */}
      {activeSubTab === 'sent' && (
        <div className="space-y-6">
          {!sentDisplayAssignment ? (
            <div className="bg-white border border-[#E6E2DA] rounded-2xl p-10 text-center">
              <h2 className="font-display text-xl font-bold text-[#151B2E]">
                Sent to Client
              </h2>
              <p className="mt-2 text-sm text-[#57534E]">
                No worksheets have been pushed by {selectedClinician.name} yet.
              </p>
              <button
                type="button"
                onClick={() => onChangeSubTab('generator')}
                className="mt-5 px-4 py-2 text-sm font-medium text-white bg-[#8B2952] rounded-lg"
              >
                Go to Homework Generator
              </button>
            </div>
          ) : (
            <>
              <section className="bg-white border border-[#E6E2DA] rounded-2xl overflow-hidden">
                <div className="p-6 sm:p-8 bg-[#FAF9F6] border-b border-[#E6E2DA] flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-medium text-[#15803D]">
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      <span>
                        Sent by {selectedClinician.name} to{' '}
                        {sentDisplayClient?.name}
                      </span>
                    </div>
                    <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#151B2E]">
                      Sent to Client
                    </h2>
                    <p className="mt-1.5 text-sm text-[#57534E]">
                      &ldquo;{sentDisplayAssignment.title}&rdquo; is active for{' '}
                      {sentDisplayClient?.preferredName}.
                    </p>
                  </div>

                  {sentDisplayAssignment.pushedAt && (
                    <span className="text-xs font-mono text-[#57534E] tabular-nums">
                      Pushed{' '}
                      {new Date(sentDisplayAssignment.pushedAt).toLocaleString(
                        'en-SG',
                        {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )}
                    </span>
                  )}
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E6E2DA]">
                      <p className="text-xs text-[#57534E]">Recipient</p>
                      <p className="mt-1 font-display text-sm font-semibold text-[#151B2E]">
                        {sentDisplayClient?.name}
                      </p>
                      <p className="mt-0.5 text-xs text-[#57534E]">
                        {sentDisplayAssignment.modality} ·{' '}
                        {sentDisplayAssignment.tasks.length} exercises
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E6E2DA]">
                      <p className="text-xs text-[#57534E]">
                        Scheduled Practice Block
                      </p>
                      <p className="mt-1 font-display text-sm font-semibold text-[#2045C8]">
                        {formatScheduleLabel(
                          sentDisplayAssignment.practiceSchedule ||
                            getDefaultPracticeSchedule(
                              sentDisplayAssignment.estimatedMinutes
                            )
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-[#57534E]">
                        Includes private worksheet link &amp; reminder alert
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E6E2DA]">
                      <p className="text-xs text-[#57534E]">
                        Client Passcode &amp; Link
                      </p>
                      <p className="mt-1 font-mono text-sm font-semibold text-[#151B2E] tabular-nums">
                        PIN {sentDisplayClient?.accessPin} ·{' '}
                        <span className="text-[#2045C8] font-normal">
                          ?clientLink={sentDisplayAssignment.uniqueToken}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-[#57534E]">
                        Next session: {sentDisplayClient?.nextSessionDate}
                      </p>
                    </div>
                  </div>

                  {/* Calendar Practice Block Invite Actions */}
                  <div className="p-4 sm:p-5 rounded-xl bg-[#EEF2FF]/60 border border-[#2045C8]/20 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="font-display text-sm font-semibold text-[#151B2E]">
                        Send Calendar &ldquo;Practice Block&rdquo; Invite
                      </p>
                      <p className="text-xs text-[#57534E]">
                        Share a calendar reminder block with the worksheet link
                        and exercises embedded so {sentDisplayClient?.preferredName}{' '}
                        doesn&rsquo;t forget between sessions.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          downloadPracticeBlockIcs({
                            assignment: sentDisplayAssignment,
                            schedule: sentDisplayAssignment.practiceSchedule,
                            client: sentDisplayClient,
                            clinician: selectedClinician,
                          });
                          onShowToast?.(
                            'Downloaded .ics Practice Block calendar invite'
                          );
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#2045C8] hover:bg-[#1938A8] rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Download className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Add to Calendar (.ics)</span>
                      </button>

                      <a
                        href={buildGoogleCalendarUrl({
                          assignment: sentDisplayAssignment,
                          schedule: sentDisplayAssignment.practiceSchedule,
                          client: sentDisplayClient,
                          clinician: selectedClinician,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#151B2E] bg-white hover:bg-[#FAF9F6] border border-[#E6E2DA] rounded-lg transition-colors whitespace-nowrap"
                      >
                        <CalendarPlus
                          className="w-3.5 h-3.5 text-[#2045C8]"
                          aria-hidden="true"
                        />
                        <span>Google Calendar</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          const text = buildInviteMessageText({
                            assignment: sentDisplayAssignment,
                            schedule: sentDisplayAssignment.practiceSchedule,
                            client: sentDisplayClient,
                            clinician: selectedClinician,
                          });
                          navigator.clipboard?.writeText(text).catch(() => {});
                          setCopiedInviteId(sentDisplayAssignment.id);
                          setTimeout(() => setCopiedInviteId(null), 2200);
                          onShowToast?.('Copied Practice Block invite message');
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#2045C8] bg-white hover:bg-[#F3F1EC] border border-[#2045C8]/25 rounded-lg transition-colors whitespace-nowrap"
                      >
                        {copiedInviteId === sentDisplayAssignment.id ? (
                          <>
                            <Check
                              className="w-3.5 h-3.5 text-[#15803D]"
                              aria-hidden="true"
                            />
                            <span>Invite Copied</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Copy Invite Text</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        handleClearFresh();
                        onChangeSubTab('generator');
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#92400E] border border-[#F59E0B]/40 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <RotateCcw className="w-4 h-4" aria-hidden="true" />
                      <span>Start Fresh Worksheet</span>
                    </button>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          onCopyLink(sentDisplayAssignment.uniqueToken);
                          setCopiedToken(sentDisplayAssignment.uniqueToken);
                          setTimeout(() => setCopiedToken(null), 2000);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#151B2E] bg-[#FAF9F6] hover:bg-[#F3F1EC] border border-[#E6E2DA] rounded-lg transition-colors whitespace-nowrap"
                      >
                        {copiedToken === sentDisplayAssignment.uniqueToken ? (
                          <>
                            <Check
                              className="w-4 h-4 text-[#15803D]"
                              aria-hidden="true"
                            />
                            <span>Link Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" aria-hidden="true" />
                            <span>Copy Bare Link</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onOpenClientLink(sentDisplayAssignment.uniqueToken)
                        }
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors whitespace-nowrap"
                      >
                        <span>Open Client Portal</span>
                        <ExternalLink className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="bg-white border border-[#E6E2DA] rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-[#E6E2DA] flex items-center justify-between">
                  <h3 className="font-display text-base font-semibold text-[#151B2E]">
                    Sent by {selectedClinician.name}
                  </h3>
                  <span className="font-mono text-xs text-[#57534E] tabular-nums">
                    {clinicianSentAssignments.length} sent
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E6E2DA] bg-[#FAF9F6] text-xs font-medium text-[#57534E]">
                        <th className="py-3 px-5">Client</th>
                        <th className="py-3 px-4">Worksheet</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Tasks</th>
                        <th className="py-3 px-5 text-right">Weblink</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6E2DA] text-sm">
                      {clinicianSentAssignments.map((asg) => {
                        const recipient = clients.find(
                          (c) => c.id === asg.clientId
                        );
                        const completed = asg.tasks.filter(
                          (t) => t.completed
                        ).length;
                        const statusMeta = getStatusDisplay(asg.status);
                        const StatusIcon = statusMeta.Icon;

                        return (
                          <tr
                            key={asg.id}
                            onClick={() => setLastSentAssignmentId(asg.id)}
                            className={`cursor-pointer transition-colors ${
                              sentDisplayAssignment.id === asg.id
                                ? 'bg-[#F3F1EC]/70'
                                : 'hover:bg-[#FAF9F6]'
                            }`}
                          >
                            <td className="py-3.5 px-5 font-medium text-[#151B2E]">
                              {recipient?.name}
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="text-[#151B2E] font-medium">
                                {asg.title}
                              </p>
                              <p className="text-xs text-[#57534E] font-mono">
                                {asg.modality} · {asg.uniqueToken}
                              </p>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusMeta.colorClass}`}
                              >
                                <StatusIcon
                                  className="w-3.5 h-3.5"
                                  aria-hidden="true"
                                />
                                <span>{statusMeta.label}</span>
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono text-xs tabular-nums">
                              {completed}/{asg.tasks.length}
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenClientLink(asg.uniqueToken);
                                }}
                                className="text-xs font-medium text-[#2045C8] hover:underline whitespace-nowrap"
                              >
                                Open Link
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      )}

      {/* TAB 4: PROGRESS & SUBMISSIONS */}
      {activeSubTab === 'progress' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="text-xs font-medium text-[#57534E] flex items-center gap-2.5">
              <span>Viewing Progress for</span>
              <select
                value={selectedClient.id}
                onChange={(e) => handleImportClientDetails(e.target.value)}
                className="px-3 py-2 text-sm font-medium bg-white border border-[#E6E2DA] rounded-lg text-[#151B2E]"
              >
                {clinicianClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.modality})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <section className="bg-white border border-[#E6E2DA] rounded-2xl p-6">
            <h2 className="font-display text-base font-semibold text-[#151B2E] mb-1">
              Between-Session Progress: {selectedClient.name}
            </h2>
            <p className="text-xs text-[#57534E] mb-5">
              Weekly task completion rate paired with client-reported steadiness.
            </p>
            <ProgressTrendChart points={selectedClient.weeklyProgress} />
          </section>

          <section className="bg-white border border-[#E6E2DA] rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-[#E6E2DA]">
              <h2 className="font-display text-base font-semibold text-[#151B2E]">
                Worksheet Log &amp; Reflections
              </h2>
            </div>

            {clientAssignments.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#57534E]">
                No homework assignments recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E6E2DA] bg-[#FAF9F6] text-xs font-medium text-[#57534E]">
                      <th className="py-3 px-5">Worksheet</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Tasks</th>
                      <th className="py-3 px-4 text-right">Steadiness</th>
                      <th className="py-3 px-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E2DA] text-sm">
                    {clientAssignments.map((asg) => {
                      const completed = asg.tasks.filter(
                        (t) => t.completed
                      ).length;
                      const statusMeta = getStatusDisplay(asg.status);
                      const StatusIcon = statusMeta.Icon;
                      const isSelected = activeAssignment?.id === asg.id;

                      return (
                        <tr
                          key={asg.id}
                          onClick={() => setSelectedAssignmentId(asg.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#F3F1EC]/70' : 'hover:bg-[#FAF9F6]'
                          }`}
                        >
                          <td className="py-3.5 px-5">
                            <p className="font-medium text-[#151B2E]">
                              {asg.title}
                            </p>
                            <p className="text-xs text-[#57534E] font-mono">
                              {asg.modality} · {asg.uniqueToken}
                            </p>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusMeta.colorClass}`}
                            >
                              <StatusIcon
                                className="w-3.5 h-3.5"
                                aria-hidden="true"
                              />
                              <span>{statusMeta.label}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-xs tabular-nums text-[#151B2E]">
                            {completed}/{asg.tasks.length}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-xs tabular-nums text-[#151B2E]">
                            {asg.moodRating ? `${asg.moodRating}/5` : '—'}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenClientLink(asg.uniqueToken);
                              }}
                              className="text-xs font-medium text-[#2045C8] hover:underline whitespace-nowrap"
                            >
                              View Link
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {activeAssignment && (
              <div className="p-6 bg-[#FAF9F6] border-t border-[#E6E2DA] space-y-4">
                <h3 className="font-display text-sm font-semibold text-[#151B2E]">
                  Client Responses: {activeAssignment.title}
                </h3>

                <div className="space-y-3">
                  {activeAssignment.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-xl bg-white border border-[#E6E2DA]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-[#151B2E]">
                          {task.title}
                        </span>
                        <span
                          className={`text-xs font-medium ${
                            task.completed ? 'text-[#15803D]' : 'text-[#78716C]'
                          }`}
                        >
                          {task.completed ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-[#57534E]">
                        {task.reflectionResponse || 'No reflection note entered yet.'}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <input
                    id="clinician-feedback-input"
                    type="text"
                    value={feedbackDraft}
                    onChange={(e) => setFeedbackDraft(e.target.value)}
                    placeholder="Add brief encouraging note for client..."
                    className="flex-1 px-3.5 py-2 text-sm bg-white border border-[#E6E2DA] rounded-lg text-[#151B2E] focus:outline-none focus:ring-2 focus:ring-[#2045C8]"
                  />
                  <button
                    type="button"
                    disabled={savingFeedback || !feedbackDraft.trim()}
                    onClick={() => handleSaveFeedback(activeAssignment.id)}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#2045C8] hover:bg-[#1938A8] disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    {feedbackSavedId === activeAssignment.id
                      ? 'Feedback Saved'
                      : 'Send Note to Client'}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
