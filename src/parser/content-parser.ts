// src/parser/content-parser.ts

import { TextSegment, segmentByLanguage } from '../utils/language-detector';

export interface ParsedContent {
  segments: TextSegment[];
}

export class ContentParser {
  parse(markdown: string): ParsedContent {
    // 0. 移除 YAML frontmatter (--- ... ---)
    let processed = markdown.replace(/^---[\s\S]*?---\s*/m, '');

    // 1. 处理代码块
    processed = processed.replace(/```[\s\S]*?```/g, '代码块');

    // 2. 处理图片
    processed = processed.replace(/!\[.*?\]\(.*?\)/g, '');

    // 3. 处理公式
    processed = processed.replace(/\$\$[\s\S]*?\$\$/g, '');
    processed = processed.replace(/\$.*?\$/g, '');

    // 4. 处理标题
    processed = processed.replace(/^######\s+(.+)$/gm, '六级标题：$1');
    processed = processed.replace(/^#####\s+(.+)$/gm, '五级标题：$1');
    processed = processed.replace(/^####\s+(.+)$/gm, '四级标题：$1');
    processed = processed.replace(/^###\s+(.+)$/gm, '三级标题：$1');
    processed = processed.replace(/^##\s+(.+)$/gm, '二级标题：$1');
    processed = processed.replace(/^#\s+(.+)$/gm, '一级标题：$1');

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
