# 对话模式功能实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现类似 NotebookLM 的对话式学习体验，将 Markdown 文档转换成三人对话形式进行播放

**Architecture:**
- DialogueGenerator 调用通义千问 API 生成对话脚本
- DialogueParser 解析脚本并映射音色
- MultiVoicePlayer 按角色切换音色播放
- DialogueFileManager 管理对话文件的保存和读取

**Tech Stack:**
- TypeScript
- Obsidian API
- 通义千问 API (qwen-long)
- 现有的 TTS 引擎架构

---

## 实现顺序

按照依赖关系，实现顺序如下：

1. **DialogueParser** - 对话解析器（无外部依赖，可先实现）
2. **DialogueFileManager** - 文件管理器（依赖 Obsidian API）
3. **DialogueGenerator** - 对话生成器（依赖 API 调用）
4. **MultiVoicePlayer** - 多音色播放器（依赖 Parser 和 TTS 引擎）
5. **UI Integration** - UI 集成（依赖所有模块）

---

## Task 1: 创建 DialogueParser 基础结构

**Files:**
- Create: `src/dialogue/dialogue-parser.ts`
- Create: `src/dialogue/types.ts`

**Step 1: 创建类型定义**

创建 `src/dialogue/types.ts`:

```typescript
// src/dialogue/types.ts

export type DialogueRole = 'host' | 'curious' | 'critical';

export interface DialogueLine {
  role: DialogueRole;
  content: string;
  voice: string;
}

export interface DialogueValidation {
  isValid: boolean;
  errors: string[];
}
```

**Step 2: 创建 DialogueParser 类骨架**

创建 `src/dialogue/dialogue-parser.ts`:

```typescript
// src/dialogue/dialogue-parser.ts

import { DialogueLine, DialogueRole, DialogueValidation } from './types';

export class DialogueParser {
  // 角色到音色的映射
  private readonly voiceMapping: Record<DialogueRole, string> = {
    'host': 'Ethan',      // 主讲人 - 稳重男声
    'curious': 'Cherry',  // 好奇学生 - 活泼女声
    'critical': 'Serena'  // 批判学生 - 理性女声
  };

  // 角色标记的正则表达式
  private readonly rolePatterns: Record<DialogueRole, RegExp> = {
    'host': /^\[主讲人\]:\s*/,
    'curious': /^\[好奇学生\]:\s*/,
    'critical': /^\[批判学生\]:\s*/
  };

  /**
   * 解析对话脚本
   */
  parse(script: string): DialogueLine[] {
    // TODO: 实现解析逻辑
    return [];
  }

  /**
   * 验证对话脚本格式
   */
  validate(script: string): DialogueValidation {
    // TODO: 实现验证逻辑
    return { isValid: true, errors: [] };
  }
}
```

**Step 3: 提交基础结构**

```bash
git add src/dialogue/
git commit -m "feat(dialogue): add DialogueParser basic structure and types"
```

---

## Task 2: 实现 DialogueParser.parse() 方法

**Files:**
- Modify: `src/dialogue/dialogue-parser.ts`

**Step 1: 实现解析逻辑**

在 `DialogueParser` 类中实现 `parse()` 方法:

```typescript
parse(script: string): DialogueLine[] {
  const lines = script.split('\n').filter(line => line.trim());
  const dialogueLines: DialogueLine[] = [];

  for (const line of lines) {
    // 识别角色
    let role: DialogueRole | null = null;
    let content = line;

    // 尝试匹配每个角色
    for (const [roleKey, pattern] of Object.entries(this.rolePatterns)) {
      if (pattern.test(line)) {
        role = roleKey as DialogueRole;
        content = line.replace(pattern, '');
        break;
      }
    }

    // 如果识别到角色，添加到结果
    if (role && content.trim()) {
      dialogueLines.push({
        role,
        content: content.trim(),
        voice: this.voiceMapping[role]
      });
    }
  }

  return dialogueLines;
}
```

**Step 2: 测试解析功能**

手动测试（在浏览器控制台）:

```typescript
const parser = new DialogueParser();
const testScript = `
[主讲人]: 今天我们来讨论理想职场。
[好奇学生]: 什么是理想职场呢？
[批判学生]: 理想职场真的存在吗？
`;

const result = parser.parse(testScript);
console.log(result);
// 期望输出 3 个 DialogueLine 对象
```

**Step 3: 提交解析功能**

```bash
git add src/dialogue/dialogue-parser.ts
git commit -m "feat(dialogue): implement DialogueParser.parse() method"
```

---

