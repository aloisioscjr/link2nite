[CmdletBinding()]
param(
    [switch]$VerifyOnly
)

$ErrorActionPreference = "Stop"

$workspaceRoot = $PSScriptRoot
$rootBetaDir = Join-Path $workspaceRoot "beta"
$mirrorBetaDir = Join-Path $workspaceRoot "link2nite-repo\beta"
$rootIndex = Join-Path $rootBetaDir "index.html"
$mirrorIndex = Join-Path $mirrorBetaDir "index.html"
$rootVenueDir = Join-Path $rootBetaDir "images\venues"
$mirrorVenueDir = Join-Path $mirrorBetaDir "images\venues"

function Assert-PathExists {
    param(
        [string]$Path,
        [string]$Label
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "$Label não encontrado: $Path"
    }
}

function Get-RelativeVenueList {
    param(
        [string]$BaseDir
    )

    return Get-ChildItem -LiteralPath $BaseDir -File -Filter *.jpg |
        Select-Object -ExpandProperty Name |
        Sort-Object
}

function Get-VenueHashTable {
    param(
        [string]$BaseDir
    )

    $table = @{}
    Get-ChildItem -LiteralPath $BaseDir -File -Filter *.jpg | ForEach-Object {
        $table[$_.Name] = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash
    }
    return $table
}

function Get-FileHashHex {
    param(
        [string]$Path
    )

    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash
}

Assert-PathExists -Path $rootIndex -Label "Arquivo raiz beta/index.html"
Assert-PathExists -Path $mirrorBetaDir -Label "Pasta espelho link2nite-repo/beta"
Assert-PathExists -Path $rootVenueDir -Label "Pasta raiz beta/images/venues"

if (-not $VerifyOnly) {
    New-Item -ItemType Directory -Force -Path $mirrorVenueDir | Out-Null
    Copy-Item -LiteralPath $rootIndex -Destination $mirrorIndex -Force
    Copy-Item -Path (Join-Path $rootVenueDir "*.jpg") -Destination $mirrorVenueDir -Force
}

Assert-PathExists -Path $mirrorIndex -Label "Arquivo espelho link2nite-repo/beta/index.html"
Assert-PathExists -Path $mirrorVenueDir -Label "Pasta espelho link2nite-repo/beta/images/venues"

$rootIndexHash = Get-FileHashHex -Path $rootIndex
$mirrorIndexHash = Get-FileHashHex -Path $mirrorIndex
$rootVenueFiles = Get-RelativeVenueList -BaseDir $rootVenueDir
$mirrorVenueFiles = Get-RelativeVenueList -BaseDir $mirrorVenueDir
$rootVenueHashes = Get-VenueHashTable -BaseDir $rootVenueDir
$mirrorVenueHashes = Get-VenueHashTable -BaseDir $mirrorVenueDir
$missingInMirror = Compare-Object $rootVenueFiles $mirrorVenueFiles | Where-Object { $_.SideIndicator -eq "<=" } | Select-Object -ExpandProperty InputObject
$extraInMirror = Compare-Object $rootVenueFiles $mirrorVenueFiles | Where-Object { $_.SideIndicator -eq "=>" } | Select-Object -ExpandProperty InputObject
$contentMismatches = @()
$commonVenueFiles = $rootVenueFiles | Where-Object { $_ -in $mirrorVenueFiles }
$commonVenueFiles | ForEach-Object {
    if ($rootVenueHashes[$_] -ne $mirrorVenueHashes[$_]) {
        $contentMismatches += $_
    }
}

$rootLineCount = (Get-Content -LiteralPath $rootIndex | Measure-Object -Line).Lines
$mirrorLineCount = (Get-Content -LiteralPath $mirrorIndex | Measure-Object -Line).Lines

Write-Output ("Mode: " + ($(if ($VerifyOnly) { "verify" } else { "sync+verify" })))
Write-Output ("Root index: " + $rootIndex)
Write-Output ("Mirror index: " + $mirrorIndex)
Write-Output ("Root index lines: " + $rootLineCount)
Write-Output ("Mirror index lines: " + $mirrorLineCount)
Write-Output ("Root venue jpg count: " + $rootVenueFiles.Count)
Write-Output ("Mirror venue jpg count: " + $mirrorVenueFiles.Count)

if ($missingInMirror.Count -gt 0) {
    Write-Output "Missing in mirror:"
    $missingInMirror | ForEach-Object { Write-Output ("  " + $_) }
}

if ($extraInMirror.Count -gt 0) {
    Write-Output "Extra in mirror:"
    $extraInMirror | ForEach-Object { Write-Output ("  " + $_) }
}

if ($contentMismatches.Count -gt 0) {
    Write-Output "Content mismatches:"
    $contentMismatches | ForEach-Object { Write-Output ("  " + $_) }
}

if ($rootIndexHash -ne $mirrorIndexHash) {
    throw "Paridade falhou: beta/index.html e link2nite-repo/beta/index.html diferem."
}

if ($missingInMirror.Count -gt 0 -or $extraInMirror.Count -gt 0 -or $contentMismatches.Count -gt 0) {
    throw "Paridade falhou: beta/images/venues e link2nite-repo/beta/images/venues diferem."
}

Write-Output "Paridade OK: index.html e beta/images/venues estão alinhados entre raiz e link2nite-repo."
