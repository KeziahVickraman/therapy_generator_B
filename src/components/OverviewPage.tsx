import { ArrowRight, BookOpen, CheckCircle2, Lock, Send, ShieldCheck } from 'lucide-react';
import { ResilientImage } from './ResilientImage';
import type { ActiveTab, ClientProfile, ClinicianProfile, HomeworkAssignment } from '../types/care';

interface OverviewPageProps {
  clinician: ClinicianProfile;
  clients: ClientProfile[];
  assignments: HomeworkAssignment[];
  onNavigate: (tab: ActiveTab) => void;
  onStartNewWorksheet: () => void;
  onOpenSampleClientLink: (token: string) => void;
}

export function OverviewPage({
  clinician,
  clients,
  assignments,
  onNavigate,
  onStartNewWorksheet,
  onOpenSampleClientLink,
}: OverviewPageProps) {
  const pushedOrCompleted = assignments.filter(
    (a) => a.status === 'pushed' || a.status === 'completed'
  );
  const completedTasks = assignments.reduce(
    (acc, a) => acc + a.tasks.filter((t) => t.completed).length,
    0
  );
  const totalTasks = assignments.reduce((acc, a) => acc + a.tasks.length, 0);
  const adherenceRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const featuredAssignment =
    assignments.find((a) => a.status === 'pushed') || assignments[0];

  return (
    <div className="bg-[#FAF9F6]">
      {/* Hero Split — Heidi Health SG calm, unhurried clinical aesthetic */}
      <section className="max-w-[1360px] mx-auto px-6 pt-10 pb-12 lg:pt-14 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          {/* Left Narrative Column */}
          <div className="lg:col-span-6 flex flex-col justify-between py-2">
            <div>
              <p className="text-xs font-medium tracking-wide text-[#B83B67] mb-4">
                Between-Session Care · Singapore Clinical Practice
              </p>

              <h1 className="font-display text-[clamp(2.25rem,4vw,3.5rem)] font-bold leading-[1.08] tracking-tight text-[#151B2E] text-balance max-w-xl">
                Putting care back between sessions.
              </h1>

              <p className="mt-5 text-base sm:text-lg leading-relaxed text-[#44403C] max-w-xl">
                Generate tailored CBT, ACT, and somatic homework worksheets in
                seconds, walk through them together before your client leaves
                the room, and send a Calendar &ldquo;Practice Block&rdquo; invite
                with their private link built in.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onStartNewWorksheet}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-[#2045C8] hover:bg-[#1938A8] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2045C8] focus-visible:ring-offset-2"
                >
                  <span>Open Homework Generator</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (featuredAssignment) {
                      onOpenSampleClientLink(featuredAssignment.uniqueToken);
                    } else {
                      onNavigate('client');
                    }
                  }}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-[#151B2E] bg-white hover:bg-[#F3F1EC] border border-[#E6E2DA] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2045C8]"
                >
                  <span>Preview Client Link</span>
                </button>
              </div>
            </div>

            {/* Quiet Trust Row */}
            <div className="mt-10 pt-6 border-t border-[#E6E2DA] flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#57534E]">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#2045C8]" aria-hidden="true" />
                <span>PDPA-aligned private weblinks</span>
              </span>
              <span aria-hidden="true">·</span>
              <span>Zero client app downloads</span>
              <span aria-hidden="true">·</span>
              <span>Built for Singapore clinicians</span>
            </div>
          </div>

          {/* Right Editorial Consultation Room Column */}
          <div className="lg:col-span-6 relative">
            <div className="relative h-full min-h-[340px] lg:min-h-[440px] rounded-2xl overflow-hidden border border-[#E6E2DA] bg-[#F3F1EC]">
              <ResilientImage
                src="/src/assets/images/hero_clinical_calm_1795158012697.jpg"
                alt="Calm modern therapy consultation room with natural daylight and oak chairs"
                className="w-full h-full object-cover"
                fallbackTitle="Clinical Consultation Room"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#151B2E]/75 via-[#151B2E]/15 to-transparent"
              />
              <div className="absolute bottom-5 left-5 right-5 bg-white/95 backdrop-blur-sm border border-[#E6E2DA] rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <ResilientImage
                    src={clinician.avatarUrl}
                    alt={clinician.name}
                    className="w-10 h-10 rounded-full object-cover border border-[#E6E2DA] shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#151B2E] truncate">
                      {clinician.name}
                    </p>
                    <p className="text-xs text-[#57534E] truncate">
                      {clinician.practiceName} · {clinician.city}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-5 text-right shrink-0">
                  <div>
                    <p className="text-[11px] text-[#57534E]">Active Links</p>
                    <p className="font-mono text-base font-medium text-[#151B2E] tabular-nums">
                      {pushedOrCompleted.length}
                    </p>
                  </div>
                  <div className="h-7 w-px bg-[#E6E2DA]" aria-hidden="true" />
                  <div>
                    <p className="text-[11px] text-[#57534E]">Task Adherence</p>
                    <p className="font-mono text-base font-medium text-[#151B2E] tabular-nums">
                      {adherenceRate}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Capability Strip */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[#E6E2DA] rounded-2xl bg-white divide-y sm:divide-y-0 sm:divide-x divide-[#E6E2DA]">
          <div className="p-6">
            <p className="font-display text-sm font-semibold text-[#151B2E]">
              01. Generate & Tailor
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#57534E]">
              Turn brief session notes into structured CBT, ACT, DBT, or somatic
              worksheets calibrated to each client.
            </p>
          </div>
          <div className="p-6">
            <p className="font-display text-sm font-semibold text-[#151B2E]">
              02. Live Walkthrough
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#57534E]">
              Switch into clean shared-screen walkthrough mode during the final
              ten minutes to co-adjust cadence.
            </p>
          </div>
          <div className="p-6">
            <p className="font-display text-sm font-semibold text-[#151B2E]">
              03. Calendar Practice Block
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#57534E]">
              Send a scheduled calendar invite with reminders and the private
              worksheet link embedded so clients never forget mid-week.
            </p>
          </div>
          <div className="p-6">
            <p className="font-display text-sm font-semibold text-[#151B2E]">
              04. Track Continuity
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#57534E]">
              Review completed tasks, mood check-ins, and written reflections
              before your next appointment.
            </p>
          </div>
        </div>
      </section>

      {/* Mechanism-to-Outcome & Resources Highlight */}
      <section className="border-t border-[#E6E2DA] bg-white py-14">
        <div className="max-w-[1360px] mx-auto px-6">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#151B2E] text-balance">
                Designed around how therapy actually feels
              </h2>
              <p className="mt-2 text-sm sm:text-base text-[#57534E] max-w-2xl">
                Clients rarely abandon homework because they lack motivation —
                they stall when instructions feel clinical or hard to revisit on
                a Wednesday evening.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('resources')}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#2045C8] hover:underline whitespace-nowrap shrink-0"
            >
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              <span>Browse Resources Library</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Dark Navy Contrast Spotlight — Heidi signature dark contrast block */}
            <div className="lg:col-span-7 bg-[#151B2E] text-[#FAF9F6] rounded-2xl p-8 flex flex-col justify-between">
              <div>
                <p className="text-xs font-medium tracking-wide text-[#F7D9E3]">
                  Clinician Walkthrough Workflow
                </p>
                <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-white">
                  Co-create in session, schedule into their week
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#CBD5E1] max-w-lg">
                  Instead of emailing generic PDFs or bare links hours after a
                  session ends, clinicians walk through the exact exercises live
                  and send a Calendar &ldquo;Practice Block&rdquo; invite with a
                  gentle reminder and private worksheet link.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#F7D9E3]">
                    <Send className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Active Roster</span>
                  </div>
                  <p className="mt-1.5 font-mono text-2xl font-medium tabular-nums text-white">
                    {clients.length} clients
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#F7D9E3]">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Tasks Logged</span>
                  </div>
                  <p className="mt-1.5 font-mono text-2xl font-medium tabular-nums text-white">
                    {completedTasks}/{totalTasks}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#F7D9E3]">
                    <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Access Model</span>
                  </div>
                  <p className="mt-1.5 font-mono text-2xl font-medium text-white">
                    4-digit PIN
                  </p>
                </div>
              </div>
            </div>

            {/* Resources Preview Card */}
            <div className="lg:col-span-5 border border-[#E6E2DA] rounded-2xl bg-[#FAF9F6] overflow-hidden flex flex-col justify-between">
              <div className="aspect-[16/9] w-full overflow-hidden border-b border-[#E6E2DA]">
                <ResilientImage
                  src="/src/assets/images/resource_cbt_journal_1795158013089.jpg"
                  alt="Open linen-bound therapy reflection journal on travertine desk"
                  className="w-full h-full object-cover"
                  fallbackTitle="Clinical Homework Templates"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-xs text-[#57534E]">
                    Resources Tab · Templates & Psychoeducation
                  </p>
                  <h3 className="mt-2 font-display text-lg font-semibold text-[#151B2E]">
                    Ready-to-assign templates and client handouts
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#57534E]">
                    Load 5-Column Thought Records, Somatic Sigh protocols, or
                    ACT Values worksheets straight into the generator with one
                    click.
                  </p>
                </div>
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => onNavigate('resources')}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2045C8] hover:underline"
                  >
                    <span>Explore templates & guides</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
