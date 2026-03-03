# 对话模式功能设计文档

> **Date:** 2026-03-03
> **Status:** Design Phase
> **Priority:** High
> **Goal:** 将 Markdown 文档转换成多人对话形式进行播放，类似 NotebookLM 的学习体验

## 背景与目标

### 问题
当前 TTS 插件逐段朗读 Markdown 文档，对于长文档来说：
- 读起来断断续续，缺乏连贯性
- 纯朗读缺少互动感，难以保持注意力
- 无法突出重点，缺少引导性

### 目标
实现类似 NotebookLM 的对话式学习体验：
- 将文档内容转换成三人对话（主讲人 + 两个学生）
- 通过提问和回答的方式讲解内容
- 自动根据文档长度调整对话详细程度
- 保存对话脚本，支持重复播放和编辑

## 用户需求确认

通过问答确认的需求：
1. **对话生成方式**：实时 AI 生成（通义千问）
2. **AI 模型**：复用现有的通义千问 API Key
3. **角色数量**：三人对话（主讲人 + 好奇学生 + 批判学生）
4. **详细程度**：根据文档字数自动调整长度
5. **触发方式**：独立的"💬 对话模式"按钮
6. **脚本处理**：保存为 `.md` 文件（可编辑和重用）
7. **音色分配**：自动分配不同音色
8. **生成体验**：显示进度提示（分析→生成→保存→准备）

## 整体架构

```
用户点击"💬 对话模式"
        ↓
[UI Controller] 显示进度提示
        ↓
[Dialogue Generator] 调用通义千问 API
        ↓
    分析文档内容
    - 提取标题、段落、关键信息
    - 计算文档长度（字数）
    - 确定对话详细程度
        ↓
    生成三人对话脚本
    - 主讲人：讲解核心内容
    - 好奇学生：提出基础问题
    - 批判学生：提出深度问题
        ↓
[File Manager] 保存对话脚本
    - 文件名：原文档名-对话.md
    - 位置：与原文档同目录
        ↓
[Dialogue Parser] 解析对话脚本
    - 识别角色标记 [主讲人]、[好奇学生]、[批判学生]
    - 提取对话内容
    - 分配音色
        ↓
[Multi-Voice Player] 按角色播放
    - 主讲人 → Ethan (男性、稳重)
    - 好奇学生 → Cherry (女性、活泼)
    - 批判学生 → Serena (女性、理性)
        ↓
    播放完成
```

## 核心模块设计

### 1. DialogueGenerator - 对话生成器

**职责**：调用通义千问 API 生成对话脚本

**Prompt 工程**：

```
你是一个教育内容转换专家。请将以下 Markdown 文档转换成三人对话形式，用于语音播放学习。

**角色设定**：
- [主讲人]：经验丰富的老师，负责讲解核心内容，语言清晰、逻辑严密
- [好奇学生]：充满好奇心的学习者，会提出基础问题、要求举例说明
- [批判学生]：善于思考的学习者，会质疑观点、提出深度问题、探讨边界情况

**对话要求**：
1. 对话长度：根据原文档字数自动调整
   - 1000字以内：5-8轮对话（约5分钟）
   - 1000-3000字：10-15轮对话（约15分钟）
   - 3000字以上：20-30轮对话（约30分钟）

2. 对话结构：
   - 开场：主讲人简要介绍文档主题和结构
   - 正文：按文档章节顺序展开，穿插学生提问
   - 结尾：主讲人总结要点，学生提出延伸思考

3. 对话风格：
   - 自然流畅，像真实的课堂讨论
   - 好奇学生的问题要简单直接（"这是什么意思？"、"能举个例子吗？"）
   - 批判学生的问题要有深度（"这个观点的前提是什么？"、"有没有反例？"）
   - 避免生硬的"谢谢老师"等客套话

4. 输出格式：
   严格使用以下格式，每行一个角色发言：
   [主讲人]: 发言内容
   [好奇学生]: 发言内容
   [批判学生]: 发言内容

**原文档内容**：
{markdown_content}

**文档字数**：{word_count} 字

请开始生成对话：
```

**长度自适应逻辑**：

```typescript
function calculateDialogueLength(wordCount: number): {
  targetRounds: number;
  estimatedMinutes: number;
  detailLevel: 'brief' | 'moderate' | 'detailed';
} {
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
```

