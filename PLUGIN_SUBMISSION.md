# Community Plugin Submission

## Plugin Information

**Plugin ID:** `obsidian-tts`

**Plugin Name:** Voice Notes - AI Dialogue

**Author:** CharlieLau

**Description:** Transform your notes into engaging AI-powered dialogues with multi-voice TTS. NotebookLM-style learning experience in Obsidian.

**Repository:** https://github.com/CharlieLau/obsidan-qwen-tts

**Release Tag:** v0.2.0

**Release URL:** https://github.com/CharlieLau/obsidan-qwen-tts/releases/tag/v0.2.0

## Plugin Details

### What does this plugin do?

Voice Notes - AI Dialogue transforms your Obsidian notes into engaging audio experiences with two modes:

1. **Standard TTS Mode**: Read any markdown note aloud with high-quality text-to-speech
2. **Dialogue Mode**: Convert notes into multi-person conversations (inspired by NotebookLM)
   - Education mode: 3-person classroom discussion (instructor + 2 students)
   - Podcast mode: 2-person casual chat

### Key Features

- 🎙️ AI-powered dialogue generation using Qwen API
- 🎵 11+ preset voice options with multi-voice support
- 🔄 Multiple TTS engines (Qwen TTS, Web Speech API, OpenAI TTS)
- ⚡ Audio caching for instant playback
- 📝 Smart Markdown parsing (handles code blocks, formulas, YAML frontmatter)
- 📊 Real-time progress tracking with seekable playback
- 💾 Dialogue script management and reuse

### Use Cases

- **Students**: Turn study notes into interactive learning dialogues
- **Researchers**: Listen to papers/articles while commuting
- **Writers**: Review content by listening
- **Language Learners**: Practice listening comprehension with multi-voice content

### Screenshots

Available in repository README:
- Control bar interface
- Dialogue generation progress
- Settings panel

### Demo

Audio demo available at: `assets/dialogue-demo.wav` in repository

## Technical Information

**Minimum Obsidian Version:** 0.15.0

**Platform Support:** Desktop and Mobile (isDesktopOnly: false)

**External Dependencies:**
- Qwen TTS API (requires API key from Alibaba Cloud DashScope)
- Optional: OpenAI TTS API

**Data Storage:**
- Plugin settings stored in `.obsidian/plugins/obsidian-tts/data.json`
- Generated dialogue files stored in `对话记录/` folder in vault
- Audio cache stored in `.audio/` folder (gitignored)

## Checklist

- [x] I have read the [plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)
- [x] My plugin follows the [plugin review guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+review+guidelines)
- [x] I have tested my plugin on desktop and mobile
- [x] My plugin does not collect user data without consent
- [x] My plugin does not make network requests without user configuration
- [x] I have included a comprehensive README with installation and usage instructions
- [x] I have included a LICENSE file (MIT)
- [x] My repository includes a tagged release (v0.2.0)
- [x] The release includes main.js, manifest.json, and styles.css
- [x] I have created a versions.json file mapping plugin versions to minimum Obsidian versions

## Additional Notes

### API Key Requirement

This plugin requires a Qwen TTS API key for dialogue mode and Qwen TTS engine. Users can obtain a free API key from [Alibaba Cloud DashScope](https://dashscope.console.aliyun.com/).

Alternative: Users can use the built-in Web Speech API without any API key for basic TTS functionality.

### Privacy & Security

- No user data is collected or transmitted
- API keys are stored locally in Obsidian's data directory
- All network requests are made directly to user-configured API endpoints
- Generated dialogue scripts are stored locally in the user's vault

### Language Support

- Primary: Chinese (Simplified)
- TTS engines support multiple languages based on content detection
- UI is currently in Chinese, English localization planned for future release

## Contact

- GitHub: [@CharlieLau](https://github.com/CharlieLau)
- Issues: https://github.com/CharlieLau/obsidan-qwen-tts/issues
- Discussions: https://github.com/CharlieLau/obsidan-qwen-tts/discussions