## Task 3: 实现 DialogueParser.validate() 方法

**Files:**
- Modify: `src/dialogue/dialogue-parser.ts`

**Step 1: 实现验证逻辑**

```typescript
validate(script: string): DialogueValidation {
  const errors: string[] = [];
  const lines = script.split('\n').filter(line => line.trim());

  // 检查是否有对话内容
  if (lines.length === 0) {
    errors.push('对话脚本为空');
    return { isValid: false, errors };
  }

  // 检查是否有无法识别的行
  let unrecognizedLines = 0;
  let recognizedLines = 0;

  for (const line of lines) {
    const hasRole = Object.values(this.rolePatterns).some(
      pattern => pattern.test(line)
    );

    if (hasRole) {
      recognizedLines++;
    } else {
      unrecognizedLines++;
    }
  }

  // 如果超过 30% 的行无法识别，认为格式有问题
  if (recognizedLines === 0) {
    errors.push('没有识别到任何对话角色标记');
  } else if (unrecognizedLines > lines.length * 0.3) {
    errors.push(`有 ${unrecognizedLines} 行无法识别角色标记（占比 ${Math.round(unrecognizedLines / lines.length * 100)}%）`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
```

**Step 2: 测试验证功能**

```typescript
// 测试有效脚本
const validScript = `
[主讲人]: 测试内容
[好奇学生]: 测试问题
`;
console.log(parser.validate(validScript));
// 期望: { isValid: true, errors: [] }

// 测试无效脚本
const invalidScript = `
这是一行没有角色标记的内容
另一行也没有标记
`;
console.log(parser.validate(invalidScript));
// 期望: { isValid: false, errors: [...] }
```

**Step 3: 提交验证功能**

```bash
git add src/dialogue/dialogue-parser.ts
git commit -m "feat(dialogue): implement DialogueParser.validate() method"
```

---

## Task 4: 创建 DialogueFileManager 基础结构

**Files:**
- Create: `src/dialogue/dialogue-file-manager.ts`

**Step 1: 创建 DialogueFileManager 类**

```typescript
// src/dialogue/dialogue-file-manager.ts

import { App, TFile } from 'obsidian';

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
    // TODO: 实现保存逻辑
    return '';
  }

  /**
   * 读取对话脚本
   */
  async loadDialogue(originalPath: string): Promise<string | null> {
    // TODO: 实现读取逻辑
    return null;
  }

  /**
   * 检查对话文件是否存在
   */
  async dialogueExists(originalPath: string): Promise<boolean> {
    // TODO: 实现检查逻辑
    return false;
  }

  /**
   * 删除对话文件
   */
  async deleteDialogue(originalPath: string): Promise<void> {
    // TODO: 实现删除逻辑
  }
}
```

**Step 2: 提交基础结构**

```bash
git add src/dialogue/dialogue-file-manager.ts
git commit -m "feat(dialogue): add DialogueFileManager basic structure"
```

---

## Task 5: 实现 DialogueFileManager 文件操作方法

**Files:**
- Modify: `src/dialogue/dialogue-file-manager.ts`

**Step 1: 实现 saveDialogue() 方法**

```typescript
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
```

**Step 2: 实现 loadDialogue() 方法**

```typescript
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
```

**Step 3: 实现 dialogueExists() 和 deleteDialogue() 方法**

```typescript
async dialogueExists(originalPath: string): Promise<boolean> {
  const dialoguePath = this.getDialoguePath(originalPath);
  return await this.app.vault.adapter.exists(dialoguePath);
}

async deleteDialogue(originalPath: string): Promise<void> {
  const dialoguePath = this.getDialoguePath(originalPath);

  if (await this.dialogueExists(originalPath)) {
    await this.app.vault.adapter.remove(dialoguePath);
  }
}
```

**Step 4: 提交文件操作功能**

```bash
git add src/dialogue/dialogue-file-manager.ts
git commit -m "feat(dialogue): implement DialogueFileManager file operations"
```

---

## Task 6: 创建 DialogueGenerator 基础结构

**Files:**
- Create: `src/dialogue/dialogue-generator.ts`
- Modify: `src/dialogue/types.ts`

**Step 1: 添加类型定义**

在 `src/dialogue/types.ts` 中添加：

```typescript
export interface DialogueLength {
  targetRounds: number;
  estimatedMinutes: number;
  detailLevel: 'brief' | 'moderate' | 'detailed';
}

export type DialogueGenerationStage =
  | 'analyzing'
  | 'generating'
  | 'saving'
  | 'preparing'
  | 'complete';

export interface DialogueGenerationProgress {
  stage: DialogueGenerationStage;
  message: string;
  percentage: number;
}

export type ProgressCallback = (progress: DialogueGenerationProgress) => void;
```

