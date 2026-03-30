#!/bin/bash

/opt/mssql/bin/sqlservr &

echo "Esperando que SQL Server (Auth) inicie..."
for i in {1..60}; do
    /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -Q "SELECT 1" -C -b > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "SQL Server (Auth) listo."
        break
    fi
    sleep 1
done

echo "Ejecutando script de inicialización GeoControlAuthDB..."
/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -d master -i /usr/config/2FAAuth.sql -C

echo "Inicialización de base de datos de autenticación finalizada."

wait
