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

  /**
   * 生成对话脚本
   */
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
}
