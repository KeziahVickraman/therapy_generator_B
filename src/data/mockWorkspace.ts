import type {
  ClientProfile,
  ClinicianProfile,
  HomeworkAssignment,
  ResourceItem,
  WorkspacePayload,
} from '../types/care';

export const SEED_CLINICIAN: ClinicianProfile = {
  id: 'clin-evelyn-lin',
  name: 'Dr. Evelyn Lin',
  credentials: 'DPsych (Clinical), SRP Registered Psychologist',
  practiceName: 'Harbor Mind Practice',
  city: 'Orchard Road, Singapore',
  avatarUrl: '/src/assets/images/avatar_dr_lin_1795158012005.jpg',
  specialtyFocus: 'CBT, Burnout & Somatic Regulation',
};

export const SEED_CLINICIANS: ClinicianProfile[] = [
  SEED_CLINICIAN,
  {
    id: 'clin-marcus-tan',
    name: 'Dr. Marcus Tan',
    credentials: 'PhD (Clinical Psychology), MSCP',
    practiceName: 'Harbor Mind Practice',
    city: 'Novena Medical Hub, Singapore',
    avatarUrl: '/src/assets/images/avatar_dr_lin_1795158012005.jpg',
    specialtyFocus: 'ACT, Life Transitions & Values Work',
  },
  {
    id: 'clin-ananya-rao',
    name: 'Dr. Ananya Rao',
    credentials: 'MClinPsych, Certified CBT-I & DBT Clinician',
    practiceName: 'Harbor Mind Practice',
    city: 'Tanjong Pagar, Singapore',
    avatarUrl: '/src/assets/images/avatar_dr_lin_1795158012005.jpg',
    specialtyFocus: 'CBT-I Insomnia & Distress Tolerance',
  },
];

