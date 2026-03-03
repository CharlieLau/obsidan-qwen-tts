// src/utils/language-detector.ts

import { Language } from '../tts/engines/base';

export function detectLanguage(text: string): Language {
  // 检测是否包含中文字符
  const chineseRegex = /[\u4e00-\u9fa5]/;
  return chineseRegex.test(text) ? 'zh-CN' : 'en-US';
}

export interface TextSegment {
  text: string;
  language: Language;
}

export function segmentByLanguage(text: string): TextSegment[] {
  // 按段落分割（双换行符）
  const paragraphs = text.split(/\n\n+/);

  return paragraphs
    .filter(p => p.trim().length > 0)
    .map(paragraph => ({
      text: paragraph.trim(),
      language: detectLanguage(paragraph)
    }));
}
