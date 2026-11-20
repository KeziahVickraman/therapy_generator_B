import type { ActiveTab } from '../types/care';

interface TopBarProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  onStartNewWorksheet: () => void;
}

export function TopBar({
  activeTab,
  onNavigate,
  onStartNewWorksheet,
}: TopBarProps) {
  const navItems: Array<{ id: ActiveTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'clinician', label: 'Clinician' },
    { id: 'client', label: 'Client Portal' },
    { id: 'resources', label: 'Resources' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-sm border-b border-[#E6E2DA]">
      <div className="max-w-[1360px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('overview')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2045C8] rounded-md px-1 py-1"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect width="24" height="24" rx="7" fill="#151B2E" />
            <path
              d="M7 7.5V16.5M17 7.5V16.5M7 12C9.2 12 9.8 9.8 12 9.8C14.2 9.8 14.8 14.2 17 14.2"
              stroke="#FAF9F6"
              strokeWidth="1.9"
              strokeLinecap="round"
            />
          </svg>
          <span className="font-display text-lg font-bold tracking-tight text-[#151B2E]">
            Heidi Care
          </span>
        </button>

        {/* Zone 2: 4 Single-line Navigation Links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`relative py-1.5 text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2045C8] rounded-sm ${
                  isActive
                    ? 'text-[#151B2E]'
                    : 'text-[#57534E] hover:text-[#151B2E]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-[#2045C8] rounded-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onStartNewWorksheet}
            className="px-4 py-2 text-sm font-medium text-white bg-[#2045C8] hover:bg-[#1938A8] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2045C8] focus-visible:ring-offset-2"
          >
            Create Worksheet
          </button>
        </div>
      </div>

      {/* Compact mobile nav row below md */}
      <div className="md:hidden border-t border-[#E6E2DA] px-4 py-2 flex items-center gap-4 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`text-xs font-medium py-1 whitespace-nowrap shrink-0 ${
                isActive
                  ? 'text-[#2045C8] underline underline-offset-4'
                  : 'text-[#57534E]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
