# 对话音频合并缓存功能设计文档

> **Date:** 2026-03-04
> **Status:** Design Phase - Pending Approval
> **Priority:** High
> **Goal:** 将多段对话音频下载并合并为单个文件，提升播放体验和减少 API 调用

## 背景与目标

### 当前问题

1. **实时调用 API**：每次播放对话都需要逐句调用通义千问 TTS API
2. **网络依赖**：播放过程依赖网络连接，不稳定
3. **重复消耗**：重复播放同一对话会重复调用 API，浪费配额
4. **播放延迟**：逐句生成导致句与句之间有等待时间
5. **临时 URL**：API 返回的音频 URL 有时效性，无法长期缓存

### 目标

1. **一次生成，多次使用**：首次生成对话时下载并合并所有音频
2. **本地缓存**：将合并后的音频保存到本地文件
3. **快速播放**：后续播放直接使用本地音频文件
4. **离线支持**：缓存后可离线播放
5. **节省配额**：避免重复调用 API

## 技术方案

### 整体流程

```
用户点击 💬 按钮
    ↓
生成对话脚本
    ↓
检查是否有缓存音频
    ↓
无缓存 → 生成音频流程
    ├─ 逐句调用 TTS API 获取音频 URL
    ├─ 下载每段音频的二进制数据
    ├─ 合并所有音频数据
    ├─ 保存到本地文件 (对话记录/.audio/xxx.mp3)
    └─ 播放合并后的音频
    ↓
有缓存 → 直接播放缓存音频
```

### 核心模块设计

#### 1. AudioMerger - 音频合并器

**职责**：下载多段音频并合并为单个文件

**主要方法**：

```typescript
class AudioMerger {
  /**
   * 生成并合并完整对话音频
   * @param dialoguePath 对话文件路径
   * @param dialogueLines 对话行数组
   * @param onProgress 进度回调
   * @returns 合并后的音频文件路径
   */
  async generateMergedAudio(
    dialoguePath: string,
    dialogueLines: DialogueLine[],
    onProgress?: (current: number, total: number, message: string) => void
  ): Promise<string>;

  /**
   * 检查音频文件是否存在
   */
  async hasAudioFile(dialoguePath: string): Promise<boolean>;

  /**
   * 加载音频文件为 Blob URL
   */
  async loadAudioFile(dialoguePath: string): Promise<string>;

  /**
   * 删除音频文件
   */
  async deleteAudioFile(dialoguePath: string): Promise<void>;
}
```

**实现细节**：

1. **逐句生成音频**
   ```typescript
   for (let i = 0; i < dialogueLines.length; i++) {
     const line = dialogueLines[i];

     // 调用 TTS API 获取音频 URL
     const audioUrl = await this.generateSingleAudio(line);

     // 下载音频二进制数据
     const audioData = await this.downloadAudio(audioUrl);

     // 收集到数组
     audioChunks.push(audioData);

     // 更新进度
     onProgress(i + 1, total, `正在生成第 ${i + 1}/${total} 句音频...`);
   }
   ```

2. **合并音频数据**
   ```typescript
   private async mergeAudioChunks(chunks: ArrayBuffer[]): Promise<ArrayBuffer> {
     // 计算总长度
     const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);

     // 创建合并后的 buffer
     const merged = new Uint8Array(totalLength);
     let offset = 0;

     // 拼接所有音频数据
     for (const chunk of chunks) {
       merged.set(new Uint8Array(chunk), offset);
       offset += chunk.byteLength;
     }

     return merged.buffer;
   }
   ```

3. **保存到本地**
   ```typescript
   const audioPath = this.getAudioPath(dialoguePath);
   await this.app.vault.adapter.writeBinary(audioPath, mergedAudio);
   ```

**音频文件存储**：

- 位置：`对话记录/.audio/`
- 命名：`文档名-对话.mp3`
- 示例：`对话记录/.audio/test-document-对话.mp3`

#### 2. MultiVoicePlayer - 播放器增强

**新增功能**：支持播放合并后的完整音频

**修改点**：

1. **加载对话时传入音频 URL**
   ```typescript
   async loadDialogue(
     lines: DialogueLine[],
     mergedAudioUrl?: string  // 新增参数
   ): Promise<void>;
   ```

2. **播放逻辑分支**
   ```typescript
   async play(): Promise<void> {
     if (this.mergedAudioUrl) {
       // 有缓存：播放完整音频
       await this.playMergedAudio();
     } else {
       // 无缓存：逐句实时生成播放
       await this.playNext();
     }
   }
   ```