export const SEED_CLIENTS: ClientProfile[] = [
  {
    id: 'client-maya',
    clinicianId: 'clin-evelyn-lin',
    name: 'Maya Tan',
    preferredName: 'Maya',
    primaryFocus: 'Work burnout & perfectionistic worry',
    modality: 'CBT',
    sessionNumber: 6,
    nextSessionDate: '26 Nov 2026',
    accessPin: '4821',
    weeklyProgress: [
      { weekLabel: 'Wk 1', completionRate: 50, moodScore: 2.6, submittedDate: '22 Oct' },
      { weekLabel: 'Wk 2', completionRate: 75, moodScore: 3.1, submittedDate: '29 Oct' },
      { weekLabel: 'Wk 3', completionRate: 67, moodScore: 3.4, submittedDate: '05 Nov' },
      { weekLabel: 'Wk 4', completionRate: 100, moodScore: 3.9, submittedDate: '12 Nov' },
    ],
  },
  {
    id: 'client-daniel',
    clinicianId: 'clin-evelyn-lin',
    name: 'Daniel Lim',
    preferredName: 'Daniel',
    primaryFocus: 'Panic episodes & interoceptive avoidance',
    modality: 'Somatic',
    sessionNumber: 4,
    nextSessionDate: '27 Nov 2026',
    accessPin: '7390',
    weeklyProgress: [
      { weekLabel: 'Wk 1', completionRate: 33, moodScore: 2.4, submittedDate: '29 Oct' },
      { weekLabel: 'Wk 2', completionRate: 67, moodScore: 2.9, submittedDate: '05 Nov' },
      { weekLabel: 'Wk 3', completionRate: 100, moodScore: 3.5, submittedDate: '12 Nov' },
    ],
  },
  {
    id: 'client-priya',
    clinicianId: 'clin-marcus-tan',
    name: 'Priya Nair',
    preferredName: 'Priya',
    primaryFocus: 'Life transition & values alignment',
    modality: 'ACT',
    sessionNumber: 8,
    nextSessionDate: '28 Nov 2026',
    accessPin: '1954',
    weeklyProgress: [
      { weekLabel: 'Wk 1', completionRate: 67, moodScore: 3.0, submittedDate: '21 Oct' },
      { weekLabel: 'Wk 2', completionRate: 100, moodScore: 3.6, submittedDate: '28 Oct' },
      { weekLabel: 'Wk 3', completionRate: 100, moodScore: 4.1, submittedDate: '04 Nov' },
      { weekLabel: 'Wk 4', completionRate: 100, moodScore: 4.3, submittedDate: '11 Nov' },
    ],
  },
  {
    id: 'client-ethan',
    clinicianId: 'clin-marcus-tan',
    name: 'Ethan Goh',
    preferredName: 'Ethan',
    primaryFocus: 'Caregiver guilt & boundary setting',
    modality: 'ACT',
    sessionNumber: 5,
    nextSessionDate: '30 Nov 2026',
    accessPin: '3182',
    weeklyProgress: [
      { weekLabel: 'Wk 1', completionRate: 50, moodScore: 2.8, submittedDate: '04 Nov' },
      { weekLabel: 'Wk 2', completionRate: 100, moodScore: 3.5, submittedDate: '11 Nov' },
    ],
  },
  {
    id: 'client-marcus',
    clinicianId: 'clin-ananya-rao',
    name: 'Marcus Wong',
    preferredName: 'Marcus',
    primaryFocus: 'Sleep onset insomnia & late-night rumination',
    modality: 'CBT-I',
    sessionNumber: 3,
    nextSessionDate: '29 Nov 2026',
    accessPin: '6042',
    weeklyProgress: [
      { weekLabel: 'Wk 1', completionRate: 50, moodScore: 2.5, submittedDate: '04 Nov' },
      { weekLabel: 'Wk 2', completionRate: 75, moodScore: 3.2, submittedDate: '11 Nov' },
    ],
  },
  {
    id: 'client-chloe',
    clinicianId: 'clin-ananya-rao',
    name: 'Chloe Koh',
    preferredName: 'Chloe',
    primaryFocus: 'Emotional overwhelm & interpersonal triggers',
    modality: 'DBT',
    sessionNumber: 7,
    nextSessionDate: '01 Dec 2026',
    accessPin: '8529',
    weeklyProgress: [
      { weekLabel: 'Wk 1', completionRate: 67, moodScore: 2.7, submittedDate: '28 Oct' },
      { weekLabel: 'Wk 2', completionRate: 67, moodScore: 3.3, submittedDate: '04 Nov' },
      { weekLabel: 'Wk 3', completionRate: 100, moodScore: 3.8, submittedDate: '11 Nov' },
    ],
  },
];

