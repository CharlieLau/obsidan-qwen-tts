// src/dialogue/dialogue-file-manager.ts

import { App } from 'obsidian';

export class DialogueFileManager {
  private app: App;
  private readonly dialogueFolder = '对话记录';

  constructor(app: App) {
    this.app = app;
  }

  /**
   * 确保对话目录存在
   */
  private async ensureDialogueFolderExists(): Promise<void> {
    const folderExists = await this.app.vault.adapter.exists(this.dialogueFolder);
    if (!folderExists) {
      await this.app.vault.adapter.mkdir(this.dialogueFolder);
    }
  }

  /**
   * 生成对话文件路径
   */
  getDialoguePath(originalPath: string): string {
    // 提取原文件名（不含路径）
    const fileName = originalPath.split('/').pop() || originalPath;

    // 移除扩展名
    const lastDot = fileName.lastIndexOf('.');
    const baseName = lastDot > 0 ? fileName.substring(0, lastDot) : fileName;

    // 生成对话文件路径：对话记录/原文件名-对话.md
    return `${this.dialogueFolder}/${baseName}-对话.md`;
  }

  /**
   * 保存对话脚本
   */
  async saveDialogue(originalPath: string, script: string): Promise<string> {
    // 确保对话目录存在
    await this.ensureDialogueFolderExists();

    const dialoguePath = this.getDialoguePath(originalPath);

    // 添加元信息
    const content = `---
generated: ${new Date().toISOString()}
source: ${originalPath}
sourceName: ${originalPath.split('/').pop()}
type: dialogue
---

${script}`;

    // 使用 Obsidian API 写入文件
    await this.app.vault.adapter.write(dialoguePath, content);

    return dialoguePath;
  }

  /**
   * 读取对话脚本
   */
  async loadDialogue(originalPath: string): Promise<string | null> {
    const dialoguePath = this.getDialoguePath(originalPath);

    try {
      const content = await this.app.vault.adapter.read(dialoguePath);

      // 移除 frontmatter
      const script = content.replace(/^---[\s\S]*?---\s*/m, '');

      return script;
    } catch (error) {
      // 文件不存在或读取失败
      return null;
    }
  }

  /**
   * 检查对话文件是否存在
   */
  async dialogueExists(originalPath: string): Promise<boolean> {
    const dialoguePath = this.getDialoguePath(originalPath);
    return await this.app.vault.adapter.exists(dialoguePath);
  }

  /**
   * 删除对话文件
   */
  async deleteDialogue(originalPath: string): Promise<void> {
    const dialoguePath = this.getDialoguePath(originalPath);

    if (await this.dialogueExists(originalPath)) {
      await this.app.vault.adapter.remove(dialoguePath);
    }
  }
}
