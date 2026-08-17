# Aprovisiona la lista de SharePoint para FORMADOS de un solo golpe:
# crea "Inscripciones FORMADOS" con las 18 columnas exactas que espera
# api/inscripcion.js, y al final imprime el Site ID y List ID listos
# para pegar en Vercel (FORMADOS_SP_SITE_ID / FORMADOS_SP_LIST_ID).
#
# Uso:
#   1. Crea un archivo .env.provision (junto a este script o en la raíz
#      del proyecto) con:
#        FORMADOS_TENANT_ID=...
#        FORMADOS_CLIENT_ID=...
#        FORMADOS_CLIENT_SECRET=...
#        SP_SITE_PATH=mundodefesantodomingo.sharepoint.com:/sites/Formados
#      (SP_SITE_PATH es el sitio donde YA existe o creaste el sitio —
#      este script no crea sitios, solo la lista dentro de uno existente)
#   2. En PowerShell, dentro de la carpeta del proyecto:
#        .\scripts\provision-formados-sharepoint.ps1
#      Si da error de "ejecución de scripts deshabilitada", corre antes:
#        Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#
# No necesita instalar ningún módulo — solo usa Invoke-RestMethod, que
# viene incluido en Windows PowerShell 5.1 y en PowerShell 7.
# .env.provision nunca se commitea (ver .gitignore) — bórralo cuando termines.

$ErrorActionPreference = "Stop"

function Import-DotEnv {
    param([string]$Path)
    if (-not (Test-Path $Path)) { return }
    Get-Content $Path | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith("#")) { return }
        $eq = $line.IndexOf("=")
        if ($eq -lt 0) { return }
        $key = $line.Substring(0, $eq).Trim()
        $val = $line.Substring($eq + 1).Trim()
        if (-not [System.Environment]::GetEnvironmentVariable($key)) {
            [System.Environment]::SetEnvironmentVariable($key, $val, "Process")
        }
    }
}

function Get-RequiredEnv {
    param([string]$Name)
    $val = [System.Environment]::GetEnvironmentVariable($Name)
    if (-not $val) {
        Write-Error "Falta $Name. Ponlo en .env.provision o defínelo antes de correr el script."
        exit 1
    }
    return $val
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
Import-DotEnv (Join-Path $projectRoot ".env.provision")
Import-DotEnv (Join-Path $scriptDir ".env.provision")

$TenantId     = Get-RequiredEnv "FORMADOS_TENANT_ID"
$ClientId     = Get-RequiredEnv "FORMADOS_CLIENT_ID"
$ClientSecret = Get-RequiredEnv "FORMADOS_CLIENT_SECRET"
$SitePath     = Get-RequiredEnv "SP_SITE_PATH"

$ListName = "Inscripciones FORMADOS"

$Columns = @(
    @{ name = "FamiliaID";           text = @{} }
    @{ name = "Nombre";              text = @{} }
    @{ name = "Edad";                number = @{ decimalPlaces = "none" } }
    @{ name = "Pista";               text = @{} }
    @{ name = "EsResponsable";       boolean = @{} }
    @{ name = "Retira";              text = @{} }
    @{ name = "Alergias";            text = @{} }
    @{ name = "ResponsableNombre";   text = @{} }
    @{ name = "ResponsableWhatsapp"; text = @{} }
    @{ name = "ResponsableCorreo";   text = @{} }
    @{ name = "Sector";              text = @{} }
    @{ name = "PrimeraVez";          text = @{} }
    @{ name = "InteresFacilitar";    text = @{} }
    @{ name = "Nota";                text = @{ allowMultipleLines = $true } }
    @{ name = "AutorizaTutor";       boolean = @{} }
    @{ name = "AutorizaFotos";       text = @{} }
    @{ name = "EnviadoEn";           text = @{} }
    @{ name = "Origen";              text = @{} }
)

Write-Host "-> Autenticando con Microsoft Graph..."
$tokenBody = @{
    client_id     = $ClientId
    client_secret = $ClientSecret
    scope         = "https://graph.microsoft.com/.default"
    grant_type    = "client_credentials"
}
try {
    $tokenResponse = Invoke-RestMethod -Method Post `
        -Uri "https://login.microsoftonline.com/$TenantId/oauth2/v2.0/token" `
        -Body $tokenBody -ContentType "application/x-www-form-urlencoded"
} catch {
    Write-Error "No se pudo autenticar: $($_.ErrorDetails.Message)"
    exit 1
}
$token = $tokenResponse.access_token
Write-Host "   ok"

$headers = @{ Authorization = "Bearer $token" }

Write-Host "-> Buscando el sitio `"$SitePath`"..."
try {
    $site = Invoke-RestMethod -Method Get -Headers $headers `
        -Uri "https://graph.microsoft.com/v1.0/sites/$SitePath"
} catch {
    Write-Error "No se encontró el sitio: $($_.ErrorDetails.Message)"
    exit 1
}
Write-Host "   Site ID: $($site.id)"

Write-Host "-> Revisando si `"$ListName`" ya existe..."
$existingLists = Invoke-RestMethod -Method Get -Headers $headers `
    -Uri "https://graph.microsoft.com/v1.0/sites/$($site.id)/lists"
$list = $existingLists.value | Where-Object { $_.displayName -eq $ListName }

if ($list) {
    Write-Host "   Ya existe (List ID: $($list.id)) -- no se crea de nuevo."
} else {
    Write-Host "-> Creando `"$ListName`" con $($Columns.Count) columnas..."
    $body = @{
        displayName = $ListName
        list        = @{ template = "genericList" }
        columns     = $Columns
    } | ConvertTo-Json -Depth 6

    try {
        $list = Invoke-RestMethod -Method Post -Headers $headers `
            -Uri "https://graph.microsoft.com/v1.0/sites/$($site.id)/lists" `
            -Body $body -ContentType "application/json"
    } catch {
        Write-Error "No se pudo crear la lista: $($_.ErrorDetails.Message)"
        exit 1
    }
    Write-Host "   Creada (List ID: $($list.id))"
}

Write-Host ""
Write-Host "Listo. Pega esto en Vercel -> Settings -> Environment Variables:" -ForegroundColor Green
Write-Host ""
Write-Host "FORMADOS_SP_SITE_ID=$($site.id)"
Write-Host "FORMADOS_SP_LIST_ID=$($list.id)"
