FROM mcr.microsoft.com/mssql/server:2022-latest

USER root

# Crear directorio para scripts
RUN mkdir -p /usr/config
WORKDIR /usr/config

# Copiar el script de init y el SQL de 2FA
COPY init-db-auth.sh .
COPY 2FAAuth.sql .

# Dar permisos de ejecución
RUN chmod +x init-db-auth.sh

# Volver al usuario mssql
USER mssql

# Entrypoint personalizado
ENTRYPOINT ["./init-db-auth.sh"]
