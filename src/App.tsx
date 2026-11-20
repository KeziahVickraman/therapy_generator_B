import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { TopBar } from './components/TopBar';
import { RoleToggleStrip } from './components/RoleToggleStrip';
import { OverviewPage } from './components/OverviewPage';
import {
  ClinicianWorkspace,
  type ClinicianSubTab,
  type DraftTaskInput,
} from './components/ClinicianWorkspace';
import { ClientPortal } from './components/ClientPortal';
import { ResourcesLibrary } from './components/ResourcesLibrary';
import { createInitialWorkspace } from './data/mockWorkspace';
import { variant, track, consent, setConsent, loadClarity } from './pt';
import type {
  ActiveTab,
  HomeworkAssignment,
  HomeworkTask,
  PracticeBlockSchedule,
  ResourceItem,
  TherapyModality,
  UserRole,
  WorkspacePayload,
} from './types/care';

const STORAGE_KEY = 'heidi_care_workspace_v2';

function loadInitialWorkspace(): WorkspacePayload {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WorkspacePayload;
      if (
        parsed &&
        parsed.clinician &&
        Array.isArray(parsed.clinicians) &&
        parsed.clinicians.length > 0 &&
        Array.isArray(parsed.clients) &&
        parsed.clients.length > 0 &&
        Array.isArray(parsed.assignments) &&
        Array.isArray(parsed.resources)
      ) {
        return parsed;
      }
    }
  } catch {
    // Fall back to fresh mock data
  }
  return createInitialWorkspace();
}

function generateClientToken(clientName: string): string {
  const slug =
    clientName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .split('-')[0] || 'client';
  const rand = Math.random().toString(16).slice(2, 6);
  return `hc-${slug}-${rand}`;
}

