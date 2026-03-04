# Obsidian Community Plugin Submission Checklist

## 📋 Pre-Submission Requirements

### ✅ Required Files
- [x] **manifest.json** - Plugin metadata with all required fields
- [x] **main.js** - Compiled plugin code
- [x] **styles.css** - Plugin styles (optional but present)
- [x] **README.md** - Comprehensive documentation
- [x] **LICENSE** - MIT License
- [x] **versions.json** - Version compatibility mapping

### ✅ manifest.json Required Fields
- [x] `id`: "obsidian-tts"
- [x] `name`: "Voice Notes - AI Dialogue"
- [x] `version`: "0.2.0"
- [x] `minAppVersion`: "0.15.0"
- [x] `description`: Clear, concise description
- [x] `author`: "CharlieLau"
- [x] `authorUrl`: GitHub profile URL
- [x] `fundingUrl`: Optional funding link (present)
- [x] `isDesktopOnly`: false

### ✅ README.md Required Sections
- [x] Plugin description and features
- [x] Installation instructions
- [x] Usage guide with examples
- [x] Configuration/settings documentation
- [x] Screenshots/demos
- [x] License information

### ✅ GitHub Repository Requirements
- [x] Public repository
- [x] Tagged release (v0.2.0)
- [x] Release includes: main.js, manifest.json, styles.css
- [ ] **TODO**: Push commits and tag to GitHub
- [ ] **TODO**: Create GitHub Release with zip file

## 🚀 Submission Process

### Step 1: Verify GitHub Repository
1. Push all commits to GitHub
   ```bash
   git push origin main
   git push origin v0.2.0
   ```

2. Create GitHub Release
   - Go to: https://github.com/CharlieLau/obsidan-qwen-tts/releases/new
   - Tag: v0.2.0
   - Title: "Voice Notes - AI Dialogue v0.2.0"
   - Description: Use content from RELEASE_NOTES_v0.2.0.md
   - Attach: obsidian-voice-notes-v0.2.0.zip

### Step 2: Fork obsidian-releases Repository
1. Go to: https://github.com/obsidianmd/obsidian-releases
2. Click "Fork" button
3. Clone your fork locally

### Step 3: Add Plugin to community-plugins.json
1. Edit `community-plugins.json` in your fork
2. Add entry (alphabetically by id):
   ```json
   {
     "id": "obsidian-tts",
     "name": "Voice Notes - AI Dialogue",
     "author": "CharlieLau",
     "description": "Transform your notes into engaging AI-powered dialogues with multi-voice TTS. NotebookLM-style learning experience in Obsidian.",
     "repo": "CharlieLau/obsidan-qwen-tts"
   }
   ```

### Step 4: Submit Pull Request
1. Commit changes to your fork
2. Create Pull Request to obsidianmd/obsidian-releases
3. PR title: "Add Voice Notes - AI Dialogue plugin"
4. PR description:
   - Brief plugin description
   - Link to your repository
   - Link to v0.2.0 release
   - Confirmation that you've read submission guidelines

### Step 5: Wait for Review
- Obsidian team will review your submission
- They may request changes or ask questions
- Once approved, plugin will appear in Community Plugins

## ⚠️ Common Issues to Avoid

- [ ] Plugin ID must be unique (check community-plugins.json first)
- [ ] Release must include main.js, manifest.json (and styles.css if used)
- [ ] Version in manifest.json must match release tag
- [ ] README must be clear and comprehensive
- [ ] No API keys or secrets in code
- [ ] Plugin must work on all platforms (unless isDesktopOnly: true)

## 📝 Current Status

**Ready for submission**: ✅ Almost ready!

**Pending actions**:
1. Add SSH key to GitHub (https://github.com/settings/ssh/new)
2. Push commits and tag to GitHub
3. Create GitHub Release with zip file
4. Fork obsidian-releases repository
5. Submit pull request

**Repository**: https://github.com/CharlieLau/obsidan-qwen-tts
**Release tag**: v0.2.0
**Zip file**: obsidian-voice-notes-v0.2.0.zip
