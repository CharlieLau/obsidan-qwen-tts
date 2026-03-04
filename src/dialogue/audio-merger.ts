// src/dialogue/audio-merger.ts

import { App, requestUrl } from 'obsidian';
import { DialogueLine } from './types';

export class AudioMerger {
  private app: App;
  private apiKey: string;
  private model: string;
  private readonly apiEndpoint = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
  private readonly audioFolder = '对话记录/audio-cache';

  constructor(app: App, apiKey: string, model: string = 'qwen3-tts-instruct-flash') {
    this.app = app;
    this.apiKey = apiKey;
    this.model = model;
  }

  /**
   * 确保音频目录存在
   */
  private async ensureAudioFolderExists(): Promise<void> {
    const folderExists = await this.app.vault.adapter.exists(this.audioFolder);
    if (!folderExists) {
      await this.app.vault.adapter.mkdir(this.audioFolder);
    }
  }

  /**
   * 生成并合并完整对话音频
   */
  async generateMergedAudio(
    dialoguePath: string,
    dialogueLines: DialogueLine[],
    onProgress?: (current: number, total: number, message: string) => void
  ): Promise<string> {
    await this.ensureAudioFolderExists();

    const audioChunks: ArrayBuffer[] = [];

    // 逐句生成并下载音频
    for (let i = 0; i < dialogueLines.length; i++) {
      const line = dialogueLines[i];

      if (onProgress) {
        onProgress(i + 1, dialogueLines.length, `正在生成第 ${i + 1}/${dialogueLines.length} 句音频...`);
      }

      // 生成单句音频
      const audioUrl = await this.generateSingleAudio(line);

      // 下载音频数据
      const audioData = await this.downloadAudio(audioUrl);
      audioChunks.push(audioData);

      // 短暂延迟，避免请求过快
      await this.sleep(100);
    }

    if (onProgress) {
      onProgress(dialogueLines.length, dialogueLines.length, '正在合并音频文件...');
    }

    // 合并所有音频
    const mergedAudio = await this.mergeAudioChunks(audioChunks);

    // 保存合并后的音频
    const audioPath = this.getAudioPath(dialoguePath);
    await this.app.vault.adapter.writeBinary(audioPath, mergedAudio);

    return audioPath;
  }

  /**
   * 生成单句音频 URL
   */
  private async generateSingleAudio(line: DialogueLine): Promise<string> {
    const language = /[\u4e00-\u9fa5]/.test(line.content) ? 'Chinese' : 'English';

    const requestBody = {
      model: this.model,
      input: {
        text: line.content,
        voice: line.voice,
        language_type: language
      },
      parameters: {
        format: 'wav'  // 使用 WAV 格式,支持直接二进制拼接
      }
    };

    const response = await requestUrl({
      url: this.apiEndpoint,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (response.status !== 200) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = response.json;
    if (!result.output?.audio?.url) {
      throw new Error('Invalid API response: missing audio URL');
    }

    return result.output.audio.url;
  }

  /**
   * 下载音频数据
   */
  private async downloadAudio(url: string): Promise<ArrayBuffer> {
    const response = await requestUrl({
      url: url,
      method: 'GET'
    });

    return response.arrayBuffer;
  }

  /**
   * 合并 WAV 音频块
   * WAV 格式可以通过去除后续文件的头部来合并
   */
  private async mergeAudioChunks(chunks: ArrayBuffer[]): Promise<ArrayBuffer> {
    if (chunks.length === 0) {
      throw new Error('No audio chunks to merge');
    }

    if (chunks.length === 1) {
      return chunks[0];
    }

    // WAV 文件头部固定为 44 字节
    const WAV_HEADER_SIZE = 44;

    // 第一个文件保留完整内容（包含头部）
    const firstChunk = new Uint8Array(chunks[0]);

    // 计算所有音频数据的总长度（去除后续文件的头部）
    let totalDataSize = firstChunk.byteLength;
    for (let i = 1; i < chunks.length; i++) {
      totalDataSize += chunks[i].byteLength - WAV_HEADER_SIZE;
    }

    // 创建合并后的 buffer
    const merged = new Uint8Array(totalDataSize);

    // 复制第一个文件的完整内容
    merged.set(firstChunk, 0);
    let offset = firstChunk.byteLength;

    // 复制后续文件的音频数据（跳过头部）
    for (let i = 1; i < chunks.length; i++) {
      const chunk = new Uint8Array(chunks[i]);
      const audioData = chunk.subarray(WAV_HEADER_SIZE);
      merged.set(audioData, offset);
      offset += audioData.byteLength;
    }

    // 更新 WAV 文件头部的大小信息
    this.updateWavHeader(merged, totalDataSize);

    return merged.buffer;
  }

  /**
   * 更新 WAV 文件头部的大小信息
   */
  private updateWavHeader(wavData: Uint8Array, totalSize: number): void {
    const view = new DataView(wavData.buffer);

    // 更新文件大小（ChunkSize at offset 4）
    // ChunkSize = 整个文件大小 - 8
    view.setUint32(4, totalSize - 8, true);

    // 更新数据块大小（Subchunk2Size at offset 40）
    // Subchunk2Size = 音频数据大小
    view.setUint32(40, totalSize - 44, true);
  }

  /**
   * 获取音频文件路径
   */
  private getAudioPath(dialoguePath: string): string {
    // 从对话文件路径生成音频文件路径
    // 例如：对话记录/test-document-对话.md -> 对话记录/.audio/test-document-对话.wav
    const fileName = dialoguePath.split('/').pop()?.replace('.md', '.wav') || 'audio.wav';
    return `${this.audioFolder}/${fileName}`;
  }

  /**
   * 检查音频文件是否存在
   */
  async hasAudioFile(dialoguePath: string): Promise<boolean> {
    const audioPath = this.getAudioPath(dialoguePath);
    return await this.app.vault.adapter.exists(audioPath);
  }

  /**
   * 加载音频文件
   */
  async loadAudioFile(dialoguePath: string): Promise<string> {
    const audioPath = this.getAudioPath(dialoguePath);

    try {
      // 检查文件是否存在
      const exists = await this.app.vault.adapter.exists(audioPath);
      if (!exists) {
        throw new Error(`音频文件不存在: ${audioPath}`);
      }

      // 读取音频数据
      const audioData = await this.app.vault.adapter.readBinary(audioPath);

      // 创建 Blob URL
      const blob = new Blob([audioData], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);

      return url;
    } catch (error) {
      console.error('Failed to load audio file:', audioPath, error);
      throw new Error(`无法加载音频文件: ${error.message}`);
    }
  }

  /**
   * 删除音频文件
   */
  async deleteAudioFile(dialoguePath: string): Promise<void> {
    const audioPath = this.getAudioPath(dialoguePath);
    if (await this.app.vault.adapter.exists(audioPath)) {
      await this.app.vault.adapter.remove(audioPath);
    }
  }

  /**
   * 获取音频文件大小
   */
  async getAudioFileSize(dialoguePath: string): Promise<number> {
    const audioPath = this.getAudioPath(dialoguePath);
    try {
      const stat = await this.app.vault.adapter.stat(audioPath);
      return stat?.size || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 延迟函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
