export const APP_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "FOUNDER",
  "PRESIDENT",
  "VICE_PRESIDENT",
  "IT_LOGISTICS_HEAD",
  "CREATIVE_HEAD",
  "PRE_CLINICAL_HEAD",
  "PARA_CLINICAL_HEAD",
  "CLINICAL_HEAD",
  "QUESTION_SETTER",
  "QUESTION_REVIEWER",
  "QUIZMASTER",
  "SCOREKEEPER",
  "VOLUNTEER",
  "PARTICIPANT",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const ROLE_LABELS: Record<AppRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  FOUNDER: "Founder",
  PRESIDENT: "President",
  VICE_PRESIDENT: "Vice President",
  IT_LOGISTICS_HEAD: "IT & Logistics Head",
  CREATIVE_HEAD: "Creative Head",
  PRE_CLINICAL_HEAD: "Pre-Clinical Head",
  PARA_CLINICAL_HEAD: "Para-Clinical Head",
  CLINICAL_HEAD: "Clinical Head",
  QUESTION_SETTER: "Question Setter",
  QUESTION_REVIEWER: "Question Reviewer",
  QUIZMASTER: "Quizmaster",
  SCOREKEEPER: "Scorekeeper",
  VOLUNTEER: "Volunteer",
  PARTICIPANT: "Participant",
};

/** Founder / President / Vice President tier plus platform admins. Mirrors public.is_senior_leadership(). */
export const SENIOR_LEADERSHIP_ROLES: AppRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "FOUNDER",
  "PRESIDENT",
  "VICE_PRESIDENT",
];

/** Academic division heads. */
export const ACADEMIC_HEAD_ROLES: AppRole[] = [
  "PRE_CLINICAL_HEAD",
  "PARA_CLINICAL_HEAD",
  "CLINICAL_HEAD",
];

/** Leadership roles allowed to run events and quiz rounds. Mirrors public.is_organiser(). */
export const ORGANISER_ROLES: AppRole[] = [
  ...SENIOR_LEADERSHIP_ROLES,
  "IT_LOGISTICS_HEAD",
  "CREATIVE_HEAD",
  ...ACADEMIC_HEAD_ROLES,
];

/** Permission foundation: which roles may perform a capability. */
export const PERMISSIONS = {
  manageEvents: ORGANISER_ROLES,
  manageRounds: ORGANISER_ROLES,
  managePeople: ["SUPER_ADMIN", "ADMIN", "FOUNDER", "PRESIDENT", "VICE_PRESIDENT"],
  // Question bank — mirrors public.can_access_question_bank()
  accessQuestionBank: [
    ...SENIOR_LEADERSHIP_ROLES,
    ...ACADEMIC_HEAD_ROLES,
    "QUESTION_SETTER",
    "QUESTION_REVIEWER",
    "QUIZMASTER",
  ],
  // Mirrors public.can_author_questions()
  writeQuestions: [...SENIOR_LEADERSHIP_ROLES, ...ACADEMIC_HEAD_ROLES, "QUESTION_SETTER"],
  // Reviewing is additionally scoped by academic division — see canReviewDivision()
  reviewQuestions: [...SENIOR_LEADERSHIP_ROLES, "QUESTION_REVIEWER", ...ACADEMIC_HEAD_ROLES],
  manageSubjects: SENIOR_LEADERSHIP_ROLES,
  manageTopics: [...SENIOR_LEADERSHIP_ROLES, ...ACADEMIC_HEAD_ROLES],
  recordScores: ["SUPER_ADMIN", "ADMIN", "SCOREKEEPER", "QUIZMASTER"],
  manageLogistics: ["SUPER_ADMIN", "ADMIN", "IT_LOGISTICS_HEAD"],
  manageRoles: ["SUPER_ADMIN", "ADMIN", "FOUNDER"],
} satisfies Record<string, AppRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(roles: AppRole[], permission: Permission): boolean {
  return roles.some((role) => (PERMISSIONS[permission] as readonly AppRole[]).includes(role));
}

export type AcademicDivision = "PRE_CLINICAL" | "PARA_CLINICAL" | "CLINICAL" | "OTHER";

export const DIVISION_LABELS: Record<AcademicDivision, string> = {
  PRE_CLINICAL: "Pre-Clinical",
  PARA_CLINICAL: "Para-Clinical",
  CLINICAL: "Clinical",
  OTHER: "Other",
};

export const DIVISIONS: AcademicDivision[] = [
  "PRE_CLINICAL",
  "PARA_CLINICAL",
  "CLINICAL",
  "OTHER",
];

const DIVISION_HEAD_ROLE: Record<AcademicDivision, AppRole | null> = {
  PRE_CLINICAL: "PRE_CLINICAL_HEAD",
  PARA_CLINICAL: "PARA_CLINICAL_HEAD",
  CLINICAL: "CLINICAL_HEAD",
  OTHER: null,
};

/**
 * Mirrors public.can_review_division(): senior leadership and dedicated question
 * reviewers cover every division, academic heads only cover their own.
 */
export function canReviewDivision(roles: AppRole[], division: AcademicDivision | null): boolean {
  if (roles.some((role) => SENIOR_LEADERSHIP_ROLES.includes(role))) return true;
  if (roles.includes("QUESTION_REVIEWER")) return true;
  if (!division) return false;
  const headRole = DIVISION_HEAD_ROLE[division];
  return headRole ? roles.includes(headRole) : false;
}

/** Divisions this user may review questions in. */
export function reviewableDivisions(roles: AppRole[]): AcademicDivision[] {
  return DIVISIONS.filter((division) => canReviewDivision(roles, division));
}
