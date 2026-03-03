// src/ui/controller.ts

import { MarkdownView, Notice } from 'obsidian';
import { TTSEngineManager } from '../tts/engine-manager';
import { ContentParser } from '../parser/content-parser';
import { EngineStatus } from '../tts/engines/base';
import TTSPlugin from '../main';
import { DialogueProgressModal } from '../dialogue/dialogue-progress-modal';
import { DialogueOptionsModal } from '../dialogue/dialogue-options-modal';

export class TTSController {
  private controlBar: HTMLElement | null = null;
  private startButton: HTMLButtonElement;
  private pauseButton: HTMLButtonElement;
  private stopButton: HTMLButtonElement;
  private dialogueButton: HTMLButtonElement;
  private statusText: HTMLSpanElement;
  private progressBar: HTMLElement;
  private progressFill: HTMLElement;
  private progressTime: HTMLSpanElement;
  private voiceSelect: HTMLSelectElement;
  private customVoiceToggle: HTMLButtonElement;
  private customVoiceContainer: HTMLElement;
  private customVoiceInput: HTMLInputElement;
  public engineManager: TTSEngineManager;
  private contentParser: ContentParser;
  private plugin: TTSPlugin;
  private currentAudio: HTMLAudioElement | null = null;

  constructor(engineManager: TTSEngineManager, plugin: TTSPlugin) {
    this.engineManager = engineManager;
    this.contentParser = new ContentParser();
    this.plugin = plugin;
  }

