// src/dialogue/dialogue-file-manager.ts

import { App } from 'obsidian';

export class DialogueFileManager {
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  /**
   * 生成对话文件路径
   */
  getDialoguePath(originalPath: string): string {
    const lastDot = originalPath.lastIndexOf('.');
    const lastSlash = originalPath.lastIndexOf('/');

    if (lastDot > lastSlash) {
      // 有扩展名
      return originalPath.substring(0, lastDot) + '-对话.md';
    } else {
      // 无扩展名
      return originalPath + '-对话.md';
    }
  }

  /**
   * 保存对话脚本
   */
  async saveDialogue(originalPath: string, script: string): Promise<string> {
    const dialoguePath = this.getDialoguePath(originalPath);

    // 添加元信息
    const content = `---
generated: ${new Date().toISOString()}
source: ${originalPath.split('/').pop()}
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
      const withoutFrontmatter = content.replace(/^---[\s\S]*?---\s*/m, '');

      return withoutFrontmatter;
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
