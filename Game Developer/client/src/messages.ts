// What the game has said lately, on the board and in fights, for the log window (Robin, 2026-11-02).

const KEPT = 20;
const said: string[] = [];

/** One message said; a repeat of the last is not said twice. */
export function rememberMessage(text: string): void {
  const line = text.trim();
  if (!line || line.startsWith('On the road') || said[said.length - 1] === line) return;
  said.push(line);
  if (said.length > KEPT) said.shift();
}

/** The last `count` messages, oldest first. */
export function lastMessages(count: number): string[] {
  return said.slice(-count);
}
