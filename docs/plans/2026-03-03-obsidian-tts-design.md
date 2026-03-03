# Obsidian TTS 插件设计方案

## 项目概述

为 Obsidian 开发一个文本转语音（TTS）插件，支持多种 TTS 引擎，智能处理 Markdown 内容，提供友好的播放控制界面。

## 需求总结

### 功能需求
1. **触发方式**：在笔记中添加按钮，点击后朗读整篇笔记
2. **TTS 引擎**：支持多种引擎切换（Web Speech API、阿里云、腾讯云、通义千问、OpenAI TTS）
3. **播放控制**：开始/暂停/继续/停止
4. **UI 位置**：在笔记标题下方添加浮动控制条
5. **内容处理**：智能处理 Markdown（标题前说"标题"，代码块说"代码块"，链接只读显示文本）
6. **设置管理**：全局设置，所有笔记使用相同配置
7. **进度保存**：不保存进度，每次从头开始
8. **多语言支持**：自动检测语言，中文段落用中文语音，英文段落用英文语音

### 技术方案
**选择方案 B：集成第三方 TTS SDK**
- 集成阿里云、腾讯云的官方 SDK
- 使用 SDK 提供的流式传输能力
- 本地缓存音频文件
- 优点：SDK 功能完整，支持流式播放，音频质量更好
- 缺点：增加插件体积，SDK 更新维护成本高

---

## 第一部分：Obsidian 插件基础架构

### 插件主体结构

#### 1. 主插件类（TTSPlugin extends Plugin）
```typescript
class TTSPlugin extends Plugin {
  onload() {
    // 插件加载时的初始化
    // - 加载用户设置
    // - 注册命令（command palette）
    // - 注册视图组件
    // - 初始化 TTS 服务
  }

  onunload() {
    // 插件卸载时的清理
    // - 停止正在播放的音频
    // - 清理 UI 组件
    // - 释放资源
  }
}
```

#### 2. 设置面板（TTSSettingTab extends PluginSettingTab）
- 继承 Obsidian 的设置面板基类
- 提供 UI 让用户配置：
  - 选择 TTS 引擎（下拉菜单）
  - 输入各个引擎的 API key
  - 调整语速（滑块）
- 保存设置到 `data.json`

#### 3. 视图组件（TTSView）
- 在笔记编辑器下方渲染控制条
- 使用 Obsidian 的 `addChild()` 方法挂载到 DOM
- 包含开始/暂停/继续/停止按钮
- 监听按钮点击事件，调用 TTS 服务

#### 4. TTS 服务层
- 封装 TTS 引擎的具体实现
- 处理文本解析和语音合成
- 管理播放状态

### 开发调试流程

#### 1. 项目初始化
- 使用 Obsidian 官方的插件模板创建项目
- 配置 TypeScript + esbuild 构建环境
- 设置 `manifest.json`（插件元信息）

#### 2. 本地开发环境
- 在 Obsidian vault 的 `.obsidian/plugins/` 目录下创建插件文件夹
- 使用 `npm run dev` 启动 watch 模式，自动编译
- 修改代码后，在 Obsidian 中使用 `Ctrl/Cmd + R` 重载插件

#### 3. 调试方法
- 使用 `console.log()` 输出调试信息
- 打开 Obsidian 的开发者工具（`Ctrl/Cmd + Shift + I`）查看日志
- 在 Chrome DevTools 中设置断点调试
- 使用 Obsidian 的 `Notice` API 显示用户提示信息

#### 4. 测试流程
- 准备测试笔记（包含中英文、代码块、链接等）
- 测试各个 TTS 引擎的切换
- 测试播放控制功能（开始/暂停/继续/停止）
- 测试异常情况（网络错误、API key 无效等）

---

## 第二部分：TTS 引擎管理器

### TTS 引擎统一接口

定义一个抽象的 TTS 引擎接口，所有引擎都实现这个接口：

```typescript
interface ITTSEngine {
  initialize(config: EngineConfig): Promise<void>;
  speak(text: string, language: 'zh-CN' | 'en-US'): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
  getStatus(): 'idle' | 'playing' | 'paused';
}
```

### 支持的引擎实现

**1. Web Speech API 引擎**
- 浏览器原生支持，无需 SDK
- 作为默认引擎，无需配置
- 质量较低，但即开即用

**2. 阿里云 TTS 引擎**
- 集成 `@alicloud/nls-sdk`
- 支持流式合成
- 需要 AccessKey ID 和 AccessKey Secret

**3. 腾讯云 TTS 引擎**
- 集成 `tencentcloud-sdk-nodejs`
- 支持多种音色
- 需要 SecretId 和 SecretKey

**4. 通义千问 TTS 引擎**
- 使用阿里云 DashScope API
- 高质量语音合成
- 需要 API Key

**5. OpenAI TTS 引擎**
- 使用 OpenAI TTS API
- 最高质量，但费用较高
- 需要 OpenAI API Key

### 引擎管理器职责

**TTSEngineManager 类：**
- 维护所有引擎实例的映射表
- 根据用户设置选择当前活跃的引擎
- 处理引擎初始化和配置更新
- 提供统一的调用接口给 UI 层
- 处理引擎切换时的状态转移

---

## 第三部分：内容解析器

### ContentParser 的职责

将 Obsidian 的 Markdown 内容转换为适合朗读的文本，并标注语言信息。

### 解析规则

**1. 标题处理**
- `# 一级标题` → "一级标题：一级标题"
- `## 二级标题` → "二级标题：二级标题"
- 以此类推

**2. 代码块处理**
- 遇到代码块 ` ```language ... ``` ` → "代码块开始...代码块结束"
- 不朗读代码内容

