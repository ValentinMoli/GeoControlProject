#!/bin/bash

# Verificar que Docker este corriendo
if ! docker info > /dev/null 2>&1; then
    echo "Docker no esta corriendo."
    exit 1
fi

echo "Deteniendo contenedores de GeoControl..."
docker compose down

echo ""
echo "Contenedores detenidos."
echo ""
read -p "Presiona Enter para cerrar"
