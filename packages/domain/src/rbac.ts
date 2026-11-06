import type { Permission, Role } from "@movie/contracts";

/**
 * Capability-based RBAC matrix (Blueprint §10 & §35.1).
 * Enforces separation of duties:
 * - EDITOR can edit drafts/metadata, NEVER approve rights or publish restricted assets.
 * - MEDIA_OPERATOR can upload/process/retry jobs, NEVER approve rights or publish.
 * - RIGHTS_REVIEWER can review/approve/revoke rights grants, NEVER upload or publish alone.
 */
export const ROLE_PERMISSIONS: Readonly<Record<Role, readonly Permission[]>> = {
  VIEWER: ["catalogue:read", "reports:submit"],
  EDITOR: [
    "catalogue:read",
    "catalogue:create",
    "catalogue:update",
    "catalogue:submit",
    "rights:read",
    "media:read",
    "reports:submit",
  ],
  MEDIA_OPERATOR: [
    "catalogue:read",
    "rights:read",
    "media:read",
    "media:ingest",
    "media:upload",
    "media:process",
    "jobs:read",
    "jobs:retry",
    "jobs:cancel",
    "storage:read",
    "reports:submit",
  ],
  RIGHTS_REVIEWER: [
    "catalogue:read",
    "rights:read",
    "rights:create",
    "rights:approve",
    "rights:revoke",
    "media:read",
    "reports:review",
    "audit:read",
  ],
  ADMIN: [
    "catalogue:read",
    "catalogue:create",
    "catalogue:update",
    "catalogue:submit",
    "catalogue:publish",
    "catalogue:unpublish",
    "rights:read",
    "rights:create",
    "media:read",
    "media:ingest",
    "media:upload",
    "media:process",
    "jobs:read",
    "jobs:retry",
    "jobs:cancel",
    "storage:read",
    "storage:manage",
    "reports:submit",
    "reports:review",
    "reports:resolve",
    "users:read",
    "users:manage",
    "audit:read",
    "settings:manage",
  ],
  SUPER_ADMIN: [
    "catalogue:read",
    "catalogue:create",
    "catalogue:update",
    "catalogue:submit",
    "catalogue:publish",
    "catalogue:unpublish",
    "rights:read",
    "rights:create",
    "rights:approve",
    "rights:revoke",
    "media:read",
    "media:ingest",
    "media:upload",
    "media:process",
    "jobs:read",
    "jobs:retry",
    "jobs:cancel",
    "storage:read",
    "storage:manage",
    "reports:submit",
    "reports:review",
    "reports:resolve",
    "users:read",
    "users:manage",
    "roles:manage",
    "audit:read",
    "settings:manage",
  ],
};

export interface ActorIdentity {
  userId: string;
  roles: readonly Role[];
  status: "ACTIVE" | "SUSPENDED";
  mfaVerified?: boolean;
}

const MFA_REQUIRED_ROLES: ReadonlySet<Role> = new Set<Role>([
  "RIGHTS_REVIEWER",
  "ADMIN",
  "SUPER_ADMIN",
]);

export function roleRequiresMfa(role: Role): boolean {
  return MFA_REQUIRED_ROLES.has(role);
}

export function hasPermission(
  actor: ActorIdentity | null | undefined,
  permission: Permission,
): boolean {
  if (!actor || actor.status !== "ACTIVE") {
    return false;
  }
  for (const role of actor.roles) {
    const perms = ROLE_PERMISSIONS[role];
    if (perms.includes(permission)) {
      if (
        MFA_REQUIRED_ROLES.has(role) &&
        permission !== "catalogue:read" &&
        permission !== "reports:submit"
      ) {
        if (!actor.mfaVerified) {
          continue;
        }
      }
      return true;
    }
  }
  return false;
}

export class AuthorizationError extends Error {
  readonly code: "UNAUTHENTICATED" | "FORBIDDEN" | "MFA_REQUIRED";

  constructor(code: "UNAUTHENTICATED" | "FORBIDDEN" | "MFA_REQUIRED", message: string) {
    super(message);
    this.name = "AuthorizationError";
    this.code = code;
  }
}

export function assertPermission(
  actor: ActorIdentity | null | undefined,
  permission: Permission,
): void {
  if (!actor) {
    throw new AuthorizationError("UNAUTHENTICATED", "Authentication is required");
  }
  if (actor.status !== "ACTIVE") {
    throw new AuthorizationError("FORBIDDEN", "Account is not active");
  }
  if (hasPermission(actor, permission)) {
    return;
  }
  const hasRoleWithoutMfa = actor.roles.some(
    (role) => MFA_REQUIRED_ROLES.has(role) && ROLE_PERMISSIONS[role].includes(permission),
  );
  if (hasRoleWithoutMfa && !actor.mfaVerified) {
    throw new AuthorizationError(
      "MFA_REQUIRED",
      "Multi-factor authentication is required for this privileged operation",
    );
  }
  throw new AuthorizationError("FORBIDDEN", `Missing required permission: ${permission}`);
}
