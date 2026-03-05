// src/dialogue/dialogue-generator.ts

import { requestUrl } from 'obsidian';
import { DialogueLength, ProgressCallback, DialogueMode, DialogueTemplate, DialogueStyle } from './types';
import { DialogueTemplateManager } from './dialogue-template-manager';

export class DialogueGenerator {
  private apiKey: string;
  private model: string;
  private mode: DialogueMode;
  private readonly apiEndpoint = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

  constructor(apiKey: string, model: string = 'qwen3.5-plus', mode: DialogueMode = 'education') {
    this.apiKey = apiKey;
    this.model = model;
    this.mode = mode;
  }

  /**
   * 设置对话模式
   */
  setMode(mode: DialogueMode): void {
    this.mode = mode;
  }

  /**
   * 计算对话长度
   * 注意：总轮数包含开场(1-2) + 正文(主体) + 深度提问(3-5) + 总结(2-3)
   */
  calculateLength(wordCount: number): DialogueLength {
    if (wordCount < 1000) {
      return {
        targetRounds: 12,  // 开场2 + 正文4 + 深度3 + 总结3
        estimatedMinutes: 5,
        detailLevel: 'brief'
      };
    } else if (wordCount < 3000) {
      return {
        targetRounds: 20,  // 开场2 + 正文10 + 深度4 + 总结4
        estimatedMinutes: 15,
        detailLevel: 'moderate'
      };
    } else {
      return {
        targetRounds: 35,  // 开场2 + 正文23 + 深度5 + 总结5
        estimatedMinutes: 30,
        detailLevel: 'detailed'
      };
    }
  }

  /**
   * 构建系统 Prompt
   */
  private buildSystemPrompt(): string {
    if (this.mode === 'podcast') {
      return this.buildPodcastPrompt();
    } else {
      return this.buildEducationPrompt();
    }
  }

  /**
   * 教育模式 Prompt
   */
  private buildEducationPrompt(): string {
    return `你是一个教育内容转换专家。请将 Markdown 文档转换成三人对话形式，用于语音播放学习。

**角色设定**：
- [主讲人]：经验丰富的老师，负责讲解核心内容，语言清晰、逻辑严密
- [好奇学生]：充满好奇心的学习者，会提出基础问题、要求举例说明
- [批判学生]：善于思考的学习者，会质疑观点、提出深度问题、探讨边界情况

**对话结构**：
- 开场：主讲人简要介绍文档主题和结构（1-2轮）
- 正文：按文档章节顺序展开，穿插学生提问（主体部分）
- 深度提问：批判学生连续提出3-5个"为什么"问题，层层深入（3-5轮）
- 总结回顾：主讲人系统梳理核心要点，提炼关键洞察（2-3轮）

**对话风格**：
- 自然流畅，像真实的课堂讨论
- 好奇学生的问题要简单直接（"这是什么意思？"、"能举个例子吗？"）
- 批判学生的问题要有深度（"这个观点的前提是什么？"、"有没有反例？"）
- 避免生硬的"谢谢老师"等客套话

**结尾深度提问示例**（批判学生主导）：
- "为什么这个方法比其他方法更有效？"
- "为什么会出现这样的问题？根本原因是什么？"
- "为什么这个原则在实践中很重要？"
- "这背后的深层逻辑是什么？"
- "如果改变某个前提，结论会如何变化？"

**总结回顾要求**（主讲人主导）：
- 用1-2分钟系统梳理核心概念
- 提炼3-5个关键要点
- 点明实践价值和应用场景
- 给出记忆提示或口诀

**输出格式**：
严格使用以下格式，每行一个角色发言：
[主讲人]: 发言内容
[好奇学生]: 发言内容
[批判学生]: 发言内容

**重要**：
- 必须使用方括号 [] 包裹角色名
- 角色名后必须有冒号和空格
- 不要添加任何前言、后记或解释
- 直接输出对话内容`;
  }

