// src/dialogue/dialogue-progress-modal.ts

import { App, Modal } from 'obsidian';
import { DialogueGenerationProgress } from './types';

export class DialogueProgressModal extends Modal {
  private progressBar: HTMLElement;
  private messageEl: HTMLElement;
  private percentageEl: HTMLElement;

  constructor(app: App) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('dialogue-progress-modal');

    // 标题
    contentEl.createEl('h2', { text: '生成对话中...' });

    // 进度条容器
    const progressContainer = contentEl.createDiv({ cls: 'progress-container' });

    // 进度条背景
    const progressTrack = progressContainer.createDiv({ cls: 'progress-track' });

    // 进度条填充
    this.progressBar = progressTrack.createDiv({ cls: 'progress-fill' });
    this.progressBar.style.width = '0%';

    // 百分比显示
    this.percentageEl = progressContainer.createDiv({ cls: 'progress-percentage' });
    this.percentageEl.textContent = '0%';

    // 消息显示
    this.messageEl = contentEl.createDiv({ cls: 'progress-message' });
    this.messageEl.textContent = '准备中...';
  }

  /**
   * 更新进度
   */
  updateProgress(progress: DialogueGenerationProgress): void {
    this.progressBar.style.width = `${progress.percentage}%`;
    this.percentageEl.textContent = `${progress.percentage}%`;
    this.messageEl.textContent = progress.message;
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
