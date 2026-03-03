// src/ui/controller.ts

import { MarkdownView, Notice } from 'obsidian';
import { TTSEngineManager } from '../tts/engine-manager';
import { ContentParser } from '../parser/content-parser';
import { EngineStatus } from '../tts/engines/base';

export class TTSController {
  private controlBar: HTMLElement | null = null;
  private startButton: HTMLButtonElement;
  private pauseButton: HTMLButtonElement;
  private stopButton: HTMLButtonElement;
  private statusText: HTMLSpanElement;
  private engineManager: TTSEngineManager;
  private contentParser: ContentParser;

  constructor(engineManager: TTSEngineManager) {
    this.engineManager = engineManager;
    this.contentParser = new ContentParser();
  }

  renderControlBar(view: MarkdownView): void {
    // 移除旧的控制条
    this.removeControlBar();

    // 创建控制条容器
    this.controlBar = document.createElement('div');
    this.controlBar.addClass('tts-control-bar');

    // 创建开始按钮
    this.startButton = document.createElement('button');
    this.startButton.textContent = '▶️ 开始';
    this.startButton.onclick = () => this.handleStart(view);

    // 创建暂停按钮
    this.pauseButton = document.createElement('button');
    this.pauseButton.textContent = '⏸️ 暂停';
    this.pauseButton.onclick = () => this.handlePause();
    this.pauseButton.style.display = 'none';

    // 创建停止按钮
    this.stopButton = document.createElement('button');
    this.stopButton.textContent = '⏹️ 停止';
    this.stopButton.onclick = () => this.handleStop();
    this.stopButton.style.display = 'none';

    // 创建状态文本
    this.statusText = document.createElement('span');
    this.statusText.addClass('tts-status-text');
    this.statusText.textContent = '就绪';

    // 添加所有元素到控制条
    this.controlBar.appendChild(this.startButton);
    this.controlBar.appendChild(this.pauseButton);
    this.controlBar.appendChild(this.stopButton);
    this.controlBar.appendChild(this.statusText);

    // 将控制条插入到编辑器容器
    const contentEl = view.containerEl.querySelector('.view-content');
    if (contentEl) {
      contentEl.insertBefore(this.controlBar, contentEl.firstChild);
    }
  }

  private async handleStart(view: MarkdownView): Promise<void> {
    try {
      // 获取当前笔记内容
      const editor = view.editor;
      const content = editor.getValue();

      if (!content || content.trim().length === 0) {
        new Notice('笔记内容为空');
        return;
      }

      // 解析内容
      const parsed = this.contentParser.parse(content);

      if (parsed.segments.length === 0) {
        new Notice('没有可朗读的内容');
        return;
      }

      // 更新 UI
      this.updateUIState('playing');
      this.statusText.textContent = '正在播放...';

      // 开始播放
      await this.engineManager.speakSegments(parsed.segments);

      // 播放完成
      this.updateUIState('idle');
      this.statusText.textContent = '播放完成';
    } catch (error) {
      new Notice(`播放失败: ${error.message}`);
      this.updateUIState('idle');
      this.statusText.textContent = '播放失败';
    }
  }

  private handlePause(): void {
    const status = this.engineManager.getStatus();

    if (status === 'playing') {
      this.engineManager.pause();
      this.updateUIState('paused');
      this.statusText.textContent = '已暂停';
      this.pauseButton.textContent = '▶️ 继续';
    } else if (status === 'paused') {
      this.engineManager.resume();
      this.updateUIState('playing');
      this.statusText.textContent = '正在播放...';
      this.pauseButton.textContent = '⏸️ 暂停';
    }
  }

  private handleStop(): void {
    this.engineManager.stop();
    this.updateUIState('idle');
    this.statusText.textContent = '已停止';
  }

  private updateUIState(status: EngineStatus): void {
    if (status === 'idle') {
      this.startButton.style.display = '';
      this.pauseButton.style.display = 'none';
      this.stopButton.style.display = 'none';
    } else if (status === 'playing') {
      this.startButton.style.display = 'none';
      this.pauseButton.style.display = '';
      this.pauseButton.textContent = '⏸️ 暂停';
      this.stopButton.style.display = '';
    } else if (status === 'paused') {
      this.startButton.style.display = 'none';
      this.pauseButton.style.display = '';
      this.pauseButton.textContent = '▶️ 继续';
      this.stopButton.style.display = '';
    }
  }

  removeControlBar(): void {
    if (this.controlBar) {
      this.controlBar.remove();
      this.controlBar = null;
    }
  }
}
