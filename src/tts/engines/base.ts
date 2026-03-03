// src/tts/engines/base.ts

export type EngineType = 'web-speech' | 'aliyun' | 'tencent' | 'qwen' | 'openai';
export type Language = 'zh-CN' | 'en-US';
export type EngineStatus = 'idle' | 'playing' | 'paused';

export interface EngineConfig {
  type: EngineType;
  apiKey?: string;
  accessKeyId?: string;
  accessKeySecret?: string;
  secretId?: string;
  secretKey?: string;
  speechRate?: number;
  voice?: string; // For Qwen TTS voice selection
  model?: string; // For Qwen TTS model selection
  onProgress?: (current: number, total: number) => void; // Progress callback
}

export interface ITTSEngine {
  initialize(config: EngineConfig): Promise<void>;
  speak(text: string, language: Language): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
  getStatus(): EngineStatus;
  getCurrentTime(): number;
  getDuration(): number;
}

export abstract class BaseTTSEngine implements ITTSEngine {
  protected status: EngineStatus = 'idle';
  protected config: EngineConfig;

  constructor(config: EngineConfig) {
    this.config = config;
  }

  abstract initialize(config: EngineConfig): Promise<void>;
  abstract speak(text: string, language: Language): Promise<void>;
  abstract pause(): void;
  abstract resume(): void;
  abstract stop(): void;

  getStatus(): EngineStatus {
    return this.status;
  }

  getCurrentTime(): number {
    return 0;
  }

  getDuration(): number {
    return 0;
  }
}
