# 安装和测试指南

## 快速安装

### 方法 1：开发版本安装（推荐用于测试）

1. **构建插件**（如果还没构建）
   ```bash
   cd /Users/liuqingqing05/work/obsidan-qwen-tts
   npm run build
   ```

2. **找到你的 Obsidian vault 位置**
   - 打开 Obsidian
   - 设置 → 关于 → 查看 vault 路径

3. **创建插件目录**
   ```bash
   # 替换 YOUR_VAULT_PATH 为你的 vault 路径
   mkdir -p YOUR_VAULT_PATH/.obsidian/plugins/obsidian-tts
   ```

4. **复制插件文件**
   ```bash
   cp main.js YOUR_VAULT_PATH/.obsidian/plugins/obsidian-tts/
   cp styles.css YOUR_VAULT_PATH/.obsidian/plugins/obsidian-tts/
   cp manifest.json YOUR_VAULT_PATH/.obsidian/plugins/obsidian-tts/
   ```

5. **启用插件**
   - 重启 Obsidian 或 Ctrl+R 重新加载
   - 设置 → 第三方插件 → 启用 "Obsidian TTS"

### 方法 2：符号链接（开发时更方便）

```bash
# 在你的 vault 插件目录创建符号链接
ln -s /Users/liuqingqing05/work/obsidan-qwen-tts YOUR_VAULT_PATH/.obsidian/plugins/obsidian-tts
```

这样每次 `npm run build` 后，Obsidian 会自动使用最新版本。

## 配置 API Key

1. 打开 Obsidian 设置
2. 找到 "TTS 设置"
3. 选择 TTS 引擎：**通义千问 TTS**
4. 输入你的 API Key
   - 从 [阿里云 DashScope](https://dashscope.console.aliyun.com/) 获取
5. 选择模型：`qwen3-tts-instruct-flash`（TTS 推荐）
6. 保存设置

## 测试对话模式

### 快速测试

1. **创建测试笔记**
   ```markdown
   # 测试文档

   这是一个测试文档，用于验证对话模式功能。

   ## 第一部分
   对话模式会将这个文档转换成三人对话形式。

   ## 第二部分
   主讲人负责讲解，两个学生会提出问题。
   ```

2. **生成对话**
   - 打开测试笔记
   - 点击控制条上的 💬 按钮
   - 等待对话生成（约 10-20 秒）
   - 观察进度提示

3. **播放对话**
   - 生成完成后自动播放
   - 注意听三种不同的音色
   - 使用 ⏸ 暂停/继续
   - 使用 ⏹ 停止

4. **查看对话文件**
   - 在同目录下会生成 `测试文档-对话.md`
   - 打开查看对话内容
   - 可以手动编辑对话

5. **重新播放**
   - 再次点击 💬 按钮
   - 选择 "使用现有对话" 或 "重新生成"

### 详细测试

参考 [TESTING.md](./TESTING.md) 进行完整的功能测试。

## 常见问题

### 1. 控制条没有显示
- 确保插件已启用
- 确保当前打开的是 Markdown 文档
- 尝试切换到其他文档再切换回来

### 2. 点击 💬 按钮没有反应
- 检查浏览器控制台（Ctrl+Shift+I）查看错误
- 确保 API Key 已配置
- 确保网络连接正常

### 3. 对话生成失败
- 检查 API Key 是否有效
- 检查 API 配额是否充足
- 检查文档内容是否为空
- 查看错误通知了解具体原因

### 4. 音色没有区分
- 确保使用的是通义千问 TTS 引擎
- 确保选择的模型支持多音色
- 检查音色配置是否正确

### 5. 播放卡顿
- 检查网络连接速度
- 尝试使用较短的文档测试
- 检查 CPU 使用率

## 调试技巧

### 查看控制台日志
```javascript
// 打开 Obsidian 开发者工具
Ctrl+Shift+I (Windows/Linux)
Cmd+Option+I (Mac)

// 查看插件日志
// 过滤 "TTS" 或 "Dialogue"
```

### 检查生成的对话文件
```bash
# 找到对话文件
find YOUR_VAULT_PATH -name "*-对话.md"

# 查看对话内容
cat "YOUR_VAULT_PATH/path/to/file-对话.md"
```

### 手动测试 API
```bash
# 测试通义千问 API
curl -X POST https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen-long",
    "input": {
      "messages": [
        {"role": "user", "content": "你好"}
      ]
    }
  }'
```

## 开发模式

### 实时开发
```bash
# 启动开发模式（自动重新编译）
npm run dev

# 在另一个终端监听文件变化
# 每次保存后 Obsidian 会自动重新加载
```

### 调试对话生成
```typescript
// 在 src/dialogue/dialogue-generator.ts 中添加日志
console.log('Generating dialogue for:', wordCount, 'words');
console.log('API response:', response);
```

### 调试对话解析
```typescript
// 在 src/dialogue/dialogue-parser.ts 中添加日志
console.log('Parsing dialogue:', script.substring(0, 100));
console.log('Parsed lines:', dialogueLines.length);
```

## 性能监控

### 使用 Chrome DevTools
1. 打开 Performance 标签
2. 点击 Record
3. 执行对话生成和播放
4. 停止录制
5. 分析性能瓶颈

### 内存使用
```javascript
// 在控制台执行
console.log('Memory:', performance.memory);
```

## 反馈和报告问题

如果发现问题，请提供以下信息：

1. **环境信息**
   - Obsidian 版本
   - 插件版本
   - 操作系统

2. **重现步骤**
   - 详细的操作步骤
   - 测试文档内容（如果相关）

3. **错误信息**
   - 控制台错误日志
   - 错误通知截图

4. **预期行为 vs 实际行为**
   - 你期望发生什么
   - 实际发生了什么

---

**祝测试顺利！** 🎉
