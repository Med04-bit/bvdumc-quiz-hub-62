export const APP_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "IT_LOGISTICS_HEAD",
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
  IT_LOGISTICS_HEAD: "IT & Logistics Head",
  QUESTION_SETTER: "Question Setter",
  QUESTION_REVIEWER: "Question Reviewer",
  QUIZMASTER: "Quizmaster",
  SCOREKEEPER: "Scorekeeper",
  VOLUNTEER: "Volunteer",
  PARTICIPANT: "Participant",
};

/** Permission foundation: which roles may perform a capability. */
export const PERMISSIONS = {
  manageEvents: ["SUPER_ADMIN", "ADMIN"],
  managePeople: ["SUPER_ADMIN", "ADMIN"],
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
