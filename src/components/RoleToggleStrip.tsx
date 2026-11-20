import { Copy, Check, Stethoscope, User } from 'lucide-react';
import { useState } from 'react';
import type { ClientProfile, HomeworkAssignment, UserRole } from '../types/care';

interface RoleToggleStripProps {
  role: UserRole;
  onToggleRole: (nextRole: UserRole) => void;
  selectedClient?: ClientProfile;
  activeAssignment?: HomeworkAssignment;
  onCopyLink: (token: string) => void;
}

export function RoleToggleStrip({
  role,
  onToggleRole,
  selectedClient,
  activeAssignment,
  onCopyLink,
}: RoleToggleStripProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!activeAssignment) return;
    onCopyLink(activeAssignment.uniqueToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="bg-white border-b border-[#E6E2DA]">
      <div className="max-w-[1360px] mx-auto px-6 py-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Role Switcher Segmented Control */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-[#57534E] whitespace-nowrap">
            Workspace View
          </span>
          <div
            role="group"
            aria-label="Switch between Clinician and Client view"
            className="inline-flex items-center p-1 bg-[#F3F1EC] rounded-lg border border-[#E6E2DA]"
          >
            <button
              type="button"
              onClick={() => onToggleRole('clinician')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2045C8] ${
                role === 'clinician'
                  ? 'bg-white text-[#151B2E] shadow-xs'
                  : 'text-[#57534E] hover:text-[#151B2E]'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Clinician View</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleRole('client')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2045C8] ${
                role === 'client'
                  ? 'bg-white text-[#151B2E] shadow-xs'
                  : 'text-[#57534E] hover:text-[#151B2E]'
              }`}
            >
              <User className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Client View</span>
            </button>
          </div>
        </div>

        {/* Contextual Client / Weblink Metadata */}
        <div className="flex items-center gap-4 text-xs text-[#57534E] min-w-0">
          {selectedClient && (
            <div className="hidden sm:flex items-center gap-2 truncate">
              <span className="text-[#151B2E] font-medium">
                {selectedClient.name}
              </span>
              <span aria-hidden="true">·</span>
              <span>{selectedClient.modality}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                Session {selectedClient.sessionNumber}
              </span>
            </div>
          )}

          {activeAssignment && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#E6E2DA] bg-[#FAF9F6] hover:bg-[#F3F1EC] text-[#151B2E] font-mono text-xs transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2045C8]"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#16A34A]" aria-hidden="true" />
                  <span>Link copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#57534E]" aria-hidden="true" />
                  <span>?clientLink={activeAssignment.uniqueToken}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
