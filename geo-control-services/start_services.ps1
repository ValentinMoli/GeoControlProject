$p1 = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '.\2fa-service'; go run main.go" -PassThru
$p2 = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '.\map-service'; go run main.go" -PassThru
