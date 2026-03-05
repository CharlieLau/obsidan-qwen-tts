// src/parser/content-parser.ts

import { TextSegment, segmentByLanguage } from '../utils/language-detector';

export interface ParsedContent {
  segments: TextSegment[];
}

export class ContentParser {
  parse(markdown: string): ParsedContent {
    // 0. 移除 YAML frontmatter (--- ... ---)
    // 只移除文档开头的 frontmatter，使用更精确的匹配
    // 匹配：开头的 --- + 任意内容 + 单独一行的 --- + 换行
    let processed = markdown;
    if (markdown.trimStart().startsWith('---\n')) {
      // 找到第二个单独成行的 ---
      const lines = markdown.split('\n');
      let endIndex = -1;
      let inFrontmatter = false;

      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (i === 0 && trimmed === '---') {
          inFrontmatter = true;
          continue;
        }
        if (inFrontmatter && trimmed === '---') {
          endIndex = i;
          break;
        }
      }

      if (endIndex > 0) {
        // 移除 frontmatter（包括结束的 --- 行）
        processed = lines.slice(endIndex + 1).join('\n');
      }
    }

    // 1. 处理代码块
    processed = processed.replace(/```[\s\S]*?```/g, '代码块');

    // 2. 处理图片
    processed = processed.replace(/!\[.*?\]\(.*?\)/g, '');

    // 3. 处理公式
    processed = processed.replace(/\$\$[\s\S]*?\$\$/g, '');
    processed = processed.replace(/\$.*?\$/g, '');

    // 4. 处理标题 - 添加停顿而不是标记
    // 通过句号创造自然停顿，避免冗余的"一级标题"等标记
    processed = processed.replace(/^######\s+(.+)$/gm, '$1。');
    processed = processed.replace(/^#####\s+(.+)$/gm, '$1。');
    processed = processed.replace(/^####\s+(.+)$/gm, '$1。');
    processed = processed.replace(/^###\s+(.+)$/gm, '$1。');
    processed = processed.replace(/^##\s+(.+)$/gm, '$1。');
    processed = processed.replace(/^#\s+(.+)$/gm, '$1。');

    // 5. 处理链接 - 只保留显示文本
    processed = processed.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
    processed = processed.replace(/\[\[([^\]]+)\]\]/g, '$1');

    // 6. 处理粗体、斜体、删除线
    processed = processed.replace(/\*\*([^\*]+)\*\*/g, '$1');
    processed = processed.replace(/\*([^\*]+)\*/g, '$1');
    processed = processed.replace(/~~([^~]+)~~/g, '$1');
    processed = processed.replace(/==([^=]+)==/g, '$1');

    // 7. 处理列表标记
    processed = processed.replace(/^[\*\-\+]\s+/gm, '');
    processed = processed.replace(/^\d+\.\s+/gm, '');

    // 8. 移除水平分隔线（单独成行的 ---, ***, ___）
    processed = processed.replace(/^[\-\*_]{3,}\s*$/gm, '');

    // 9. 按语言分段
    const segments = segmentByLanguage(processed);

    // 10. 过滤掉空白或只有空格的片段
    const filteredSegments = segments.filter(seg => seg.text.trim().length > 0);

    return { segments: filteredSegments };
  }
}
