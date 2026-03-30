$env:DOCKER_HOST = "npipe:////./pipe/dockerDesktopLinuxEngine"

# Verificar que Docker este corriendo
docker info >$null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker no esta corriendo. Inicia Docker Desktop primero." -ForegroundColor Red
    exit 1
}

# Buildear imagenes si no existen
$images = docker compose images -q 2>$null
if (-not $images) {
    Write-Host "Construyendo imagenes Docker de GeoControl..." -ForegroundColor Cyan
    docker compose build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error en el build." -ForegroundColor Red
        exit 1
    }
    Write-Host "Build finalizado." -ForegroundColor Green
}

Write-Host "Iniciando contenedores de GeoControl..." -ForegroundColor Cyan
docker compose up -d

Write-Host "Esperando a que los servicios esten listos..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "Estado de los contenedores:" -ForegroundColor Cyan
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

Write-Host ""
Write-Host "GeoControl disponible en:" -ForegroundColor Green
Write-Host "  Frontend:    http://localhost:4200"
Write-Host "  API:         http://localhost:7214"
Write-Host "  2FA Service: http://localhost:8081"
Write-Host "  Map Service: http://localhost:8082"
Write-Host "  MSSQL:       localhost:1434"
Write-Host ""
Read-Host "Presiona Enter para cerrar"
