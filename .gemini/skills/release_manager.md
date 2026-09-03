# Skill: Hai Job Web Store Release Manager

This skill automates the generation of multi-language "What's New" content for the Chrome Web Store based on the project's CHANGELOG.md.

## Triggers
- `release new version web store`
- `build release notes`
- `prepare store update`

## Workflow

### Phase 1: Extraction & English Draft
1. **Locate Latest Version**: Parse `.\CHANGELOG.md` from the standalone repository root to find the topmost version entry (e.g., `## [1.1.0]`).
2. **Extract Content**: Capture all text between the latest version header and the next version header (or end of file).
3. **Create Directory**: Ensure `.\docs\web_store\v[version]\` exists.
4. **Generate Draft**: Create `what_is_new_v[version].md` with the extracted English content.
5. **Report & Pause**: Display the English content in the chat and wait for user review/modification of the file.

### Phase 2: Multi-language Translation
1. **Read Reviewed Draft**: Read the modified `what_is_new_v[version].md` using the `view_file` tool to get the user's finalized English section. **CRITICAL: DO NOT overwrite or regenerate the English section in this phase. You must use the exact content the user has provided/edited.**
2. **Translate**: Translate the *reviewed* English content into 5 target languages:
   - Simplified Chinese (zh_CN)
   - Traditional Chinese (zh_TW)
   - Japanese (ja)
   - Korean (ko)
   - French (fr)
3. **Append to File**: Append the translated localized sections to `what_is_new_v[version].md`. Do not alter the English text.
4. **Final Delivery**: Provide a quick-access summary of the localized blocks.

## Guidelines
- Convert Markdown lists to professional emojis (✨, 🛠️, ⚡).
- Keep descriptions concise and action-oriented.
- Use native-sounding terminology for each target language.
