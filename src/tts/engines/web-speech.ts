// src/tts/engines/web-speech.ts

import { BaseTTSEngine, EngineConfig, Language } from './base';

export class WebSpeechEngine extends BaseTTSEngine {
  private utterance: SpeechSynthesisUtterance | null = null;
  private synth: SpeechSynthesis;

  constructor(config: EngineConfig) {
    super(config);
    this.synth = window.speechSynthesis;
  }

  async initialize(config: EngineConfig): Promise<void> {
    this.config = config;
    // Web Speech API 不需要初始化
    return Promise.resolve();
  }

  async speak(text: string, language: Language): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.utterance = new SpeechSynthesisUtterance(text);
        this.utterance.lang = language;
        this.utterance.rate = this.config.speechRate || 1.0;

        this.utterance.onstart = () => {
          this.status = 'playing';
        };

        this.utterance.onend = () => {
          this.status = 'idle';
          resolve();
        };

        this.utterance.onerror = (event) => {
          this.status = 'idle';
          reject(new Error(`Speech synthesis error: ${event.error}`));
        };

        this.synth.speak(this.utterance);
      } catch (error) {
        reject(error);
      }
    });
  }

  pause(): void {
    if (this.status === 'playing') {
      this.synth.pause();
      this.status = 'paused';
    }
  }

  resume(): void {
    if (this.status === 'paused') {
      this.synth.resume();
      this.status = 'playing';
    }
  }

  stop(): void {
    this.synth.cancel();
    this.status = 'idle';
  }
}
