import type { User } from "@supabase/supabase-js";

export const AUTH_ROLES = ["client", "pro", "admin"] as const;

export type AuthRole = (typeof AUTH_ROLES)[number];
export type SignupRole = Exclude<AuthRole, "admin">;

export function isAuthRole(value: unknown): value is AuthRole {
  return typeof value === "string" && AUTH_ROLES.includes(value as AuthRole);
}

export function getPrimaryAuthRole(user: User | null): AuthRole {
  const metadataRole = user?.user_metadata?.role;
  if (isAuthRole(metadataRole)) return metadataRole;

  const appMetadataRole = user?.app_metadata?.role;
  if (isAuthRole(appMetadataRole)) return appMetadataRole;

  const appMetadataRoles = user?.app_metadata?.roles;
  if (Array.isArray(appMetadataRoles)) {
    const role = appMetadataRoles.find(isAuthRole);
    if (role) return role;
  }

  return "client";
}
