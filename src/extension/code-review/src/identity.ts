export function isSameIdentity(
  currentUserId: string | null,
  developerId: string | null,
): boolean {
  return Boolean(currentUserId && developerId && currentUserId === developerId);
}