3. **播放合并音频**
   ```typescript
   private async playMergedAudio(): Promise<void> {
     this.currentAudio = new Audio(this.mergedAudioUrl);

     this.currentAudio.onended = () => {
       this.isPlaying = false;
       this.cleanup();
     };

     await this.currentAudio.play();
   }
   ```

#### 3. Controller - UI 控制器修改

**handleDialogue 方法增强**：

```typescript
async handleDialogue(view: MarkdownView): Promise<void> {
  // ... 生成对话脚本 ...

  // 检查是否有缓存音频
  const audioMerger = new AudioMerger(this.plugin.app, apiKey, model);
  const hasCachedAudio = await audioMerger.hasAudioFile(dialoguePath);

  let audioUrl: string | undefined;

  if (!hasCachedAudio) {
    // 显示音频生成进度
    progressModal.updateProgress({
      stage: 'generating',
      message: '正在生成音频（1/10）...',
      percentage: 30
    });

    // 生成并合并音频
    const audioPath = await audioMerger.generateMergedAudio(
      dialoguePath,
      dialogueLines,
      (current, total, message) => {
        const percentage = 30 + Math.floor((current / total) * 30);
        progressModal.updateProgress({
          stage: 'generating',
          message: message,
          percentage: percentage
        });
      }
    );

    // 加载音频文件
    audioUrl = await audioMerger.loadAudioFile(dialoguePath);
  } else {
    // 直接加载缓存音频
    audioUrl = await audioMerger.loadAudioFile(dialoguePath);
  }

  // 加载到播放器
  await this.plugin.multiVoicePlayer.loadDialogue(dialogueLines, audioUrl);

  // 开始播放
  await this.plugin.multiVoicePlayer.play();
}
```

### 文件结构

```
对话记录/
├── test-document-对话.md          # 对话脚本
├── 人工智能简介-对话.md
└── .audio/                        # 音频缓存目录
    ├── test-document-对话.mp3     # 合并后的音频
    └── 人工智能简介-对话.mp3
```

### 进度显示

生成音频时的进度提示：

```
30% - 正在生成音频（1/10）...
35% - 正在生成音频（2/10）...
40% - 正在生成音频（3/10）...
...
58% - 正在生成音频（10/10）...
60% - 正在合并音频文件...
70% - 正在保存对话文件...
90% - 准备播放...
100% - 对话生成完成！
```

## 技术要点

### 1. 音频格式兼容性

**问题**：通义千问返回的音频格式是什么？

- 推测：MP3 格式
- 验证：需要实际测试确认

**简单拼接的可行性**：

✅ **可行场景**：
- 相同采样率
- 相同比特率
- 相同声道数
- 无需精确同步

⚠️ **潜在问题**：
- 可能有轻微的间隙或爆音
- 不同音频参数可能导致播放问题

**解决方案**：
1. **方案 A**（推荐）：简单二进制拼接
   - 优点：实现简单，速度快
   - 缺点：可能有轻微瑕疵
   - 适用：通义千问 API 返回统一格式

2. **方案 B**：使用 Web Audio API 重新编码
   - 优点：音质完美
   - 缺点：实现复杂，性能开销大
   - 适用：音频格式不统一

**建议**：先用方案 A，如果有问题再考虑方案 B

### 2. 文件大小估算

假设：
- 每句对话：2-5 秒
- 音频比特率：128 kbps（MP3 标准）
- 对话总长：5-30 分钟

**文件大小**：
- 5 分钟对话：~5 MB
- 15 分钟对话：~15 MB
- 30 分钟对话：~30 MB

**存储考虑**：
- 10 个对话：~50-300 MB
- 建议添加缓存清理功能

### 3. API 调用优化

**批量生成策略**：

```typescript
// 添加延迟避免请求过快
for (let i = 0; i < lines.length; i++) {
  await generateSingleAudio(lines[i]);
  await sleep(100); // 延迟 100ms
}
```

**错误重试**：

```typescript
async generateSingleAudio(line: DialogueLine, retries = 3): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      return await this.callAPI(line);
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(1000 * (i + 1)); // 指数退避
    }
  }
}
```

### 4. 缓存管理

**缓存策略**：

1. **自动缓存**：首次生成对话时自动创建音频缓存
2. **手动清理**：提供清理缓存的选项（未来功能）
3. **智能更新**：重新生成对话时删除旧缓存

**缓存清理**（v0.2.0 功能）：

```typescript
// 清理单个对话的缓存
await audioMerger.deleteAudioFile(dialoguePath);

// 清理所有缓存
await audioMerger.clearAllCache();

// 获取缓存大小
const size = await audioMerger.getCacheSize();
```

## 用户体验

### 首次生成对话

