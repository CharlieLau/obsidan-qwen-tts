// src/settings.ts

import { App, PluginSettingTab, Setting } from 'obsidian';
import { EngineType } from './tts/engines/base';
import TTSPlugin from './main';

export interface TTSSettings {
  currentEngine: EngineType;
  aliyun: {
    accessKeyId: string;
    accessKeySecret: string;
  };
  tencent: {
    secretId: string;
    secretKey: string;
  };
  qwen: {
    apiKey: string;
    model: string;
    voice: string;
    customVoice: string;
    voiceList: Array<{ key: string; value: string }>;
  };
  openai: {
    apiKey: string;
  };
  speechRate: number;
}

export const DEFAULT_SETTINGS: TTSSettings = {
  currentEngine: 'web-speech',
  aliyun: {
    accessKeyId: '',
    accessKeySecret: ''
  },
  tencent: {
    secretId: '',
    secretKey: ''
  },
  qwen: {
    apiKey: '',
    model: 'qwen3-tts-instruct-flash',
    voice: 'Cherry',
    customVoice: '',
    voiceList: [
      { key: 'Cherry', value: 'Cherry (芊悦)' },
      { key: 'Serena', value: 'Serena (苏瑶)' },
      { key: 'Ethan', value: 'Ethan (晨煦)' },
      { key: 'Chelsie', value: 'Chelsie (千雪)' },
      { key: 'Momo', value: 'Momo (茉兔)' },
      { key: 'Vivian', value: 'Vivian (十三)' },
      { key: 'Moon', value: 'Moon (月白)' },
      { key: 'Maia', value: 'Maia (四月)' },
      { key: 'Kai', value: 'Kai (凯)' },
      { key: 'Nofish', value: 'Nofish (不吃鱼)' },
      { key: 'Bella', value: 'Bella (萌宝)' }
    ]
  },
  openai: {
    apiKey: ''
  },
  speechRate: 1.0
};

export class TTSSettingTab extends PluginSettingTab {
  plugin: TTSPlugin;

