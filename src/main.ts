// src/main.ts

import { Plugin, MarkdownView, Notice } from 'obsidian';
import { TTSSettings, DEFAULT_SETTINGS, TTSSettingTab } from './settings';
import { TTSEngineManager } from './tts/engine-manager';
import { TTSController } from './ui/controller';
import { DialogueGenerator } from './dialogue/dialogue-generator';
import { DialogueParser } from './dialogue/dialogue-parser';
import { DialogueFileManager } from './dialogue/dialogue-file-manager';
import { MultiVoicePlayer } from './dialogue/multi-voice-player';
import './ui/styles.css';

export default class TTSPlugin extends Plugin {
  settings: TTSSettings;
  engineManager: TTSEngineManager;
  controller: TTSController;
  dialogueGenerator: DialogueGenerator;
  dialogueParser: DialogueParser;
  dialogueFileManager: DialogueFileManager;
  multiVoicePlayer: MultiVoicePlayer;

  async onload() {
    console.log('Loading TTS Plugin');

    // 加载设置
    await this.loadSettings();

    // 初始化 UI 控制器（需要先创建，因为引擎需要它的进度回调）
    this.controller = new TTSController(this.engineManager, this);

    // 初始化引擎管理器
    this.engineManager = new TTSEngineManager({
      type: this.settings.currentEngine,
      speechRate: this.settings.speechRate,
      onProgress: (current, total) => this.controller.updateProgress(current, total),
      ...this.getEngineConfig()
    });

    // 更新 controller 的 engineManager 引用
    this.controller.engineManager = this.engineManager;

    // 初始化当前引擎
    await this.engineManager.initialize({
      type: this.settings.currentEngine,
      speechRate: this.settings.speechRate,
      onProgress: (current, total) => this.controller.updateProgress(current, total),
      ...this.getEngineConfig()
    });

    // 初始化对话模块
    this.dialogueGenerator = new DialogueGenerator(
      this.settings.qwen.apiKey,
      this.settings.qwen.dialogueModel,
      this.settings.qwen.dialogueMode
    );
    this.dialogueParser = new DialogueParser(
      this.settings.qwen.dialogueMode,
      this.settings.qwen.educationVoices,
      this.settings.qwen.podcastVoices
    );
    this.dialogueFileManager = new DialogueFileManager(this.app);
    this.multiVoicePlayer = new MultiVoicePlayer(this.engineManager);

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

    // 切换文档时停止播放
    let wasStopped = false;

    if (this.engineManager) {
      const status = this.engineManager.getStatus();
      if (status === 'playing' || status === 'paused') {
        this.engineManager.stop();
        wasStopped = true;
      }
    }

    // 停止对话模式播放
    if (this.multiVoicePlayer) {
      const dialogueStatus = this.multiVoicePlayer.getStatus();
      if (dialogueStatus === 'playing' || dialogueStatus === 'paused') {
        this.multiVoicePlayer.stop();
        wasStopped = true;
      }
    }

    // 提醒用户
    if (wasStopped) {
      new Notice('已自动停止播放');
    }

    if (view) {
      // 渲染控制条
      this.controller.renderControlBar(view);
    } else {
      // 移除控制条
      this.controller.removeControlBar();
    }
  }

  async loadSettings() {
    const loadedData = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);

    // 兼容旧版本：如果 voiceList 不存在，使用默认值
    if (!this.settings.qwen.voiceList || this.settings.qwen.voiceList.length === 0) {
      this.settings.qwen.voiceList = DEFAULT_SETTINGS.qwen.voiceList;
    }

    // 兼容旧版本：如果对话模式配置不存在，使用默认值
    if (!this.settings.qwen.dialogueMode) {
      this.settings.qwen.dialogueMode = DEFAULT_SETTINGS.qwen.dialogueMode;
    }
    if (!this.settings.qwen.educationVoices) {
      this.settings.qwen.educationVoices = DEFAULT_SETTINGS.qwen.educationVoices;
    }
    if (!this.settings.qwen.podcastVoices) {
      this.settings.qwen.podcastVoices = DEFAULT_SETTINGS.qwen.podcastVoices;
    }
    if (!this.settings.qwen.dialogueModel) {
      this.settings.qwen.dialogueModel = DEFAULT_SETTINGS.qwen.dialogueModel;
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);

    // 重新初始化引擎
    await this.engineManager.initialize({
      type: this.settings.currentEngine,
      speechRate: this.settings.speechRate,
      onProgress: (current, total) => this.controller.updateProgress(current, total),
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
        model: this.settings.qwen.model,
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
