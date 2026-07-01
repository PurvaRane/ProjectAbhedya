# Installs the pre-commit hook that blocks .env files from being committed.
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$hookSrc = Join-Path $root "scripts\pre-commit-block-env"
$hookDest = Join-Path $root ".git\hooks\pre-commit"

if (-not (Test-Path (Join-Path $root ".git"))) {
  Write-Error "Not a git repository: $root"
  exit 1
}

Copy-Item -Force $hookSrc $hookDest
Write-Host "Installed pre-commit hook at .git/hooks/pre-commit"
Write-Host "Commits containing backend/.env or frontend/.env will now be blocked."
