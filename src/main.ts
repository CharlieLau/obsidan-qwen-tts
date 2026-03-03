// src/main.ts

import { Plugin, MarkdownView } from 'obsidian';
import { TTSSettings, DEFAULT_SETTINGS, TTSSettingTab } from './settings';
import { TTSEngineManager } from './tts/engine-manager';
import { TTSController } from './ui/controller';
import './ui/styles.css';

export default class TTSPlugin extends Plugin {
  settings: TTSSettings;
  engineManager: TTSEngineManager;
  controller: TTSController;

  async onload() {
    console.log('Loading TTS Plugin');

    // 加载设置
    await this.loadSettings();

    // 初始化引擎管理器
    this.engineManager = new TTSEngineManager({
      type: this.settings.currentEngine,
      speechRate: this.settings.speechRate,
      ...this.getEngineConfig()
    });

    // 初始化当前引擎
    await this.engineManager.initialize({
      type: this.settings.currentEngine,
      speechRate: this.settings.speechRate,
      ...this.getEngineConfig()
    });

    // 初始化 UI 控制器
    this.controller = new TTSController(this.engineManager);

    // 注册设置面板
    this.addSettingTab(new TTSSettingTab(this.app, this));

    // 监听活动页面变化
    this.registerEvent(
      this.app.workspace.on('active-leaf-change', () => {
        this.onActiveLeafChange();
      })
    );

    // 初始渲染
    this.onActiveLeafChange();

    // 注册命令
    this.addCommand({
      id: 'tts-start',
      name: '开始朗读',
      checkCallback: (checking: boolean) => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view) {
          if (!checking) {
            // 触发开始按钮点击
            const startButton = view.containerEl.querySelector('.tts-control-bar button') as HTMLButtonElement;
            if (startButton) {
              startButton.click();
            }
          }
          return true;
        }
        return false;
      }
    });
  }

  onunload() {
    console.log('Unloading TTS Plugin');

    // 停止播放
    if (this.engineManager) {
      this.engineManager.stop();
    }

    // 移除 UI
    if (this.controller) {
      this.controller.removeControlBar();
    }
  }

  private onActiveLeafChange(): void {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);

    if (view) {
      // 渲染控制条
      this.controller.renderControlBar(view);
    } else {
      // 移除控制条
      this.controller.removeControlBar();
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);

    // 重新初始化引擎
    await this.engineManager.initialize({
      type: this.settings.currentEngine,
      speechRate: this.settings.speechRate,
      ...this.getEngineConfig()
    });
  }

  private getEngineConfig(): any {
    const engine = this.settings.currentEngine;

    if (engine === 'aliyun') {
      return {
        accessKeyId: this.settings.aliyun.accessKeyId,
        accessKeySecret: this.settings.aliyun.accessKeySecret
      };
    } else if (engine === 'tencent') {
      return {
        secretId: this.settings.tencent.secretId,
        secretKey: this.settings.tencent.secretKey
      };
    } else if (engine === 'qwen') {
      return {
        apiKey: this.settings.qwen.apiKey,
        voice: this.settings.qwen.voice
      };
    } else if (engine === 'openai') {
      return {
        apiKey: this.settings.openai.apiKey
      };
    }

    return {};
  }
}
