# --- APORTE Open Source: Windows Startup Script ---

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

Write-Host "  The Open Source Wealth Simulation Engine" -ForegroundColor White
Write-Host "  ----------------------------------------`n" -ForegroundColor White

# -----------------
# Execution Start
# -----------------

Print-Step "Performing system checks..."

# 1. Check for Docker
try {
    $null = docker info
    Print-Success "Docker Engine is active."
} catch {
    Print-Error "Docker is not installed or not running."
    Write-Host "  Please install Docker Desktop to continue: " -NoNewline
    Write-Host "https://www.docker.com/" -ForegroundColor Cyan
    exit 1
}

# 2. Configure .env automatically
Print-Step "Verifying environment configuration..."
if (-not (Test-Path .env)) {
    Print-Warning "No .env file found. Generating from template..."
    Copy-Item .env.example .env
    Print-Success "Environment profile (.env) created."
} else {
    Print-Success "Environment profile (.env) found."
}

# 3. Generate secure AUTH_SECRET if still using placeholder
$envContent = Get-Content .env -Raw
if ($envContent -match "sua_chave_secreta") {
    Print-Step "Securing authentication layer..."
    
    # Cryptographically secure random generation
    $bytes = New-Object Byte[] 32
    $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::Create()
    $rng.GetBytes($bytes)
    $secret = [Convert]::ToBase64String($bytes)
    
    # Replace in file
    $envContent = $envContent -replace 'AUTH_SECRET=.*', "AUTH_SECRET=$secret"
    [IO.File]::WriteAllText("$PWD\.env", $envContent)
    
    Print-Success "Cryptographic keys generated and injected."
}

Write-Host "`n"
Print-Step "Igniting the Aporte containers..."
Write-Host "  This phase builds the Math Engine and Web Layer." -ForegroundColor White
Write-Host "  Depending on your internet speed, this may take a few minutes.`n" -ForegroundColor White

# 4. Start Containers
docker compose up --build -d

Write-Host "`n"
Write-Host "=======================================================" -ForegroundColor Green
Write-Host "                 APORTE IS ONLINE                      " -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green
Write-Host "`n"
Write-Host "  Launch URL    " -ForegroundColor White -NoNewline
Write-Host "http://localhost:3000/" -ForegroundColor Cyan
Write-Host "  Status        Containers running in background.`n" -ForegroundColor White
Write-Host "  To monitor server logs in real-time, run:" -ForegroundColor Gray
Write-Host "  docker compose logs -f`n" -ForegroundColor Gray
