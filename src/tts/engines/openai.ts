// src/tts/engines/openai.ts

import OpenAI from 'openai';
import { BaseTTSEngine, EngineConfig, Language } from './base';

export class OpenAIEngine extends BaseTTSEngine {
  private client: OpenAI | null = null;
  private audio: HTMLAudioElement | null = null;
  private audioUrl: string | null = null;

  constructor(config: EngineConfig) {
    super(config);
  }

  async initialize(config: EngineConfig): Promise<void> {
    this.config = config;

    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  async speak(text: string, language: Language): Promise<void> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    return new Promise(async (resolve, reject) => {
      try {
        // Clean up previous audio if exists
        this.cleanup();

        // Select voice based on language
        const voice = language === 'zh-CN' ? 'nova' : 'alloy';

        // Call OpenAI TTS API
        const response = await this.client!.audio.speech.create({
          model: 'tts-1',
          voice: voice,
          input: text,
          speed: this.config.speechRate || 1.0
        });

        // Convert response to blob
        const arrayBuffer = await response.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
        this.audioUrl = URL.createObjectURL(blob);

        // Create and setup audio element
        this.audio = new Audio(this.audioUrl);

        this.audio.onloadeddata = () => {
          this.status = 'playing';
        };

        this.audio.onplay = () => {
          this.status = 'playing';
        };

        this.audio.onended = () => {
          this.status = 'idle';
          this.cleanup();
          resolve();
        };

        this.audio.onerror = (event) => {
          this.status = 'idle';
          this.cleanup();
          reject(new Error(`Audio playback error: ${event}`));
        };

        // Start playback
        await this.audio.play();
        this.status = 'playing';
      } catch (error) {
        this.status = 'idle';
        this.cleanup();
        reject(error);
      }
    });
  }

  pause(): void {
    if (this.audio && this.status === 'playing') {
      this.audio.pause();
      this.status = 'paused';
    }
  }

  resume(): void {
    if (this.audio && this.status === 'paused') {
      this.audio.play();
      this.status = 'playing';
    }
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.status = 'idle';
    this.cleanup();
  }

  private cleanup(): void {
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
      this.audioUrl = null;
    }
    if (this.audio) {
      this.audio.src = '';
      this.audio = null;
    }
  }
}
