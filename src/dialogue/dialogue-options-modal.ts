// src/dialogue/dialogue-options-modal.ts

import { App, Modal } from 'obsidian';

export type DialogueOption = 'use-existing' | 'regenerate' | 'cancel';

export class DialogueOptionsModal extends Modal {
  private resolvePromise: (value: DialogueOption) => void;

  constructor(app: App) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('dialogue-options-modal');

    // 标题
    contentEl.createEl('h2', { text: '对话文件已存在' });

    // 说明
    contentEl.createEl('p', {
      text: '检测到已有对话文件，你想：'
    });

    // 按钮容器
    const buttonContainer = contentEl.createDiv({ cls: 'dialogue-options-buttons' });

    // 使用现有对话
    const useButton = buttonContainer.createEl('button', {
      text: '使用现有对话',
      cls: 'mod-cta'
    });
    useButton.onclick = () => {
      this.close();
      this.resolvePromise('use-existing');
    };

    // 重新生成
    const regenButton = buttonContainer.createEl('button', {
      text: '重新生成'
    });
    regenButton.onclick = () => {
      this.close();
      this.resolvePromise('regenerate');
    };

    // 取消
    const cancelButton = buttonContainer.createEl('button', {
      text: '取消'
    });
    cancelButton.onclick = () => {
      this.close();
      this.resolvePromise('cancel');
    };
  }

  /**
   * 显示 Modal 并等待用户选择
   */
  async waitForChoice(): Promise<DialogueOption> {
    return new Promise((resolve) => {
      this.resolvePromise = resolve;
      this.open();
    });
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
