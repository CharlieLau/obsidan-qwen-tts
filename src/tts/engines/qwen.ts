// src/tts/engines/qwen.ts

import { BaseTTSEngine, EngineConfig, Language } from './base';

export class QwenEngine extends BaseTTSEngine {
  private apiKey: string | null = null;
  private audio: HTMLAudioElement | null = null;
  private audioUrl: string | null = null;
  private readonly apiEndpoint = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';

  constructor(config: EngineConfig) {
    super(config);
  }

  async initialize(config: EngineConfig): Promise<void> {
    this.config = config;

    if (!config.apiKey) {
      throw new Error('Qwen API key is required');
    }

    this.apiKey = config.apiKey;
  }

  async speak(text: string, language: Language): Promise<void> {
    if (!this.apiKey) {
      throw new Error('Qwen API key not initialized');
    }

    return new Promise(async (resolve, reject) => {
      try {
        // Clean up previous audio if exists
        this.cleanup();

        // Select voice based on language and config
        const voice = this.config.voice || (language === 'zh-CN' ? 'Cherry' : 'Emily');
        const languageType = language === 'zh-CN' ? 'Chinese' : 'English';

        // Prepare request body for qwen3-tts-instruct-flash model
        const requestBody = {
          model: 'qwen3-tts-instruct-flash',
          input: {
            text: text,
            voice: voice,
            language_type: languageType
          }
        };

        // Call Qwen TTS API
        const response = await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Qwen TTS API error: ${response.status} - ${errorText}`);
        }

        // Parse JSON response to get audio URL
        const result = await response.json();
        if (!result.output || !result.output.audio || !result.output.audio.url) {
          throw new Error('Invalid API response: missing audio URL');
        }

        // Use the audio URL directly
        this.audioUrl = result.output.audio.url;

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
    // Note: audioUrl is from API, not a blob URL, so no need to revoke
    this.audioUrl = null;
    if (this.audio) {
      this.audio.src = '';
      this.audio = null;
    }
  }
}
