// src/dialogue/dialogue-config-modal.ts

import { App, Modal } from 'obsidian';
import { DialogueTemplate, DialogueStyle } from './types';
import { DialogueTemplateManager, TemplateVoiceConfig } from './dialogue-template-manager';

export interface DialogueConfig {
  template: DialogueTemplate;
  style: DialogueStyle;
}

export class DialogueConfigModal extends Modal {
  private templateManager: DialogueTemplateManager;
  private selectedTemplate: string;
  private selectedStyle: DialogueStyle;
  private resolvePromise: ((config: DialogueConfig | null) => void) | null = null;

  constructor(
    app: App,
    defaultTemplate: string,
    defaultStyle: DialogueStyle,
    voiceConfig?: TemplateVoiceConfig
  ) {
    super(app);
    this.templateManager = new DialogueTemplateManager(voiceConfig);
    this.selectedTemplate = defaultTemplate;
    this.selectedStyle = defaultStyle;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('dialogue-config-modal');

    // Title
    contentEl.createEl('h2', { text: '对话模式配置' });

    // Template selection
    const templateSection = contentEl.createDiv('dialogue-config-section');
    templateSection.createEl('h3', { text: '选择模板' });

    const templateGrid = templateSection.createDiv('template-grid');

    const templates = this.templateManager.getTemplates();
    templates.forEach(template => {
      const templateCard = templateGrid.createDiv('template-card');
      if (template.id === this.selectedTemplate) {
        templateCard.addClass('selected');
      }

      const icon = templateCard.createDiv('template-icon');
      icon.textContent = template.icon;

      const name = templateCard.createDiv('template-name');
      name.textContent = template.name;

      const desc = templateCard.createDiv('template-desc');
      desc.textContent = template.description;

      templateCard.onclick = () => {
        // Remove previous selection
        templateGrid.querySelectorAll('.template-card').forEach(card => {
          card.removeClass('selected');
        });
        templateCard.addClass('selected');
        this.selectedTemplate = template.id;
      };
    });

    // Style selection
    const styleSection = contentEl.createDiv('dialogue-config-section');
    styleSection.createEl('h3', { text: '对话风格' });

    const styleGrid = styleSection.createDiv('style-grid');

    const styles: Array<{ id: DialogueStyle; name: string; desc: string }> = [
      { id: 'formal', name: '正式', desc: '语言规范、逻辑严密' },
      { id: 'casual', name: '轻松', desc: '语言通俗、比喻生动' },
      { id: 'humorous', name: '幽默', desc: '加入幽默元素、俏皮话' }
    ];

    styles.forEach(style => {
      const styleCard = styleGrid.createDiv('style-card');
      if (style.id === this.selectedStyle) {
        styleCard.addClass('selected');
      }

      const name = styleCard.createDiv('style-name');
      name.textContent = style.name;

      const desc = styleCard.createDiv('style-desc');
      desc.textContent = style.desc;

      styleCard.onclick = () => {
        styleGrid.querySelectorAll('.style-card').forEach(card => {
          card.removeClass('selected');
        });
        styleCard.addClass('selected');
        this.selectedStyle = style.id;
      };
    });

    // Buttons
    const buttonContainer = contentEl.createDiv('dialogue-config-buttons');

    const cancelButton = buttonContainer.createEl('button', { text: '取消' });
    cancelButton.onclick = () => {
      this.resolvePromise?.(null);
      this.close();
    };

    const confirmButton = buttonContainer.createEl('button', {
      text: '开始生成',
      cls: 'mod-cta'
    });
    confirmButton.onclick = () => {
      const template = this.templateManager.getTemplate(this.selectedTemplate);
      if (template) {
        this.resolvePromise?.({
          template,
          style: this.selectedStyle
        });
      }
      this.close();
    };
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  async waitForConfig(): Promise<DialogueConfig | null> {
    return new Promise(resolve => {
      this.resolvePromise = resolve;
    });
  }
}
