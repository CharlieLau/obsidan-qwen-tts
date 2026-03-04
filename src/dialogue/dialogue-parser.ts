// src/dialogue/dialogue-parser.ts

import { DialogueLine, DialogueRole, DialogueValidation, DialogueMode } from './types';

export class DialogueParser {
  private mode: DialogueMode;
  private educationVoiceMapping: Record<string, string>;
  private podcastVoiceMapping: Record<string, string>;

  constructor(
    mode: DialogueMode = 'education',
    educationVoices?: { host: string; curious: string; critical: string },
    podcastVoices?: { host1: string; host2: string }
  ) {
    this.mode = mode;
    this.educationVoiceMapping = educationVoices || {
      'host': 'Ethan',
      'curious': 'Cherry',
      'critical': 'Serena'
    };
    this.podcastVoiceMapping = podcastVoices || {
      'host1': 'Moon',
      'host2': 'Maia'
    };
  }

  /**
   * 设置对话模式
   */
  setMode(mode: DialogueMode): void {
    this.mode = mode;
  }

  /**
   * 更新音色映射
   */
  updateVoiceMapping(
    educationVoices?: { host: string; curious: string; critical: string },
    podcastVoices?: { host1: string; host2: string }
  ): void {
    if (educationVoices) {
      this.educationVoiceMapping = educationVoices;
    }
    if (podcastVoices) {
      this.podcastVoiceMapping = podcastVoices;
    }
  }

  // 教育模式：角色标记的正则表达式（容忍空格）
  private readonly educationRolePatterns: Record<string, RegExp> = {
    'host': /^\[\s*主讲人\s*\]\s*:\s*/,
    'curious': /^\[\s*好奇学生\s*\]\s*:\s*/,
    'critical': /^\[\s*批判学生\s*\]\s*:\s*/
  };

  // 播客模式：角色标记的正则表达式（容忍空格）
  private readonly podcastRolePatterns: Record<string, RegExp> = {
    'host1': /^\[\s*主播\s*A\s*\]\s*:\s*/,
    'host2': /^\[\s*主播\s*B\s*\]\s*:\s*/
  };

  /**
   * 获取当前模式的角色映射
   */
  private getVoiceMapping(): Record<string, string> {
    return this.mode === 'podcast' ? this.podcastVoiceMapping : this.educationVoiceMapping;
  }

  /**
   * 获取当前模式的角色模式
   */
  private getRolePatterns(): Record<string, RegExp> {
    return this.mode === 'podcast' ? this.podcastRolePatterns : this.educationRolePatterns;
  }

  /**
   * 解析对话脚本
   */
  parse(script: string): DialogueLine[] {
    const lines = script.split('\n').filter(line => line.trim());
    const dialogueLines: DialogueLine[] = [];
    const voiceMapping = this.getVoiceMapping();
    const rolePatterns = this.getRolePatterns();

    for (const line of lines) {
      // 识别角色
      let role: string | null = null;
      let content = line;

      // 尝试匹配每个角色
      for (const [roleKey, pattern] of Object.entries(rolePatterns)) {
        if (pattern.test(line)) {
          role = roleKey;
          content = line.replace(pattern, '');
          break;
        }
      }

      // 如果识别到角色，添加到结果
      if (role && content.trim()) {
        dialogueLines.push({
          role: role as DialogueRole,
          content: content.trim(),
          voice: voiceMapping[role]
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
    const rolePatterns = this.getRolePatterns();

    // 检查是否有对话内容
    if (lines.length === 0) {
      errors.push('对话脚本为空');
      return { isValid: false, errors };
    }

    // 检查是否有无法识别的行
    let unrecognizedLines = 0;
    let recognizedLines = 0;

    for (const line of lines) {
      const hasRole = Object.values(rolePatterns).some(
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
