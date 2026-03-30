# GeoControl

App web para gestionar trabajos geolocalizados. Los admins crean tareas y las asignan a operarios por profesion, y se visualizan en un mapa interactivo. Esto puede adaptarse a diferentes a diferentes areas asignando diferentes profesiones, en este caso esta con oficios, pero podria ser repartidor, cobrador etc.

Stack: Angular 21, ASP.NET Core 6, Go (Gin), MSSQL 2022, Docker

## Como levantar

Windows:
Necesitas Docker Desktop instalado y corriendo.

.\start.ps1 # levanta todo (buildea si es la primera vez)
.\stop.ps1 # baja los contenedores

Linux:
chmod +x start.sh stop.sh # dar permisos si no funciona
./start.sh
./stop.sh

## URLs

- Frontend: http://localhost:4200
- API: http://localhost:7214

## Usuarios de prueba

Admins (requieren 2FA por email):

Mail|Clave

| valentinmoli12@gmail.com | 1234 |
| azunino@gmail.com | 1234 |

Operarios:

Mail|Clave|Profesion

| Email                     | Password | Profesion    |
| ------------------------- | -------- | ------------ |
| juanperez@gmail.com       | 1234     | Carpintero   |
| pedrolopez@gmail.com      | 1234     | Albanil      |
| fabianrodriguez@gmail.com | 1234     | Plomero      |
| jorgegonzales@gmail.com   | 1234     | Gasista      |
| MH@gmail.com              | 12345    | Electricista |
