FROM mcr.microsoft.com/mssql/server:2022-latest

USER root

# Crear directorio para nuestros scripts
RUN mkdir -p /usr/config
WORKDIR /usr/config

# Copiar el script de init y el SQL
COPY init-db.sh .
COPY GeoControlDB.sql .

# Dar permisos de ejecución
RUN chmod +x init-db.sh

# Volver al usuario mssql
USER mssql

# Entrypoint personalizado para correr SQLServer y luego ejecutar el sql de semilla
ENTRYPOINT ["./init-db.sh"]
