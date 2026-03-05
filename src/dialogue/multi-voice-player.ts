// src/dialogue/multi-voice-player.ts

import { TTSEngineManager } from '../tts/engine-manager';
import { DialogueLine } from './types';
import { Language, EngineStatus } from '../tts/engines/base';

export class MultiVoicePlayer {
  private engineManager: TTSEngineManager;
  private currentIndex: number = 0;
  private dialogueLines: DialogueLine[] = [];
  private isPlaying: boolean = false;
  private currentAudio: HTMLAudioElement | null = null;
  private isPaused: boolean = false;
  private mergedAudioUrl: string | null = null;
  private onProgressUpdate?: (current: number, total: number) => void;
  private getPlaybackSpeed: () => number;

  constructor(engineManager: TTSEngineManager, getPlaybackSpeed: () => number) {
    this.engineManager = engineManager;
    this.getPlaybackSpeed = getPlaybackSpeed;
  }

  /**
   * 设置进度更新回调
   */
  setProgressCallback(callback: (current: number, total: number) => void): void {
    this.onProgressUpdate = callback;
  }

  /**
   * 加载对话脚本准备播放
   */
  async loadDialogue(lines: DialogueLine[], mergedAudioUrl?: string): Promise<void> {
    this.dialogueLines = lines;
    this.mergedAudioUrl = mergedAudioUrl || null;
    this.currentIndex = 0;
  }

  /**
   * 开始播放对话
   */
  async play(): Promise<void> {
    if (this.dialogueLines.length === 0) {
      throw new Error('没有可播放的对话内容');
    }

    this.isPlaying = true;

    // 如果有合并的音频，直接播放
    if (this.mergedAudioUrl) {
      await this.playMergedAudio();
    } else {
      // 否则逐句播放
      await this.playNext();
    }
  }

  /**
   * 播放合并后的完整音频
   */
  private async playMergedAudio(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.currentAudio = new Audio(this.mergedAudioUrl!);

      // Apply playback speed
      this.currentAudio.playbackRate = this.getPlaybackSpeed();

      // 监听时间更新，更新进度条
      this.currentAudio.ontimeupdate = () => {
        if (this.currentAudio && this.onProgressUpdate) {
          const current = this.currentAudio.currentTime;
          const total = this.currentAudio.duration;
          if (!isNaN(current) && !isNaN(total) && total > 0) {
            this.onProgressUpdate(current, total);
          }
        }
      };

      this.currentAudio.onended = () => {
        this.isPlaying = false;
        this.cleanup();
        resolve();
      };

      this.currentAudio.onerror = (event) => {
        this.isPlaying = false;
        this.cleanup();
        reject(new Error(`音频播放错误: ${event}`));
      };

      this.currentAudio.play().catch(reject);
    });
  }

  /**
   * 播放下一句对话（实时生成模式）
   */
  private async playNext(): Promise<void> {
    if (!this.isPlaying || this.currentIndex >= this.dialogueLines.length) {
      this.isPlaying = false;
      this.cleanup();
      return;
    }

    const line = this.dialogueLines[this.currentIndex];
    const language = this.detectLanguage(line.content);

    try {
      await this.engineManager.speakWithVoice(line.content, language, line.voice);
      this.currentIndex++;
      await this.playNext();
    } catch (error) {
      this.isPlaying = false;
      throw error;
    }
  }

  /**
   * 清理当前音频
   */
  private cleanup(): void {
    if (this.currentAudio) {
      // 移除所有事件监听器
      this.currentAudio.ontimeupdate = null;
      this.currentAudio.onended = null;
      this.currentAudio.onerror = null;
      this.currentAudio.pause();
      this.currentAudio.src = '';
      this.currentAudio = null;
    }
  }

  /**
   * 暂停播放
   */
  pause(): void {
    this.isPlaying = false;
    this.isPaused = true;

    if (this.currentAudio) {
      this.currentAudio.pause();
    } else {
      this.engineManager.pause();
    }
  }

  /**
   * 继续播放
   */
  resume(): void {
    if (this.currentIndex < this.dialogueLines.length) {
      this.isPlaying = true;
      this.isPaused = false;

      if (this.currentAudio) {
        this.currentAudio.play();
      } else {
        this.engineManager.resume();
      }
    }
  }

  /**
   * 停止播放
   */
  stop(): void {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentIndex = 0;

    this.cleanup();
    this.engineManager.stop();
  }

  /**
   * 获取播放状态
   */
  getStatus(): EngineStatus {
    if (this.isPlaying) {
      return 'playing';
    } else if (this.isPaused) {
      return 'paused';
    } else {
      return 'idle';
    }
  }

  /**
   * 获取当前音频元素
   */
  getCurrentAudio(): HTMLAudioElement | null {
    return this.currentAudio;
  }

  /**
   * 获取播放进度
   */
  getProgress(): { current: number; total: number; percentage: number } {
    return {
      current: this.currentIndex,
      total: this.dialogueLines.length,
      percentage: this.dialogueLines.length > 0
        ? (this.currentIndex / this.dialogueLines.length) * 100
        : 0
    };
  }

  /**
   * 跳转到指定对话
   */
  async seekTo(index: number): Promise<void> {
    if (index < 0 || index >= this.dialogueLines.length) {
      throw new Error('Invalid dialogue index');
    }

    this.stop();
    this.currentIndex = index;
    await this.play();
  }

  /**
   * 跳转到指定时间（秒）
   * 仅在有合并音频时有效
   */
  seekToTime(seconds: number): void {
    if (!this.currentAudio) {
      console.warn('No audio available for seeking');
      return;
    }

    if (!this.mergedAudioUrl) {
      console.warn('Seeking only available with merged audio');
      return;
    }

    const duration = this.currentAudio.duration;
    if (isNaN(duration) || duration === 0) {
      console.warn('Audio duration not available');
      return;
    }

    // 限制在有效范围内
    const targetTime = Math.max(0, Math.min(seconds, duration));
    this.currentAudio.currentTime = targetTime;
  }

  /**
   * 简单的语言检测
   */
  private detectLanguage(text: string): Language {
    return /[\u4e00-\u9fa5]/.test(text) ? 'zh-CN' : 'en-US';
  }
}
