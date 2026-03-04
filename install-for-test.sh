#!/bin/bash

# Obsidian TTS Plugin - 快速安装测试脚本
# 使用方法：./install-for-test.sh /path/to/your/vault

set -e

echo "🚀 Obsidian TTS Plugin - 快速安装脚本"
echo "========================================"
echo ""

# 检查参数
if [ -z "$1" ]; then
    echo "❌ 错误：请提供 Obsidian vault 路径"
    echo ""
    echo "使用方法："
    echo "  ./install-for-test.sh /path/to/your/vault"
    echo ""
    echo "示例："
    echo "  ./install-for-test.sh ~/Documents/ObsidianVault"
    echo ""
    exit 1
fi

VAULT_PATH="$1"
PLUGIN_DIR="$VAULT_PATH/.obsidian/plugins/obsidian-tts"
SOURCE_DIR="$(cd "$(dirname "$0")" && pwd)"

# 检查 vault 是否存在
if [ ! -d "$VAULT_PATH" ]; then
    echo "❌ 错误：Vault 路径不存在: $VAULT_PATH"
    exit 1
fi

echo "📁 Vault 路径: $VAULT_PATH"
echo "📦 插件源码: $SOURCE_DIR"
echo ""

# 创建插件目录
echo "1️⃣  创建插件目录..."
mkdir -p "$PLUGIN_DIR"
echo "   ✅ 目录已创建: $PLUGIN_DIR"
echo ""

# 复制文件
echo "2️⃣  复制插件文件..."

if [ ! -f "$SOURCE_DIR/main.js" ]; then
    echo "   ⚠️  main.js 不存在，正在构建..."
    cd "$SOURCE_DIR"
    npm run build
    cd - > /dev/null
fi

cp "$SOURCE_DIR/main.js" "$PLUGIN_DIR/"
echo "   ✅ main.js ($(ls -lh "$SOURCE_DIR/main.js" | awk '{print $5}'))"

cp "$SOURCE_DIR/styles.css" "$PLUGIN_DIR/"
echo "   ✅ styles.css ($(ls -lh "$SOURCE_DIR/styles.css" | awk '{print $5}'))"

cp "$SOURCE_DIR/manifest.json" "$PLUGIN_DIR/"
echo "   ✅ manifest.json"

echo ""

# 复制测试文档（可选）
echo "3️⃣  复制测试文档（可选）..."
if [ -f "$SOURCE_DIR/test-document.md" ]; then
    cp "$SOURCE_DIR/test-document.md" "$VAULT_PATH/"
    echo "   ✅ test-document.md 已复制到 vault 根目录"
else
    echo "   ⚠️  test-document.md 不存在，跳过"
fi
echo ""

# 显示下一步操作
echo "✅ 安装完成！"
echo ""
echo "📋 下一步操作："
echo ""
echo "1. 重启 Obsidian 或按 Ctrl/Cmd+R 重新加载"
echo "2. 打开设置 → 第三方插件 → 启用 \"TTS - Text to Speech\""
echo "3. 配置通义千问 API Key："
echo "   - 设置 → TTS 设置"
echo "   - 选择引擎：通义千问 TTS"
echo "   - 输入 API Key"
echo "   - 选择模型：qwen3-tts-instruct-flash"
echo "4. 打开 test-document.md 测试对话模式"
echo ""
echo "🎯 测试对话模式："
echo "   1. 打开 test-document.md"
echo "   2. 点击控制条上的 💬 按钮"
echo "   3. 等待对话生成（约 10-20 秒）"
echo "   4. 自动播放三人对话"
echo ""
echo "📖 详细测试指南：TEST_GUIDE.md"
echo ""
echo "🐛 如有问题，请查看控制台日志（Ctrl/Cmd+Shift+I）"
echo ""
