// src/dialogue/dialogue-generator.ts

import { requestUrl } from 'obsidian';
import { DialogueLength, ProgressCallback, DialogueMode, DialogueTemplate, DialogueStyle } from './types';
import { DialogueTemplateManager } from './dialogue-template-manager';

export class DialogueGenerator {
  private apiKey: string;
  private model: string;
  private readonly apiEndpoint = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

  constructor(apiKey: string, model: string = 'qwen3.5-plus') {
    this.apiKey = apiKey;
    this.model = model;
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
