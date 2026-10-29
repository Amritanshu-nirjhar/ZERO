// Site audio: the soundtrack ("Aggressive Phonk Drift Beat" by vaitsez, Pixabay Content License,
// streamed from /audio/phonk-drift.mp3) plus the hero's synthesised sound effects.
// Music runs through a low-pass that the page opens up as you scroll, so it comes "into focus"
// with the hero. On top of that the music rides the scroll: full while you scroll, settling back
// to a quieter level a moment after you stop. SFX use their own gain so they stay crisp and aren't affected by the music fade.

export const TRACK = {
  src: "/audio/phonk-drift.mp3",
  title: "Aggressive Phonk Drift Beat",
  artist: "vaitsez",
  credit: "“Aggressive Phonk Drift Beat” vaitsez (pixabay.com) · Pixabay Content License",
  licenseUrl: "https://pixabay.com/service/license-summary/",
};

const MUSIC_LEVEL = 0.7;
const IDLE_LEVEL = 0.4; // music level while the page is still, relative to scrolling



export class Soundtrack {
  private ctx: AudioContext;
  private el: HTMLAudioElement;
  private music: GainNode;
  private duck: GainNode;
  private drive: GainNode;
  private tone: BiquadFilterNode;
  private sfx: GainNode;
  private noise: AudioBuffer;
  playing = false;

  constructor() {
    this.ctx = new AudioContext();
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 3;
    comp.connect(this.ctx.destination);

    // Music chain: <audio> → tone (low-pass) → duck → scroll drive → music fade → out.
    this.el = new Audio(TRACK.src);
    this.el.loop = true;
    this.el.preload = "auto";
    this.el.crossOrigin = "anonymous";
    this.tone = this.ctx.createBiquadFilter();
    this.tone.type = "lowpass";
    this.tone.frequency.value = 1200;
    this.tone.Q.value = 0.6;
    this.duck = this.ctx.createGain();
    this.drive = this.ctx.createGain();
    this.drive.gain.value = IDLE_LEVEL;
    this.music = this.ctx.createGain();
    this.music.gain.value = 0;
    this.ctx
      .createMediaElementSource(this.el)
      .connect(this.tone)
      .connect(this.duck)
      .connect(this.drive)
      .connect(this.music)
      .connect(comp);

    this.sfx = this.ctx.createGain();
    this.sfx.gain.value = 1;
    this.sfx.connect(comp);

    // Two seconds of white noise, reused by the SFX.
    this.noise = this.ctx.createBuffer(
      1,
      this.ctx.sampleRate * 2,
      this.ctx.sampleRate,
    );
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  async start() {
    await this.ctx.resume();
    if (this.playing) return;
    this.playing = true;
    await this.el.play();
    const t = this.ctx.currentTime;
    this.music.gain.cancelScheduledValues(t);
    this.music.gain.setTargetAtTime(MUSIC_LEVEL, t, 0.8);
  }

  stop() {
    if (!this.playing) return;
    this.playing = false;
    const t = this.ctx.currentTime;
    this.music.gain.cancelScheduledValues(t);
    this.music.gain.setTargetAtTime(0, t, 0.25);
    // Pause once faded so the track resumes where it left off.
    window.setTimeout(() => !this.playing && this.el.pause(), 1200);
  }

  // 0 = muffled (as if from another room), 1 = fully open.
  setFocus(f: number) {
    const hz = 900 * (18000 / 900) ** Math.min(1, Math.max(0, f));
    this.tone.frequency.setTargetAtTime(hz, this.ctx.currentTime, 0.15);
  }

  // Call on every scroll event: swell to full, then ease back once scrolling stops.
  scrolled() {
    const g = this.drive.gain;
    const t = this.ctx.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.setTargetAtTime(1, t, 0.06);
    g.setTargetAtTime(IDLE_LEVEL, t + 0.4, 0.5);
  }

  // ── sound-effect building blocks ────────────────────────────────────────

  private env(t: number, peak: number, attack: number, decay: number) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    return g;
  }