  renderControlBar(view: MarkdownView): void {
    // 移除旧的控制条
    this.removeControlBar();

    // 创建控制条容器
    this.controlBar = document.createElement('div');
    this.controlBar.addClass('tts-control-bar');

    // 创建主控制行
    const mainControls = document.createElement('div');
    mainControls.addClass('tts-controls-main');

    // 创建开始按钮（圆形）
    this.startButton = document.createElement('button');
    this.startButton.textContent = '▶';
    this.startButton.title = '播放';
    this.startButton.onclick = () => this.handleStart(view);

    // 创建暂停按钮（圆形）
    this.pauseButton = document.createElement('button');
    this.pauseButton.textContent = '⏸';
    this.pauseButton.title = '暂停';
    this.pauseButton.onclick = () => this.handlePause();
    this.pauseButton.style.display = 'none';

    // 创建停止按钮（圆形）
    this.stopButton = document.createElement('button');
    this.stopButton.textContent = '⏹';
    this.stopButton.title = '停止';
    this.stopButton.onclick = () => this.handleStop();
    this.stopButton.style.display = 'none';

    // 创建对话按钮
    this.dialogueButton = document.createElement('button');
    this.dialogueButton.textContent = '💬';
    this.dialogueButton.title = '对话模式';
    this.dialogueButton.onclick = () => this.handleDialogue(view);

    mainControls.appendChild(this.startButton);
    mainControls.appendChild(this.pauseButton);
    mainControls.appendChild(this.stopButton);
    mainControls.appendChild(this.dialogueButton);

    // 创建状态文本（隐藏，仅在错误时显示）
    this.statusText = document.createElement('span');
    this.statusText.addClass('tts-status-text');

    // 创建进度条容器
    const progressContainer = document.createElement('div');
    progressContainer.addClass('tts-progress-container');

    this.progressBar = document.createElement('div');
    this.progressBar.addClass('tts-progress-bar');
    this.progressBar.onclick = (e) => this.handleProgressClick(e);

    this.progressFill = document.createElement('div');
    this.progressFill.addClass('tts-progress-fill');
    this.progressFill.style.width = '0%';

    this.progressBar.appendChild(this.progressFill);

    this.progressTime = document.createElement('span');
    this.progressTime.addClass('tts-progress-time');
    this.progressTime.textContent = '0:00 / 0:00';

    progressContainer.appendChild(this.progressBar);
    progressContainer.appendChild(this.progressTime);

    // 将进度条添加到主控制行
    mainControls.appendChild(progressContainer);

    // 创建音色选择器（放在主控制行）
    const voiceSelector = document.createElement('div');
    voiceSelector.addClass('tts-voice-selector');

    const voiceLabel = document.createElement('span');
    voiceLabel.addClass('tts-voice-label');
    voiceLabel.textContent = '音色：';

    this.voiceSelect = document.createElement('select');
    this.voiceSelect.addClass('tts-voice-select');

    // 从设置中动态加载音色列表
    const voices = this.plugin.settings.qwen.voiceList || [];

    if (voices.length === 0) {
      // 如果没有音色列表，添加一个默认选项
      const option = document.createElement('option');
      option.value = 'Cherry';
      option.textContent = 'Cherry (芊悦)';
      this.voiceSelect.appendChild(option);
    } else {
      voices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.key;
        option.textContent = voice.value;
        this.voiceSelect.appendChild(option);
      });
    }

    // 设置当前选中的音色
    this.voiceSelect.value = this.plugin.settings.qwen.voice || 'Cherry';

    // 监听音色变化
    this.voiceSelect.onchange = async () => {
      this.plugin.settings.qwen.voice = this.voiceSelect.value;
      await this.plugin.saveSettings();
    };

    voiceSelector.appendChild(voiceLabel);
    voiceSelector.appendChild(this.voiceSelect);

    // 创建自定义音色切换按钮
    this.customVoiceToggle = document.createElement('button');
    this.customVoiceToggle.addClass('tts-custom-voice-toggle');
    this.customVoiceToggle.textContent = '⚙';
    this.customVoiceToggle.title = '自定义音色';
    this.customVoiceToggle.onclick = () => this.toggleCustomVoice();

    // 添加音色选择器到主控制行
    mainControls.appendChild(voiceSelector);
    mainControls.appendChild(this.customVoiceToggle);
    mainControls.appendChild(this.statusText);

    // 创建自定义音色输入容器
    this.customVoiceContainer = document.createElement('div');
    this.customVoiceContainer.addClass('tts-custom-voice-container');

    this.customVoiceInput = document.createElement('input');
    this.customVoiceInput.addClass('tts-custom-voice-input');
    this.customVoiceInput.type = 'text';
    this.customVoiceInput.placeholder = '输入自定义音色名称';
    this.customVoiceInput.value = this.plugin.settings.qwen.customVoice || '';
    this.customVoiceInput.oninput = async () => {
      this.plugin.settings.qwen.customVoice = this.customVoiceInput.value;
      await this.plugin.saveSettings();
    };

    const customVoiceHint = document.createElement('div');
    customVoiceHint.addClass('tts-custom-voice-hint');
    customVoiceHint.textContent = '适用于其他 TTS 模型的音色名称';

    this.customVoiceContainer.appendChild(this.customVoiceInput);
    this.customVoiceContainer.appendChild(customVoiceHint);

    // 组装控制条
    this.controlBar.appendChild(mainControls);
    this.controlBar.appendChild(this.customVoiceContainer);

    // 将控制条插入到编辑器容器
    const contentEl = view.containerEl.querySelector('.view-content');
    if (contentEl) {
      contentEl.insertBefore(this.controlBar, contentEl.firstChild);
    }
  }

  private toggleCustomVoice(): void {
    const isVisible = this.customVoiceContainer.hasClass('visible');
    if (isVisible) {
      this.customVoiceContainer.removeClass('visible');
      this.customVoiceToggle.removeClass('active');
    } else {
      this.customVoiceContainer.addClass('visible');
      this.customVoiceToggle.addClass('active');
    }
  }

  private async handleStart(view: MarkdownView): Promise<void> {
    try {
      // 获取当前笔记内容
      const editor = view.editor;
      const content = editor.getValue();

      if (!content || content.trim().length === 0) {
        new Notice('笔记内容为空');
        return;
      }

      // 解析内容
      const parsed = this.contentParser.parse(content);

      if (parsed.segments.length === 0) {
        new Notice('没有可朗读的内容');
        return;
      }

      // 更新 UI
      this.updateUIState('playing');

      // 开始播放
      await this.engineManager.speakSegments(parsed.segments);

      // 播放完成
      this.updateUIState('idle');
    } catch (error) {
      new Notice(`播放失败: ${error.message}`);
      this.updateUIState('idle');
      this.showStatus('播放失败', true);
    }
  }

  private handlePause(): void {
    const status = this.engineManager.getStatus();

    if (status === 'playing') {
      this.engineManager.pause();
      this.updateUIState('paused');
      this.pauseButton.textContent = '▶';
      this.pauseButton.title = '继续';
    } else if (status === 'paused') {
      this.engineManager.resume();
      this.updateUIState('playing');
      this.pauseButton.textContent = '⏸';
      this.pauseButton.title = '暂停';
    }
  }

  private handleStop(): void {
    this.engineManager.stop();
    this.updateUIState('idle');
    this.progressFill.style.width = '0%';
    this.progressTime.textContent = '0:00 / 0:00';
  }

  private showStatus(message: string, isError: boolean = false): void {
    this.statusText.textContent = message;
    this.statusText.addClass('visible');
    if (isError) {
      this.statusText.style.color = 'var(--text-error)';
    }
    setTimeout(() => {
      this.statusText.removeClass('visible');
      this.statusText.style.color = '';
    }, 3000);
  }

  private handleProgressClick(e: MouseEvent): void {
    // TODO: 实现进度跳转功能
    // 需要在引擎管理器中添加 seek 方法
    console.log('Progress click:', e);
  }

  public updateProgress(current: number, total: number): void {
    const percentage = total > 0 ? (current / total) * 100 : 0;
    this.progressFill.style.width = `${percentage}%`;

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    this.progressTime.textContent = `${formatTime(current)} / ${formatTime(total)}`;
  }

  private updateUIState(status: EngineStatus): void {
    if (status === 'idle') {
      this.startButton.style.display = '';
      this.pauseButton.style.display = 'none';
      this.stopButton.style.display = 'none';
    } else if (status === 'playing') {
      this.startButton.style.display = 'none';
      this.pauseButton.style.display = '';
      this.pauseButton.textContent = '⏸';
      this.pauseButton.title = '暂停';
      this.stopButton.style.display = '';
    } else if (status === 'paused') {
      this.startButton.style.display = 'none';
      this.pauseButton.style.display = '';
      this.pauseButton.textContent = '▶';
      this.pauseButton.title = '继续';
      this.stopButton.style.display = '';
    }
  }

  removeControlBar(): void {
    if (this.controlBar) {
      this.controlBar.remove();
      this.controlBar = null;
    }
  }

  private async handleDialogue(view: MarkdownView): Promise<void> {
    try {
      // 获取当前文件路径
      const file = view.file;
      if (!file) {
        new Notice('无法获取当前文件');
        return;
      }

      const filePath = file.path;

      // 检查对话文件是否已存在
      const exists = await this.plugin.dialogueFileManager.dialogueExists(filePath);

      let shouldGenerate = true;
      let dialogueScript: string | null = null;

      if (exists) {
        // 显示选项 Modal
        const optionsModal = new DialogueOptionsModal(this.plugin.app);
        const choice = await optionsModal.waitForChoice();

        if (choice === 'cancel') {
          return;
        } else if (choice === 'use-existing') {
          // 使用现有对话
          shouldGenerate = false;
          dialogueScript = await this.plugin.dialogueFileManager.loadDialogue(filePath);
          if (!dialogueScript) {
            new Notice('无法读取对话文件');
            return;
          }
        }
        // choice === 'regenerate' 时，shouldGenerate 保持 true
      }

      if (shouldGenerate) {
        // 显示进度 Modal
        const progressModal = new DialogueProgressModal(this.plugin.app);
        progressModal.open();

        try {
          // 获取文档内容
          const content = view.editor.getValue();
          const wordCount = content.length;

          // 生成对话
          dialogueScript = await this.plugin.dialogueGenerator.generate(
            content,
            wordCount,
            (progress) => {
              progressModal.updateProgress(progress);
            }
          );

          // 验证脚本
          const validation = this.plugin.dialogueParser.validate(dialogueScript);
          if (!validation.isValid) {
            throw new Error(`对话脚本格式错误: ${validation.errors.join(', ')}`);
          }

          // 保存对话
          progressModal.updateProgress({
            stage: 'saving',
            message: '正在保存对话文件...',
            percentage: 70
          });

          const savedPath = await this.plugin.dialogueFileManager.saveDialogue(filePath, dialogueScript);

          progressModal.updateProgress({
            stage: 'complete',
            message: '对话生成完成！',
            percentage: 100
          });

          // 延迟关闭 Modal，让用户看到完成状态
          setTimeout(() => {
            progressModal.close();
            new Notice(`对话已保存到: ${savedPath}`);
          }, 1000);
        } catch (error) {
          progressModal.close();
          throw error;
        }
      }

      // 确保有对话脚本
      if (!dialogueScript) {
        new Notice('无法获取对话脚本');
        return;
      }

      // 解析对话
      const dialogueLines = this.plugin.dialogueParser.parse(dialogueScript);

      if (dialogueLines.length === 0) {
        new Notice('对话内容为空');
        return;
      }

      // 加载对话到播放器
      await this.plugin.multiVoicePlayer.loadDialogue(dialogueLines);

      // 更新 UI 状态
      this.updateUIState('playing');

      // 开始播放
      await this.plugin.multiVoicePlayer.play();

      // 播放完成
      this.updateUIState('idle');
      new Notice('对话播放完成');
    } catch (error) {
      new Notice(`对话模式失败: ${error.message}`);
      this.updateUIState('idle');
      console.error('Dialogue error:', error);
    }
  }
}
