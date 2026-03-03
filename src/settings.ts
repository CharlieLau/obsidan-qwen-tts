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
    voice: string;
    customVoice: string;
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
    voice: 'Cherry',
    customVoice: ''
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
        .setName('音色选择')
        .setDesc('选择语音合成的音色（所有音色支持中英文）')
        .addDropdown(dropdown => dropdown
          .addOption('Cherry', 'Cherry (芊悦) - 阳光积极、亲切自然')
          .addOption('Serena', 'Serena (苏瑶) - 温柔小姐姐')
          .addOption('Ethan', 'Ethan (晨煦) - 阳光温暖、活力朝气')
          .addOption('Chelsie', 'Chelsie (千雪) - 二次元虚拟女友')
          .addOption('Momo', 'Momo (茉兔) - 撒娇搞怪')
          .addOption('Vivian', 'Vivian (十三) - 拽拽的可爱小暴躁')
          .addOption('Moon', 'Moon (月白) - 率性帅气')
          .addOption('Maia', 'Maia (四月) - 知性与温柔')
          .addOption('Kai', 'Kai (凯) - 耳朵的SPA')
          .addOption('Nofish', 'Nofish (不吃鱼) - 设计师')
          .addOption('Bella', 'Bella (萌宝) - 可爱小萝莉')
          .setValue(this.plugin.settings.qwen.voice)
          .onChange(async (value) => {
            this.plugin.settings.qwen.voice = value;
            await this.plugin.saveSettings();
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
