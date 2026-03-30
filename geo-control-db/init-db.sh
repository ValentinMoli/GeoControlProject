#!/bin/bash

# Iniciar SQL Server 
/opt/mssql/bin/sqlservr &

# Esperar a que SQL Server esté listo 
echo "Esperando que SQL Server inicie..."
for i in {1..60}; do
    /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -Q "SELECT 1" -C -b > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "SQL Server listo."
        break
    fi
    sleep 1
done

echo "Ejecutando script de inicialización GeoControlDB..."
/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -d master -i /usr/config/GeoControlDB.sql -C

echo "Inicialización de base de datos GeoControlDB finalizada."

wait
