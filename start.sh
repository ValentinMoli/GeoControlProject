#!/bin/bash

# Verificar que Docker este corriendo
if ! docker info > /dev/null 2>&1; then
    echo "Docker no esta corriendo. Inicia Docker primero."
    exit 1
fi

# Buildear imagenes si no existen
if [ -z "$(docker compose images -q 2>/dev/null)" ]; then
    echo "Construyendo imagenes Docker de GeoControl..."
    docker compose build
    if [ $? -ne 0 ]; then
        echo "Error en el build."
        exit 1
    fi
    echo "Build finalizado."
fi

echo "Iniciando contenedores de GeoControl..."
docker compose up -d

echo "Esperando a que los servicios esten listos..."
sleep 10

echo ""
echo "Estado de los contenedores:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "GeoControl disponible en:"
echo "  Frontend:    http://localhost:4200"
echo "  API:         http://localhost:7214"
echo "  2FA Service: http://localhost:8081"
echo "  Map Service: http://localhost:8082"
echo "  MSSQL:       localhost:1434"
echo ""
read -p "Presiona Enter para cerrar"
