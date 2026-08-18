export const APP_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
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

/** Leadership roles allowed to run events and quiz rounds. Mirrors public.is_organiser(). */
export const ORGANISER_ROLES: AppRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "PRESIDENT",
  "VICE_PRESIDENT",
  "IT_LOGISTICS_HEAD",
  "CREATIVE_HEAD",
  "PRE_CLINICAL_HEAD",
  "PARA_CLINICAL_HEAD",
  "CLINICAL_HEAD",
];

/** Permission foundation: which roles may perform a capability. */
export const PERMISSIONS = {
  manageEvents: ORGANISER_ROLES,
  manageRounds: ORGANISER_ROLES,
  managePeople: ["SUPER_ADMIN", "ADMIN", "PRESIDENT", "VICE_PRESIDENT"],
  writeQuestions: ["SUPER_ADMIN", "ADMIN", "QUESTION_SETTER"],
  reviewQuestions: ["SUPER_ADMIN", "ADMIN", "QUESTION_REVIEWER"],
  recordScores: ["SUPER_ADMIN", "ADMIN", "SCOREKEEPER", "QUIZMASTER"],
  manageLogistics: ["SUPER_ADMIN", "ADMIN", "IT_LOGISTICS_HEAD"],
  manageRoles: ["SUPER_ADMIN", "ADMIN"],
} satisfies Record<string, AppRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(roles: AppRole[], permission: Permission): boolean {
  return roles.some((role) => (PERMISSIONS[permission] as readonly AppRole[]).includes(role));
}
