package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/smtp"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	_ "github.com/microsoft/go-mssqldb"
)

// Estructura de la tabla TwoFactorCodes
type TwoFACodeRecord struct {
	Id        int
	UserId    int
	Code      string
	CreatedAt time.Time
	ExpiresAt time.Time
	Used      bool
}

// Estructura para el archivo de configuración que tengo en config.json
type Config struct {
	SMTPHost   string `json:"smtp_host"`
	SMTPPort   string `json:"smtp_port"`
	SMTPUser   string `json:"smtp_user"`
	SMTPPass   string `json:"smtp_pass"`
	SMTPFrom   string `json:"smtp_from"`
	AuthDBConn string `json:"auth_db_conn"`
}

var (
	db     *sql.DB
	config *Config
)

func loadConfig(filename string) (*Config, error) {
	file, err := os.Open(filename)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	decoder := json.NewDecoder(file)
	cfg := &Config{}
	err = decoder.Decode(cfg)
	if err != nil {
		return nil, err
	}
	return cfg, nil
}

func main() {
	var err error
	// Carga configuración desde archivo JSON
	config, err = loadConfig("config.json")
	if err != nil {
		log.Fatalf("Error cargando configuración: %v", err)
	}

	// Override por variable de entorno (para Docker)
	if envConn := os.Getenv("AUTH_DB_CONN"); envConn != "" {
		config.AuthDBConn = envConn
	}

	// Conexión a Auth DB con reintentos (MSSQL puede tardar en arrancar)
	db, err = sql.Open("sqlserver", config.AuthDBConn)
	if err != nil {
		log.Fatalf("Error abriendo conexión a la DB: %v", err)
	}
	defer db.Close()

	for i := 0; i < 30; i++ {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		err = db.PingContext(ctx)
		cancel()
		if err == nil {
			break
		}
		log.Printf("Esperando a la DB (intento %d/30): %v", i+1, err)
		time.Sleep(2 * time.Second)
	}
	if err != nil {
		log.Fatalf("No se pudo conectar a la DB después de 30 intentos: %v", err)
	}

	log.Println("Conectado a GeoControlAuthDB.")

	// Configuración de rutas, primero inicio el router gin
	r := gin.Default()
	// aca le asigno la ruta del generador de claves y el validador
	r.POST("/generate", generate2FAHandler)
	r.POST("/validate", validate2FAHandler)

	log.Println("2FA Service en puerto 8081")
	if err := r.Run(":8081"); err != nil {
		log.Fatalf("Error iniciando servidor HTTP: %v", err)
	}
}

// funcion donde creo el codigo de verificacion
func generate2FAHandler(c *gin.Context) {
	//primero recibo el request y valido que tenga el userId y el email
	var req struct {
		UserId int    `json:"userId"`
		Email  string `json:"email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"success": false, "message": "request inválido"})
		return
	}

	if req.Email == "" {
		c.JSON(400, gin.H{"success": false, "message": "email requerido"})
		return
	}

	//creo el codigo de 6 digitos y lo guardo en la db
	code := fmt.Sprintf("%06d", rand.Intn(1000000))
	now := time.Now().UTC()
	expires := now.Add(3 * time.Minute)

	query := `
		INSERT INTO TwoFactorCodes (UserId, Code, CreatedAt, ExpiresAt, Used)
		VALUES (@p1, @p2, @p3, @p4, 0);
	`

	_, err := db.ExecContext(context.Background(), query, req.UserId, code, now, expires)
	if err != nil {
		log.Printf("Error guardando código 2FA: %v", err)
		c.JSON(500, gin.H{"success": false, "message": "error interno"})
		return
	}

	//genero y envio el email al usuario

	subject := "Código de verificación GeoControl"
	body := fmt.Sprintf(`
	<!DOCTYPE html>
	<html>
	<head>
		<style>
			body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
			.container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); text-align: center; }
			.code { font-size: 48px; font-weight: bold; letter-spacing: 5px; color: #333; margin: 20px 0; }
			.footer { font-size: 12px; color: #777; margin-top: 20px; }
		</style>
	</head>
	<body>
		<div class="container">
			<h2>Código de verificación GeoControl</h2>
			<p>Tu código de verificación es:</p>
			<div class="code">%s</div>
			<p>Vence en 3 minutos.</p>
			<div class="footer">Este correo fue generado automáticamente, por favor no responder.</div>
		</div>
	</body>
	</html>
	`, code)

	if err := sendEmail(req.Email, subject, body); err != nil {
		log.Printf("Error enviando email 2FA: %v", err)
		c.JSON(500, gin.H{"success": false, "message": "no se pudo enviar el correo"})
		return
	}

	c.JSON(200, gin.H{
		"success":   true,
		"message":   "Código generado y enviado por email.",
		"expiresAt": expires,
		"userId":    req.UserId,
	})
}

// Validador para verificar si el código ingresado es correcto y no ha expirado
func validate2FAHandler(c *gin.Context) {
	var req struct {
		UserId int    `json:"userId"`
		Code   string `json:"code"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"valid": false, "message": "request inválido"})
		return
	}

	query := `
		SELECT TOP 1 Id, UserId, Code, CreatedAt, ExpiresAt, Used
		FROM TwoFactorCodes
		WHERE UserId = @p1 AND Code = @p2
		ORDER BY CreatedAt DESC;
	`

	var rec TwoFACodeRecord
	err := db.QueryRowContext(context.Background(), query, req.UserId, req.Code).Scan(
		&rec.Id, &rec.UserId, &rec.Code, &rec.CreatedAt, &rec.ExpiresAt, &rec.Used,
	)

	if err == sql.ErrNoRows {
		c.JSON(401, gin.H{"valid": false, "message": "Código no encontrado"})
		return
	}
	if err != nil {
		log.Printf("Error consultando código 2FA: %v", err)
		c.JSON(500, gin.H{"valid": false, "message": "error interno"})
		return
	}

	if rec.Used {
		c.JSON(401, gin.H{"valid": false, "message": "Código ya usado"})
		return
	}

	if time.Now().UTC().After(rec.ExpiresAt) {
		c.JSON(401, gin.H{"valid": false, "message": "Código expirado"})
		return
	}

	// Marcar como usado
	_, err = db.ExecContext(context.Background(), "UPDATE TwoFactorCodes SET Used = 1 WHERE Id = @p1;", rec.Id)
	if err != nil {
		log.Printf("Error marcando código 2FA como usado: %v", err)
	}

	c.JSON(200, gin.H{
		"valid":   true,
		"message": "Código validado",
	})
}

func sendEmail(to, subject, body string) error {
	if config.SMTPHost == "" || config.SMTPPort == "" || config.SMTPUser == "" || config.SMTPPass == "" || config.SMTPFrom == "" {
		log.Println("credenciales no configurados en config.json")
		return nil
	}

	addr := config.SMTPHost + ":" + config.SMTPPort

	msg := []byte(
		"To: " + to + "\r\n" +
			"Subject: " + subject + "\r\n" +
			"MIME-Version: 1.0\r\n" +
			"Content-Type: text/html; charset=\"utf-8\"\r\n" +
			"\r\n" +
			body + "\r\n",
	)

	auth := smtp.PlainAuth("", config.SMTPUser, config.SMTPPass, config.SMTPHost)

	return smtp.SendMail(addr, auth, config.SMTPFrom, []string{to}, msg)
}