export default function App() {
  const [workspace, setWorkspace] = useState<WorkspacePayload>(() =>
    loadInitialWorkspace()
  );

  const initialParams = new URLSearchParams(window.location.search);
  const initialUrlToken = initialParams.get('clientLink');
  const initialMatchedAsg = initialUrlToken
    ? workspace.assignments.find((a) => a.uniqueToken === initialUrlToken)
    : undefined;

  const initialMatchedClient = initialMatchedAsg
    ? workspace.clients.find((c) => c.id === initialMatchedAsg.clientId)
    : undefined;

  const [activeVariant] = useState(() => variant());
  const [consentChoice, setConsentChoice] = useState<'granted' | 'denied' | null>(
    () => consent()
  );
  const hasTrackedScreenView = useRef(false);

  const [activeTab, setActiveTab] = useState<ActiveTab>(
    initialMatchedAsg ? 'client' : 'clinician'
  );
  const [role, setRole] = useState<UserRole>(
    initialMatchedAsg ? 'client' : 'clinician'
  );
  const [selectedClinicianId, setSelectedClinicianId] = useState<string>(
    initialMatchedClient?.clinicianId ||
      workspace.clinicians[0]?.id ||
      workspace.clinician.id
  );
  const [selectedClientId, setSelectedClientId] = useState<string>(
    initialMatchedAsg?.clientId || workspace.clients[0]?.id || ''
  );
  const [clinicianSubTab, setClinicianSubTab] =
    useState<ClinicianSubTab>('generator');
  const [activeClientToken, setActiveClientToken] = useState<string>(
    initialMatchedAsg?.uniqueToken ||
      workspace.assignments.find((a) => a.status === 'pushed')?.uniqueToken ||
      workspace.assignments[0]?.uniqueToken ||
      ''
  );
  const [incomingTemplate, setIncomingTemplate] = useState<ResourceItem | null>(
    null
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2600);
  }, []);

  useEffect(() => {
    if (hasTrackedScreenView.current) return;
    hasTrackedScreenView.current = true;
    if (consent() === 'granted') {
      loadClarity();
    }
    track('screen_view');
  }, []);

  // Persist changes locally in the browser
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    } catch {
      // Ignore storage quota issues
    }
  }, [workspace]);

  const syncUrlClientToken = (token: string | null) => {
    try {
      const url = new URL(window.location.href);
      if (token) {
        url.searchParams.set('clientLink', token);
      } else {
        url.searchParams.delete('clientLink');
      }
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Ignore history errors in restricted frames
    }
  };

  const handleNavigate = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab === 'clinician') {
      setRole('clinician');
      syncUrlClientToken(null);
    } else if (tab === 'client') {
      setRole('client');
      if (activeClientToken) {
        syncUrlClientToken(activeClientToken);
      }
    } else {
      syncUrlClientToken(null);
    }
  };

  const handleToggleRole = (nextRole: UserRole) => {
    setRole(nextRole);
    if (nextRole === 'clinician') {
      setActiveTab('clinician');
      syncUrlClientToken(null);
    } else {
      const clientAsg =
        workspace.assignments.find(
          (a) => a.clientId === selectedClientId && a.status === 'pushed'
        ) ||
        workspace.assignments.find((a) => a.clientId === selectedClientId) ||
        workspace.assignments[0];
      if (clientAsg) {
        setActiveClientToken(clientAsg.uniqueToken);
        syncUrlClientToken(clientAsg.uniqueToken);
      }
      setActiveTab('client');
    }
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    const matched =
      workspace.assignments.find(
        (a) => a.clientId === clientId && a.status === 'pushed'
      ) || workspace.assignments.find((a) => a.clientId === clientId);
    if (matched) {
      setActiveClientToken(matched.uniqueToken);
    }
  };

  const handleCopyLink = (token: string) => {
    const shareUrl = `${window.location.origin}/?clientLink=${token}`;
    navigator.clipboard?.writeText(shareUrl).catch(() => {});
    if (role === 'clinician') {
      track('goal_complete');
    }
    showToast(`Copied private client link (?clientLink=${token})`);
  };

  const handleOpenClientLink = (token: string) => {
    const matched = workspace.assignments.find((a) => a.uniqueToken === token);
    if (matched) {
      setSelectedClientId(matched.clientId);
    }
    setActiveClientToken(token);
    setRole('client');
    setActiveTab('client');
    syncUrlClientToken(token);
  };

  const handleCreateAssignment = async (payload: {
    clientId: string;
    title: string;
    modality: TherapyModality;
    clinicalRationale: string;
    walkthroughNotes: string;
    estimatedMinutes: number;
    status: 'walkthrough' | 'pushed';
    practiceSchedule?: PracticeBlockSchedule;
    tasks: DraftTaskInput[];
  }): Promise<HomeworkAssignment> => {
    const client = workspace.clients.find((c) => c.id === payload.clientId);
    const now = new Date().toISOString();
    const id = `asg-${Math.random().toString(16).slice(2, 10)}`;
    const uniqueToken = generateClientToken(client?.name || 'client');

    const formattedTasks: HomeworkTask[] = payload.tasks.map((t, idx) => ({
      id: `task-${id}-${idx + 1}`,
      title: t.title,
      instruction: t.instruction,
      frequency: t.frequency || '3x this week',
      promptQuestion:
        t.promptQuestion || 'What did you notice while practicing this?',
      completed: false,
      reflectionResponse: '',
    }));

    const created: HomeworkAssignment = {
      id,
      clientId: payload.clientId,
      title: payload.title,
      modality: payload.modality,
      clinicalRationale: payload.clinicalRationale,
      walkthroughNotes: payload.walkthroughNotes,
      estimatedMinutes: payload.estimatedMinutes,
      status: payload.status,
      uniqueToken,
      createdAt: now,
      pushedAt: payload.status === 'pushed' ? now : undefined,
      practiceSchedule: payload.practiceSchedule,
      tasks: formattedTasks,
    };

    setWorkspace((prev) => ({
      ...prev,
      assignments: [created, ...prev.assignments],
    }));
    setActiveClientToken(created.uniqueToken);
    if (payload.status === 'pushed') {
      track('goal_complete');
    }
    showToast(
      payload.status === 'pushed'
        ? 'Therapy homework shared with client'
        : 'Worksheet saved for walkthrough'
    );

    return created;
  };

  const handleUpdateAssignment = async (
    assignmentId: string,
    updates: Partial<HomeworkAssignment>
  ): Promise<HomeworkAssignment> => {
    const now = new Date().toISOString();
    let updatedResult: HomeworkAssignment | undefined;

    setWorkspace((prev) => ({
      ...prev,
      assignments: prev.assignments.map((a) => {
        if (a.id !== assignmentId) return a;
        const nextStatus = updates.status ?? a.status;
        const nextPushedAt =
          nextStatus === 'pushed' && !a.pushedAt ? now : a.pushedAt;
        updatedResult = {
          ...a,
          ...updates,
          pushedAt: nextPushedAt,
        };
        return updatedResult;
      }),
    }));

    if (updates.status === 'pushed' && updatedResult) {
      track('goal_complete');
      showToast('Therapy homework shared with client');
    }

    return (
      updatedResult ||
      workspace.assignments.find((a) => a.id === assignmentId)!
    );
  };

  const handleToggleTask = async (
    assignmentId: string,
    taskId: string,
    completed?: boolean,
    reflectionResponse?: string
  ): Promise<HomeworkAssignment> => {
    const now = new Date().toISOString();
    let updatedResult: HomeworkAssignment | undefined;

    setWorkspace((prev) => ({
      ...prev,
      assignments: prev.assignments.map((a) => {
        if (a.id !== assignmentId) return a;
        const nextTasks = a.tasks.map((t) => {
          if (t.id !== taskId) return t;
          const nextCompleted =
            typeof completed === 'boolean' ? completed : t.completed;
          return {
            ...t,
            completed: nextCompleted,
            completedAt:
              typeof completed === 'boolean'
                ? completed
                  ? now
                  : undefined
                : t.completedAt,
            reflectionResponse:
              typeof reflectionResponse === 'string'
                ? reflectionResponse
                : t.reflectionResponse,
          };
        });
        updatedResult = { ...a, tasks: nextTasks };
        return updatedResult;
      }),
    }));

    return (
      updatedResult ||
      workspace.assignments.find((a) => a.id === assignmentId)!
    );
  };

  const handleSubmitAssignment = async (
    assignmentId: string,
    payload: {
      moodRating: number;
      difficultyRating: number;
      overallReflection: string;
    }
  ) => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-SG', {
      day: '2-digit',
      month: 'short',
    });

    setWorkspace((prev) => {
      const targetAsg = prev.assignments.find((a) => a.id === assignmentId);
      if (!targetAsg) return prev;

      const completedCount = targetAsg.tasks.filter((t) => t.completed).length;
      const total = Math.max(targetAsg.tasks.length, 1);
      const completionRate = Math.round((completedCount / total) * 100);

      const nextAssignments = prev.assignments.map((a) =>
        a.id === assignmentId
          ? {
              ...a,
              status: 'completed' as const,
              submittedAt: now.toISOString(),
              moodRating: payload.moodRating,
              difficultyRating: payload.difficultyRating,
              overallReflection: payload.overallReflection,
            }
          : a
      );

      const nextClients = prev.clients.map((c) => {
        if (c.id !== targetAsg.clientId) return c;
        const alreadySubmittedThisAsg = targetAsg.status === 'completed';
        if (alreadySubmittedThisAsg) {
          return c;
        }
        return {
          ...c,
          weeklyProgress: [
            ...c.weeklyProgress,
            {
              weekLabel: `Wk ${c.weeklyProgress.length + 1}`,
              completionRate,
              moodScore: payload.moodRating,
              submittedDate: formattedDate,
            },
          ],
        };
      });

      return {
        ...prev,
        assignments: nextAssignments,
        clients: nextClients,
      };
    });

    showToast('Homework submitted to your clinician');
  };

  const handleSaveClinicianReview = async (
    assignmentId: string,
    clinicianFeedback: string
  ): Promise<HomeworkAssignment> => {
    let updatedResult: HomeworkAssignment | undefined;

    setWorkspace((prev) => ({
      ...prev,
      assignments: prev.assignments.map((a) => {
        if (a.id !== assignmentId) return a;
        updatedResult = { ...a, clinicianFeedback };
        return updatedResult;
      }),
    }));

    showToast('Clinician note shared with client');

    return (
      updatedResult ||
      workspace.assignments.find((a) => a.id === assignmentId)!
    );
  };

  const handleUseTemplate = (resource: ResourceItem) => {
    setIncomingTemplate(resource);
    setRole('clinician');
    setClinicianSubTab('generator');
    setActiveTab('clinician');
    syncUrlClientToken(null);
    showToast(`Loaded "${resource.title}" into Generator`);
  };

  const handleSelectClinician = (clinicianId: string) => {
    setSelectedClinicianId(clinicianId);
    const firstClient =
      workspace.clients.find((c) => c.clinicianId === clinicianId) ||
      workspace.clients[0];
    if (firstClient) {
      setSelectedClientId(firstClient.id);
      const matchedAsg =
        workspace.assignments.find(
          (a) => a.clientId === firstClient.id && a.status === 'pushed'
        ) || workspace.assignments.find((a) => a.clientId === firstClient.id);
      if (matchedAsg) {
        setActiveClientToken(matchedAsg.uniqueToken);
      }
    }
  };

  const handleResetDemoData = () => {
    const fresh = createInitialWorkspace();
    setWorkspace(fresh);
    setSelectedClinicianId(fresh.clinicians[0]?.id || fresh.clinician.id);
    setSelectedClientId(fresh.clients[0]?.id || '');
    setActiveClientToken(fresh.assignments[0]?.uniqueToken || '');
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      // Ignore storage errors
    }
    showToast('Demo clinical data restored');
  };

  const selectedClinician =
    workspace.clinicians.find((c) => c.id === selectedClinicianId) ||
    workspace.clinician;
  const selectedClient =
    workspace.clients.find((c) => c.id === selectedClientId) ||
    workspace.clients[0];
  const activeAssignment =
    workspace.assignments.find((a) => a.uniqueToken === activeClientToken) ||
    workspace.assignments.find((a) => a.clientId === selectedClient?.id);
  const activeAssignmentClient = activeAssignment
    ? workspace.clients.find((c) => c.id === activeAssignment.clientId)
    : selectedClient;
  const activeAssignmentClinician =
    workspace.clinicians.find(
      (c) => c.id === activeAssignmentClient?.clinicianId
    ) || selectedClinician;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#151B2E]">
      <TopBar
        activeTab={activeTab}
        onNavigate={handleNavigate}
        onStartNewWorksheet={() => {
          setRole('clinician');
          setClinicianSubTab('generator');
          setActiveTab('clinician');
          syncUrlClientToken(null);
        }}
      />

      <RoleToggleStrip
        role={role}
        onToggleRole={handleToggleRole}
        selectedClient={selectedClient}
        activeAssignment={activeAssignment}
        onCopyLink={handleCopyLink}
      />

      <main className="flex-1">
        {activeTab === 'overview' && (
          <OverviewPage
            clinician={workspace.clinician}
            clients={workspace.clients}
            assignments={workspace.assignments}
            onNavigate={handleNavigate}
            onStartNewWorksheet={() => {
              setRole('clinician');
              setClinicianSubTab('generator');
              setActiveTab('clinician');
            }}
            onOpenSampleClientLink={handleOpenClientLink}
          />
        )}

        {activeTab === 'clinician' && (
          <ClinicianWorkspace
            variant={activeVariant}
            clinicians={workspace.clinicians}
            selectedClinicianId={selectedClinician.id}
            onSelectClinician={handleSelectClinician}
            clients={workspace.clients}
            assignments={workspace.assignments}
            selectedClientId={selectedClient?.id || ''}
            onSelectClient={handleSelectClient}
            activeSubTab={clinicianSubTab}
            onChangeSubTab={setClinicianSubTab}
            incomingTemplate={incomingTemplate}
            onClearIncomingTemplate={() => setIncomingTemplate(null)}
            onCreateAssignment={handleCreateAssignment}
            onUpdateAssignment={handleUpdateAssignment}
            onSaveClinicianReview={handleSaveClinicianReview}
            onOpenClientLink={handleOpenClientLink}
            onCopyLink={handleCopyLink}
            onShowToast={showToast}
            onTrackCtaClick={() => track('cta_click')}
            onTrackGoalComplete={() => track('goal_complete')}
          />
        )}

        {activeTab === 'client' && (
          <ClientPortal
            clinician={activeAssignmentClinician}
            clients={workspace.clients}
            assignments={workspace.assignments}
            activeToken={activeClientToken}
            onSelectToken={(token) => {
              setActiveClientToken(token);
              const matched = workspace.assignments.find(
                (a) => a.uniqueToken === token
              );
              if (matched) {
                setSelectedClientId(matched.clientId);
              }
              syncUrlClientToken(token);
            }}
            onToggleTask={handleToggleTask}
            onSubmitAssignment={handleSubmitAssignment}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'resources' && (
          <ResourcesLibrary
            resources={workspace.resources}
            onUseTemplate={handleUseTemplate}
          />
        )}
      </main>

      {/* Quiet Clinical Footer */}
      <footer className="border-t border-[#E6E2DA] bg-white">
        <div className="max-w-[1360px] mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-4 text-xs text-[#57534E]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-display font-semibold text-[#151B2E]">
              Heidi Care
            </span>
            <span aria-hidden="true">·</span>
            <span>Between-session therapy continuity · Singapore PDPA aligned</span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => handleNavigate('overview')}
              className="hover:text-[#151B2E]"
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('clinician')}
              className="hover:text-[#151B2E]"
            >
              Clinician
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('client')}
              className="hover:text-[#151B2E]"
            >
              Client Portal
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('resources')}
              className="hover:text-[#151B2E]"
            >
              Resources
            </button>
            <button
              type="button"
              onClick={handleResetDemoData}
              className="inline-flex items-center gap-1 text-[#78716C] hover:text-[#151B2E]"
            >
              <RotateCcw className="w-3 h-3" aria-hidden="true" />
              <span>Reset Demo Data</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Subtle Toast Confirmation */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed right-5 z-40 bg-[#151B2E] text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 ${
            consentChoice === null ? 'bottom-24' : 'bottom-5'
          }`}
        >
          <Check className="w-3.5 h-3.5 text-[#86EFAC]" aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Bottom Consent Notice */}
      {consentChoice === null && (
        <div
          role="region"
          aria-label="Study consent notice"
          className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-[#E6E2DA] shadow-lg"
        >
          <div className="max-w-[1360px] mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs sm:text-sm text-[#151B2E] max-w-3xl leading-relaxed">
              This class prototype records which version you saw and what you
              pressed, to test a design. Nothing about your visit leaves this
              browser unless you agree.
            </p>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setConsent('granted');
                  setConsentChoice('granted');
                }}
                className="px-4 py-2 text-xs font-medium text-[#151B2E] bg-[#F3F1EC] hover:bg-[#E6E2DA] border border-[#E6E2DA] rounded-lg transition-colors whitespace-nowrap"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => {
                  setConsent('denied');
                  setConsentChoice('denied');
                }}
                className="px-4 py-2 text-xs font-medium text-[#151B2E] bg-[#F3F1EC] hover:bg-[#E6E2DA] border border-[#E6E2DA] rounded-lg transition-colors whitespace-nowrap"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
