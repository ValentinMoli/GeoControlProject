#!/bin/bash

# Iniciar SQL Server en el background
/opt/mssql/bin/sqlservr &

# Esperar a que el servidor levante
echo "Esperando que SQL Server (Auth) inicie..."
sleep 25s

# Crear la base de datos de autenticación 2FA
echo "Creando GeoControlAuthDB..."
/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -d master -i /usr/config/2FAAuth.sql -C

echo "Inicialización de base de datos de autenticación finalizada."

wait
