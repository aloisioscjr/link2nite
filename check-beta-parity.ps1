[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$workspaceRoot = $PSScriptRoot
$syncScript = Join-Path $workspaceRoot "sync-beta-parity.ps1"

if (-not (Test-Path -LiteralPath $syncScript)) {
    throw "Script de sync não encontrado: $syncScript"
}

Write-Output "Modo seguro: apenas verificação de paridade, sem copiar ficheiros."
& $syncScript -VerifyOnly