**API 配置**：

```typescript
const apiConfig = {
  model: 'qwen-long',  // 支持长文本输入
  temperature: 0.8,     // 稍高的温度，增加对话自然度
  max_tokens: 4000,     // 足够生成完整对话
  top_p: 0.9
};
```

### 2. DialogueParser - 对话解析器

**职责**：解析对话脚本，识别角色，映射音色

**对话脚本格式**：

```markdown
[主讲人]: 今天我们来讨论理想职场与意识形态的关系。

[好奇学生]: 老师，什么是意识形态呢？

[主讲人]: 好问题。意识形态可以理解为一套系统的思想观念。

[批判学生]: 那意识形态和职场有什么必然联系吗？
```

**接口定义**：

```typescript
interface DialogueLine {
  role: 'host' | 'curious' | 'critical';  // 角色类型
  content: string;                         // 对话内容
  voice: string;                           // 分配的音色
}

class DialogueParser {
  // 角色到音色的映射
  private readonly voiceMapping = {
    'host': 'Ethan',      // 主讲人 - 稳重男声
    'curious': 'Cherry',  // 好奇学生 - 活泼女声
    'critical': 'Serena'  // 批判学生 - 理性女声
  };

  parse(script: string): DialogueLine[];
  validate(script: string): { isValid: boolean; errors: string[] };
}
```

**音色配置**：

| 角色 | 音色 | 性别 | 特点 | 适合原因 |
|------|------|------|------|----------|
| 主讲人 | Ethan | 男性 | 阳光、温暖、活力 | 稳重可信，适合讲解 |
| 好奇学生 | Cherry | 女性 | 阳光积极、亲切自然 | 活泼好奇，适合提问 |
| 批判学生 | Serena | 女性 | 温柔理性 | 温和但有深度，适合质疑 |

### 3. DialogueFileManager - 文件管理器

**职责**：保存/读取对话脚本文件

**文件命名规则**：
- 原文档：`思考/理想职场.md`
- 对话文件：`思考/理想职场-对话.md`

**文件格式**：

```markdown
---
generated: 2026-03-03T10:30:00Z
source: 理想职场.md
type: dialogue
---

[主讲人]: 今天我们来讨论...
[好奇学生]: 老师，什么是...
```

**接口定义**：

```typescript
class DialogueFileManager {
  getDialoguePath(originalPath: string): string;
  async saveDialogue(originalPath: string, script: string): Promise<string>;
  async loadDialogue(originalPath: string): Promise<string | null>;
  async dialogueExists(originalPath: string): Promise<boolean>;
  async deleteDialogue(originalPath: string): Promise<void>;
}
```

### 4. MultiVoicePlayer - 多音色播放器

**职责**：按角色切换音色，逐句播放对话

**播放流程**：

1. 加载对话 → `loadDialogue(lines)`
2. 开始播放 → `play()`
3. 逐句播放：
   - 获取当前对话行
   - 根据角色切换音色
   - 调用 TTS 引擎播放
   - 等待播放完成
   - 自动播放下一句
4. 播放控制：
   - 暂停/继续：保持当前位置
   - 停止：重置到开头
   - 跳转：可以跳到任意对话

**接口定义**：

```typescript
class MultiVoicePlayer {
  async loadDialogue(lines: DialogueLine[]): Promise<void>;
  async play(): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
  getProgress(): { current: number; total: number; percentage: number };
  async seekTo(index: number): Promise<void>;
}
```

## UI 设计

### 控制条布局

```
现有布局：
┌────────────────────────────────────────────────────┐
│ ▶ ⏸ ⏹  ├──●────┤ 0:23/2:45  🎵Cherry  ⚙         │
└────────────────────────────────────────────────────┘

新增对话模式后：
┌────────────────────────────────────────────────────┐
│ ▶ ⏸ ⏹ 💬  ├──●────┤ 0:23/2:45  🎵Cherry  ⚙       │
└────────────────────────────────────────────────────┘
         ↑
    对话模式按钮
```

### 进度提示 Modal

**阶段划分**：

