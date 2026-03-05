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
    voiceList: Array<{ key: string; value: string; desc?: string }>;
    dialogueModel: string;
    dialogueMode: 'education' | 'podcast';
    // 教育模式音色配置
    educationVoices: {
      host: string;      // 主讲人
      curious: string;   // 好奇学生
      critical: string;  // 批判学生
    };
    // 播客模式音色配置
    podcastVoices: {
      host1: string;     // 主播A
      host2: string;     // 主播B
    };
  };
  openai: {
    apiKey: string;
  };
  speechRate: number;
  playbackSpeed: number;
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
      { key: 'Cherry', value: 'Cherry (芊悦)', desc: '阳光积极、亲切自然小姐姐（女性）' },
      { key: 'Serena', value: 'Serena (苏瑶)', desc: '温柔小姐姐（女性）' },
      { key: 'Ethan', value: 'Ethan (晨煦)', desc: '阳光、温暖、活力、朝气（男性）' },
      { key: 'Chelsie', value: 'Chelsie (千雪)', desc: '二次元虚拟女友（女性）' },
      { key: 'Momo', value: 'Momo (茉兔)', desc: '撒娇搞怪，逗你开心（女性）' },
      { key: 'Vivian', value: 'Vivian (十三)', desc: '拽拽的、可爱的小暴躁（女性）' },
      { key: 'Moon', value: 'Moon (月白)', desc: '率性帅气的月白（男性）' },
      { key: 'Maia', value: 'Maia (四月)', desc: '知性与温柔的碰撞（女性）' },
      { key: 'Kai', value: 'Kai (凯)', desc: '耳朵的一场SPA（男性）' },
      { key: 'Nofish', value: 'Nofish (不吃鱼)', desc: '不会翘舌音的设计师（男性）' },
      { key: 'Bella', value: 'Bella (萌宝)', desc: '喝酒不打醉拳的小萝莉（女性）' }
    ],
    dialogueModel: 'qwen3.5-plus',
    dialogueMode: 'education',
    educationVoices: {
      host: 'Ethan',      // 主讲人 - 稳重男声
      curious: 'Cherry',  // 好奇学生 - 活泼女声
      critical: 'Serena'  // 批判学生 - 理性女声
    },
    podcastVoices: {
      host1: 'Moon',      // 主播A - 率性帅气男声
      host2: 'Maia'       // 主播B - 知性温柔女声
    }
  },
  openai: {
    apiKey: ''
  },
  speechRate: 1.0,
  playbackSpeed: 1.0
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

  private createVoiceListItem(containerEl: HTMLElement, voice: { key: string; value: string; desc?: string }, index: number): void {
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
      .addText(text => text
        .setPlaceholder('描述 (如 阳光积极、亲切自然)')
        .setValue(voice.desc || '')
        .onChange(async (value) => {
          this.plugin.settings.qwen.voiceList[index].desc = value;
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
        .setName('TTS 模型')
        .setDesc('语音合成模型（默认：qwen3-tts-instruct-flash）')
        .addText(text => text
          .setPlaceholder('输入模型名称')
          .setValue(this.plugin.settings.qwen.model)
          .onChange(async (value) => {
            this.plugin.settings.qwen.model = value;
            await this.plugin.saveSettings();
          }));

      new Setting(containerEl)
        .setName('对话生成模型')
        .setDesc('用于生成对话脚本的文本模型（默认：qwen3.5-plus）')
        .addText(text => text
          .setPlaceholder('输入模型名称')
          .setValue(this.plugin.settings.qwen.dialogueModel)
          .onChange(async (value) => {
            this.plugin.settings.qwen.dialogueModel = value;
            await this.plugin.saveSettings();
          }));

      new Setting(containerEl)
        .setName('对话模式')
        .setDesc('选择对话风格：教育模式（三人课堂）或播客模式（双人聊天）')
        .addDropdown(dropdown => dropdown
          .addOption('education', '📚 教育模式（主讲人+学生）')
          .addOption('podcast', '🎙️ 播客模式（双主播闲聊）')
          .setValue(this.plugin.settings.qwen.dialogueMode)
          .onChange(async (value) => {
            this.plugin.settings.qwen.dialogueMode = value as 'education' | 'podcast';
            await this.plugin.saveSettings();
            this.display(); // 重新渲染以显示对应的音色配置
          }));

      // 教育模式音色配置
      if (this.plugin.settings.qwen.dialogueMode === 'education') {
        containerEl.createEl('h4', { text: '教育模式音色配置' });

        new Setting(containerEl)
          .setName('主讲人音色')
          .setDesc('负责讲解核心内容的老师')
          .addDropdown(dropdown => {
            this.plugin.settings.qwen.voiceList.forEach(voice => {
              dropdown.addOption(voice.key, voice.value);
            });
            return dropdown
              .setValue(this.plugin.settings.qwen.educationVoices.host)
              .onChange(async (value) => {
                this.plugin.settings.qwen.educationVoices.host = value;
                await this.plugin.saveSettings();
              });
          });

        new Setting(containerEl)
          .setName('好奇学生音色')
          .setDesc('提出基础问题的学习者')
          .addDropdown(dropdown => {
            this.plugin.settings.qwen.voiceList.forEach(voice => {
              dropdown.addOption(voice.key, voice.value);
            });
            return dropdown
              .setValue(this.plugin.settings.qwen.educationVoices.curious)
              .onChange(async (value) => {
                this.plugin.settings.qwen.educationVoices.curious = value;
                await this.plugin.saveSettings();
              });
          });

        new Setting(containerEl)
          .setName('批判学生音色')
          .setDesc('提出深度问题的学习者')
          .addDropdown(dropdown => {
            this.plugin.settings.qwen.voiceList.forEach(voice => {
              dropdown.addOption(voice.key, voice.value);
            });
            return dropdown
              .setValue(this.plugin.settings.qwen.educationVoices.critical)
              .onChange(async (value) => {
                this.plugin.settings.qwen.educationVoices.critical = value;
                await this.plugin.saveSettings();
              });
          });
      }

      // 播客模式音色配置
      if (this.plugin.settings.qwen.dialogueMode === 'podcast') {
        containerEl.createEl('h4', { text: '播客模式音色配置' });

        new Setting(containerEl)
          .setName('主播A音色')
          .setDesc('博主本人，分享见解和经验')
          .addDropdown(dropdown => {
            this.plugin.settings.qwen.voiceList.forEach(voice => {
              dropdown.addOption(voice.key, voice.value);
            });
            return dropdown
              .setValue(this.plugin.settings.qwen.podcastVoices.host1)
              .onChange(async (value) => {
                this.plugin.settings.qwen.podcastVoices.host1 = value;
                await this.plugin.saveSettings();
              });
          });

        new Setting(containerEl)
          .setName('主播B音色')
          .setDesc('好友搭档，提问互动')
          .addDropdown(dropdown => {
            this.plugin.settings.qwen.voiceList.forEach(voice => {
              dropdown.addOption(voice.key, voice.value);
            });
            return dropdown
              .setValue(this.plugin.settings.qwen.podcastVoices.host2)
              .onChange(async (value) => {
                this.plugin.settings.qwen.podcastVoices.host2 = value;
                await this.plugin.saveSettings();
              });
          });
      }

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
        text: '管理可用的音色列表。Key 是音色参数（如 Cherry），Value 是显示名称（如 Cherry (芊悦)），描述是音色特点。'
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
            this.plugin.settings.qwen.voiceList.push({ key: '', value: '', desc: '' });
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