**Step 2: 创建 DialogueGenerator 类骨架**

```typescript
// src/dialogue/dialogue-generator.ts

import { requestUrl } from 'obsidian';
import { DialogueLength, ProgressCallback } from './types';

export class DialogueGenerator {
  private apiKey: string;
  private readonly apiEndpoint = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * 计算对话长度
   */
  calculateLength(wordCount: number): DialogueLength {
    if (wordCount < 1000) {
      return {
        targetRounds: 6,
        estimatedMinutes: 5,
        detailLevel: 'brief'
      };
    } else if (wordCount < 3000) {
      return {
        targetRounds: 12,
        estimatedMinutes: 15,
        detailLevel: 'moderate'
      };
    } else {
      return {
        targetRounds: 25,
        estimatedMinutes: 30,
        detailLevel: 'detailed'
      };
    }
  }

  /**
   * 生成对话脚本
   */
  async generate(
    content: string,
    wordCount: number,
    onProgress?: ProgressCallback
  ): Promise<string> {
    // TODO: 实现生成逻辑
    return '';
  }
}
```

**Step 3: 提交基础结构**

```bash
git add src/dialogue/
git commit -m "feat(dialogue): add DialogueGenerator basic structure"
```

---

## Task 7: 实现 Prompt 生成逻辑

**Files:**
- Modify: `src/dialogue/dialogue-generator.ts`

**Step 1: 添加 Prompt 构建方法**

```typescript
/**
 * 构建系统 Prompt
 */
private buildSystemPrompt(): string {
  return `你是一个教育内容转换专家。请将 Markdown 文档转换成三人对话形式，用于语音播放学习。

**角色设定**：
- [主讲人]：经验丰富的老师，负责讲解核心内容，语言清晰、逻辑严密
- [好奇学生]：充满好奇心的学习者，会提出基础问题、要求举例说明
- [批判学生]：善于思考的学习者，会质疑观点、提出深度问题、探讨边界情况

**对话结构**：
- 开场：主讲人简要介绍文档主题和结构
- 正文：按文档章节顺序展开，穿插学生提问
- 结尾：主讲人总结要点，学生提出延伸思考

**对话风格**：
- 自然流畅，像真实的课堂讨论
- 好奇学生的问题要简单直接（"这是什么意思？"、"能举个例子吗？"）
- 批判学生的问题要有深度（"这个观点的前提是什么？"、"有没有反例？"）
- 避免生硬的"谢谢老师"等客套话

**输出格式**：
严格使用以下格式，每行一个角色发言：
[主讲人]: 发言内容
[好奇学生]: 发言内容
[批判学生]: 发言内容`;
}

/**
 * 构建用户 Prompt
 */
private buildUserPrompt(content: string, length: DialogueLength): string {
  return `请将以下 Markdown 文档转换成对话形式。

**文档字数**：${content.length} 字
**对话要求**：生成约 ${length.targetRounds} 轮对话（约 ${length.estimatedMinutes} 分钟）
**详细程度**：${length.detailLevel === 'brief' ? '简明扼要' : length.detailLevel === 'moderate' ? '适中深度' : '详细讲解'}

**文档内容**：
${content}

请开始生成对话：`;
}
```

**Step 2: 提交 Prompt 构建逻辑**

```bash
git add src/dialogue/dialogue-generator.ts
git commit -m "feat(dialogue): add prompt building methods"
```

---

## Task 8: 实现 API 调用逻辑

**Files:**
- Modify: `src/dialogue/dialogue-generator.ts`

**Step 1: 实现 generate() 方法**

```typescript
async generate(
  content: string,
  wordCount: number,
  onProgress?: ProgressCallback
): Promise<string> {
  // 计算对话长度
  const length = this.calculateLength(wordCount);

  // 报告进度：分析文档
  onProgress?.({
    stage: 'analyzing',
    message: '正在分析文档内容...',
    percentage: 10
  });

  // 构建 Prompt
  const systemPrompt = this.buildSystemPrompt();
  const userPrompt = this.buildUserPrompt(content, length);

  // 报告进度：生成对话
  onProgress?.({
    stage: 'generating',
    message: '正在生成对话脚本...',
    percentage: 30
  });

  // 调用 API
  const response = await requestUrl({
    url: this.apiEndpoint,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'qwen-long',
      input: {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      },
      parameters: {
        temperature: 0.8,
        max_tokens: 4000,
        top_p: 0.9
      }
    })
  });

  // 检查响应
  if (response.status !== 200) {
    throw new Error(`API 调用失败: ${response.status}`);
  }

  const result = response.json;
  if (!result.output || !result.output.choices || result.output.choices.length === 0) {
    throw new Error('API 返回格式错误');
  }

  // 提取对话脚本
  const script = result.output.choices[0].message.content;

  return script;
}
```