  /**
   * 播客模式 Prompt
   */
  private buildPodcastPrompt(): string {
    return `你是一个播客内容创作专家。请将 Markdown 文档转换成轻松有趣的双人播客对话，用于语音播放。

**角色设定**：
- [主播A]：博主本人，分享自己的见解和经验，语言轻松幽默、有个人风格
- [主播B]：好友或搭档，负责提问互动、补充观点、调节气氛

**对话结构**：
- 开场：轻松的寒暄，引出今天的话题（"嘿，今天聊聊..."）（1-2轮）
- 正文：围绕文档内容自然展开，像朋友聊天（主体部分）
- 深度探讨：主播B连续追问"为什么"，挖掘深层原因（3-5轮）
- 总结升华：主播A总结核心观点，分享个人感悟和行动建议（2-3轮）
- 结尾：邀请听众互动（"你怎么看？欢迎留言"）（1轮）

**对话风格**：
- 轻松随意，像朋友聊天，可以开玩笑
- 主播A分享个人经验、故事、感悟
- 主播B提问、附和、补充不同角度（"哇，有意思"、"我也遇到过"、"换个角度看..."）
- 可以有口语化表达（"嗯"、"哈哈"、"对对对"）
- 可以跑题、插入小故事、分享趣事
- 避免说教，多用"我觉得"、"我的经验是"

**语言特点**：
- 口语化：用"咱们"、"这事儿"、"挺"等口语词
- 情绪化：可以表达兴奋、惊讶、共鸣（"太棒了！"、"确实！"）
- 互动感：经常互相回应（"你说是吧"、"对不对"）
- 生活化：联系日常生活场景和例子

**深度探讨示例**（主播B追问）：
- "但是为什么会这样呢？"
- "这背后的原因是什么？"
- "为什么这个对我们很重要？"
- "换个角度看，为什么不能用另一种方式？"
- "那根本原因到底是什么？"

**总结升华要求**（主播A主导）：
- 用自己的话重新串联核心观点
- 分享个人最大的收获或感悟
- 给出1-3个具体的行动建议
- 用一句话概括主题精髓

**输出格式**：
严格使用以下格式，每行一个角色发言：
[主播A]: 发言内容
[主播B]: 发言内容

**重要**：
- 必须使用方括号 [] 包裹角色名
- 角色名后必须有冒号和空格
- 不要添加任何前言、后记或解释
- 直接输出对话内容`;
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

  /**
   * 计算超时时间（根据文档长度）
   */
  private calculateTimeout(wordCount: number): number {
    // 基础超时：90秒
    // 每1000字增加30秒
    const baseTimeout = 90000;
    const additionalTimeout = Math.floor(wordCount / 1000) * 30000;
    const maxTimeout = 300000; // 最大5分钟

    return Math.min(baseTimeout + additionalTimeout, maxTimeout);
  }

  /**
   * 构建模板特定的 Prompt
   */
  private buildPrompt(
    content: string,
    wordCount: number,
    template: DialogueTemplate,
    style: DialogueStyle
  ): string {
    const stylePrompts = {
      formal: '语言规范、逻辑严密，使用专业术语，适合学术、技术文档',
      casual: '语言通俗、比喻生动，适当使用口语，适合科普、生活类内容',
      humorous: '加入幽默元素、俏皮话，使用类比和段子，适合娱乐、趣味内容'
    };

    const styleDesc = stylePrompts[style];

    // Build role descriptions
    const roleDescriptions = template.roles.map(role =>
      `- [${role.name}]：${role.personality}`
    ).join('\n');

    const roleFormat = template.roles.map(role =>
      `[${role.name}]: 发言内容`
    ).join('\n');

    let prompt = `你是一个内容转换专家。请将以下文档转换成${template.name}形式：\n\n`;
    prompt += `**角色设定**：\n${roleDescriptions}\n\n`;
    prompt += `**对话风格**：${styleDesc}\n\n`;
    prompt += `**对话长度**：根据原文档字数自动调整\n`;
    prompt += `- 1000字以内：5-8轮对话（约5分钟）\n`;
    prompt += `- 1000-3000字：10-15轮对话（约15分钟）\n`;
    prompt += `- 3000字以上：20-30轮对话（约30分钟）\n\n`;
    prompt += `**输出格式**：\n严格使用以下格式，每行一个角色发言：\n${roleFormat}\n\n`;
    prompt += `**原文档内容**：\n${content}\n\n`;
    prompt += `**文档字数**：${wordCount} 字\n\n`;
    prompt += `请开始生成对话：`;

    return prompt;
  }

  /**
   * 生成对话脚本
   */
  async generate(
    content: string,
    wordCount: number,
    onProgress?: ProgressCallback,
    template?: DialogueTemplate,
    style?: DialogueStyle
  ): Promise<string> {
    // Use defaults if not provided
    const templateManager = new DialogueTemplateManager();
    const actualTemplate = template || templateManager.getDefaultTemplate();
    const actualStyle = style || 'casual';

    // 计算对话长度和超时时间
    const length = this.calculateLength(wordCount);
    const timeout = this.calculateTimeout(wordCount);
    const timeoutSeconds = Math.round(timeout / 1000);

    // 报告进度：分析文档
    onProgress?.({
      stage: 'analyzing',
      message: '正在分析文档内容...',
      percentage: 10
    });

    // 构建 Prompt
    const prompt = this.buildPrompt(content, wordCount, actualTemplate, actualStyle);

    // 报告进度：生成对话
    onProgress?.({
      stage: 'generating',
      message: `正在生成对话脚本（约${length.estimatedMinutes}分钟内容，最长等待${timeoutSeconds}秒）...`,
      percentage: 30
    });

    // 调用 API (使用 OpenAI 兼容格式)
    const requestBody = {
      model: this.model,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 4000,
      top_p: 0.9
    };

    let response: any;
    try {
      response = await Promise.race([
        requestUrl({
          url: this.apiEndpoint,
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody),
          throw: false
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`请求超时（${timeoutSeconds}秒）`)), timeout)
        )
      ]);
    } catch (error: any) {
      throw new Error(`API 请求失败: ${error.message}`);
    }

    // 检查响应
    if (response.status !== 200) {
      throw new Error(`API 调用失败: ${response.status} - ${JSON.stringify(response.json)}`);
    }

    const result = response.json;
    if (!result.choices || result.choices.length === 0) {
      throw new Error('API 返回格式错误');
    }

    // 提取对话脚本 (OpenAI 兼容格式)
    const script = result.choices[0].message.content;

    return script;
  }
}