export const SEED_ASSIGNMENTS: HomeworkAssignment[] = [
  {
    id: 'asg-maya-current',
    clientId: 'client-maya',
    title: 'Evening Thought Catch & Compassionate Reframe',
    modality: 'CBT',
    clinicalRationale:
      'Reduce post-work catastrophic forecasting by separating objective deadlines from self-critical assumptions.',
    walkthroughNotes:
      'Maya, we practiced the three-column reframe together in session. Aim for two entries before Friday — keep each note under four sentences.',
    estimatedMinutes: 12,
    status: 'pushed',
    uniqueToken: 'hc-maya-84a2',
    createdAt: '2026-11-18T09:15:00.000Z',
    pushedAt: '2026-11-18T10:02:00.000Z',
    tasks: [
      {
        id: 'task-maya-1',
        title: 'Catch one "all-or-nothing" work thought after 6:30 PM',
        instruction:
          'When you notice urgency rising around unread Slack messages, write down the exact automatic thought verbatim.',
        frequency: '3 evenings this week',
        promptQuestion: 'What was the exact thought, and what emotion intensity (0–100) came with it?',
        completed: true,
        reflectionResponse:
          'Thought: "If I do not reply tonight, leadership will think I am falling behind." Anxiety 75/100.',
        completedAt: '2026-11-19T13:20:00.000Z',
      },
      {
        id: 'task-maya-2',
        title: 'Test the evidence for and against the prediction',
        instruction:
          'List one factual piece of evidence that supports the fear and two objective counter-examples from the past month.',
        frequency: 'After each captured thought',
        promptQuestion: 'What is a balanced alternative statement you would tell a close colleague?',
        completed: false,
        reflectionResponse: '',
      },
      {
        id: 'task-maya-3',
        title: 'Five-minute closing ritual before leaving your desk',
        instruction:
          'Write tomorrow’s top two priorities on paper, close your laptop lid, and step outside for a short walk without your phone.',
        frequency: 'Daily on workdays',
        promptQuestion: 'Did the closing ritual change how easily you transitioned into your evening?',
        completed: false,
        reflectionResponse: '',
      },
    ],
  },
  {
    id: 'asg-daniel-current',
    clientId: 'client-daniel',
    title: 'Physiological Sigh & 5-4-3-2-1 MRT Grounding',
    modality: 'Somatic',
    clinicalRationale:
      'Build tolerance for mild cardiac elevation during crowded commutes without triggering safety-seeking escape behaviors.',
    walkthroughNotes:
      'Remember our in-session trial: let the exhale be twice as long as the inhale, and keep your feet anchored on the carriage floor.',
    estimatedMinutes: 8,
    status: 'pushed',
    uniqueToken: 'hc-daniel-39f1',
    createdAt: '2026-11-17T08:00:00.000Z',
    pushedAt: '2026-11-17T08:50:00.000Z',
    tasks: [
      {
        id: 'task-dan-1',
        title: 'Two cycles of physiological sigh prior to boarding',
        instruction:
          'Double inhale through the nose (deep breath + short top-off), followed by a slow, unhurried exhale through the mouth.',
        frequency: 'Daily morning commute',
        promptQuestion: 'How did your chest tightness shift from before to after the second exhale?',
        completed: true,
        reflectionResponse:
          'Did it on the platform at Raffles Place. Chest dropped from 6/10 tight to about 3/10.',
        completedAt: '2026-11-18T01:12:00.000Z',
      },
      {
        id: 'task-dan-2',
        title: 'Stay on the train for one extra stop during mild discomfort',
        instruction:
          'Practice riding through the peak of adrenaline without checking your pulse watch for 90 seconds.',
        frequency: 'Twice this week',
        promptQuestion: 'What did you notice happen to the wave of sensation after 90 seconds?',
        completed: false,
        reflectionResponse: '',
      },
    ],
  },
  {
    id: 'asg-priya-completed',
    clientId: 'client-priya',
    title: 'Values-Aligned Micro-Commitments & Defusion',
    modality: 'ACT',
    clinicalRationale:
      'Shift attention from avoiding uncertainty around career transition toward small daily actions aligned with curiosity and care.',
    walkthroughNotes:
      'Priya, focus on the feeling of choosing one small action each morning rather than waiting to feel 100% certain.',
    estimatedMinutes: 10,
    status: 'completed',
    uniqueToken: 'hc-priya-51c8',
    createdAt: '2026-11-11T05:30:00.000Z',
    pushedAt: '2026-11-11T06:20:00.000Z',
    submittedAt: '2026-11-17T14:15:00.000Z',
    moodRating: 4,
    difficultyRating: 2,
    overallReflection:
      'Naming the worry voice as "Radio Doubt" made it much easier to send out two portfolio notes without stalling all afternoon.',
    clinicianFeedback:
      'Wonderful progress noticing Radio Doubt without letting it steer your afternoon. Let us review which values felt most energizing next session.',
    tasks: [
      {
        id: 'task-priya-1',
        title: 'Label one "Radio Doubt" story each morning',
        instruction:
          'Prefix anxious self-talk with "I notice my mind is telling me the story that..." to create gentle cognitive distance.',
        frequency: 'Daily for 5 days',
        promptQuestion: 'Which repeated story showed up most often this week?',
        completed: true,
        reflectionResponse: '"I am starting too late to pivot fields." Easier to smile at it by Thursday.',
        completedAt: '2026-11-15T04:10:00.000Z',
      },
      {
        id: 'task-priya-2',
        title: 'Complete one 20-minute values-driven outreach step',
        instruction:
          'Take one small step rooted in your value of Growth regardless of lingering nervousness.',
        frequency: '2x this week',
        promptQuestion: 'What step did you take, and how did it feel afterward?',
        completed: true,
        reflectionResponse: 'Messaged an old mentor for coffee at Tiong Bahru and drafted my case study outline.',
        completedAt: '2026-11-16T09:40:00.000Z',
      },
    ],
  },
  {
    id: 'asg-marcus-walkthrough',
    clientId: 'client-marcus',
    title: 'Constructive Worry Window & Bedtime Buffer',
    modality: 'CBT-I',
    clinicalRationale:
      'Unpair the bed from problem-solving arousal by scheduling an earlier 15-minute worry window and consistent wake anchor.',
    walkthroughNotes:
      'Drafted for today’s walkthrough — confirm with Marcus whether 7:30 PM or 8:00 PM works best for the worry pad.',
    estimatedMinutes: 10,
    status: 'walkthrough',
    uniqueToken: 'hc-marcus-22d9',
    createdAt: '2026-11-19T11:00:00.000Z',
    tasks: [
      {
        id: 'task-marcus-1',
        title: '7:30 PM Worry & Next-Day Planning Pad',
        instruction:
          'Spend 12 minutes at the dining table writing down open loops and one next step for each, then place the notebook away.',
        frequency: 'Nightly before 8:30 PM',
        promptQuestion: 'What open loop felt lighter once written down on paper?',
        completed: false,
        reflectionResponse: '',
      },
      {
        id: 'task-marcus-2',
        title: '20-minute Stimulus Control Reset',
        instruction:
          'If awake and restless for more than ~20 minutes, move to a dim armchair and read light paper pages until eyelids feel heavy.',
        frequency: 'As needed at night',
        promptQuestion: 'How many times did you leave bed, and did sleepiness return faster?',
        completed: false,
        reflectionResponse: '',
      },
    ],
  },
];