**Step 2: 提交 API 调用逻辑**

```bash
git add src/dialogue/dialogue-generator.ts
git commit -m "feat(dialogue): implement API call for dialogue generation"
```

---

## Task 9: 创建 MultiVoicePlayer 基础结构

**Files:**
- Create: `src/dialogue/multi-voice-player.ts`

**Step 1: 创建 MultiVoicePlayer 类**

```typescript
// src/dialogue/multi-voice-player.ts

import { TTSEngineManager } from '../tts/engine-manager';
import { DialogueLine } from './types';
import { Language } from '../tts/engines/base';

export class MultiVoicePlayer {
  private engineManager: TTSEngineManager;
  private currentIndex: number = 0;
  private dialogueLines: DialogueLine[] = [];
  private isPlaying: boolean = false;

  constructor(engineManager: TTSEngineManager) {
    this.engineManager = engineManager;
  }

  /**
   * 加载对话脚本准备播放
   */
  async loadDialogue(lines: DialogueLine[]): Promise<void> {
    this.dialogueLines = lines;
    this.currentIndex = 0;
  }

  /**
   * 开始播放对话
   */
  async play(): Promise<void> {
    // TODO: 实现播放逻辑
  }

  /**
   * 暂停播放
   */
  pause(): void {
    // TODO: 实现暂停逻辑
  }

  /**
   * 继续播放
   */
  resume(): void {
    // TODO: 实现继续逻辑
  }

  /**
   * 停止播放
   */
  stop(): void {
    // TODO: 实现停止逻辑
  }

  /**
   * 获取播放进度
   */
  getProgress(): { current: number; total: number; percentage: number } {
    return {
      current: this.currentIndex,
      total: this.dialogueLines.length,
      percentage: this.dialogueLines.length > 0
        ? (this.currentIndex / this.dialogueLines.length) * 100
        : 0
    };
  }
}
```

**Step 2: 提交基础结构**

```bash
git add src/dialogue/multi-voice-player.ts
git commit -m "feat(dialogue): add MultiVoicePlayer basic structure"
```

---

## Task 10: 实现 MultiVoicePlayer 播放逻辑

**Files:**
- Modify: `src/dialogue/multi-voice-player.ts`

**Step 1: 实现播放方法**

```typescript
/**
 * 开始播放对话
 */
async play(): Promise<void> {
  if (this.dialogueLines.length === 0) {
    throw new Error('没有可播放的对话内容');
  }

  this.isPlaying = true;
  await this.playNext();
}

/**
 * 播放下一句对话
 */
private async playNext(): Promise<void> {
  if (!this.isPlaying || this.currentIndex >= this.dialogueLines.length) {
    this.isPlaying = false;
    return;
  }

  const line = this.dialogueLines[this.currentIndex];

  // 切换音色
  await this.engineManager.initialize({
    type: 'qwen',
    voice: line.voice,
    apiKey: this.engineManager['config'].apiKey,
    model: this.engineManager['config'].model,
    speechRate: this.engineManager['config'].speechRate
  });

  // 检测语言
  const language = this.detectLanguage(line.content);

  // 播放当前句
  try {
    await this.engineManager.currentEngine.speak(line.content, language);

    // 播放完成，继续下一句
    this.currentIndex++;
    await this.playNext();
  } catch (error) {
    this.isPlaying = false;
    throw error;
  }
}

/**
 * 简单的语言检测
 */
private detectLanguage(text: string): Language {
  return /[\u4e00-\u9fa5]/.test(text) ? 'zh-CN' : 'en-US';
}
```

**Step 2: 实现控制方法**

```typescript
pause(): void {
  this.isPlaying = false;
  this.engineManager.pause();
}

resume(): void {
  if (this.currentIndex < this.dialogueLines.length) {
    this.isPlaying = true;
    this.engineManager.resume();
  }
}

stop(): void {
  this.isPlaying = false;
  this.currentIndex = 0;
  this.engineManager.stop();
}

/**
 * 跳转到指定对话
 */
async seekTo(index: number): Promise<void> {
  if (index < 0 || index >= this.dialogueLines.length) {
    throw new Error('Invalid dialogue index');
  }

  this.stop();
  this.currentIndex = index;
  await this.play();
}
```

