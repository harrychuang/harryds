// =============================================================================
// 共用 Web Audio 音效管理工具
// - 單例 AudioContext
// - 音效快取（AudioBuffer）避免重複解碼
// - 一次性播放 helper，回傳可停止的控制句柄
// - 全局靜音控制
// =============================================================================

// LocalStorage key for sound enabled state
const SOUND_ENABLED_KEY = 'portfolio-sound-enabled';

export type PlayOptions = {
  volume?: number;
  playbackRate?: number;
  loop?: boolean;
};

export type PlaybackHandle = {
  stop: () => void;
  source: AudioBufferSourceNode | null;
  gain: GainNode | null;
};

class AudioManager {
  private audioContext: AudioContext | null = null;
  private bufferCache: Map<string, Promise<AudioBuffer>> = new Map();
  private _isSoundEnabled: boolean = true;
  private _listeners: Set<(enabled: boolean) => void> = new Set();

  constructor() {
    // 從 localStorage 讀取音效狀態
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SOUND_ENABLED_KEY);
      this._isSoundEnabled = stored !== 'false'; // 預設為 true
    }
  }

  // 取得音效是否開啟
  get isSoundEnabled(): boolean {
    return this._isSoundEnabled;
  }

  // 設定音效是否開啟
  setSoundEnabled(enabled: boolean): void {
    this._isSoundEnabled = enabled;
    // 儲存到 localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(SOUND_ENABLED_KEY, enabled ? 'true' : 'false');
    }
    // 通知所有監聽者
    this._listeners.forEach((listener) => listener(enabled));
  }

  // 切換音效狀態
  toggleSound(): boolean {
    const newState = !this._isSoundEnabled;
    this.setSoundEnabled(newState);
    return newState;
  }

  // 訂閱音效狀態變化
  subscribe(listener: (enabled: boolean) => void): () => void {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (this.audioContext) return this.audioContext;
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return null;
    this.audioContext = new Ctx();
    return this.audioContext;
  }

  async resume(): Promise<void> {
    const ctx = this.getContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // ignore resume errors
      }
    }
  }

  preload(urls: string[] | string): Promise<void[]> {
    const list = Array.isArray(urls) ? urls : [urls];
    return Promise.all(list.map((u) => this.loadBuffer(u).then(() => undefined)));
  }

  private async loadBuffer(url: string): Promise<AudioBuffer> {
    const ctx = this.getContext();
    if (!ctx) throw new Error('Web Audio API is not available');

    if (!this.bufferCache.has(url)) {
      const promise = fetch(url)
        .then((res) => res.arrayBuffer())
        .then((data) => ctx.decodeAudioData(data));
      this.bufferCache.set(url, promise);
    }
    return this.bufferCache.get(url)!;
  }

  async play(url: string, options: PlayOptions = {}): Promise<PlaybackHandle | null> {
    // 如果音效關閉，直接返回空句柄
    if (!this._isSoundEnabled) {
      return { stop: () => {}, source: null, gain: null };
    }

    const ctx = this.getContext();
    if (!ctx) return null;
    await this.resume();

    const buffer = await this.loadBuffer(url);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = !!options.loop;
    if (options.playbackRate && options.playbackRate > 0) {
      source.playbackRate.value = options.playbackRate;
    }

    const gain = ctx.createGain();
    gain.gain.value = Math.max(0, Math.min(1, options.volume ?? 1));

    source.connect(gain);
    gain.connect(ctx.destination);

    try {
      source.start(0);
    } catch {
      // ignore start errors
    }

    const handle: PlaybackHandle = {
      stop: () => {
        try {
          source.stop(0);
        } catch {
          // ignore
        }
        try {
          source.disconnect();
        } catch {
          // ignore
        }
        try {
          gain.disconnect();
        } catch {
          // ignore
        }
      },
      source,
      gain,
    };

    // 自動清理：在播放結束時斷開連線
    source.onended = () => {
      try { source.disconnect(); } catch {}
      try { gain.disconnect(); } catch {}
    };

    return handle;
  }
}

export const audioManager = new AudioManager();


