package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	_ "modernc.org/sqlite"
)

var db *sql.DB

func main() {
	var err error
	//Abro archivo MBTILES
	db, err = sql.Open("sqlite", "./data/argentina.mbtiles")
	if err != nil {
		log.Fatalf("Error abriendo argentina.mbtiles: %v", err)
	}
	defer db.Close()

	if err = db.Ping(); err != nil {
		log.Fatalf("No se pudo abrir MBTiles: %v", err)
	}

	log.Println("MBTiles argentina.mbtiles abierto correctamente.")

	r := gin.Default()

	// Configuración de CORS para permitir peticiones desde el frontend (Angular)
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:4200")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Endpoints del servicio
	r.GET("/style.json", serveStyle)
	r.GET("/tiles/:z/:x/:y", serveTile)

	port := os.Getenv("MAP_PORT")
	if port == "" {
		port = "8082"
	}

	log.Printf("Map service escuchando en puerto %s ...", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Error iniciando servidor: %v", err)
	}
}

// serveStyle genera y devuelve el JSON de estilo para Maplibre
func serveStyle(c *gin.Context) {
	host := c.Request.Host

	style := fmt.Sprintf(`{
  "version": 8,
  "name": "GeoControl Argentina",
  "sources": {
    "openmaptiles": {
      "type": "vector",
      "tiles": [
        "http://%s/tiles/{z}/{x}/{y}.pbf"
      ],
      "minzoom": 0,
      "maxzoom": 14
    }
  },
  "layers": [
    {
      "id": "landcover",
      "type": "fill",
      "source": "openmaptiles",
      "source-layer": "landcover",
      "paint": { "fill-color": "#eae0d0" }
    },
    {
      "id": "water",
      "type": "fill",
      "source": "openmaptiles",
      "source-layer": "water",
      "paint": { "fill-color": "#a0c8f0" }
    },
    {
      "id": "roads",
      "type": "line",
      "source": "openmaptiles",
      "source-layer": "transportation",
      "paint": {
        "line-color": "#555555",
        "line-width": 1
      }
    },
    {
      "id": "buildings",
      "type": "fill",
      "source": "openmaptiles",
      "source-layer": "building",
      "paint": { "fill-color": "#d6bfbf" }
    },
    {
      "id": "road_label",
      "type": "symbol",
      "source": "openmaptiles",
      "source-layer": "transportation_name",
      "layout": {
        "symbol-placement": "line",
        "text-field": "{name:latin}",
        "text-size": 12
      },
      "paint": {
        "text-color": "#000000",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1
      }
    },
    {
      "id": "place_label",
      "type": "symbol",
      "source": "openmaptiles",
      "source-layer": "place",
      "layout": {
        "text-field": "{name:latin}",
        "text-size": 14
      },
      "paint": {
        "text-color": "#000000",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1
      }
    }
  ]
}`, host)

	c.Header("Content-Type", "application/json")
	c.String(http.StatusOK, style)
}

// serveTile sirve los tiles vectoriales
// GET /tiles/:z/:x/:y  
func serveTile(c *gin.Context) {
	zStr := c.Param("z")
	xStr := c.Param("x")
	yStr := c.Param("y") 

	yStr = strings.TrimSuffix(yStr, ".pbf")

	z, err := strconv.Atoi(zStr)
	if err != nil {
		c.Status(http.StatusBadRequest)
		return
	}
	x, err := strconv.Atoi(xStr)
	if err != nil {
		c.Status(http.StatusBadRequest)
		return
	}
	y, err := strconv.Atoi(yStr)
	if err != nil {
		c.Status(http.StatusBadRequest)
		return
	}

	tmsY := flipY(z, y)

	query := `
        SELECT tile_data
        FROM tiles
        WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?;
    `

	var data []byte

	err = db.QueryRow(query, z, x, tmsY).Scan(&data)

	if err != nil {
		if err == sql.ErrNoRows {
			c.Status(http.StatusNoContent)
			return
		}
		log.Printf("Error leyendo tile z=%d x=%d y=%d: %v", z, x, y, err)
		c.Status(http.StatusInternalServerError)
		return
	}

	// Detectar si el tile está gzip-comprimido 
	if len(data) >= 2 && data[0] == 0x1f && data[1] == 0x8b {
		c.Header("Content-Encoding", "gzip")
	}

	c.Header("Content-Type", "application/x-protobuf")
	c.Writer.WriteHeader(http.StatusOK)
	if _, err := c.Writer.Write(data); err != nil {
		log.Printf("Error escribiendo tile: %v", err)
	}
}

// flipY convierte coordenadas entre esquema XYZ y TMS
func flipY(z, y int) int {
	return (1 << z) - 1 - y
}