**Step 3: 提交播放逻辑**

```bash
git add src/dialogue/multi-voice-player.ts
git commit -m "feat(dialogue): implement MultiVoicePlayer playback logic"
```

---

## Task 11: 创建进度提示 Modal

**Files:**
- Create: `src/dialogue/dialogue-progress-modal.ts`

**Step 1: 创建 Modal 类**

```typescript
// src/dialogue/dialogue-progress-modal.ts

import { App, Modal } from 'obsidian';
import { DialogueGenerationProgress } from './types';

export class DialogueProgressModal extends Modal {
  private progressBar: HTMLElement;
  private messageEl: HTMLElement;
  private percentageEl: HTMLElement;

  constructor(app: App) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('dialogue-progress-modal');

    // 标题
    contentEl.createEl('h2', { text: '生成对话中...' });

    // 进度条容器
    const progressContainer = contentEl.createDiv({ cls: 'progress-container' });

    // 进度条背景
    const progressTrack = progressContainer.createDiv({ cls: 'progress-track' });

    // 进度条填充
    this.progressBar = progressTrack.createDiv({ cls: 'progress-fill' });
    this.progressBar.style.width = '0%';

    // 百分比显示
    this.percentageEl = progressContainer.createDiv({ cls: 'progress-percentage' });
    this.percentageEl.textContent = '0%';

    // 消息显示
    this.messageEl = contentEl.createDiv({ cls: 'progress-message' });
    this.messageEl.textContent = '准备中...';
  }

  /**
   * 更新进度
   */
  updateProgress(progress: DialogueGenerationProgress): void {
    this.progressBar.style.width = `${progress.percentage}%`;
    this.percentageEl.textContent = `${progress.percentage}%`;
    this.messageEl.textContent = progress.message;
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
```

**Step 2: 添加样式**

在 `src/ui/styles.css` 中添加：

```css
/* 对话进度 Modal */
.dialogue-progress-modal {
  padding: 20px;
  min-width: 400px;
}

.dialogue-progress-modal h2 {
  margin-top: 0;
  text-align: center;
}

.progress-container {
  margin: 20px 0;
}

.progress-track {
  width: 100%;
  height: 8px;
  background: var(--background-modifier-border);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: var(--interactive-accent);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-percentage {
  text-align: center;
  margin-top: 10px;
  font-weight: bold;
  color: var(--text-normal);
}

.progress-message {
  text-align: center;
  margin-top: 10px;
  color: var(--text-muted);
  font-size: 14px;
}
```

**Step 3: 提交进度 Modal**

```bash
git add src/dialogue/ src/ui/styles.css
git commit -m "feat(dialogue): add progress modal for dialogue generation"
```

---

## Task 12: 创建对话选项 Modal

**Files:**
- Create: `src/dialogue/dialogue-options-modal.ts`

**Step 1: 创建 Modal 类**

```typescript
// src/dialogue/dialogue-options-modal.ts

import { App, Modal } from 'obsidian';

export type DialogueOption = 'use-existing' | 'regenerate' | 'cancel';

export class DialogueOptionsModal extends Modal {
  private resolvePromise: (value: DialogueOption) => void;

  constructor(app: App) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('dialogue-options-modal');

    // 标题
    contentEl.createEl('h2', { text: '对话文件已存在' });

    // 说明
    contentEl.createEl('p', {
      text: '检测到已有对话文件，你想：'
    });

    // 按钮容器
    const buttonContainer = contentEl.createDiv({ cls: 'dialogue-options-buttons' });

    // 使用现有对话
    const useButton = buttonContainer.createEl('button', {
      text: '使用现有对话',
      cls: 'mod-cta'
    });
    useButton.onclick = () => {
      this.close();
      this.resolvePromise('use-existing');
    };

    // 重新生成
    const regenButton = buttonContainer.createEl('button', {
      text: '重新生成'
    });
    regenButton.onclick = () => {
      this.close();
      this.resolvePromise('regenerate');
    };

    // 取消
    const cancelButton = buttonContainer.createEl('button', {
      text: '取消'
    });
    cancelButton.onclick = () => {
      this.close();
      this.resolvePromise('cancel');
    };
  }

  /**
   * 显示 Modal 并等待用户选择
   */
  async waitForChoice(): Promise<DialogueOption> {
    return new Promise((resolve) => {
      this.resolvePromise = resolve;
      this.open();
    });
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
```

