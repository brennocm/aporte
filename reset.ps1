$ErrorActionPreference = "Stop"

# -----------------
# Helper Functions
# -----------------
function Print-Step ($Message) {
    Write-Host "> " -ForegroundColor Cyan -NoNewline
    Write-Host $Message -ForegroundColor White
}

function Print-Success ($Message) {
    Write-Host "v " -ForegroundColor Green -NoNewline
    Write-Host $Message -ForegroundColor White
}

function Print-Error ($Message) {
    Write-Host "x " -ForegroundColor Red -NoNewline
    Write-Host $Message -ForegroundColor White
}

function Print-Warning ($Message) {
    Write-Host "! " -ForegroundColor Yellow -NoNewline
    Write-Host $Message -ForegroundColor White
}

# -----------------
# Splash Screen
# -----------------
Clear-Host
Write-Host @"
  ____  ____   ___   ____  ______    ___ 
 /    ||    \ /   \ |    \|      |  /  _]
|  o  ||  o  )     ||  D  )      | /  [_ 
|     ||   _/|  O  ||    /|_|  |_||    _]
|  _  ||  |  |     ||    \  |  |  |   [_ 
|  |  ||  |  |     ||  .  \ |  |  |     |
|__|__||__|   \___/ |__|\_| |__|  |_____|

by: brennocm (https://github.com/brennocm/aporte)
                                            
"@ -ForegroundColor Cyan

Print-Warning "Initiating Controlled Reset of Aporte OSS..."
Write-Host "  This will clear the mathematical cache and rebuild containers." -ForegroundColor White
Write-Host "  Your account, portfolios, and database are SAFE." -ForegroundColor Green
Write-Host ""

Print-Step "1/3 Stopping containers..."
docker compose stop

# 2. Delete only the container and image from Cache (Redis) to force flush
Print-Step "2/3 Clearing Cache (Redis)..."
docker compose rm -s -v -f redis

# 3. Rebuild the images and start
Print-Step "3/3 Rebuilding engine and starting infrastructure..."
docker compose down
docker compose up -d --build --force-recreate

Write-Host ""
Print-Success "Aporte restarted successfully!"
Write-Host "  Status: All containers active." -ForegroundColor White
Write-Host "  URL: http://localhost:3000/`n" -ForegroundColor White
exit 0
