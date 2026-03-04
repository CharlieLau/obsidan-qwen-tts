# 对话模式测试指南

## 🧪 测试环境设置

### 1. 找到你的 Obsidian Vault 位置

打开 Obsidian，查看 vault 路径：
- 设置 → 关于 → 查看 Vault 路径
- 例如：`/Users/yourusername/Documents/ObsidianVault`

### 2. 安装插件

```bash
# 方法 A：手动复制（推荐）
# 1. 创建插件目录
mkdir -p "YOUR_VAULT_PATH/.obsidian/plugins/obsidian-tts"

# 2. 复制文件
cd /Users/liuqingqing05/work/obsidan-qwen-tts
cp main.js styles.css manifest.json "YOUR_VAULT_PATH/.obsidian/plugins/obsidian-tts/"

# 方法 B：创建符号链接（开发用）
ln -s /Users/liuqingqing05/work/obsidan-qwen-tts "YOUR_VAULT_PATH/.obsidian/plugins/obsidian-tts"
```

### 3. 启用插件

1. 重启 Obsidian 或按 `Ctrl/Cmd + R` 重新加载
2. 打开设置 → 第三方插件
3. 找到 "TTS - Text to Speech" 并启用

### 4. 配置 API Key

1. 打开设置 → TTS 设置
2. 选择 TTS 引擎：**通义千问 TTS**
3. 输入你的 API Key（从 https://dashscope.console.aliyun.com/ 获取）
4. 选择模型：`qwen3-tts-instruct-flash`
5. 保存设置

---

## 🎯 快速测试流程

### 测试 1：基础 UI 检查

1. **打开测试文档**
   - 将 `test-document.md` 复制到你的 vault
   - 在 Obsidian 中打开该文档

2. **检查控制条**
   - [ ] 控制条显示在文档标题下方
   - [ ] 包含按钮：▶ ⏸ ⏹ 💬
   - [ ] 包含进度条和时间显示
   - [ ] 包含音色选择器

3. **检查对话按钮**
   - [ ] 💬 按钮可见
   - [ ] 鼠标悬停显示 "对话模式" 提示

### 测试 2：对话生成

1. **首次生成对话**
   ```
   点击 💬 按钮
   ```

2. **观察进度 Modal**
   - [ ] Modal 标题："生成对话中..."
   - [ ] 进度条从 0% 到 100%
   - [ ] 阶段提示依次显示：
     - "正在分析文档内容..." (10%)
     - "正在生成对话脚本..." (30%)
     - "正在保存对话文件..." (70%)
     - "准备播放..." (90%)
     - "对话生成完成！" (100%)

3. **检查结果**
   - [ ] Modal 自动关闭
   - [ ] 显示通知："对话已保存到: test-document-对话.md"
   - [ ] 自动开始播放对话

4. **检查对话文件**
   - [ ] 在同目录下找到 `test-document-对话.md`
   - [ ] 打开文件，检查格式：
     ```markdown
     ---
     generated: 2026-03-04T...
     source: test-document.md
     type: dialogue
     ---

     [主讲人]: ...
     [好奇学生]: ...
     [批判学生]: ...
     ```

### 测试 3：多音色播放

1. **听音色变化**
   - [ ] 主讲人（Ethan）：男性、稳重
   - [ ] 好奇学生（Cherry）：女性、活泼
   - [ ] 批判学生（Serena）：女性、理性
   - [ ] 音色切换流畅，无卡顿

2. **检查播放控制**
   - [ ] 点击 ⏸ 暂停播放
   - [ ] 按钮变为 ▶
   - [ ] 再次点击继续播放
   - [ ] 点击 ⏹ 停止播放
   - [ ] 按钮恢复初始状态

### 测试 4：对话文件管理

1. **再次点击 💬 按钮**
   - [ ] 显示选项 Modal
   - [ ] 标题："对话文件已存在"
   - [ ] 三个按钮：[使用现有对话] [重新生成] [取消]

2. **测试"使用现有对话"**
   - [ ] 点击"使用现有对话"
   - [ ] Modal 关闭
   - [ ] 直接播放现有对话（不重新生成）

3. **测试"重新生成"**
   - [ ] 停止播放
   - [ ] 再次点击 💬 按钮
   - [ ] 选择"重新生成"
   - [ ] 显示进度 Modal
   - [ ] 重新生成对话
   - [ ] 覆盖原有文件

4. **测试"取消"**
   - [ ] 点击 💬 按钮
   - [ ] 选择"取消"
   - [ ] Modal 关闭
   - [ ] 不执行任何操作

### 测试 5：错误处理

1. **测试空文档**
   - [ ] 创建空白文档
   - [ ] 点击 💬 按钮
   - [ ] 显示适当的错误提示

2. **测试网络错误**（可选）
   - [ ] 临时断开网络
   - [ ] 点击 💬 按钮
   - [ ] 显示错误通知
   - [ ] UI 恢复正常

3. **测试无效 API Key**（可选）
   - [ ] 临时使用无效的 API Key
   - [ ] 点击 💬 按钮
   - [ ] 显示错误通知："对话模式失败: ..."

---

## 📊 测试检查表

### 基础功能
- [ ] 控制条显示正常
- [ ] 对话按钮可点击
- [ ] 进度 Modal 正常显示
- [ ] 对话生成成功
- [ ] 对话文件保存成功

### 播放功能
- [ ] 多音色播放正常
- [ ] 音色切换流畅
- [ ] 播放控制正常（播放/暂停/停止）
- [ ] 进度显示正确

### 文件管理
- [ ] 对话文件格式正确
- [ ] 选项 Modal 正常工作
- [ ] 使用现有对话功能正常
- [ ] 重新生成功能正常

### 用户体验
- [ ] 进度提示清晰
- [ ] 错误提示友好
- [ ] UI 响应流畅
- [ ] 无明显卡顿

### 性能
- [ ] 生成时间 < 30 秒
- [ ] 不影响 Obsidian 其他功能
- [ ] 内存占用正常

---

## 🐛 问题报告

如果发现问题，请记录以下信息：

### 环境信息
- Obsidian 版本：_________
- 操作系统：_________
- 插件版本：v0.1.0

### 问题描述
1. 操作步骤：
   -
   -
   -

2. 预期结果：


3. 实际结果：


4. 错误信息（如果有）：
   ```

   ```

5. 控制台日志（按 Ctrl/Cmd+Shift+I 查看）：
   ```

   ```

---

## 💡 测试技巧

### 查看控制台日志
```javascript
// 打开开发者工具
Ctrl/Cmd + Shift + I

// 过滤日志
在控制台输入：TTS 或 Dialogue
```

### 测试不同文档长度
- **短文档**（< 1000 字）：test-document.md（约 500 字）
- **中等文档**（1000-3000 字）：创建 2000 字文档
- **长文档**（> 3000 字）：创建 5000 字文档

### 手动测试 API
```bash
# 测试通义千问 API 连接
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

---

## ✅ 测试完成

测试完成后：
1. 填写测试检查表
2. 记录发现的问题
3. 提供反馈和建议

**祝测试顺利！** 🎉