**Step 2: 添加样式**

在 `src/ui/styles.css` 中添加：

```css
/* 对话选项 Modal */
.dialogue-options-modal {
  padding: 20px;
  min-width: 400px;
}

.dialogue-options-modal h2 {
  margin-top: 0;
}

.dialogue-options-modal p {
  margin: 15px 0 20px 0;
  color: var(--text-muted);
}

.dialogue-options-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.dialogue-options-buttons button {
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}
```

**Step 3: 提交选项 Modal**

```bash
git add src/dialogue/ src/ui/styles.css
git commit -m "feat(dialogue): add options modal for existing dialogue files"
```

---

## Task 13: 集成对话模块到 main.ts

**Files:**
- Modify: `src/main.ts`

**Step 1: 导入对话模块**

在 `src/main.ts` 顶部添加导入：

```typescript
import { DialogueGenerator } from './dialogue/dialogue-generator';
import { DialogueParser } from './dialogue/dialogue-parser';
import { DialogueFileManager } from './dialogue/dialogue-file-manager';
import { MultiVoicePlayer } from './dialogue/multi-voice-player';
```

**Step 2: 在 TTSPlugin 类中添加对话模块实例**

```typescript
export default class TTSPlugin extends Plugin {
  settings: TTSSettings;
  engineManager: TTSEngineManager;
  controller: TTSController;

  // 添加对话模块
  dialogueGenerator: DialogueGenerator;
  dialogueParser: DialogueParser;
  dialogueFileManager: DialogueFileManager;
  multiVoicePlayer: MultiVoicePlayer;

  // ... 其他代码
}
```

**Step 3: 在 onload() 中初始化对话模块**

```typescript
async onload() {
  console.log('Loading TTS Plugin');

  // 加载设置
  await this.loadSettings();

  // ... 现有的引擎和控制器初始化代码 ...

  // 初始化对话模块
  this.dialogueGenerator = new DialogueGenerator(this.settings.qwen.apiKey);
  this.dialogueParser = new DialogueParser();
  this.dialogueFileManager = new DialogueFileManager(this.app);
  this.multiVoicePlayer = new MultiVoicePlayer(this.engineManager);

  // ... 其他初始化代码 ...
}
```

**Step 4: 提交集成代码**

```bash
git add src/main.ts
git commit -m "feat(dialogue): integrate dialogue modules into main plugin"
```

---

## Task 14: 在 Controller 中添加对话按钮

**Files:**
- Modify: `src/ui/controller.ts`

**Step 1: 添加对话按钮属性**

```typescript
export class TTSController {
  // ... 现有属性 ...
  private dialogueButton: HTMLButtonElement;
  private isDialogueMode: boolean = false;

  // ... 其他代码 ...
}
```

**Step 2: 在 renderControlBar() 中创建对话按钮**

在创建播放按钮后添加：

```typescript
// 创建对话模式按钮
this.dialogueButton = document.createElement('button');
this.dialogueButton.addClass('tts-dialogue-button');
this.dialogueButton.textContent = '💬';
this.dialogueButton.setAttribute('aria-label', '对话模式');
this.dialogueButton.title = '生成对话播放';

this.dialogueButton.onclick = async () => {
  await this.handleDialogueMode();
};

// 添加到控制按钮组
controlButtons.appendChild(this.dialogueButton);
```

**Step 3: 添加对话按钮样式**

在 `src/ui/styles.css` 中添加：

```css
/* 对话模式按钮 */
.tts-dialogue-button {
  width: 32px;
  height: 32px;
  border: 1px solid var(--background-modifier-border);
  border-radius: 6px;
  background: var(--background-secondary);
  color: var(--text-normal);
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.tts-dialogue-button:hover {
  background: var(--background-modifier-hover);
  border-color: var(--interactive-accent);
  color: var(--interactive-accent);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tts-dialogue-button.active {
  background: var(--interactive-accent);
  color: var(--text-on-accent);
  border-color: var(--interactive-accent);
}
```

**Step 4: 提交对话按钮**

```bash
git add src/ui/
git commit -m "feat(dialogue): add dialogue mode button to control bar"
```

---

## Task 15: 实现对话模式处理逻辑

**Files:**
- Modify: `src/ui/controller.ts`

**Step 1: 实现 handleDialogueMode() 方法**