```
1. 点击 💬 按钮
2. 显示进度 Modal：
   - 正在分析文档内容... (10%)
   - 正在生成对话脚本... (20%)
   - 正在生成音频（1/10）... (30%)
   - 正在生成音频（2/10）... (33%)
   - ...
   - 正在生成音频（10/10）... (58%)
   - 正在合并音频文件... (60%)
   - 正在保存对话文件... (70%)
   - 准备播放... (90%)
   - 对话生成完成！(100%)
3. 自动开始播放
4. 通知：对话已保存到 xxx，音频已缓存
```

**预计时间**：
- 对话生成：10-20 秒
- 音频生成：10-30 秒（取决于对话长度）
- 总计：20-50 秒

### 后续播放

```
1. 点击 💬 按钮
2. 检测到已有缓存
3. 显示选项：[使用现有对话] [重新生成] [取消]
4. 选择"使用现有对话"
5. 立即开始播放（< 1 秒）
```

## 优势与限制

### 优势

✅ **性能提升**：后续播放即时开始，无需等待
✅ **离线支持**：缓存后可离线播放
✅ **节省配额**：避免重复调用 API
✅ **播放流畅**：无句间停顿
✅ **用户体验**：快速响应，体验更好

### 限制

⚠️ **首次较慢**：首次生成需要额外时间下载和合并音频
⚠️ **存储空间**：需要额外的磁盘空间存储音频
⚠️ **音频质量**：简单拼接可能有轻微瑕疵
⚠️ **缓存管理**：需要手动清理缓存（未来功能）

## 实现计划

### Phase 1：核心功能（当前）

1. ✅ 创建 AudioMerger 类
2. ✅ 实现音频下载和合并
3. ✅ 修改 MultiVoicePlayer 支持完整音频播放
4. ⏳ 修改 Controller 集成音频缓存流程
5. ⏳ 测试和优化

### Phase 2：增强功能（v0.2.0）

- [ ] 缓存管理界面（查看、清理）
- [ ] 音频质量选择
- [ ] 后台预生成音频
- [ ] 音频格式优化（使用 Web Audio API）

### Phase 3：高级功能（v0.3.0）

- [ ] 智能缓存策略（LRU）
- [ ] 缓存大小限制
- [ ] 音频压缩
- [ ] 导出音频文件

## 风险与应对

### 风险 1：音频拼接有杂音

**应对**：
1. 先测试简单拼接效果
2. 如果有问题，使用 Web Audio API 重新编码
3. 添加音频淡入淡出效果

### 风险 2：生成时间过长

**应对**：
1. 显示详细的进度信息
2. 允许用户取消生成
3. 添加后台生成选项（v0.2.0）

### 风险 3：存储空间不足

**应对**：
1. 添加缓存大小提示
2. 提供缓存清理功能
3. 设置缓存大小限制（v0.2.0）

### 风险 4：API 调用失败

**应对**：
1. 添加错误重试机制
2. 保存已下载的音频，断点续传
3. 友好的错误提示

## 成功标准

### 功能完整性

- ✅ 能够下载所有对话音频
- ✅ 能够合并为单个文件
- ✅ 能够保存到本地
- ✅ 能够加载和播放缓存音频
- ✅ 进度显示清晰

### 性能指标

- ✅ 首次生成时间 < 60 秒（10 句对话）
- ✅ 缓存播放启动 < 1 秒
- ✅ 音频文件大小合理（< 5 MB/分钟）
- ✅ 不影响 Obsidian 性能

### 用户体验

- ✅ 进度提示清晰友好
- ✅ 错误处理完善
- ✅ 后续播放快速流畅
- ✅ 文件管理清晰

## 问题与决策

### Q1：是否需要压缩音频？

**决策**：暂不压缩
- 理由：通义千问已返回压缩格式（MP3）
- 未来：可考虑添加质量选项

### Q2：是否需要缓存管理界面？

**决策**：v0.2.0 添加
- 当前：自动缓存，手动清理
- 未来：提供可视化管理界面

### Q3：音频合并使用哪种方案？

**决策**：先用简单拼接（方案 A）
- 理由：实现简单，速度快
- 备选：如有问题再用 Web Audio API

### Q4：是否支持断点续传？

**决策**：暂不支持
- 理由：增加复杂度
- 未来：v0.2.0 可考虑

---

## 请确认

请确认以下几点：

1. ✅ 整体方案是否可行？
2. ✅ 音频存储位置是否合理？（`对话记录/.audio/`）
3. ✅ 是否先用简单的二进制拼接？
4. ✅ 进度显示是否清晰？
5. ✅ 是否有其他需要考虑的点？

**确认后我将开始实现！** 🚀
