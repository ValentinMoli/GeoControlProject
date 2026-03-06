# Build stage
FROM golang:1.24-alpine AS builder
WORKDIR /app
# Copiar go mod y sum
COPY go.mod go.sum ./
RUN go mod download
# Copiar el código fuente
COPY . .
RUN go mod tidy
# Compilar binario estático
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o map-service .

# Run stage
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
# Copiar binario
COPY --from=builder /app/map-service .
# Crear directorio de datos (se montará el mbtiles mediante docker-compose)
RUN mkdir -p data
EXPOSE 8082
CMD ["./map-service"]