```typescript
/**
 * 处理对话模式点击
 */
private async handleDialogueMode(): Promise<void> {
  const view = this.app.workspace.getActiveViewOfType(MarkdownView);
  if (!view) {
    new Notice('请先打开一个笔记');
    return;
  }

  const filePath = view.file.path;

  // 检查是否已存在对话文件
  const exists = await this.plugin.dialogueFileManager.dialogueExists(filePath);

  if (exists) {
    // 显示选项 Modal
    const modal = new DialogueOptionsModal(this.app);
    const choice = await modal.waitForChoice();

    if (choice === 'use-existing') {
      await this.playExistingDialogue(filePath);
      return;
    } else if (choice === 'regenerate') {
      // 继续生成新对话
    } else {
      // 取消
      return;
    }
  }

  // 生成新对话
  await this.generateAndPlayDialogue(view);
}
```

**Step 2: 实现 generateAndPlayDialogue() 方法**

```typescript
/**
 * 生成并播放对话
 */
private async generateAndPlayDialogue(view: MarkdownView): Promise<void> {
  const progressModal = new DialogueProgressModal(this.app);
  progressModal.open();

  try {
    // 阶段 1: 分析文档
    progressModal.updateProgress({
      stage: 'analyzing',
      message: '正在分析文档内容...',
      percentage: 10
    });

    const content = view.editor.getValue();
    const wordCount = content.length;

    // 阶段 2: 生成对话
    const script = await this.plugin.dialogueGenerator.generate(
      content,
      wordCount,
      (progress) => progressModal.updateProgress(progress)
    );

    // 验证脚本
    const validation = this.plugin.dialogueParser.validate(script);
    if (!validation.isValid) {
      throw new Error(`对话脚本格式错误: ${validation.errors.join(', ')}`);
    }

    // 阶段 3: 保存文件
    progressModal.updateProgress({
      stage: 'saving',
      message: '正在保存对话文件...',
      percentage: 70
    });

    const dialoguePath = await this.plugin.dialogueFileManager.saveDialogue(
      view.file.path,
      script
    );

    // 阶段 4: 准备播放
    progressModal.updateProgress({
      stage: 'preparing',
      message: '准备播放...',
      percentage: 90
    });

    const dialogueLines = this.plugin.dialogueParser.parse(script);
    await this.plugin.multiVoicePlayer.loadDialogue(dialogueLines);

    // 完成
    progressModal.updateProgress({
      stage: 'complete',
      message: '对话生成完成！',
      percentage: 100
    });

    // 延迟关闭 modal
    setTimeout(() => {
      progressModal.close();
      this.isDialogueMode = true;
      this.dialogueButton.addClass('active');
      this.plugin.multiVoicePlayer.play();

      // 显示成功通知
      const fileName = dialoguePath.split('/').pop();
      new Notice(`对话已保存到: ${fileName}`);
    }, 500);

  } catch (error) {
    progressModal.close();
    new Notice(`对话生成失败: ${error.message}`);
    console.error('Dialogue generation error:', error);
  }
}
```

**Step 3: 实现 playExistingDialogue() 方法**

```typescript
/**
 * 播放已存在的对话
 */
private async playExistingDialogue(filePath: string): Promise<void> {
  try {
    const script = await this.plugin.dialogueFileManager.loadDialogue(filePath);
    if (!script) {
      throw new Error('无法加载对话文件');
    }

    const dialogueLines = this.plugin.dialogueParser.parse(script);
    await this.plugin.multiVoicePlayer.loadDialogue(dialogueLines);

    this.isDialogueMode = true;
    this.dialogueButton.addClass('active');
    await this.plugin.multiVoicePlayer.play();

  } catch (error) {
    new Notice(`播放对话失败: ${error.message}`);
    console.error('Play dialogue error:', error);
  }
}
```

**Step 4: 提交对话处理逻辑**

```bash
git add src/ui/controller.ts
git commit -m "feat(dialogue): implement dialogue mode handling logic"
```

---

## Task 16: 处理对话模式下的播放控制

**Files:**
- Modify: `src/ui/controller.ts`

**Step 1: 修改播放/暂停/停止按钮逻辑**

更新按钮的 onclick 事件，检查是否在对话模式：

```typescript
// 在 renderControlBar() 中修改播放按钮
this.startButton.onclick = async () => {
  if (this.isDialogueMode) {
    // 对话模式：使用 MultiVoicePlayer
    await this.plugin.multiVoicePlayer.play();
  } else {
    // 普通模式：使用现有逻辑
    // ... 现有代码 ...
  }
};

// 修改暂停按钮
this.pauseButton.onclick = () => {
  if (this.isDialogueMode) {
    this.plugin.multiVoicePlayer.pause();
  } else {
    this.engineManager.pause();
  }
};

// 修改停止按钮
this.stopButton.onclick = () => {
  if (this.isDialogueMode) {
    this.plugin.multiVoicePlayer.stop();
    this.isDialogueMode = false;
    this.dialogueButton.removeClass('active');
  } else {
    this.engineManager.stop();
  }
};
```

