# TTS Control Bar 重设计方案

> **Date:** 2026-03-03
> **Status:** Design Phase
> **Priority:** High

## 用户需求

1. **UI 优化**：当前 TTS bar 太丑，需要重新设计
2. **进度功能**：如果成本不高，加上进度条功能（可拖动跳转）
3. **音色配置**：音色选择器放在 bar 上，方便随时切换
4. **自定义音色输入**：有些模型的 voice 名称不在预设列表中，需要提供输入框（默认折叠）

## 设计原则

基于 UI/UX Pro Max 的建议：
- **风格**：极简主义 + 轻微玻璃态效果
- **配色**：深色模式兼容，使用 Obsidian 主题变量
- **交互**：清晰的 hover 状态，150-300ms 过渡动画
- **无障碍**：4.5:1 对比度，键盘导航支持，prefers-reduced-motion
- **响应式**：适配 375px - 1440px 屏幕

## 当前状态分析

### 现有问题
1. **视觉问题**：
   - 缺少视觉层次感
   - 按钮和进度条缺少交互反馈
   - 整体风格不够现代

2. **功能问题**：
   - 进度条只显示，不能拖动跳转
   - 音色切换需要去设置页面
   - 没有自定义音色输入

3. **布局问题**：
   - 元素间距不够协调
   - 响应式适配不完善

## 重设计方案

### 1. 整体布局

```
┌────────────────────────────────────────────────────────────────┐
│  ▶  ⏸  ⏹  ├──────●───────────────┤  0:23 / 2:45  🎵 Cherry ⚙  │
└────────────────────────────────────────────────────────────────┘
                                    ↓ (点击⚙展开)
┌────────────────────────────────────────────────────────────────┐
│  [输入自定义音色名称                                    ]       │
│  提示：适用于其他 TTS 模型的音色名称                           │
└────────────────────────────────────────────────────────────────┘
```

**布局特点**：
- 单行紧凑布局，不占用过多空间
- 进度条居中，两侧对称
- 音色选择器和设置按钮右对齐
- 自定义输入区默认折叠，点击⚙展开

### 2. 视觉设计

#### 控制条容器
```css
.tts-control-bar {
  /* 背景：轻微玻璃态 */
  background: var(--background-primary-alt);
  backdrop-filter: blur(10px);

  /* 边框：细线，使用主题颜色 */
  border: 1px solid var(--background-modifier-border);
  border-radius: 8px;

  /* 阴影：轻微提升 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  /* 间距 */
  padding: 8px 12px;
  margin: 8px auto;
  max-width: 800px;
}
```

#### 按钮设计
```css
.tts-control-bar button {
  /* 尺寸：触摸友好 */
  width: 36px;
  height: 36px;

  /* 圆角：柔和 */
  border-radius: 8px;

  /* 背景：主题色 */
  background: var(--interactive-accent);

  /* 过渡：流畅 */
  transition: all 0.2s ease;

  /* 交互反馈 */
  cursor: pointer;
}

.tts-control-bar button:hover {
  background: var(--interactive-accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.tts-control-bar button:active {
  transform: translateY(0);
}
```

#### 进度条设计（可交互）
```css
.tts-progress-bar {
  /* 轨道 */
  height: 6px;
  background: var(--background-modifier-border);
  border-radius: 3px;

  /* 交互提示 */
  cursor: pointer;
  position: relative;
}

.tts-progress-bar:hover {
  height: 8px; /* 悬停时变粗 */
}

.tts-progress-fill {
  /* 填充 */
  height: 100%;
  background: var(--interactive-accent);
  border-radius: 3px;
  transition: width 0.1s linear;
}

.tts-progress-handle {
  /* 拖动手柄 */
  position: absolute;
  width: 14px;
  height: 14px;
  background: var(--interactive-accent);
  border: 2px solid var(--background-primary);
  border-radius: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  cursor: grab;
  opacity: 0;
  transition: opacity 0.2s;
}

.tts-progress-bar:hover .tts-progress-handle {
  opacity: 1;
}

.tts-progress-handle:active {
  cursor: grabbing;
  transform: translate(-50%, -50%) scale(1.2);
}
```

#### 音色选择器
```css
.tts-voice-selector {
  /* 内联布局 */
  display: flex;
  align-items: center;
  gap: 6px;
}

.tts-voice-select {
  /* 下拉菜单 */
  padding: 6px 10px;
  background: var(--background-secondary);
  border: 1px solid var(--background-modifier-border);
  border-radius: 6px;
  color: var(--text-normal);
  cursor: pointer;
  transition: all 0.2s;
}

.tts-voice-select:hover {
  background: var(--background-modifier-hover);
  border-color: var(--interactive-accent);
}
```

#### 自定义音色输入（可折叠）
```css
.tts-custom-voice-container {
  /* 默认隐藏 */
  display: none;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.tts-custom-voice-container.visible {
  display: block;
  max-height: 100px;
  margin-top: 8px;
}

.tts-custom-voice-input {
  width: 100%;
  padding: 8px 12px;
  background: var(--background-primary);
  border: 1px solid var(--background-modifier-border);
  border-radius: 6px;
  color: var(--text-normal);
  transition: all 0.2s;
}

.tts-custom-voice-input:focus {
  outline: none;
  border-color: var(--interactive-accent);
  box-shadow: 0 0 0 2px rgba(var(--interactive-accent-rgb), 0.1);
}
```

