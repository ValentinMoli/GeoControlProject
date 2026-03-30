$env:DOCKER_HOST = "npipe:////./pipe/dockerDesktopLinuxEngine"

# Verificar que Docker este corriendo
docker info >$null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker no esta corriendo." -ForegroundColor Red
    exit 1
}

Write-Host "Deteniendo contenedores de GeoControl..." -ForegroundColor Cyan
docker compose down

Write-Host ""
Write-Host "Contenedores detenidos." -ForegroundColor Green
Write-Host ""
Read-Host "Presiona Enter para cerrar"
