# Base de runtime
FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

# Base de build
FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /src

# Copiar sln y csproj para restaurar
COPY ["GeoControl.Api/GeoControl.Api.sln", "GeoControl.Api/"]
COPY ["GeoControl.Api/GeoControl.Api/GeoControl.Api.csproj", "GeoControl.Api/GeoControl.Api/"]
RUN dotnet restore "GeoControl.Api/GeoControl.Api/GeoControl.Api.csproj"

# Copiar el resto y compilar
COPY . .
WORKDIR "/src/GeoControl.Api/GeoControl.Api"
RUN dotnet build "GeoControl.Api.csproj" -c Release -o /app/build

# Publicar
FROM build AS publish
RUN dotnet publish "GeoControl.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage final
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "GeoControl.Api.dll"]