### 3. 交互设计

#### 进度条交互（新增功能）

**点击跳转**：
- 用户点击进度条任意位置
- 计算点击位置占进度条宽度的百分比
- 调用 `engineManager.seek(percentage)` 跳转到对应位置

**拖动跳转**：
- 用户按住进度条手柄拖动
- 实时更新进度条位置（不立即跳转）
- 松开鼠标时，跳转到目标位置

**实现要点**：
```typescript
// 点击跳转
handleProgressClick(e: MouseEvent) {
  const rect = this.progressBar.getBoundingClientRect();
  const percentage = (e.clientX - rect.left) / rect.width;
  this.engineManager.seek(percentage);
}

// 拖动跳转
handleProgressDrag(e: MouseEvent) {
  if (!this.isDragging) return;

  const rect = this.progressBar.getBoundingClientRect();
  const percentage = Math.max(0, Math.min(1,
    (e.clientX - rect.left) / rect.width
  ));

  // 实时更新 UI
  this.updateProgressUI(percentage);
}

handleProgressDragEnd() {
  if (this.isDragging) {
    this.isDragging = false;
    // 跳转到目标位置
    this.engineManager.seek(this.targetPercentage);
  }
}
```

#### 音色切换交互（优化）

**内联选择器**：
- 音色下拉菜单直接放在控制条上
- 选择后立即生效，无需保存
- 下次播放时使用新音色

**自定义音色输入**：
- 点击⚙按钮展开/折叠输入区
- 输入框有占位符提示："输入自定义音色名称（如 Alloy, Nova）"
- 输入后自动保存到设置
- 优先使用自定义音色（如果填写了）

### 4. 成本评估

#### 进度跳转功能成本：**中等**

**需要修改的文件**：
1. `src/tts/engines/base.ts` - 添加 `seek(percentage: number)` 接口
2. `src/tts/engines/qwen.ts` - 实现 seek 方法（需要重新请求音频）
3. `src/tts/engine-manager.ts` - 实现跨片段跳转逻辑
4. `src/ui/controller.ts` - 添加拖动交互处理

**技术难点**：
- Qwen TTS 不支持流式播放，无法直接跳转
- 需要记录每个文本片段的时间范围
- 跳转时需要重新从目标片段开始合成

**简化方案**（降低成本）：
- 仅支持点击跳转，不支持拖动
- 跳转粒度为文本片段（段落级别），而不是秒级
- 跳转时从目标片段开始重新播放

#### 音色配置优化成本：**低**

**需要修改的文件**：
1. `src/ui/controller.ts` - 添加音色选择器和自定义输入
2. `src/ui/styles.css` - 添加新样式

**无技术难点**，纯 UI 改动。

## 实现优先级

### P0（必须实现）
1. ✅ 视觉重设计（CSS 优化）
2. ✅ 音色选择器移到控制条
3. ✅ 自定义音色输入（折叠）

### P1（建议实现）
4. 🔄 进度条点击跳转（段落级别）
5. 🔄 进度条拖动交互

### P2（可选）
6. ⏸️ 进度条秒级跳转（需要更复杂的时间计算）

## 无障碍支持

### 键盘导航
- Tab 键可以遍历所有交互元素
- 空格键/Enter 键触发按钮
- 左右方向键调整进度（5% 步进）

### 屏幕阅读器
- 所有按钮有 aria-label
- 进度条有 role="slider" 和 aria-valuemin/max/now
- 状态变化有 aria-live 通知

### 减少动画
```css
@media (prefers-reduced-motion: reduce) {
  .tts-control-bar *,
  .tts-control-bar *::before,
  .tts-control-bar *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 响应式设计

### 桌面端（>= 768px）
- 所有元素单行显示
- 进度条最大宽度 300px

### 平板端（480px - 767px）
- 进度条缩短到 200px
- 音色选择器文本缩短

### 移动端（< 480px）
- 控制按钮缩小到 32px
- 进度条和音色选择器换行
- 时间显示缩短（仅显示分:秒）

## 后续优化方向

1. **播放速度控制**：添加 0.5x / 1.0x / 1.5x / 2.0x 速度切换
2. **音量控制**：添加音量滑块
3. **快捷键支持**：空格键播放/暂停，左右键跳转
4. **播放历史**：记录最近播放的笔记和位置
5. **音频缓存**：缓存已合成的音频，避免重复请求

## 交付清单

实现完成后，确保：
- [ ] 所有按钮有 cursor: pointer
- [ ] Hover 状态有明显反馈
- [ ] 过渡动画 150-300ms
- [ ] 深色/浅色模式都正常显示
- [ ] 对比度 >= 4.5:1
- [ ] 键盘导航完整
- [ ] 响应式测试通过（375px, 768px, 1440px）
- [ ] prefers-reduced-motion 生效
- [ ] 无 emoji 图标（使用 SVG）

---

**下一步**：创建详细的实现计划（writing-plans）
