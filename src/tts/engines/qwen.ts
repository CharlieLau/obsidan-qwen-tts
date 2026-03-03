// src/tts/engines/qwen.ts

import { requestUrl } from 'obsidian';
import { BaseTTSEngine, EngineConfig, Language } from './base';

export class QwenEngine extends BaseTTSEngine {
  private apiKey: string | null = null;
  private model: string = 'qwen3-tts-instruct-flash';
  private audio: HTMLAudioElement | null = null;
  private audioUrl: string | null = null;
  private progressInterval: number | null = null;
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
    this.model = config.model || 'qwen3-tts-instruct-flash';
  }

  async speak(text: string, language: Language): Promise<void> {
    if (!this.apiKey) {
      throw new Error('Qwen API key not initialized');
    }

    return new Promise(async (resolve, reject) => {
      try {
        // Clean up previous audio if exists
        this.cleanup();

        // Select voice and language type based on detected language
        // All voices support both Chinese and English
        // Available voices: Cherry, Serena, Ethan, Chelsie, Momo, Vivian, Moon, Maia, Kai, Nofish, Bella
        console.log('Detected language:', language);
        console.log('Configured voice:', this.config.voice);

        const voice = this.config.voice || 'Cherry'; // Default to Cherry
        const languageType = language === 'zh-CN' ? 'Chinese' : 'English';

        console.log('Using voice:', voice, 'for language:', languageType);

        // Prepare request body for configured model
        const requestBody = {
          model: this.model,
          input: {
            text: text,
            voice: voice,
            language_type: languageType
          }
        };

        // Call Qwen TTS API using Obsidian's requestUrl to bypass CORS
        console.log('Qwen TTS request:', requestBody);
        const response = await requestUrl({
          url: this.apiEndpoint,
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        console.log('Qwen TTS response status:', response.status);
        console.log('Qwen TTS response:', response.json);

        if (response.status !== 200) {
          console.error('Qwen TTS API error:', response.json);
          throw new Error(`Qwen TTS API error: ${response.status} - ${JSON.stringify(response.json)}`);
        }

        // Parse JSON response to get audio URL
        const result = response.json;
        if (!result.output || !result.output.audio || !result.output.audio.url) {
          throw new Error('Invalid API response: missing audio URL');
        }

        // Use the audio URL directly
        this.audioUrl = result.output.audio.url;

        // Create and setup audio element
        this.audio = new Audio(this.audioUrl!);

        this.audio.onloadeddata = () => {
          this.status = 'playing';
        };

        this.audio.onplay = () => {
          this.status = 'playing';
          this.startProgressTracking();
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
      this.stopProgressTracking();
    }
  }

  resume(): void {
    if (this.audio && this.status === 'paused') {
      this.audio.play();
      this.status = 'playing';
      this.startProgressTracking();
    }
  }

  stop(): void {
    this.status = 'idle';
    this.stopProgressTracking();

    if (this.audio) {
      // 移除所有事件监听器，避免触发错误回调
      this.audio.onloadeddata = null;
      this.audio.onplay = null;
      this.audio.onended = null;
      this.audio.onerror = null;

      // 停止播放
      this.audio.pause();
      this.audio.currentTime = 0;
    }

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

  private startProgressTracking(): void {
    this.stopProgressTracking();
    this.progressInterval = window.setInterval(() => {
      if (this.audio && this.config.onProgress) {
        this.config.onProgress(this.audio.currentTime, this.audio.duration || 0);
      }
    }, 100); // Update every 100ms
  }

  private stopProgressTracking(): void {
    if (this.progressInterval !== null) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  getCurrentTime(): number {
    return this.audio?.currentTime || 0;
  }

  getDuration(): number {
    return this.audio?.duration || 0;
  }
}
