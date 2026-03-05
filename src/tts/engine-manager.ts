// src/tts/engine-manager.ts

import { Notice } from 'obsidian';
import { ITTSEngine, EngineType, EngineConfig, Language, EngineStatus } from './engines/base';
import { WebSpeechEngine } from './engines/web-speech';
import { OpenAIEngine } from './engines/openai';
import { QwenEngine } from './engines/qwen';
import { TextSegment } from '../utils/language-detector';

export class TTSEngineManager {
  private engines: Map<EngineType, ITTSEngine> = new Map();
  private currentEngine: ITTSEngine;
  private currentSegmentIndex: number = 0;
  private segments: Array<{ text: string; language: Language }> = [];
  private isPlaying: boolean = false;
  private currentSegments: TextSegment[] = [];

  constructor(config: EngineConfig) {
    // 初始化 Web Speech API 引擎（默认）
    const webSpeechEngine = new WebSpeechEngine(config);
    this.engines.set('web-speech', webSpeechEngine);

    // 初始化 OpenAI 引擎
    const openaiEngine = new OpenAIEngine(config);
    this.engines.set('openai', openaiEngine);

    // 初始化 Qwen 引擎
    const qwenEngine = new QwenEngine(config);
    this.engines.set('qwen', qwenEngine);

    this.currentEngine = webSpeechEngine;
  }

  async initialize(config: EngineConfig): Promise<void> {
    const engine = this.engines.get(config.type);
    if (engine) {
      // Store the config for later use
      this.config = config;
      await engine.initialize(config);
      this.currentEngine = engine;
    } else {
      // 如果引擎不存在，回退到 Web Speech API
      console.warn('Engine not found:', config.type, 'Falling back to web-speech');
      new Notice('选择的引擎不可用，使用默认引擎');
      this.currentEngine = this.engines.get('web-speech')!;
    }
  }

  private config: EngineConfig;

  async speakSegments(segments: Array<{ text: string; language: Language }>): Promise<void> {
    this.currentSegments = segments;
    this.currentSegmentIndex = 0;
    this.segments = segments;
    this.isPlaying = true;

    try {
      await this.playNextSegment();
    } catch (error) {
      new Notice(`播放错误: ${error.message}`);
      this.isPlaying = false;
    }
  }

  private async playNextSegment(): Promise<void> {
    if (!this.isPlaying || this.currentSegmentIndex >= this.segments.length) {
      this.isPlaying = false;
      return;
    }

    const segment = this.segments[this.currentSegmentIndex];
    await this.currentEngine.speak(segment.text, segment.language);

    this.currentSegmentIndex++;
    await this.playNextSegment();
  }

  pause(): void {
    this.currentEngine.pause();
    this.isPlaying = false;
  }

  resume(): void {
    if (this.currentEngine.getStatus() === 'paused') {
      this.currentEngine.resume();
      this.isPlaying = true;
    }
  }

  stop(): void {
    this.currentEngine.stop();
    this.isPlaying = false;
    this.currentSegmentIndex = 0;
  }

  getStatus(): EngineStatus {
    return this.currentEngine.getStatus();
  }

  /**
   * 使用指定音色播放文本（用于对话模式）
   */
  async speakWithVoice(text: string, language: Language, voice: string): Promise<void> {
    // 临时切换音色
    const originalVoice = this.config.voice;
    this.config.voice = voice;

    await this.currentEngine.initialize(this.config);
    await this.currentEngine.speak(text, language);

    // 恢复原音色
    this.config.voice = originalVoice;
  }

  /**
   * 更新播放速度
   */
  updatePlaybackSpeed(speed: number): void {
    if (this.config) {
      this.config.playbackSpeed = speed;
    }
  }

  async seekToSegment(index: number): Promise<void> {
    if (index < 0 || index >= this.currentSegments.length) {
      throw new Error(`Invalid segment index: ${index}`);
    }

    // Stop current playback
    this.stop();

    // Start from target segment
    this.currentSegmentIndex = index;
    const remainingSegments = this.currentSegments.slice(index);
    await this.speakSegments(remainingSegments);
  }
}