  constructor(app: App, plugin: TTSPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'TTS 设置' });

    // 引擎选择
    new Setting(containerEl)
      .setName('TTS 引擎')
      .setDesc('选择要使用的 TTS 引擎')
      .addDropdown(dropdown => dropdown
        .addOption('web-speech', 'Web Speech API（默认）')
        .addOption('aliyun', '阿里云 TTS')
        .addOption('tencent', '腾讯云 TTS')
        .addOption('qwen', '通义千问 TTS')
        .addOption('openai', 'OpenAI TTS')
        .setValue(this.plugin.settings.currentEngine)
        .onChange(async (value) => {
          this.plugin.settings.currentEngine = value as EngineType;
          await this.plugin.saveSettings();
          this.display(); // 重新渲染以显示对应的配置项
        }));

    // 语速设置
    new Setting(containerEl)
      .setName('语速')
      .setDesc('调整语音播放速度（0.5 - 2.0）')
      .addSlider(slider => slider
        .setLimits(0.5, 2.0, 0.1)
        .setValue(this.plugin.settings.speechRate)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.speechRate = value;
          await this.plugin.saveSettings();
        }));

    // 根据选择的引擎显示对应的配置
    this.displayEngineSettings(containerEl);
  }

  private createVoiceListItem(containerEl: HTMLElement, voice: { key: string; value: string }, index: number): void {
    const setting = new Setting(containerEl)
      .setClass('tts-voice-list-item')
      .addText(text => text
        .setPlaceholder('Key (如 Cherry)')
        .setValue(voice.key)
        .onChange(async (value) => {
          this.plugin.settings.qwen.voiceList[index].key = value;
          await this.plugin.saveSettings();
        }))
      .addText(text => text
        .setPlaceholder('Value (如 Cherry (芊悦))')
        .setValue(voice.value)
        .onChange(async (value) => {
          this.plugin.settings.qwen.voiceList[index].value = value;
          await this.plugin.saveSettings();
        }))
      .addButton(button => button
        .setButtonText('删除')
        .setWarning()
        .onClick(async () => {
          this.plugin.settings.qwen.voiceList.splice(index, 1);
          await this.plugin.saveSettings();
          this.display(); // 重新渲染
        }));

    // 移除默认的 setting-item-info（左侧的名称和描述区域）
    const infoEl = setting.settingEl.querySelector('.setting-item-info');
    if (infoEl) {
      infoEl.remove();
    }

    // 调整 setting-item-control 宽度为 100%
    const controlEl = setting.settingEl.querySelector('.setting-item-control') as HTMLElement;
    if (controlEl) {
      controlEl.style.flexGrow = '1';
      controlEl.style.display = 'flex';
      controlEl.style.gap = '10px';
      controlEl.style.justifyContent = 'flex-start';
    }
  }

  private displayEngineSettings(containerEl: HTMLElement): void {
    const engine = this.plugin.settings.currentEngine;

    if (engine === 'aliyun') {
      containerEl.createEl('h3', { text: '阿里云配置' });

      new Setting(containerEl)
        .setName('Access Key ID')
        .addText(text => text
          .setPlaceholder('输入 Access Key ID')
          .setValue(this.plugin.settings.aliyun.accessKeyId)
          .onChange(async (value) => {
            this.plugin.settings.aliyun.accessKeyId = value;
            await this.plugin.saveSettings();
          }));

      new Setting(containerEl)
        .setName('Access Key Secret')
        .addText(text => text
          .setPlaceholder('输入 Access Key Secret')
          .setValue(this.plugin.settings.aliyun.accessKeySecret)
          .onChange(async (value) => {
            this.plugin.settings.aliyun.accessKeySecret = value;
            await this.plugin.saveSettings();
          }));
    } else if (engine === 'tencent') {
      containerEl.createEl('h3', { text: '腾讯云配置' });

      new Setting(containerEl)
        .setName('Secret ID')
        .addText(text => text
          .setPlaceholder('输入 Secret ID')
          .setValue(this.plugin.settings.tencent.secretId)
          .onChange(async (value) => {
            this.plugin.settings.tencent.secretId = value;
            await this.plugin.saveSettings();
          }));

      new Setting(containerEl)
        .setName('Secret Key')
        .addText(text => text
          .setPlaceholder('输入 Secret Key')
          .setValue(this.plugin.settings.tencent.secretKey)
          .onChange(async (value) => {
            this.plugin.settings.tencent.secretKey = value;
            await this.plugin.saveSettings();
          }));
    } else if (engine === 'qwen') {
      containerEl.createEl('h3', { text: '通义千问配置' });

      new Setting(containerEl)
        .setName('API Key')
        .addText(text => text
          .setPlaceholder('输入 API Key')
          .setValue(this.plugin.settings.qwen.apiKey)
          .onChange(async (value) => {
            this.plugin.settings.qwen.apiKey = value;
            await this.plugin.saveSettings();
          }));

      new Setting(containerEl)
        .setName('模型')
        .setDesc('选择 TTS 模型（默认：qwen3-tts-instruct-flash）')
        .addText(text => text
          .setPlaceholder('输入模型名称')
          .setValue(this.plugin.settings.qwen.model)
          .onChange(async (value) => {
            this.plugin.settings.qwen.model = value;
            await this.plugin.saveSettings();
          }));

      new Setting(containerEl)
        .setName('音色选择')
        .setDesc('选择语音合成的音色')
        .addDropdown(dropdown => {
          // 从 voiceList 动态生成选项
          this.plugin.settings.qwen.voiceList.forEach(voice => {
            dropdown.addOption(voice.key, voice.value);
          });
          return dropdown
            .setValue(this.plugin.settings.qwen.voice)
            .onChange(async (value) => {
              this.plugin.settings.qwen.voice = value;
              await this.plugin.saveSettings();
            });
        });

      // 音色列表管理
      containerEl.createEl('h4', { text: '音色列表管理' });

      const voiceListDesc = containerEl.createEl('div', {
        cls: 'setting-item-description',
        text: '管理可用的音色列表。Key 是音色的实际值（如 Cherry），Value 是显示名称（如 Cherry (芊悦)）。'
      });
      voiceListDesc.style.marginBottom = '10px';

      // 显示现有音色列表
      this.plugin.settings.qwen.voiceList.forEach((voice, index) => {
        this.createVoiceListItem(containerEl, voice, index);
      });

      // 添加新音色按钮
      new Setting(containerEl)
        .addButton(button => button
          .setButtonText('+ 添加音色')
          .onClick(async () => {
            this.plugin.settings.qwen.voiceList.push({ key: '', value: '' });
            await this.plugin.saveSettings();
            this.display(); // 重新渲染
          }));
    } else if (engine === 'openai') {
      containerEl.createEl('h3', { text: 'OpenAI 配置' });

      new Setting(containerEl)
        .setName('API Key')
        .addText(text => text
          .setPlaceholder('输入 OpenAI API Key')
          .setValue(this.plugin.settings.openai.apiKey)
          .onChange(async (value) => {
            this.plugin.settings.openai.apiKey = value;
            await this.plugin.saveSettings();
          }));
    }
  }
}
