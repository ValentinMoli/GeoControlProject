FROM mcr.microsoft.com/mssql/server:2022-latest

USER root

RUN mkdir -p /usr/config
WORKDIR /usr/config

COPY init-db.sh .
COPY GeoControlDB.sql .

RUN chmod +x init-db.sh

USER mssql

# Correr SQLServer y luego ejecutar el sql inicial
ENTRYPOINT ["./init-db.sh"]
