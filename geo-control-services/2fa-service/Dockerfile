# Build stage
FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o 2fa-service .

# Run stage
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
# Copiar config y binario
COPY --from=builder /app/config.json .
COPY --from=builder /app/2fa-service .
EXPOSE 8081
CMD ["./2fa-service"]
