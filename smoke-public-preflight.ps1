[CmdletBinding()]
param(
    [string]$BetaUrl = "https://www.link2nite.com/beta/",
    [string]$CapabilitiesUrl = "https://script.google.com/macros/s/AKfycbxnPAbUdYLuTL4dN0x0Z0nJIVjmqZECNfiP-o3OVqy7ThzgGCLG9Gf_mr-FJZKOLVDp0g/exec?action=capabilities&feature=shared_state",
    [switch]$SkipLive,
    [switch]$RequirePhoneAuth,
    [switch]$RequireSmsAuth
)

$ErrorActionPreference = "Stop"

$workspaceRoot = $PSScriptRoot
$rootIndex = Join-Path $workspaceRoot "beta\index.html"
$parityScript = Join-Path $workspaceRoot "check-beta-parity.ps1"

function Assert-PathExists {
    param(
        [string]$Path,
        [string]$Label
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "$Label nao encontrado: $Path"
    }
}

function Assert-Contains {
    param(
        [string]$Text,
        [string]$Needle,
        [string]$Label
    )

    if ($Text -notmatch [regex]::Escape($Needle)) {
        throw "$Label ausente: $Needle"
    }
}

function Assert-NotContains {
    param(
        [string]$Text,
        [string]$Needle,
        [string]$Label
    )

    if ($Text -match [regex]::Escape($Needle)) {
        throw "$Label ainda presente: $Needle"
    }
}

function Write-Check {
    param(
        [string]$Message
    )

    Write-Output ("[OK] " + $Message)
}

Assert-PathExists -Path $rootIndex -Label "Arquivo raiz beta/index.html"
Assert-PathExists -Path $parityScript -Label "Script de paridade"

Write-Output "1. Verificando paridade local..."
& $parityScript
Write-Check "Paridade local OK."

$localHtml = Get-Content -LiteralPath $rootIndex -Raw

$requiredLocalMarkers = @(
    @{ Label = "Flag de launch publico no HTML local"; Needle = "const PUBLIC_REAL_LAUNCH_MODE = true;" },
    @{ Label = "CTA mensal do paywall no HTML local"; Needle = "Continue to Monthly checkout" },
    @{ Label = "Modal full-screen de match no HTML local"; Needle = 'id="match-modal"' },
    @{ Label = "Badge de matches no HTML local"; Needle = 'id="nav-matches-badge"' }
)

$forbiddenLocalMarkers = @(
    @{ Label = "CTA antigo de retorno para landing no HTML local"; Needle = "Back to landing" },
    @{ Label = "Toast antigo de sync beta no HTML local"; Needle = "Couldn't sync the shared beta right now." },
    @{ Label = "Toast antigo de email beta no HTML local"; Needle = "Enter a valid email to sync with the shared beta." },
    @{ Label = "Toast antigo de username beta no HTML local"; Needle = "Username changes aren't live yet on the shared beta." },
    @{ Label = "Onboarding antigo em portugues no HTML local"; Needle = "De match com pessoas que vao ao mesmo lugar" },
    @{ Label = "Onboarding antigo em portugues no HTML local"; Needle = "Veja o que esta bombando hoje" },
    @{ Label = "Onboarding antigo em portugues no HTML local"; Needle = "Marque o encontro sem enrolacao" },
    @{ Label = "Formulario antigo em portugues no HTML local"; Needle = "Nome que voce quer mostrar" }
)

Write-Output "2. Verificando marcadores do build local..."
foreach ($marker in $requiredLocalMarkers) {
    Assert-Contains -Text $localHtml -Needle $marker.Needle -Label $marker.Label
    Write-Check $marker.Label
}

foreach ($marker in $forbiddenLocalMarkers) {
    Assert-NotContains -Text $localHtml -Needle $marker.Needle -Label $marker.Label
    Write-Check $marker.Label
}

if ($SkipLive) {
    Write-Output "3. Preflight live foi pulado por -SkipLive."
    Write-Output "Preflight OK (somente local)."
    exit 0
}

Write-Output "3. Verificando HTML publicado..."
$liveResponse = Invoke-WebRequest -Uri $BetaUrl -UseBasicParsing
if ($liveResponse.StatusCode -ne 200) {
    throw "Beta live respondeu com status inesperado: $($liveResponse.StatusCode)"
}
Write-Check "Beta live respondeu 200."

$liveHtml = [string]$liveResponse.Content

foreach ($marker in $requiredLocalMarkers) {
    $liveLabel = $marker.Label -replace "local", "live"
    Assert-Contains -Text $liveHtml -Needle $marker.Needle -Label $liveLabel
    Write-Check $liveLabel
}

foreach ($marker in $forbiddenLocalMarkers) {
    $liveLabel = $marker.Label -replace "local", "live"
    Assert-NotContains -Text $liveHtml -Needle $marker.Needle -Label $liveLabel
    Write-Check $liveLabel
}

Write-Output "4. Verificando capabilities do Apps Script..."
$capabilitiesResponse = Invoke-WebRequest -Uri $CapabilitiesUrl -UseBasicParsing
$capabilities = $capabilitiesResponse.Content | ConvertFrom-Json

$requiredCapabilityFlags = @(
    "ok",
    "supportsAdminAuth",
    "supportsUserAuth",
    "supportsSharedState",
    "supportsAppBackend",
    "supportsPayments",
    "supportsStripeCheckout"
)

foreach ($flag in $requiredCapabilityFlags) {
    if (-not $capabilities.$flag) {
        throw "Capability obrigatoria desligada no deploy live: $flag"
    }
    Write-Check ("Capability live OK: " + $flag)
}

if ($RequirePhoneAuth -and -not $capabilities.supportsPhoneAuth) {
    throw "Phone auth ainda nao esta live, mas o preflight foi chamado com -RequirePhoneAuth."
}

if ($RequireSmsAuth -and -not $capabilities.supportsSmsAuth) {
    throw "SMS auth ainda nao esta live, mas o preflight foi chamado com -RequireSmsAuth."
}

if (-not $capabilities.supportsPhoneAuth -or -not $capabilities.supportsSmsAuth) {
    Assert-Contains -Text $liveHtml -Needle "SMS verification is not live on this deployment yet" -Label "Copy publica de fallback de SMS no HTML live"
    Write-Check "Fallback publico de SMS coerente com capabilities live."
} else {
    Write-Check "Phone/SMS auth live."
}

Write-Output ("Capabilities live: " + ($capabilities | ConvertTo-Json -Compress))
Write-Output "Preflight OK (local + live)."
