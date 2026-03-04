# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-03-04

### Added - Dialogue Mode 💬

#### Core Features
- **AI-Powered Dialogue Generation**: Convert Markdown documents into three-person dialogue format using Qwen API
- **Three-Role System**:
  - 主讲人 (Host - Ethan): Explains core content with stable male voice
  - 好奇学生 (Curious Student - Cherry): Asks basic questions with lively female voice
  - 批判学生 (Critical Student - Serena): Asks deep questions with rational female voice
- **Adaptive Dialogue Length**:
  - Short documents (< 1000 words): ~5 minutes dialogue
  - Medium documents (1000-3000 words): ~15 minutes dialogue
  - Long documents (> 3000 words): ~30 minutes dialogue

#### UI Components
- **Dialogue Button (💬)**: New button in control bar to trigger dialogue mode
- **Progress Modal**: Real-time progress tracking with visual feedback
  - Analyzing document (10%)
  - Generating dialogue (30%)
  - Saving file (70%)
  - Preparing playback (90%)
  - Complete (100%)
- **Options Modal**: Choose between existing dialogue or regenerate
  - Use existing dialogue
  - Regenerate new dialogue
  - Cancel operation

#### File Management
- **Auto-save Dialogue Scripts**: Save generated dialogues as `filename-对话.md`
- **YAML Frontmatter**: Include metadata (generated time, source file, type)
- **Reusable Dialogues**: Load and replay existing dialogue files
- **Manual Editing**: Edit dialogue scripts directly in Markdown

#### Playback System
- **Multi-Voice Playback**: Automatic voice switching based on roles
- **Seamless Integration**: Use existing play/pause/stop controls
- **Mode Switching**: Toggle between normal TTS and dialogue mode
- **Language Detection**: Auto-detect Chinese/English for each line

#### Technical Implementation
- **7 New Modules** (634 lines of code):
  - `DialogueGenerator`: AI dialogue generation with Qwen API
  - `DialogueParser`: Parse and validate dialogue scripts
  - `DialogueFileManager`: Handle dialogue file operations
  - `MultiVoicePlayer`: Multi-voice sequential playback
  - `DialogueProgressModal`: Progress tracking UI
  - `DialogueOptionsModal`: User choice dialog
  - `types.ts`: Type definitions

### Enhanced

#### Engine Manager
- **speakWithVoice()**: New method for dynamic voice switching
- **Voice Preservation**: Restore original voice after dialogue playback

#### UI Controller
- **Dialogue Mode Flag**: Track current playback mode
- **Unified Controls**: Support both normal and dialogue modes with same buttons
- **Error Handling**: Comprehensive error messages and recovery

### Documentation

#### User Documentation
- **README Updates**: Comprehensive dialogue mode usage guide
- **TESTING.md**: Detailed testing checklist with 50+ test cases
- **INSTALLATION.md**: Installation and troubleshooting guide
- **Usage Examples**: Sample dialogue output and file structure

#### Developer Documentation
- **Design Document**: Complete architecture and component design
- **Implementation Plan**: 20-task step-by-step implementation guide
- **Optimization Checklist**: Code quality and performance verification

### Performance

- **Build Size**: main.js 287 KB (optimized)
- **Generation Speed**: < 30 seconds for most documents
- **Memory Usage**: < 50 MB during operation
- **No UI Blocking**: Async operations don't freeze Obsidian

### Previous Features (v0.0.x)

#### Core TTS Features
- Multi-engine support (Web Speech API, Qwen TTS, OpenAI TTS)
- Intelligent Markdown parsing
- Real-time progress display
- 11+ preset voices with custom voice support
- Auto language detection (Chinese/English)

#### UI Design
- Compact single-line layout
- Center-aligned control bar
- Smooth hover effects
- Dark/light theme adaptation

#### Smart Parsing
- Remove YAML frontmatter
- Remove horizontal rules
- Convert code blocks to text hints
- Add heading level prefixes
- Extract link text only
- Remove formatting marks

## [Unreleased]

### Planned for v0.2.0
- Progress bar click/drag seeking
- Keyboard shortcuts (space for play/pause)
- Playback speed control (0.5x - 2.0x)
- Volume control
- Dialogue mode enhancements:
  - Custom role count and positioning
  - Dialogue style selection (formal/casual/humorous)
  - Section-based generation

### Planned for v0.3.0
- Audio caching
- Playback history
- Complete Aliyun/Tencent TTS engines
- Export audio files
- Advanced dialogue features:
  - Streaming generation (generate while playing)
  - Dialogue outline preview and editing
  - Multi-language dialogue generation

## Links

- **Repository**: https://github.com/CharlieLau/obsidan-qwen-tts
- **Issues**: https://github.com/CharlieLau/obsidan-qwen-tts/issues
- **Discussions**: https://github.com/CharlieLau/obsidan-qwen-tts/discussions

---

**Note**: This plugin requires a valid Qwen API key for dialogue mode functionality.
