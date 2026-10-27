/** The message of anything thrown, for showing to the user. */
export function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