**3. 链接处理**
- `[显示文本](url)` → 只朗读"显示文本"
- `[[内部链接]]` → 只朗读"内部链接"

**4. 图片和公式**
- `![alt](image.png)` → 跳过不读
- `$公式$` 或 `$$公式$$` → 跳过不读

**5. 列表处理**
- 保留列表结构，朗读列表项内容
- 无序列表项前可选添加"项目"提示

**6. 其他 Markdown 语法**
- 粗体 `**text**`、斜体 `*text*` → 只读文本内容
- 删除线、高亮等 → 只读文本内容

### 语言检测

**分段检测策略：**
- 按段落（双换行符）分割文本
- 对每个段落检测主要语言（中文/英文）
- 使用简单的正则判断：如果包含中文字符，则为中文；否则为英文
- 返回结构：`[{text: "段落内容", language: "zh-CN" | "en-US"}]`

### 输出格式

```typescript
interface ParsedContent {
  segments: Array<{
    text: string;
    language: 'zh-CN' | 'en-US';
  }>;
}
```

---

## 第四部分：UI 控制器和数据流

### UI 控制器（TTSController）

**渲染位置：**
- 监听 Obsidian 的 `active-leaf-change` 事件
- 当用户切换到编辑视图时，在编辑器容器下方插入控制条
- 使用 CSS 实现浮动效果，不影响编辑器布局

**控制条 UI 结构：**
```
┌─────────────────────────────────────┐
│  ▶️ 开始  ⏸️ 暂停  ⏹️ 停止  [状态文本] │
└─────────────────────────────────────┘
```

**按钮状态管理：**
- 初始状态：只显示"开始"按钮
- 播放中：显示"暂停"和"停止"按钮
- 暂停时：显示"继续"和"停止"按钮
- 状态文本显示：如"正在播放..."、"已暂停"、"播放完成"

### 数据流设计

**从用户操作到语音播放的完整流程：**

```
用户点击"开始"
    ↓
TTSController 获取当前笔记内容
    ↓
ContentParser 解析 Markdown，返回分段内容
    ↓
TTSController 将分段内容传给 TTSEngineManager
    ↓
TTSEngineManager 选择当前引擎，逐段调用 speak()
    ↓
引擎检测语言，自动切换语音
    ↓
播放音频，更新 UI 状态
```

**状态管理：**
- 使用简单的状态机：`idle` → `playing` → `paused` → `playing` → `idle`
- 状态存储在 TTSController 中
- UI 根据状态更新按钮显示

**错误处理：**
- 网络错误：显示 Notice 提示用户检查网络
- API key 无效：提示用户检查设置
- 引擎初始化失败：回退到 Web Speech API

---

## 第五部分：配置管理和项目结构

### 配置管理（SettingsManager）

**配置数据结构：**
```typescript
interface TTSSettings {
  // 当前选择的引擎
  currentEngine: 'web-speech' | 'aliyun' | 'tencent' | 'qwen' | 'openai';

  // 各引擎的 API 配置
  aliyun: {
    accessKeyId: string;
    accessKeySecret: string;
  };
  tencent: {
    secretId: string;
    secretKey: string;
  };
  qwen: {
    apiKey: string;
  };
  openai: {
    apiKey: string;
  };

  // 通用设置
  speechRate: number; // 语速：0.5 - 2.0
}
```

**默认配置：**
- 默认引擎：`web-speech`（无需配置）
- 默认语速：1.0

**设置面板 UI：**
- 引擎选择下拉菜单
- 根据选择的引擎动态显示对应的 API key 输入框
- 语速滑块（0.5 - 2.0）
- 保存按钮

### 项目文件结构

```
obsidian-tts-plugin/
├── src/
│   ├── main.ts                 # 主插件类
│   ├── settings.ts             # 设置管理
│   ├── tts/
│   │   ├── engine-manager.ts   # TTS 引擎管理器
│   │   ├── engines/
│   │   │   ├── base.ts         # ITTSEngine 接口定义
│   │   │   ├── web-speech.ts   # Web Speech API 实现
│   │   │   ├── aliyun.ts       # 阿里云 TTS 实现
│   │   │   ├── tencent.ts      # 腾讯云 TTS 实现
│   │   │   ├── qwen.ts         # 通义千问 TTS 实现
│   │   │   └── openai.ts       # OpenAI TTS 实现
│   ├── parser/
│   │   └── content-parser.ts   # Markdown 内容解析器
│   ├── ui/
│   │   ├── controller.ts       # UI 控制器
│   │   └── styles.css          # 控制条样式
│   └── utils/
│       └── language-detector.ts # 语言检测工具
├── manifest.json               # 插件元信息
├── package.json
├── tsconfig.json
├── esbuild.config.mjs          # 构建配置
└── README.md
```

### 依赖包

**核心依赖：**
- `obsidian`: Obsidian API
- `@alicloud/nls-sdk`: 阿里云 TTS SDK
- `tencentcloud-sdk-nodejs`: 腾讯云 SDK
- `openai`: OpenAI SDK

**开发依赖：**
- `typescript`
- `esbuild`
- `@types/node`

### 发布和安装

**开发阶段：**
- 在本地 vault 的 `.obsidian/plugins/obsidian-tts/` 下开发
- 使用 `npm run dev` 实时编译

**发布阶段：**
- 提交到 Obsidian 社区插件市场
- 用户可在 Obsidian 设置中直接搜索安装

---

## 总结

本设计方案涵盖了 Obsidian TTS 插件的完整架构，包括：
1. 插件基础结构和开发调试流程
2. 多引擎支持的 TTS 管理系统
3. 智能 Markdown 内容解析
4. 友好的 UI 控制和数据流
5. 完整的配置管理和项目组织

下一步将根据此设计创建详细的实现计划。
