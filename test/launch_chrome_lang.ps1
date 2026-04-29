# Chrome Language Test Tool (Compatibility Version)
# Usage: powershell .\test\launch_chrome_lang.ps1

$chromePath = "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $chromePath)) {
    $chromePath = "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
}

if (-not (Test-Path $chromePath)) {
    Write-Error "Cannot find Chrome. Please check the path in the script."
    exit
}

# Profile directory
$testDataRoot = "$PSScriptRoot\chrome_test_profiles"

$languages = @{
    "1" = @{ "name" = "Chinese (Simplified)"; "code" = "zh-CN" }
    "2" = @{ "name" = "English (US)"; "code" = "en-US" }
    "3" = @{ "name" = "Chinese (Traditional)"; "code" = "zh-TW" }
    "4" = @{ "name" = "Japanese"; "code" = "ja" }
    "5" = @{ "name" = "Korean"; "code" = "ko" }
    "6" = @{ "name" = "French"; "code" = "fr" }
}

Write-Host "========================================" -ForegroundColor Yellow
Write-Host "      Chrome Language Test Tool" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "Select language version:"

foreach ($key in ($languages.Keys | Sort-Object)) {
    Write-Host "$key. $($languages[$key].name) ($($languages[$key].code))"
}
Write-Host "q. Quit"

$choice = Read-Host "`nEnter choice [1-6]"

if ($choice -eq "q") { exit }

if ($languages.ContainsKey($choice)) {
    $lang = $languages[$choice].code
    $name = $languages[$choice].name
    $userDataDir = "$testDataRoot\$lang"

    Write-Host "`nLaunching [$name]..." -ForegroundColor Green
    Write-Host "User Data Dir: $userDataDir" -ForegroundColor Gray

    # Launch Chrome
    Start-Process $chromePath -ArgumentList "--lang=$lang", "--user-data-dir=`"$userDataDir`"", "--no-first-run"
} else {
    Write-Host "Invalid choice." -ForegroundColor Red
}
