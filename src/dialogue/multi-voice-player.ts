// src/dialogue/multi-voice-player.ts

import { TTSEngineManager } from '../tts/engine-manager';
import { DialogueLine } from './types';
import { Language } from '../tts/engines/base';

export class MultiVoicePlayer {
  private engineManager: TTSEngineManager;
  private currentIndex: number = 0;
  private dialogueLines: DialogueLine[] = [];
  private isPlaying: boolean = false;

  constructor(engineManager: TTSEngineManager) {
    this.engineManager = engineManager;
  }

  /**
   * 加载对话脚本准备播放
   */
  async loadDialogue(lines: DialogueLine[]): Promise<void> {
    this.dialogueLines = lines;
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
    await this.playNext();
  }

  /**
   * 播放下一句对话
   */
  private async playNext(): Promise<void> {
    if (!this.isPlaying || this.currentIndex >= this.dialogueLines.length) {
      this.isPlaying = false;
      return;
    }

    const line = this.dialogueLines[this.currentIndex];

    // 切换音色
    await this.engineManager.initialize({
      type: 'qwen',
      voice: line.voice,
      apiKey: (this.engineManager as any).config?.apiKey,
      model: (this.engineManager as any).config?.model,
      speechRate: (this.engineManager as any).config?.speechRate
    });

    // 检测语言
    const language = this.detectLanguage(line.content);

    // 播放当前句
    try {
      await this.engineManager.currentEngine.speak(line.content, language);

      // 播放完成，继续下一句
      this.currentIndex++;
      await this.playNext();
    } catch (error) {
      this.isPlaying = false;
      throw error;
    }
  }

  /**
   * 暂停播放
   */
  pause(): void {
    this.isPlaying = false;
    this.engineManager.pause();
  }

  /**
   * 继续播放
   */
  resume(): void {
    if (this.currentIndex < this.dialogueLines.length) {
      this.isPlaying = true;
      this.engineManager.resume();
    }
  }

  /**
   * 停止播放
   */
  stop(): void {
    this.isPlaying = false;
    this.currentIndex = 0;
    this.engineManager.stop();
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
   * 简单的语言检测
   */
  private detectLanguage(text: string): Language {
    return /[\u4e00-\u9fa5]/.test(text) ? 'zh-CN' : 'en-US';
  }
}
