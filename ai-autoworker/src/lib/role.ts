export type UserRole = "admin" | "viewer";

export const roleStorageKey = "ai-autoworker-role";
export const roleChangeEventName = "ai-role-change";

export function getStoredRole(): UserRole {
  if (typeof window === "undefined") {
    return "admin";
  }

  const raw = window.localStorage.getItem(roleStorageKey);
  if (raw === "viewer") {
    return "viewer";
  }
  return "admin";
}

export function setStoredRole(role: UserRole): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(roleStorageKey, role);
  window.dispatchEvent(new Event(roleChangeEventName));
}
