import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Check, Copy, FileText, Search, X } from 'lucide-react';
import { ResilientImage } from './ResilientImage';
import type { ResourceItem, TherapyModality } from '../types/care';

interface ResourcesLibraryProps {
  resources: ResourceItem[];
  onUseTemplate: (resource: ResourceItem) => void;
}

const MODALITIES: Array<'All' | TherapyModality> = [
  'All',
  'CBT',
  'ACT',
  'DBT',
  'Somatic',
  'CBT-I',
];

export function ResourcesLibrary({
  resources,
  onUseTemplate,
}: ResourcesLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<'all' | 'template' | 'education'>('all');
  const [modalityFilter, setModalityFilter] = useState<'All' | TherapyModality>('All');
  const [activeReader, setActiveReader] = useState<ResourceItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return resources.filter((item) => {
      if (kindFilter !== 'all' && item.kind !== kindFilter) return false;
      if (modalityFilter !== 'All' && item.modality !== modalityFilter) return false;
      if (q) {
        const hay = `${item.title} ${item.summary} ${item.modality} ${item.audience}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [resources, searchQuery, kindFilter, modalityFilter]);

  const templates = filtered.filter((r) => r.kind === 'template');
  const guides = filtered.filter((r) => r.kind === 'education');

  const handleCopySummary = (item: ResourceItem) => {
    const text = `${item.title}\n\n${item.sections
      .map((s) => `${s.heading}: ${s.body}`)
      .join('\n\n')}`;
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="max-w-[1360px] mx-auto px-6 py-10 space-y-10">
      {/* Header & Filter Controls */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#E6E2DA]">
        <div>
          <p className="text-xs font-medium text-[#B83B67]">
            Clinical Library · Singapore Practice Standards
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#151B2E] text-balance">
            Resources &amp; Therapy Templates
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#57534E] max-w-2xl">
            Browse evidence-based psychoeducation handouts to share with clients
            or load structured homework templates directly into the Generator.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search
              className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates or guides..."
              aria-label="Search resources"
              className="pl-9 pr-3 py-2 text-sm bg-white border border-[#E6E2DA] rounded-lg text-[#151B2E] w-64 focus:outline-none focus:ring-2 focus:ring-[#2045C8]"
            />
          </div>
        </div>
      </section>

      {/* Interactive Filter Bars */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div
          role="group"
          aria-label="Filter by resource type"
          className="inline-flex items-center p-1 bg-[#F3F1EC] border border-[#E6E2DA] rounded-lg"
        >
          {[
            { id: 'all' as const, label: 'All Resources' },
            { id: 'template' as const, label: 'Homework Templates' },
            { id: 'education' as const, label: 'Educational Guides' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setKindFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                kindFilter === tab.id
                  ? 'bg-white text-[#151B2E] shadow-xs'
                  : 'text-[#57534E] hover:text-[#151B2E]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div
          role="group"
          aria-label="Filter by therapy modality"
          className="flex flex-wrap items-center gap-1.5"
        >
          {MODALITIES.map((mod) => (
            <button
              key={mod}
              type="button"
              onClick={() => setModalityFilter(mod)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                modalityFilter === mod
                  ? 'bg-[#151B2E] text-white border-[#151B2E]'
                  : 'bg-white text-[#57534E] border-[#E6E2DA] hover:text-[#151B2E]'
              }`}
            >
              {mod}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="bg-white border border-[#E6E2DA] rounded-2xl p-12 text-center">
          <p className="text-sm text-[#57534E]">
            No templates or educational guides match your current filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setKindFilter('all');
              setModalityFilter('All');
            }}
            className="mt-4 px-4 py-2 text-xs font-medium text-[#2045C8] border border-[#E6E2DA] rounded-lg bg-[#FAF9F6]"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Section 1: Therapy Homework Templates */}
      {templates.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-[#151B2E]">
              Therapy Homework Templates
            </h2>
            <span className="text-xs font-mono text-[#57534E] tabular-nums">
              {templates.length} {templates.length === 1 ? 'template' : 'templates'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((tpl) => (
              <article
                key={tpl.id}
                className="bg-white border border-[#E6E2DA] rounded-2xl p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#57534E]">
                    <span>{tpl.modality}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">~{tpl.readMinutes} min</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {tpl.templateTasks?.length || 0} exercises
                    </span>
                  </div>

                  <h3 className="mt-2 font-display text-lg font-semibold text-[#151B2E]">
                    {tpl.title}
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-[#44403C]">
                    {tpl.summary}
                  </p>

                  {tpl.templateTasks && (
                    <ul className="mt-4 pt-4 border-t border-[#E6E2DA] space-y-1.5 text-xs text-[#57534E]">
                      {tpl.templateTasks.map((t, i) => (
                        <li key={i} className="truncate">
                          0{i + 1}. {t.title}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-[#E6E2DA] flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveReader(tpl)}
                    className="text-xs font-medium text-[#57534E] hover:text-[#151B2E] inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Preview Template</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUseTemplate(tpl)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#2045C8] hover:bg-[#1938A8] rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Use in Generator</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Section 2: Educational Content Library */}
      {guides.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-[#151B2E]">
              Educational Content &amp; Psychoeducation
            </h2>
            <span className="text-xs font-mono text-[#57534E] tabular-nums">
              {guides.length} {guides.length === 1 ? 'guide' : 'guides'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {guides.map((guide) => (
              <article
                key={guide.id}
                className="bg-white border border-[#E6E2DA] rounded-2xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[4/3] w-full overflow-hidden border-b border-[#E6E2DA] bg-[#F3F1EC]">
                    <ResilientImage
                      src={guide.imageUrl}
                      alt={guide.title}
                      className="w-full h-full object-cover"
                      fallbackTitle={guide.title}
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-xs text-[#57534E]">
                      <span>{guide.modality}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        {guide.readMinutes} min read
                      </span>
                    </div>
                    <h3 className="mt-2 font-display text-lg font-semibold text-[#151B2E]">
                      {guide.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#44403C]">
                      {guide.summary}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-3 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveReader(guide)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2045C8] hover:underline whitespace-nowrap"
                  >
                    <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Read Guide</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopySummary(guide)}
                    className="inline-flex items-center gap-1 text-xs text-[#57534E] hover:text-[#151B2E] whitespace-nowrap"
                  >
                    {copiedId === guide.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#15803D]" aria-hidden="true" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Copy Handout</span>
                      </>
                    )}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Clinical Reader Modal */}
      {activeReader && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="resource-modal-title"
          className="fixed inset-0 z-50 bg-[#151B2E]/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-[#E6E2DA] rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E6E2DA] flex items-center justify-between gap-4">
              <div className="text-xs text-[#57534E]">
                {activeReader.modality} · {activeReader.audience}
              </div>
              <button
                type="button"
                onClick={() => setActiveReader(null)}
                aria-label="Close reader"
                className="p-1.5 rounded-lg text-[#57534E] hover:text-[#151B2E] hover:bg-[#FAF9F6]"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              <div>
                <h2
                  id="resource-modal-title"
                  className="font-display text-2xl font-bold text-[#151B2E]"
                >
                  {activeReader.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#44403C]">
                  {activeReader.summary}
                </p>
              </div>

              <div className="space-y-5">
                {activeReader.sections.map((sec, idx) => (
                  <div
                    key={idx}
                    className="pt-4 border-t border-[#E6E2DA] space-y-1.5"
                  >
                    <h3 className="font-display text-sm font-semibold text-[#151B2E]">
                      {sec.heading}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#44403C]">
                      {sec.body}
                    </p>
                  </div>
                ))}
              </div>

              {activeReader.templateTasks && (
                <div className="pt-4 border-t border-[#E6E2DA] space-y-3">
                  <h3 className="font-display text-sm font-semibold text-[#151B2E]">
                    Included Exercises
                  </h3>
                  {activeReader.templateTasks.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E6E2DA]"
                    >
                      <p className="text-xs font-mono text-[#57534E]">
                        Step 0{idx + 1} · {t.frequency}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#151B2E]">
                        {t.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-[#44403C]">
                        {t.instruction}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-[#FAF9F6] border-t border-[#E6E2DA] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => handleCopySummary(activeReader)}
                className="px-4 py-2 text-xs font-medium text-[#151B2E] bg-white border border-[#E6E2DA] rounded-lg hover:bg-[#F3F1EC]"
              >
                {copiedId === activeReader.id ? 'Copied to Clipboard' : 'Copy Text'}
              </button>
              {activeReader.templateTasks && (
                <button
                  type="button"
                  onClick={() => {
                    const tpl = activeReader;
                    setActiveReader(null);
                    onUseTemplate(tpl);
                  }}
                  className="px-4 py-2 text-xs font-medium text-white bg-[#2045C8] hover:bg-[#1938A8] rounded-lg"
                >
                  Use in Generator
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
