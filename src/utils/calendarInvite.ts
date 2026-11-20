import type {
  ClientProfile,
  ClinicianProfile,
  HomeworkAssignment,
  PracticeBlockSchedule,
} from '../types/care';

export function getTomorrowDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDefaultPracticeSchedule(
  durationMinutes = 10
): PracticeBlockSchedule {
  return {
    startDate: getTomorrowDateString(),
    time: '19:30',
    durationMinutes: Math.max(durationMinutes || 10, 5),
    repeat: '3x-week',
    reminderMinutes: 15,
  };
}

function parseStartAndEnd(schedule: PracticeBlockSchedule): {
  start: Date;
  end: Date;
} {
  const [y, m, d] = schedule.startDate.split('-').map(Number);
  const [hh, mm] = schedule.time.split(':').map(Number);

  const start = new Date(
    y || new Date().getFullYear(),
    (m ? m - 1 : new Date().getMonth()),
    d || new Date().getDate(),
    Number.isFinite(hh) ? hh : 19,
    Number.isFinite(mm) ? mm : 30,
    0
  );

  const end = new Date(
    start.getTime() + Math.max(schedule.durationMinutes || 10, 5) * 60_000
  );

  return { start, end };
}

function formatUtcIcsDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  return `${y}${m}${d}T${hh}${mm}${ss}Z`;
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function buildRrule(repeat: PracticeBlockSchedule['repeat']): string | null {
  if (repeat === 'daily') {
    return 'FREQ=DAILY;COUNT=5';
  }
  if (repeat === '3x-week') {
    return 'FREQ=WEEKLY;BYDAY=MO,WE,FR;COUNT=6';
  }
  return null;
}

export function getClientWorksheetUrl(token: string): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/?clientLink=${token}`;
  }
  return `/?clientLink=${token}`;
}

export function formatScheduleLabel(schedule: PracticeBlockSchedule): string {
  const { start } = parseStartAndEnd(schedule);
  const datePart = start.toLocaleDateString('en-SG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const timePart = start.toLocaleTimeString('en-SG', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const repeatLabel =
    schedule.repeat === 'daily'
      ? 'Daily (5 days)'
      : schedule.repeat === '3x-week'
        ? 'Mon / Wed / Fri (2 wks)'
        : 'Single block';
  return `${datePart} · ${timePart} (${schedule.durationMinutes} min) · ${repeatLabel}`;
}

export function buildEventDescription(
  assignment: HomeworkAssignment,
  client?: ClientProfile,
  clinician?: ClinicianProfile
): string {
  const worksheetUrl = getClientWorksheetUrl(assignment.uniqueToken);
  const lines: string[] = [
    `Between-Session Practice Block (${assignment.modality})`,
    '',
    `Open your private worksheet: ${worksheetUrl}`,
  ];

  if (client?.accessPin) {
    lines.push(`4-Digit Passcode PIN: ${client.accessPin}`);
  }

  if (assignment.walkthroughNotes) {
    lines.push('', `Note from ${clinician?.name || 'your clinician'}:`, assignment.walkthroughNotes);
  }

  if (assignment.tasks.length > 0) {
    lines.push('', 'Exercises for this block:');
    assignment.tasks.forEach((task, idx) => {
      lines.push(`${idx + 1}. ${task.title} (${task.frequency})`);
      if (task.instruction) {
        lines.push(`   ${task.instruction}`);
      }
    });
  }

  lines.push('', 'Shared via Heidi Care — Between-Session Therapy Continuity');
  return lines.join('\n');
}

export function buildPracticeBlockIcs(params: {
  assignment: HomeworkAssignment;
  schedule?: PracticeBlockSchedule;
  client?: ClientProfile;
  clinician?: ClinicianProfile;
}): string {
  const { assignment, client, clinician } = params;
  const schedule =
    params.schedule ||
    assignment.practiceSchedule ||
    getDefaultPracticeSchedule(assignment.estimatedMinutes);

  const { start, end } = parseStartAndEnd(schedule);
  const dtStamp = formatUtcIcsDate(new Date());
  const dtStart = formatUtcIcsDate(start);
  const dtEnd = formatUtcIcsDate(end);
  const uid = `${assignment.uniqueToken}-${assignment.id}@heidicare.app`;
  const summary = `Practice Block: ${assignment.title} (${assignment.modality})`;
  const description = buildEventDescription(assignment, client, clinician);
  const worksheetUrl = getClientWorksheetUrl(assignment.uniqueToken);
  const rrule = buildRrule(schedule.repeat);
  const reminder = Math.max(schedule.reminderMinutes || 15, 0);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Heidi Care//Practice Block Invite//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(worksheetUrl)}`,
    `URL:${worksheetUrl}`,
    ...(rrule ? [`RRULE:${rrule}`] : []),
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeIcsText(`Gentle reminder: ${assignment.title}`)}`,
    `TRIGGER:-PT${reminder}M`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.join('\r\n');
}

export function downloadPracticeBlockIcs(params: {
  assignment: HomeworkAssignment;
  schedule?: PracticeBlockSchedule;
  client?: ClientProfile;
  clinician?: ClinicianProfile;
}): void {
  const icsContent = buildPracticeBlockIcs(params);
  const blob = new Blob([icsContent], {
    type: 'text/calendar;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const slug = params.assignment.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'practice-block';

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${slug}-practice-block.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function buildGoogleCalendarUrl(params: {
  assignment: HomeworkAssignment;
  schedule?: PracticeBlockSchedule;
  client?: ClientProfile;
  clinician?: ClinicianProfile;
}): string {
  const { assignment, client, clinician } = params;
  const schedule =
    params.schedule ||
    assignment.practiceSchedule ||
    getDefaultPracticeSchedule(assignment.estimatedMinutes);

  const { start, end } = parseStartAndEnd(schedule);
  const dates = `${formatUtcIcsDate(start)}/${formatUtcIcsDate(end)}`;
  const text = `Practice Block: ${assignment.title} (${assignment.modality})`;
  const details = buildEventDescription(assignment, client, clinician);
  const location = getClientWorksheetUrl(assignment.uniqueToken);
  const rrule = buildRrule(schedule.repeat);

  const search = new URLSearchParams({
    action: 'TEMPLATE',
    text,
    dates,
    details,
    location,
  });

  if (rrule) {
    search.set('recur', `RRULE:${rrule}`);
  }

  return `https://calendar.google.com/calendar/render?${search.toString()}`;
}

export function buildInviteMessageText(params: {
  assignment: HomeworkAssignment;
  schedule?: PracticeBlockSchedule;
  client?: ClientProfile;
  clinician?: ClinicianProfile;
}): string {
  const { assignment, client, clinician } = params;
  const schedule =
    params.schedule ||
    assignment.practiceSchedule ||
    getDefaultPracticeSchedule(assignment.estimatedMinutes);
  const worksheetUrl = getClientWorksheetUrl(assignment.uniqueToken);

  return [
    `Hi ${client?.preferredName || 'there'}, here is your scheduled Practice Block for "${assignment.title}" (${assignment.modality}):`,
    `• Practice Block: ${formatScheduleLabel(schedule)}`,
    `• Private Worksheet: ${worksheetUrl}`,
    client?.accessPin ? `• 4-Digit PIN: ${client.accessPin}` : '',
    '',
    clinician?.name ? `Warmly,\n${clinician.name}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