**Step 2: 提交播放控制更新**

```bash
git add src/ui/controller.ts
git commit -m "feat(dialogue): integrate dialogue mode with playback controls"
```

---

## Task 17: 构建并测试

**Files:**
- N/A

**Step 1: 构建项目**

```bash
npm run build
```

预期：构建成功，无 TypeScript 错误

**Step 2: 同步到 vault**

```bash
cp main.js styles.css /path/to/vault/.obsidian/plugins/obsidian-tts/
```

**Step 3: 在 Obsidian 中测试**

1. 按 `Cmd/Ctrl + R` 重新加载插件
2. 打开一个笔记
3. 点击 💬 按钮
4. 观察进度提示
5. 等待对话生成
6. 检查对话文件是否生成
7. 测试播放功能

**Step 4: 提交构建配置（如有修改）**

```bash
git add .
git commit -m "build: update build configuration for dialogue mode"
```

---

## Task 18: 文档更新

**Files:**
- Modify: `README.md`

**Step 1: 更新 README**

在功能特性部分添加：

```markdown
### 🎭 对话模式（新增）
- **AI 生成对话**：使用通义千问将文档转换成三人对话
- **三角色设定**：主讲人、好奇学生、批判学生
- **长度自适应**：根据文档字数自动调整对话详细程度
- **多音色播放**：按角色自动切换音色
- **对话保存**：生成的对话保存为可编辑的 .md 文件
```

在使用指南部分添加：

```markdown
### 对话模式使用

1. 打开任意 Markdown 笔记
2. 点击 💬 对话模式按钮
3. 等待 AI 生成对话脚本（10-30秒）
4. 自动开始播放对话
5. 对话文件保存为 `原文档名-对话.md`

**对话角色**：
- 主讲人（Ethan）：讲解核心内容
- 好奇学生（Cherry）：提出基础问题
- 批判学生（Serena）：提出深度问题
```

**Step 2: 提交文档更新**

```bash
git add README.md
git commit -m "docs: add dialogue mode documentation to README"
```

---

## Task 19: 最终测试与优化

**测试清单**：

1. **基础功能测试**
   - [ ] 对话生成成功
   - [ ] 对话文件正确保存
   - [ ] 对话解析正确
   - [ ] 音色切换正常
   - [ ] 播放流畅无卡顿

2. **边界情况测试**
   - [ ] 短文档（<1000字）
   - [ ] 中等文档（1000-3000字）
   - [ ] 长文档（>3000字）
   - [ ] 空文档
   - [ ] 纯代码文档

3. **错误处理测试**
   - [ ] API 调用失败
   - [ ] 脚本格式错误
   - [ ] 文件保存失败
   - [ ] 播放中断

4. **用户体验测试**
   - [ ] 进度提示清晰
   - [ ] 错误提示友好
   - [ ] 按钮状态正确
   - [ ] 对话文件已存在时的选项

**优化建议**：

1. 添加对话生成超时处理（30秒）
2. 添加对话脚本缓存（避免重复生成）
3. 优化进度提示动画
4. 添加对话质量评分功能

---

## Task 20: 提交最终版本

**Step 1: 最终代码检查**

```bash
# 检查所有文件是否已提交
git status

# 检查代码风格
npm run lint  # 如果有 lint 配置
```

**Step 2: 创建最终提交**

```bash
git add .
git commit -m "feat: complete dialogue mode implementation

- Add DialogueGenerator for AI-powered dialogue generation
- Add DialogueParser for script parsing and voice mapping
- Add MultiVoicePlayer for multi-voice playback
- Add DialogueFileManager for file operations
- Add progress modal and options modal
- Integrate dialogue mode into UI with dedicated button
- Update documentation with dialogue mode usage

Closes #[issue-number]"
```

**Step 3: 推送到远程仓库**

```bash
git push origin main
```

---

## 完成！

实现计划已完成。总结：

- **Task 1-5**: DialogueParser 和 DialogueFileManager
- **Task 6-10**: DialogueGenerator 和 MultiVoicePlayer
- **Task 11-15**: UI 集成和对话处理逻辑
- **Task 16-20**: 播放控制、测试、文档和发布

所有核心功能已实现，可以开始执行计划了！
