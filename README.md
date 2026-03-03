# Obsidian TTS Plugin

为 Obsidian 提供文本转语音（TTS）功能的插件，支持多种 TTS 引擎。

## 功能特性

- 🎙️ 支持多种 TTS 引擎
  - Web Speech API（默认，无需配置）
  - 阿里云 TTS
  - 腾讯云 TTS
  - 通义千问 TTS
  - OpenAI TTS
- 📝 智能 Markdown 解析
  - 自动处理标题、代码块、链接等
  - 跳过图片和公式
- 🌍 多语言支持
  - 自动检测中英文
  - 自动切换对应语音
- 🎮 播放控制
  - 开始/暂停/继续/停止
  - 可调节语速

## 安装

### 从社区插件安装（推荐）

1. 打开 Obsidian 设置
2. 进入"社区插件"
3. 搜索"TTS"
4. 点击安装

### 手动安装

1. 下载最新的 release
2. 解压到 `.obsidian/plugins/obsidian-tts/`
3. 重启 Obsidian
4. 在设置中启用插件

## 使用方法

1. 打开任意笔记
2. 在笔记标题下方会出现 TTS 控制条
3. 点击"开始"按钮开始朗读
4. 使用暂停/停止按钮控制播放

## 配置

进入插件设置页面：

1. 选择 TTS 引擎
2. 如果使用云服务，输入对应的 API key
3. 调整语速（可选）

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build
```

## 许可证

MIT