  private noiseHit(
    t: number,
    type: BiquadFilterType,
    freq: number,
    peak: number,
    len: number,
    q = 1,
  ) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = this.env(t, peak, 0.002, len);
    src.connect(f).connect(g).connect(this.sfx);
    src.start(t, Math.random() * 1.5);
    src.stop(t + len + 0.05);
  }

  private tone1(
    t: number,
    type: OscillatorType,
    from: number,
    to: number,
    peak: number,
    len: number,
  ) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(to, t + len * 0.6);
    const g = this.env(t, peak, 0.003, len);
    o.connect(g).connect(this.sfx);
    o.start(t);
    o.stop(t + len + 0.05);
  }

  // ── sound effects ───────────────────────────────────────────────────────

  // Paper crinkle: a burst of tiny bandpassed clicks; `amount` scales how many.
  crinkle(amount: number) {
    if (!this.playing) return;
    const n = Math.min(10, Math.ceil(amount * 260));
    const t = this.ctx.currentTime;
    for (let i = 0; i < n; i++) {
      this.noiseHit(
        t + Math.random() * 0.06,
        "bandpass",
        2200 + Math.random() * 4500,
        0.1 + Math.random() * 0.1,
        0.02 + Math.random() * 0.03,
        2,
      );
    }
  }

  // Air rushing past as the ball is hurled down.
  whoosh() {
    if (!this.playing) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass";
    f.Q.value = 1.4;
    f.frequency.setValueAtTime(400, t);
    f.frequency.exponentialRampToValueAtTime(2600, t + 0.28);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.22);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    src.connect(f).connect(g).connect(this.sfx);
    src.start(t);
    src.stop(t + 0.4);
  }

  // The ball slamming onto the desk: deep body + papery crunch + wooden knock, then things rattling.
  thud() {
    if (!this.playing) return;
    const t = this.ctx.currentTime;
    this.tone1(t, "sine", 120, 40, 1.1, 0.55); // chest-thump body
    this.tone1(t, "triangle", 220, 90, 0.35, 0.12); // wooden knock of the desk
    this.noiseHit(t, "lowpass", 900, 0.8, 0.22); // impact air
    this.noiseHit(t, "bandpass", 3200, 0.35, 0.09, 1.5); // paper-ball crunch
    // Mug and phone rattling on the desk after the hit.
    for (let i = 0; i < 7; i++) {
      const at = t + 0.06 + i * 0.045 + Math.random() * 0.02;
      this.noiseHit(
        at,
        "bandpass",
        2500 + Math.random() * 2500,
        0.18 * (1 - i / 8),
        0.03,
        6,
      );
    }
    this.tone1(t + 0.05, "sine", 1850, 1800, 0.05, 0.35); // ceramic ring of the mug
    // Duck the music so the hit lands.
    this.duck.gain.cancelScheduledValues(t);
    this.duck.gain.setValueAtTime(0.25, t);
    this.duck.gain.setTargetAtTime(1, t + 0.2, 0.3);
  }

  buzz() {
    if (!this.playing) return;
    const t = this.ctx.currentTime;
    for (let k = 0; k < 2; k++) {
      const s = t + k * 0.28;
      const o = this.ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = 150;
      const lp = this.ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 500;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, s);
      g.gain.linearRampToValueAtTime(0.08, s + 0.02);
      g.gain.setValueAtTime(0.08, s + 0.18);
      g.gain.linearRampToValueAtTime(0, s + 0.22);
      o.connect(lp).connect(g).connect(this.sfx);
      o.start(s);
      o.stop(s + 0.25);
    }
  }
}

// Page components fire these; the SoundToggle listens and plays the matching sound.
export const SFX = {
  crinkle: "sfx:crinkle",
  whoosh: "sfx:whoosh",
  thud: "sfx:thud",
  buzz: "sfx:buzz",
} as const;

export function emit(name: (typeof SFX)[keyof typeof SFX], detail?: number) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}