| 阶段 | 进度 | 提示信息 | 说明 |
|------|------|----------|------|
| analyzing | 10% | 正在分析文档内容... | 读取文档，计算字数 |
| generating | 30% | 正在生成对话脚本... | 调用 AI API |
| saving | 70% | 正在保存对话文件... | 写入文件系统 |
| preparing | 90% | 准备播放... | 解析脚本，加载播放器 |
| complete | 100% | 对话生成完成！ | 显示成功消息 |

### 对话选项 Modal

当对话文件已存在时显示：

```
┌─────────────────────────────────┐
│     对话文件已存在              │
│                                 │
│  检测到已有对话文件，你想：     │
│                                 │
│  [使用现有对话] [重新生成] [取消] │
└─────────────────────────────────┘
```

## 用户交互流程

```
用户点击 💬 按钮
    ↓
检查对话文件是否存在
    ↓
存在 → 显示选项 Modal
    ├─ 使用现有 → 直接播放
    ├─ 重新生成 → 继续生成流程
    └─ 取消 → 返回
    ↓
不存在 → 开始生成
    ↓
显示进度 Modal
    ├─ 分析文档 (10%)
    ├─ 生成对话 (30%)
    ├─ 保存文件 (70%)
    ├─ 准备播放 (90%)
    └─ 完成 (100%)
    ↓
自动开始播放
    ↓
显示成功通知："对话已保存到: xxx-对话.md"
```

## 技术实现要点

### 1. API 调用

```typescript
// 使用通义千问 qwen-long 模型
const response = await requestUrl({
  url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
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
```

### 2. 音色切换

```typescript
// 每句对话前切换音色
for (const line of dialogueLines) {
  await this.engineManager.initialize({
    type: 'qwen',
    voice: line.voice,  // Ethan / Cherry / Serena
    // ... 其他配置
  });

  await this.engineManager.currentEngine.speak(
    line.content,
    this.detectLanguage(line.content)
  );
}
```

### 3. 进度更新

```typescript
// 使用回调函数更新进度
const progressCallback = (progress: DialogueGenerationProgress) => {
  progressModal.updateProgress(progress);
};

await this.dialogueGenerator.generate(
  content,
  wordCount,
  progressCallback
);
```

## 错误处理

### 1. API 调用失败
- 显示错误通知："对话生成失败: API 调用超时"
- 保留用户输入，允许重试
- 记录错误日志

### 2. 脚本格式错误
- 验证生成的脚本格式
- 如果格式错误，显示具体错误信息
- 提供"重新生成"选项

### 3. 文件保存失败
- 检查文件系统权限
- 显示错误通知："无法保存对话文件"
- 提供将脚本复制到剪贴板的选项

### 4. 播放中断
- 切换文档时自动停止播放
- 保存当前播放位置
- 提供"继续播放"选项

## 性能优化

### 1. 缓存策略
- 对话文件保存后，下次直接使用
- 避免重复调用 API
- 用户可选择"重新生成"

### 2. 异步加载
- 生成过程在后台进行
- 不阻塞 Obsidian 主线程
- 使用 Web Worker（可选）

### 3. 进度反馈
- 实时显示生成进度
- 让用户知道系统在工作
- 避免误以为卡死

## 未来扩展

### v0.2.0 可能的增强
- [ ] 支持自定义角色数量和定位
- [ ] 支持选择不同的 AI 模型（OpenAI GPT-4）
- [ ] 支持流式生成（边生成边播放）
- [ ] 支持对话大纲预览和编辑
- [ ] 支持分段生成（按章节）

### v0.3.0 可能的增强
- [ ] 支持对话风格选择（正式/轻松/幽默）
- [ ] 支持多语言对话生成
- [ ] 支持导出音频文件
- [ ] 支持对话脚本模板库

## 成功标准

### 功能完整性
- ✅ 点击按钮能成功生成对话
- ✅ 对话脚本格式正确
- ✅ 音色切换正常
- ✅ 文件保存成功
- ✅ 播放流畅无卡顿

### 用户体验
- ✅ 生成时间 < 30 秒（大多数情况）
- ✅ 进度提示清晰
- ✅ 错误提示友好
- ✅ 对话内容质量高
- ✅ 音色区分明显

### 性能指标
- ✅ API 调用成功率 > 95%
- ✅ 脚本解析准确率 > 98%
- ✅ 内存占用 < 50MB
- ✅ 不影响 Obsidian 其他功能

---

**下一步**：使用 writing-plans 技能创建详细的实现计划
