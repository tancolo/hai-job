# SKILL: Build & Package Hai Job Chrome Extension

## Trigger Keywords
This skill should be considered when the user mentions any of the following (in any language or context):
- 打包
- zip / ZIP
- 发布
- release
- build extension
- build zip
- package extension
- 生成zip
- 上架包

## Skill Description
Packages the **Hai Job** Chrome extension into a clean, version-tagged ZIP file ready for upload to the Chrome Web Store.

## Project Context
- **Project Root**: `d:\Dev-Env\Antigravity_Projects\hai_job`
- **Build Script**: `build_extension.ps1` (located in project root)
- **Output Directory**: `dist\`
- **Version Source**: Automatically read from `manifest.json`

## Execution Steps

Follow these steps **in order** without asking for confirmation unless an error occurs:

### Step 1 — Clean previous build
Delete the `dist\` folder if it exists to ensure a clean build:
```powershell
if (Test-Path "dist") { Remove-Item "dist" -Recurse -Force; Write-Host "Old dist/ removed." }
```

### Step 2 — Run the build script
Execute the existing packaging script:
```powershell
powershell -ExecutionPolicy Bypass -File ".\build_extension.ps1"
```

### Step 3 — Extract ZIP for Load Unpacked testing
After the ZIP is created, extract it to `dist\test_unpack\` for local testing:
```powershell
Expand-Archive -Path "dist\hai_job_vX.X.X.zip" -DestinationPath "dist\test_unpack" -Force
```
The user can then load `dist\test_unpack\` via `chrome://extensions/` → Load unpacked.

### Step 4 — Report results
After the script completes, report back to the user with:
- The ZIP file name (e.g., `hai_job_v1.0.0.zip`)
- The file size in KB
- The full output path (`dist\test_unpack\` for Load Unpacked)
- Any warnings or errors from the checklist

## Working Directory
Always run commands from the project root:
`d:\Dev-Env\Antigravity_Projects\hai_job`

## Success Criteria
The skill is complete when:
1. `dist\hai_job_vX.X.X.zip` exists
2. `dist\test_unpack\` folder is populated and ready for Load Unpacked
3. The build script exits with code 0 (no errors)
4. The user is informed of both the ZIP path and the test_unpack path

## Notes
- Do NOT commit the `dist\` folder to git (it is in `.gitignore`)
- Version number is automatically extracted from `manifest.json` — no manual input needed
- If the build script itself is missing, alert the user that `build_extension.ps1` needs to be restored from git history
