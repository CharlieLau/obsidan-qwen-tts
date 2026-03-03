# Obsidian TTS Plugin

一个功能强大的 Obsidian 文本转语音（Text-to-Speech）插件，支持多种 TTS 引擎，智能解析 Markdown 内容，提供流畅的朗读体验。

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Obsidian](https://img.shields.io/badge/obsidian-%3E%3D0.15.0-purple)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ 特性

### 🎯 核心功能
- **多引擎支持**：Web Speech API、通义千问 TTS、OpenAI TTS（阿里云、腾讯云待完善）
- **智能内容解析**：自动处理 Markdown 语法，过滤无意义内容
- **实时进度显示**：进度条实时更新，显示当前播放时间和总时长
- **音色管理**：支持 11+ 种预设音色，可自定义添加音色配置
- **自动语言检测**：自动识别中英文，切换对应语音

### 🎨 界面设计
- **紧凑单行布局**：不占用过多笔记空间
- **居中对齐**：视觉平衡，美观大方
- **柔和交互**：细边框、悬停效果、平滑过渡
- **主题适配**：完美融入 Obsidian 深色/浅色主题

### 🔧 智能解析
自动处理以下 Markdown 元素：
- ✅ 移除 YAML frontmatter
- ✅ 移除水平分隔线（`---`, `***`, `___`）
- ✅ 移除图片、数学公式
- ✅ 转换代码块为"代码块"提示
- ✅ 标题添加级别前缀（"一级标题：xxx"）
- ✅ 链接只读显示文本
- ✅ 移除格式标记（粗体、斜体、删除线、高亮）
- ✅ 移除列表标记符号

## 📦 安装

### 方法 1：手动安装（推荐）

1. 下载最新的 Release
2. 解压到 Obsidian vault 的 `.obsidian/plugins/obsidian-tts/` 目录
3. 重启 Obsidian 或重新加载插件
4. 在设置中启用 "Obsidian TTS"

### 方法 2：开发模式安装

```bash
# 克隆仓库
git clone https://github.com/your-username/obsidian-tts-plugin.git
cd obsidian-tts-plugin

# 安装依赖
npm install

# 构建插件
npm run build

# 复制到 Obsidian vault
cp main.js styles.css manifest.json /path/to/your/vault/.obsidian/plugins/obsidian-tts/
```

## 🚀 使用指南

### 基本使用

1. 打开任意 Markdown 笔记
2. 控制条会自动出现在笔记标题下方
3. 点击 ▶ 按钮开始播放
4. 使用 ⏸ 暂停/继续，⏹ 停止播放

### 配置 TTS 引擎

#### 通义千问 TTS（推荐）

1. 打开 Obsidian 设置 → TTS 设置
2. 选择 TTS 引擎：**通义千问 TTS**
3. 输入你的 API Key（从[阿里云 DashScope](https://dashscope.console.aliyun.com/) 获取）
4. 选择模型（默认：`qwen3-tts-instruct-flash`）
5. 选择音色（11 种预设音色可选）

#### Web Speech API（无需配置）

- 使用浏览器内置 TTS，无需 API Key
- 质量较低，但即开即用

### 音色管理

#### 预设音色
- **Cherry (芊悦)**：阳光积极、亲切自然小姐姐（女性）
- **Serena (苏瑶)**：温柔小姐姐（女性）
- **Ethan (晨煦)**：阳光、温暖、活力、朝气（男性）
- **Chelsie (千雪)**：二次元虚拟女友（女性）
- **Momo (茉兔)**：撒娇搞怪，逗你开心（女性）
- **Vivian (十三)**：拽拽的、可爱的小暴躁（女性）
- **Moon (月白)**：率性帅气的月白（男性）
- **Maia (四月)**：知性与温柔的碰撞（女性）
- **Kai (凯)**：耳朵的一场SPA（男性）
- **Nofish (不吃鱼)**：不会翘舌音的设计师（男性）
- **Bella (萌宝)**：喝酒不打醉拳的小萝莉（女性）

#### 自定义音色

1. 在设置中找到"音色列表管理"
2. 点击"+ 添加音色"
3. 填写：
   - **Key**：音色参数（如 `Alloy`）
   - **Value**：显示名称（如 `Alloy (合金)`）
   - **描述**：音色特点（可选）
4. 保存后即可在控制条中选择

### 快捷操作

- **切换文档**：自动停止当前播放
- **音色切换**：在控制条上直接切换，无需进入设置
- **自定义音色输入**：点击 ⚙ 按钮展开输入框

## 🎛️ 配置选项

### 通用设置
- **TTS 引擎**：选择使用的 TTS 服务
- **语速**：0.5 - 2.0（默认 1.0）

### 通义千问 TTS 设置
- **API Key**：DashScope API 密钥
- **模型**：TTS 模型名称（支持多个版本）
- **音色**：从预设列表中选择
- **自定义音色**：输入其他模型的音色名称

### 音色列表管理
- **添加**：点击"+ 添加音色"按钮
- **编辑**：直接修改 Key、Value、描述
- **删除**：点击"删除"按钮移除音色

## 🛠️ 开发

### 项目结构

```
obsidian-tts-plugin/
├── src/
│   ├── main.ts                 # 主插件类
│   ├── settings.ts             # 设置管理
│   ├── tts/
│   │   ├── engine-manager.ts   # TTS 引擎管理器
│   │   └── engines/
│   │       ├── base.ts         # 引擎接口定义
│   │       ├── web-speech.ts   # Web Speech API
│   │       ├── qwen.ts         # 通义千问 TTS
│   │       └── openai.ts       # OpenAI TTS
│   ├── parser/
│   │   └── content-parser.ts   # Markdown 解析器
│   ├── ui/
│   │   ├── controller.ts       # UI 控制器
│   │   └── styles.css          # 样式文件
│   └── utils/
│       └── language-detector.ts # 语言检测
├── docs/
│   └── plans/                  # 设计文档
├── manifest.json               # 插件元信息
├── package.json
├── tsconfig.json
└── esbuild.config.mjs          # 构建配置
```

### 开发命令

```bash
# 安装依赖
npm install

# 开发模式（自动重新编译）
npm run dev

# 生产构建
npm run build
```

### 添加新的 TTS 引擎

1. 在 `src/tts/engines/` 创建新引擎文件
2. 实现 `ITTSEngine` 接口
3. 在 `engine-manager.ts` 中注册引擎
4. 在 `settings.ts` 中添加配置 UI

## 🐛 已知问题

- [ ] 进度条暂不支持点击/拖动跳转
- [ ] 阿里云、腾讯云 TTS 引擎待完善
- [ ] 暂不支持播放速度调节

## 🗺️ 路线图

### v0.2.0（计划中）
- [ ] 进度条点击/拖动跳转
- [ ] 快捷键支持（空格播放/暂停）
- [ ] 播放速度控制（0.5x - 2.0x）
- [ ] 音量控制

### v0.3.0（计划中）
- [ ] 音频缓存
- [ ] 播放历史记录
- [ ] 多引擎完善（阿里云、腾讯云）
- [ ] 导出音频文件

## 📄 许可证

MIT License

## 🙏 致谢

- [Obsidian](https://obsidian.md/) - 强大的笔记应用
- [阿里云 DashScope](https://dashscope.console.aliyun.com/) - 提供通义千问 TTS API
- 所有贡献者和用户

## 📮 反馈与支持

- **Issues**：[GitHub Issues](https://github.com/your-username/obsidian-tts-plugin/issues)
- **讨论**：[GitHub Discussions](https://github.com/your-username/obsidian-tts-plugin/discussions)

---

**如果这个插件对你有帮助，请给个 ⭐️ Star 支持一下！**
