#!/bin/bash

# Iniciar SQL Server en el background
/opt/mssql/bin/sqlservr &

# Esperar a que el servidor levante
echo "Esperando que SQL Server inicie para correr el script de inicialización..."
sleep 25s

# Crear la base de datos, tablas y usuario admin
echo "Creando GeoControlDB..."
/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -d master -i /usr/config/GeoControlDB.sql -C

echo "Inicialización de base de datos GeoControlDB finalizada."

# Esperar al proceso de SQL Server para que el contenedor no se apague
wait
