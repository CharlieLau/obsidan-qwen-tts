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

  /**
   * 验证对话脚本格式
   */
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
}
