// src/ui/controller.ts

import { MarkdownView, Notice } from 'obsidian';
import { TTSEngineManager } from '../tts/engine-manager';
import { ContentParser } from '../parser/content-parser';
import { EngineStatus } from '../tts/engines/base';
import TTSPlugin from '../main';
import { DialogueProgressModal } from '../dialogue/dialogue-progress-modal';
import { DialogueOptionsModal } from '../dialogue/dialogue-options-modal';
import { AudioMerger } from '../dialogue/audio-merger';
import { SpeedController } from '../utils/speed-controller';
import { TextSegment } from '../utils/language-detector';

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
  private speedSelect: HTMLSelectElement;
  private speedController: SpeedController;
  public engineManager: TTSEngineManager;
  private contentParser: ContentParser;
  private plugin: TTSPlugin;
  private currentAudio: HTMLAudioElement | null = null;
  private isDialogueMode: boolean = false;
  private isGeneratingDialogue: boolean = false;
  private currentSegments: TextSegment[] | null = null;

  constructor(engineManager: TTSEngineManager, plugin: TTSPlugin) {
    this.engineManager = engineManager;
    this.contentParser = new ContentParser();
    this.plugin = plugin;
    this.speedController = new SpeedController(plugin.settings.playbackSpeed);
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

    // 创建对话模式选择器
    const dialogueModeSelector = document.createElement('select');
    dialogueModeSelector.addClass('tts-dialogue-mode-select');
    dialogueModeSelector.title = '对话模式';

    const educationOption = document.createElement('option');
    educationOption.value = 'education';
    educationOption.textContent = '📚 教育';

    const podcastOption = document.createElement('option');
    podcastOption.value = 'podcast';
    podcastOption.textContent = '🎙️ 播客';

    dialogueModeSelector.appendChild(educationOption);
    dialogueModeSelector.appendChild(podcastOption);
    dialogueModeSelector.value = this.plugin.settings.qwen.dialogueMode;

    dialogueModeSelector.onchange = async () => {
      const mode = dialogueModeSelector.value as 'education' | 'podcast';
      this.plugin.settings.qwen.dialogueMode = mode;
      await this.plugin.saveSettings();

      // 更新 Generator 和 Parser 的模式
      this.plugin.dialogueGenerator.setMode(mode);
      this.plugin.dialogueParser.setMode(mode);
      this.plugin.dialogueParser.updateVoiceMapping(
        this.plugin.settings.qwen.educationVoices,
        this.plugin.settings.qwen.podcastVoices
      );

      // 更新按钮提示
      this.dialogueButton.title = mode === 'education' ? '对话模式（教育）' : '对话模式（播客）';
    };

    // 播放控制按钮组
    mainControls.appendChild(this.startButton);
    mainControls.appendChild(this.pauseButton);
    mainControls.appendChild(this.stopButton);

    // 添加分隔符
    const separator1 = document.createElement('div');
    separator1.addClass('tts-separator');
    mainControls.appendChild(separator1);

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

    // 添加分隔符
    const separator2 = document.createElement('div');
    separator2.addClass('tts-separator');
    mainControls.appendChild(separator2);

    // 创建音色选择器（放在主控制行）
    const voiceSelector = document.createElement('div');
    voiceSelector.addClass('tts-voice-selector');

    const voiceLabel = document.createElement('span');
    voiceLabel.addClass('tts-voice-label');
    voiceLabel.textContent = '音色';

    this.voiceSelect = document.createElement('select');
    this.voiceSelect.addClass('tts-voice-select');

    // 从设置中动态加载音色列表
    const voices = this.plugin.settings.qwen.voiceList || [];

    if (voices.length === 0) {
      // 如果没有音色列表，添加一个默认选项
      const option = document.createElement('option');
      option.value = 'Cherry';
      option.textContent = 'Cherry';
      this.voiceSelect.appendChild(option);
    } else {
      voices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.key;
        // 只显示音色名称，不显示括号内容
        option.textContent = voice.key;
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

    // 添加音色选择器到主控制行
    mainControls.appendChild(voiceSelector);

    // 添加分隔符
    const separator3 = document.createElement('div');
    separator3.addClass('tts-separator');
    mainControls.appendChild(separator3);

    // 创建速度选择器
    const speedSelector = document.createElement('div');
    speedSelector.addClass('tts-speed-selector');

    const speedIcon = document.createElement('span');
    speedIcon.addClass('tts-speed-icon');
    speedIcon.textContent = '🎬';

    this.speedSelect = document.createElement('select');
    this.speedSelect.addClass('tts-speed-select');

    // 添加速度选项
    const speeds = this.speedController.getSpeedOptions();
    speeds.forEach(speed => {
      const option = document.createElement('option');
      option.value = speed.toString();
      option.textContent = `${speed}x`;
      this.speedSelect.appendChild(option);
    });

    // 设置当前速度
    this.speedSelect.value = this.plugin.settings.playbackSpeed.toString();

    // 监听速度变化
    this.speedSelect.onchange = async () => {
      const newSpeed = parseFloat(this.speedSelect.value);
      this.speedController.setSpeed(newSpeed);
      this.plugin.settings.playbackSpeed = newSpeed;
      await this.plugin.saveSettings();

      // 应用到当前播放（如果正在播放）
      if (this.isDialogueMode) {
        const audio = this.plugin.multiVoicePlayer.getCurrentAudio();
        if (audio) {
          this.speedController.applyToAudio(audio);
        }
      } else {
        // 更新引擎管理器的速度设置
        this.engineManager.updatePlaybackSpeed(newSpeed);
      }
    };

    speedSelector.appendChild(speedIcon);
    speedSelector.appendChild(this.speedSelect);
    mainControls.appendChild(speedSelector);

    // 添加分隔符
    const separator4 = document.createElement('div');
    separator4.addClass('tts-separator');
    mainControls.appendChild(separator4);

    // 对话模式区
    mainControls.appendChild(this.dialogueButton);
    mainControls.appendChild(dialogueModeSelector);

    // 状态文本（放在最右侧）
    mainControls.appendChild(this.statusText);

    // 组装控制条
    this.controlBar.appendChild(mainControls);

    // 将控制条插入到编辑器容器
    const contentEl = view.containerEl.querySelector('.view-content');
    if (contentEl) {
      contentEl.insertBefore(this.controlBar, contentEl.firstChild);
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

      // Store segments for seeking
      this.currentSegments = parsed.segments;

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
    if (this.isDialogueMode) {
      // 对话模式：控制 MultiVoicePlayer
      const status = this.plugin.multiVoicePlayer.getStatus();

      if (status === 'playing') {
        this.plugin.multiVoicePlayer.pause();
        this.updateUIState('paused');
        this.pauseButton.textContent = '▶';
        this.pauseButton.title = '继续';
      } else if (status === 'paused') {
        this.plugin.multiVoicePlayer.resume();
        this.updateUIState('playing');
        this.pauseButton.textContent = '⏸';
        this.pauseButton.title = '暂停';
      }
    } else {
      // 普通模式：控制 EngineManager
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
  }

  private handleStop(): void {
    if (this.isDialogueMode) {
      // 对话模式：停止 MultiVoicePlayer
      this.plugin.multiVoicePlayer.stop();
      this.isDialogueMode = false;
    } else {
      // 普通模式：停止 EngineManager
      this.engineManager.stop();
    }

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
    const progressBar = e.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;

    if (this.isDialogueMode) {
      // Dialogue mode: seek by time
      const status = this.plugin.multiVoicePlayer.getStatus();
      if (status === 'idle') {
        return;
      }

      const timeText = this.progressTime.textContent || '0:00 / 0:00';
      const match = timeText.match(/\d+:\d+ \/ (\d+):(\d+)/);

      if (match) {
        const totalMinutes = parseInt(match[1]);
        const totalSeconds = parseInt(match[2]);
        const totalDuration = totalMinutes * 60 + totalSeconds;
        const targetTime = totalDuration * percentage;

        this.plugin.multiVoicePlayer.seekToTime(targetTime);
      }
    } else {
      // Normal mode: seek by segment
      const status = this.engineManager.getStatus();
      if (status === 'idle' || !this.currentSegments) {
        return;
      }

      const targetIndex = Math.floor(this.currentSegments.length * percentage);
      this.engineManager.seekToSegment(targetIndex);
    }
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
      // 防止重复点击
      if (this.isGeneratingDialogue) {
        new Notice('对话生成中，请稍候...');
        return;
      }

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
        // 标记正在生成
        this.isGeneratingDialogue = true;

        // 显示进度 Modal，带取消回调
        let cancelled = false;
        const progressModal = new DialogueProgressModal(this.plugin.app, () => {
          cancelled = true;
        });
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
              // 检查是否已取消
              if (cancelled || progressModal.isCancelRequested()) {
                throw new Error('用户取消了生成');
              }
              progressModal.updateProgress(progress);
            }
          );

          // 再次检查是否已取消
          if (cancelled || progressModal.isCancelRequested()) {
            progressModal.close();
            return;
          }

          // 验证脚本
          const validation = this.plugin.dialogueParser.validate(dialogueScript);

          if (!validation.isValid) {
            // 保存脚本以便调试
            await this.plugin.dialogueFileManager.saveDialogue(filePath, dialogueScript);
            throw new Error(`对话脚本格式错误: ${validation.errors.join(', ')}\n\n已保存到文件，请查看格式是否正确。`);
          }

          // 保存对话
          if (!cancelled && !progressModal.isCancelRequested()) {
            progressModal.updateProgress({
              stage: 'saving',
              message: '正在保存对话文件...',
              percentage: 70
            });

            const savedPath = await this.plugin.dialogueFileManager.saveDialogue(filePath, dialogueScript);

            // 检查是否已取消
            if (cancelled || progressModal.isCancelRequested()) {
              progressModal.close();
              return;
            }

            // 不关闭 Modal，继续生成音频
            progressModal.updateProgress({
              stage: 'generating',
              message: '正在生成音频（准备中）...',
              percentage: 70
            });

          // 解析对话
          const dialogueLines = this.plugin.dialogueParser.parse(dialogueScript);

          // 创建 AudioMerger
          const audioMerger = new AudioMerger(
            this.plugin.app,
            this.plugin.settings.qwen.apiKey,
            this.plugin.settings.qwen.model
          );

            // 生成并合并音频
            const audioPath = await audioMerger.generateMergedAudio(
              savedPath,
              dialogueLines,
              (current, total, message) => {
                // 检查是否已取消
                if (cancelled || progressModal.isCancelRequested()) {
                  throw new Error('用户取消了生成');
                }
                const percentage = 70 + Math.floor((current / total) * 20);
                progressModal.updateProgress({
                  stage: 'generating',
                  message: message,
                  percentage: percentage
                });
              }
            );

            // 最后检查是否已取消
            if (cancelled || progressModal.isCancelRequested()) {
              progressModal.close();
              return;
            }

            progressModal.updateProgress({
              stage: 'complete',
              message: '对话生成完成！',
              percentage: 100
            });

            // 延迟关闭 Modal
            setTimeout(() => {
              progressModal.close();
              new Notice(`对话已保存到: ${savedPath}\n音频已缓存`);
            }, 1000);
          }
        } catch (error) {
          progressModal.close();
          this.isGeneratingDialogue = false;
          // 如果是用户取消，不显示错误
          if (error.message === '用户取消了生成') {
            new Notice('已取消生成');
            return;
          }
          throw error;
        } finally {
          // 确保标志被重置
          this.isGeneratingDialogue = false;
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

      // 创建 AudioMerger 检查音频缓存
      const audioMerger = new AudioMerger(
        this.plugin.app,
        this.plugin.settings.qwen.apiKey,
        this.plugin.settings.qwen.model
      );

      const dialoguePath = this.plugin.dialogueFileManager.getDialoguePath(filePath);
      const hasAudio = await audioMerger.hasAudioFile(dialoguePath);

      let audioUrl: string | undefined;

      if (hasAudio) {
        try {
          // 加载缓存的音频
          audioUrl = await audioMerger.loadAudioFile(dialoguePath);
        } catch (error) {
          console.warn('Failed to load cached audio, will regenerate:', error);
          // 删除损坏的缓存文件
          try {
            await audioMerger.deleteAudioFile(dialoguePath);
          } catch (deleteError) {
            console.warn('Failed to delete corrupted audio file:', deleteError);
          }
          // audioUrl 保持 undefined，播放器会实时生成
        }
      }

      // 加载对话到播放器
      await this.plugin.multiVoicePlayer.loadDialogue(dialogueLines, audioUrl);

      // 设置进度更新回调
      this.plugin.multiVoicePlayer.setProgressCallback((current, total) => {
        this.updateProgress(current, total);
      });

      // 标记为对话模式
      this.isDialogueMode = true;

      // 更新 UI 状态
      this.updateUIState('playing');

      // 开始播放
      await this.plugin.multiVoicePlayer.play();

      // 播放完成
      this.isDialogueMode = false;
      this.updateUIState('idle');
      new Notice('对话播放完成');
    } catch (error) {
      new Notice(`对话模式失败: ${error.message}`);
      this.updateUIState('idle');
      console.error('Dialogue error:', error);
    }
  }
}
