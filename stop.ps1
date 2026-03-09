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

Print-Warning "Initiating Aporte shutdown..."
Write-Host ""

# Stop Docker Compose containers
Print-Step "Stopping containers..."
docker compose stop

Write-Host ""
Print-Success "Aporte shut down successfully!"
Write-Host "  Memory and processing resources (CPU) have been fully released." -ForegroundColor White
Write-Host "  To start again, run: .\start.ps1`n" -ForegroundColor White
exit 0

