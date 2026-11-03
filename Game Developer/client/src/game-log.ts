// The in-game frame log and error log the player can download (the Survival game's Admin pattern).
// A phone has no console: this is how Robin tells us what his phone saw. Cheap per frame: one write into a ring.

const FRAME_RING = 1800; // the last 30 seconds at 60 fps
const MAX_LINES = 500;
const MAX_ERRORS = 200;
const MAX_SECONDS = 600; // ten minutes of per-second summaries

export class GameLog {
  private readonly deltas = new Float32Array(FRAME_RING);
  private head = 0;
  private filled = 0;
  private elapsed = 0;
  private secondAccum = 0;
  private secondFrames = 0;
  private secondWorst = 0;
  private readonly seconds: string[] = [];
  private readonly lines: string[] = [];
  private readonly errors: string[] = [];
  private readonly started = Date.now();

  /** Catch what the page would otherwise lose: thrown errors, failed promises, console.error. */
  attach(w: Window): void {
    w.addEventListener('error', (e) => this.error(`${e.message} (${e.filename}:${e.lineno}:${e.colno})`));
    w.addEventListener('unhandledrejection', (e) => this.error(`unhandled rejection: ${describe(e.reason)}`));
    const original = console.error.bind(console);
    console.error = (...args: unknown[]) => {
      this.error(args.map(describe).join(' '));
      original(...args);
    };
  }

  /** Called once per frame with the frame's delta in ms. */
  frame(delta: number): void {
    this.deltas[this.head] = delta;
    this.head = (this.head + 1) % FRAME_RING;
    if (this.filled < FRAME_RING) this.filled++;
    this.elapsed += delta;
    this.secondAccum += delta;
    this.secondFrames++;
    if (delta > this.secondWorst) this.secondWorst = delta;
    if (this.secondAccum >= 1000) {
      const fps = (this.secondFrames * 1000) / this.secondAccum;
      this.seconds.push(`${(this.elapsed / 1000).toFixed(0).padStart(5)}s  ${fps.toFixed(1).padStart(5)} fps  worst ${this.secondWorst.toFixed(1)} ms`);
      if (this.seconds.length > MAX_SECONDS) this.seconds.shift();
      this.secondAccum = 0;
      this.secondFrames = 0;
      this.secondWorst = 0;
    }
  }

  /** Something that happened in the game, worth seeing next to the frame times. */
  note(text: string): void {
    this.lines.push(`${this.stamp()} ${text}`);
    if (this.lines.length > MAX_LINES) this.lines.shift();
  }

  error(text: string): void {
    this.errors.push(`${this.stamp()} ${text}`);
    if (this.errors.length > MAX_ERRORS) this.errors.shift();
  }

  get errorCount(): number {
    return this.errors.length;
  }

  /** The whole log as text. */
  text(): string {
    const recent: string[] = [];
    for (let i = 0; i < this.filled; i++) {
      const idx = (this.head - this.filled + i + FRAME_RING) % FRAME_RING;
      recent.push(this.deltas[idx]!.toFixed(1));
    }
    const nav = typeof navigator === 'undefined' ? null : navigator;
    const header = [
      `Zite log`,
      `started ${new Date(this.started).toISOString()}, running ${(this.elapsed / 1000).toFixed(1)} s`,
      `agent ${nav?.userAgent ?? '?'}`,
      `screen ${screen.width}x${screen.height} @${window.devicePixelRatio}, viewport ${window.innerWidth}x${window.innerHeight}`,
      `errors ${this.errors.length}`,
    ];
    return [
      ...header,
      '',
      '== errors ==',
      ...(this.errors.length ? this.errors : ['none']),
      '',
      '== events ==',
      ...(this.lines.length ? this.lines : ['none']),
      '',
      '== frames per second, each second ==',
      ...(this.seconds.length ? this.seconds : ['not a full second yet']),
      '',
      `== last ${recent.length} frame times (ms) ==`,
      recent.join(' '),
      '',
    ].join('\n');
  }

  /** Hand the log to the player as a text file. */
  download(filename = `boardworld-log-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`): void {
    const blob = new Blob([this.text()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private stamp(): string {
    return `[${(this.elapsed / 1000).toFixed(1).padStart(7)}s]`;
  }
}

function describe(value: unknown): string {
  if (value instanceof Error) return `${value.name}: ${value.message}${value.stack ? `\n${value.stack}` : ''}`;
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