export const SEED_RESOURCES: ResourceItem[] = [
  {
    id: 'res-thought-record',
    kind: 'template',
    title: '5-Column Cognitive Thought Record',
    modality: 'CBT',
    readMinutes: 12,
    audience: 'Adults experiencing rumination, perfectionism, or social anxiety',
    summary:
      'Structured worksheet guiding clients from trigger situation and automatic thought through objective evidence testing and balanced reframing.',
    imageUrl: '/src/assets/images/resource_cbt_journal_1795158013089.jpg',
    sections: [
      {
        heading: 'Clinical Purpose',
        body: 'Helps clients slow down rapid emotional spirals by separating observable facts from rigid predictions or self-judgments.',
      },
      {
        heading: 'Walkthrough Guidance',
        body: 'Complete the first row together during the final 8 minutes of session using a recent low-to-moderate distress event rather than a peak crisis.',
      },
    ],
    templateTasks: [
      {
        title: 'Capture the situation and automatic thought',
        instruction:
          'Note where you were, what happened, and the first headline thought that crossed your mind.',
        frequency: '3 moments this week',
        promptQuestion: 'What emotion arose, and how strong was it from 0 to 100?',
      },
      {
        title: 'Examine evidence for and against',
        instruction:
          'List facts that support the thought, followed by facts or past experiences that complicate or contradict it.',
        frequency: 'With each entry',
        promptQuestion: 'What objective facts did your anxious mind skip over?',
      },
      {
        title: 'Write a compassionate balanced perspective',
        instruction:
          'Synthesize a realistic statement that respects the difficulty without exaggerating catastrophe.',
        frequency: 'With each entry',
        promptQuestion: 'Re-rate your emotion intensity (0–100) after reading your balanced thought.',
      },
    ],
  },
  {
    id: 'res-somatic-grounding',
    kind: 'template',
    title: 'Somatic Orienting & Physiological Sigh Protocol',
    modality: 'Somatic',
    readMinutes: 8,
    audience: 'Clients managing acute panic, sensory overwhelm, or commute anxiety',
    summary:
      'Brief nervous-system down-regulation sequence combining double-inhale sighs, peripheral vision softening, and tactile anchoring.',
    imageUrl: '/src/assets/images/resource_somatic_calm_1795158012588.jpg',
    sections: [
      {
        heading: 'Clinical Purpose',
        body: 'Engages vagal brake mechanisms via extended exhalations and gentle exteroceptive orienting when cognitive reframing feels out of reach.',
      },
      {
        heading: 'In-Session Practice Cue',
        body: 'Practice two cycles sitting upright with feet uncrossed so the client experiences the subtle shoulder drop live before leaving.',
      },
    ],
    templateTasks: [
      {
        title: 'Two physiological sighs with long exhale',
        instruction:
          'Inhale deeply through the nose, take a second quick sip of air at the top, and exhale slowly through pursed lips.',
        frequency: 'Morning & pre-stress transitions',
        promptQuestion: 'Where in your body did you first notice softening?',
      },
      {
        title: '5-4-3-2-1 sensory orienting scan',
        instruction:
          'Quietly name 5 neutral visual shapes around the room, 4 textures touching your skin, and 3 steady ambient sounds.',
        frequency: 'When heart rate spikes',
        promptQuestion: 'What neutral anchor helped bring your focus outward?',
      },
    ],
  },
  {
    id: 'res-act-values',
    kind: 'template',
    title: 'Values Compass & Committed Micro-Action',
    modality: 'ACT',
    readMinutes: 10,
    audience: 'Clients navigating burnout, career transitions, or avoidance loops',
    summary:
      'Distinguishes outcome-obsessed goals from enduring personal values, pairing one chosen domain with a low-friction 15-minute commitment.',
    sections: [
      {
        heading: 'Clinical Purpose',
        body: 'Builds psychological flexibility by shifting behavior from symptom-avoidance to meaning-driven movement.',
      },
    ],
    templateTasks: [
      {
        title: 'Choose one guiding value for the week',
        instruction:
          'Select one quality of action you want to embody (e.g., Steadiness, Curiosity, Warmth) rather than a checklist target.',
        frequency: 'Start of week',
        promptQuestion: 'Why does this value matter to the person you want to be right now?',
      },
      {
        title: 'Schedule one 15-minute values-aligned action',
        instruction:
          'Pick a realistic micro-step you can take even if anxious thoughts tag along for the ride.',
        frequency: '2x this week',
        promptQuestion: 'What unwanted thought showed up, and how did you carry it with you anyway?',
      },
    ],
  },
  {
    id: 'res-dbt-tipp',
    kind: 'template',
    title: 'DBT Distress Tolerance TIPP Check-In',
    modality: 'DBT',
    readMinutes: 7,
    audience: 'Clients working on emotional dysregulation or intense interpersonal triggers',
    summary:
      'Rapid crisis-de-escalation routine using Temperature, Intense movement, Paced breathing, and Paired muscle relaxation.',
    sections: [
      {
        heading: 'When to Assign',
        body: 'Best assigned when distress exceeds 7/10 and cognitive processing is temporarily offline.',
      },
    ],
    templateTasks: [
      {
        title: 'Cold water facial dive reflex reset',
        instruction:
          'Splash cool water over your cheeks and eyes for 20–30 seconds while holding a slow breath to lower heart rate.',
        frequency: 'During distress > 7/10',
        promptQuestion: 'How quickly did the urge to react impulsively settle?',
      },
      {
        title: 'Paced 4-6 breathing for three minutes',
        instruction: 'Inhale gently for 4 counts and lengthen the exhale to 6 counts without straining.',
        frequency: 'Daily practice + acute moments',
        promptQuestion: 'What changed in your urge intensity after three minutes?',
      },
    ],
  },
  {
    id: 'res-edu-window',
    kind: 'education',
    title: 'Understanding Your Window of Tolerance',
    modality: 'Somatic',
    readMinutes: 5,
    audience: 'Client-friendly psychoeducation handout',
    summary:
      'A non-judgmental visual framework explaining hyperarousal, hypoarousal, and how everyday somatic cues signal when we are moving outside our optimal zone.',
    imageUrl: '/src/assets/images/resource_somatic_calm_1795158012588.jpg',
    sections: [
      {
        heading: 'What Is the Window of Tolerance?',
        body: 'Coined by Dr. Dan Siegel, your Window of Tolerance is the band of nervous-system arousal where you can think clearly, feel emotions without drowning in them, and stay connected to others.',
      },
      {
        heading: 'Hyperarousal vs. Hypoarousal',
        body: 'Above the window sits fight-or-flight (racing thoughts, tight chest, irritability). Below the window sits freeze or shutdown (numbness, heavy fatigue, brain fog). Neither state is a character flaw — both are protective alarms.',
      },
      {
        heading: 'Widening the Window Between Sessions',
        body: 'Gentle daily micro-practices — paced breathing, brief daylight walks, and naming sensations without judgment — teach your nervous system that activation can rise and safely come back down.',
      },
    ],
  },
  {
    id: 'res-edu-distortions',
    kind: 'education',
    title: 'Field Guide to Common Thinking Traps',
    modality: 'CBT',
    readMinutes: 6,
    audience: 'Client-friendly psychoeducation handout',
    summary:
      'Plain-language guide to spotting Mind Reading, Catastrophizing, and All-or-Nothing Thinking in daily work and family life.',
    imageUrl: '/src/assets/images/resource_cbt_journal_1795158013089.jpg',
    sections: [
      {
        heading: 'Why Our Minds Take Shortcuts',
        body: 'Under fatigue or high responsibility, the brain relies on fast threat-prediction shortcuts. Naming the trap does not mean your feelings are invalid — it simply opens room to check the facts.',
      },
      {
        heading: 'Three Traps to Notice This Week',
        body: '1. Mind Reading: Assuming a neutral pause or short message means disapproval. 2. Fortune Telling: Treating a worst-case scenario as an inevitable outcome. 3. Should Statements: Using rigid self-demands that fuel shame rather than sustainable energy.',
      },
      {
        heading: 'A Gentle Curiosity Question',
        body: 'Ask yourself: "If someone I cared deeply about had this exact thought tonight, what steady perspective would I offer them?"',
      },
    ],
  },
  {
    id: 'res-edu-cbti',
    kind: 'education',
    title: 'Circadian Anchors & Sleep Drive Basics',
    modality: 'CBT-I',
    readMinutes: 5,
    audience: 'Client-friendly psychoeducation handout',
    summary:
      'Explains why consistent morning wake times and leaving bed during wakefulness rebuild natural sleep pressure faster than trying harder to sleep.',
    sections: [
      {
        heading: 'Sleep Pressure Builds Like an Appetite',
        body: 'Every hour awake builds adenosine — your natural sleep appetite. Long daytime naps or sleeping late after a rough night accidentally snack on that appetite before bedtime.',
      },
      {
        heading: 'Protecting the Bed-Sleep Association',
        body: 'When we lie awake worrying for an hour, the brain learns that bed equals problem-solving. Stepping out calmly into dim light for 15 minutes resets that association.',
      },
    ],
  },
];

export function createInitialWorkspace(): WorkspacePayload {
  return structuredClone({
    clinician: SEED_CLINICIAN,
    clinicians: SEED_CLINICIANS,
    clients: SEED_CLIENTS,
    assignments: SEED_ASSIGNMENTS,
    resources: SEED_RESOURCES,
  });
}
