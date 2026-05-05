# =============================================================================
# Hai Job Chrome Extension - Build & Package Script
# Usage: Run from the hai_job project root directory
#   .\build_extension.ps1
# =============================================================================

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ProjectRoot = $PSScriptRoot
$ManifestPath = Join-Path $ProjectRoot "manifest.json"

# ─── Color helpers ───────────────────────────────────────────────────────────
function Write-OK   { param($msg) Write-Host "  ✅ $msg" -ForegroundColor Green }
function Write-WARN { param($msg) Write-Host "  ⚠️  $msg" -ForegroundColor Yellow }
function Write-ERR  { param($msg) Write-Host "  ❌ $msg" -ForegroundColor Red }
function Write-INFO { param($msg) Write-Host "  ℹ️  $msg" -ForegroundColor Cyan }

Write-Host ""
Write-Host "======================================================" -ForegroundColor Blue
Write-Host "  Hai Job Extension - Pre-flight Checklist & Packager " -ForegroundColor Blue
Write-Host "======================================================" -ForegroundColor Blue
Write-Host ""

$checksPassed = $true

# ─── STEP 1: Read manifest.json ───────────────────────────────────────────────
Write-Host "[ Step 1 ] Reading manifest.json ..." -ForegroundColor White
if (-not (Test-Path $ManifestPath)) {
    Write-ERR "manifest.json not found in project root!"
    exit 1
}

$manifest = Get-Content $ManifestPath -Raw | ConvertFrom-Json
$version  = $manifest.version
$extName  = $manifest.name

Write-OK "manifest.json found"
Write-INFO "Extension name    : $extName"
Write-INFO "Version           : $version"
Write-INFO "Manifest version  : $($manifest.manifest_version)"
Write-Host ""

# ─── STEP 2: Manifest V3 check ────────────────────────────────────────────────
Write-Host "[ Step 2 ] Checking Manifest Version ..." -ForegroundColor White
if ($manifest.manifest_version -eq 3) {
    Write-OK "Manifest V3 confirmed (required by Chrome Web Store)"
} else {
    Write-ERR "Manifest version is $($manifest.manifest_version). Chrome Web Store requires V3!"
    $checksPassed = $false
}
Write-Host ""

# ─── STEP 3: Required files check ─────────────────────────────────────────────
Write-Host "[ Step 3 ] Checking required files & directories ..." -ForegroundColor White

$requiredItems = @(
    @{ Path = "manifest.json";   Label = "manifest.json" },
    @{ Path = "background.js";   Label = "background.js" },
    @{ Path = "src";             Label = "src/ directory" },
    @{ Path = "assets\icons";    Label = "assets/icons/ directory" },
    @{ Path = "_locales";        Label = "_locales/ directory (i18n)" }
)

foreach ($item in $requiredItems) {
    $fullPath = Join-Path $ProjectRoot $item.Path
    if (Test-Path $fullPath) {
        Write-OK "$($item.Label)"
    } else {
        Write-ERR "$($item.Label) is MISSING!"
        $checksPassed = $false
    }
}
Write-Host ""

# ─── STEP 4: Icon sizes check ─────────────────────────────────────────────────
Write-Host "[ Step 4 ] Checking required icon sizes ..." -ForegroundColor White
$requiredIcons = @("icon_16.png", "icon_32.png", "icon_48.png", "icon_128.png")
foreach ($icon in $requiredIcons) {
    $iconPath = Join-Path $ProjectRoot "assets\icons\$icon"
    if (Test-Path $iconPath) {
        Write-OK "$icon"
    } else {
        Write-WARN "$icon not found — recommended for Chrome Web Store"
    }
}
Write-Host ""

# ─── STEP 5: Dangerous files check ────────────────────────────────────────────
Write-Host "[ Step 5 ] Checking for files that must NOT be packaged ..." -ForegroundColor White
$forbiddenPatterns = @(".git", "node_modules", "test", "bugs", "PRD", "docs", ".gitignore", "README.md", "README_CN.md", "build_extension.ps1", "*.zip")
$foundForbidden = $false
foreach ($pattern in $forbiddenPatterns) {
    $fullPath = Join-Path $ProjectRoot $pattern
    if (Test-Path $fullPath) {
        Write-WARN "$pattern exists (will be EXCLUDED from ZIP)"
        $foundForbidden = $true
    }
}
if (-not $foundForbidden) {
    Write-OK "No forbidden files found at root level"
}
Write-Host ""

# ─── STEP 6: Abort if critical checks failed ──────────────────────────────────
if (-not $checksPassed) {
    Write-Host "======================================================" -ForegroundColor Red
    Write-ERR "Pre-flight checks FAILED. Please fix the issues above before packaging."
    Write-Host "======================================================" -ForegroundColor Red
    exit 1
}

Write-Host "[ Step 6 ] All critical checks passed. Proceeding to package ..." -ForegroundColor White
Write-Host ""

# ─── STEP 7: Create output dir and ZIP ────────────────────────────────────────
$outputDir  = Join-Path $ProjectRoot "dist"
$zipName    = "hai_job_v$version.zip"
$zipPath    = Join-Path $outputDir $zipName

if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

# Remove old zip with same name if exists
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
    Write-WARN "Old $zipName removed."
}

Write-Host "[ Step 7 ] Packaging extension into: dist\$zipName" -ForegroundColor White

# Define what to INCLUDE in the ZIP
$includeItems = @(
    "manifest.json",
    "background.js",
    "src",
    "assets",
    "_locales"
)

# Create a temp staging directory
$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "hai_job_build_$version"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir | Out-Null

foreach ($item in $includeItems) {
    $srcPath = Join-Path $ProjectRoot $item
    if (Test-Path $srcPath) {
        Copy-Item -Path $srcPath -Destination $tempDir -Recurse -Force
    }
}

# Create ZIP from staging dir contents
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -Force

# Cleanup temp
Remove-Item $tempDir -Recurse -Force

Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "  ✅ Package created successfully!" -ForegroundColor Green
Write-Host "  📦 File : dist\$zipName" -ForegroundColor Green
$zipSize = [math]::Round((Get-Item $zipPath).Length / 1KB, 1)
Write-Host "  📏 Size : $zipSize KB" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""

# ─── STEP 8: Extract ZIP for Load Unpacked testing ────────────────────────────
Write-Host "[ Step 8 ] Extracting ZIP for Load Unpacked testing ..." -ForegroundColor White
$testUnpackDir = Join-Path $outputDir "test_unpack"
if (Test-Path $testUnpackDir) {
    Remove-Item $testUnpackDir -Recurse -Force
}
Expand-Archive -Path $zipPath -DestinationPath $testUnpackDir -Force

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  🧪 Load Unpacked Test Folder Ready!" -ForegroundColor Cyan
Write-Host "  📂 Path: dist\test_unpack\" -ForegroundColor Cyan
Write-Host "  ➡️  Open chrome://extensions/ → Enable Developer Mode" -ForegroundColor Cyan
Write-Host "     → Load unpacked → Select dist\test_unpack\" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""
Write-INFO "When ready, upload dist\$zipName to Chrome Web Store Developer Dashboard"
Write-Host ""
