FROM mcr.microsoft.com/mssql/server:2022-latest

USER root

RUN mkdir -p /usr/config
WORKDIR /usr/config

COPY init-db-auth.sh .
COPY 2FAAuth.sql .

RUN chmod +x init-db-auth.sh

USER mssql

ENTRYPOINT ["./init-db-auth.sh"]
