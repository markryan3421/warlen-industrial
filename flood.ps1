$baseUrl = "http://warlen-industrial.test"
$session = [Microsoft.PowerShell.Commands.WebRequestSession]::new()

# ── Get CSRF token ──────────────────────────
Write-Host "Getting CSRF token..." -ForegroundColor Cyan
$loginPage = Invoke-WebRequest -Uri "$baseUrl/login" `
    -UseBasicParsing `
    -SessionVariable "session"

$csrfToken = [regex]::Match(
    $loginPage.Content, 
    'name="_token"\s+value="([^"]+)"'
).Groups[1].Value

Write-Host "Token: $csrfToken" -ForegroundColor Green

# ── Login ───────────────────────────────────
Write-Host "Logging in..." -ForegroundColor Cyan
Invoke-WebRequest -Uri "$baseUrl/login" `
    -Method POST `
    -UseBasicParsing `
    -WebSession $session `
    -Body @{
        email    = "admin@test.com"
        password = "password"
        _token   = $csrfToken
    }
Write-Host "Logged in!" -ForegroundColor Green

# ── Start Flood ─────────────────────────────
$count    = 0
$errors   = 0
$start    = Get-Date

Write-Host "Flooding DB... Ctrl+C to stop" -ForegroundColor Red

while ($true) {
    try {
        $random = Get-Random -Maximum 9999
        $tabs   = @("logs","exceptions","periods","schedules")
        $tab    = $tabs | Get-Random

        # Hit heavy DB routes
        Invoke-WebRequest `
            -Uri "$baseUrl/attendances?tab=$tab&search=emp$random&perPage=100" `
            -UseBasicParsing `
            -WebSession $session `
            -ErrorAction SilentlyContinue | Out-Null

        Invoke-WebRequest `
            -Uri "$baseUrl/employees?search=test$random&perPage=100" `
            -UseBasicParsing `
            -WebSession $session `
            -ErrorAction SilentlyContinue | Out-Null

        $count  += 2
        $elapsed = ((Get-Date) - $start).TotalSeconds
        $rps     = [math]::Round($count / $elapsed, 2)

        Write-Host "[$([DateTime]::Now.ToString('HH:mm:ss'))] Requests: $count | RPS: $rps | Errors: $errors"

    } catch {
        $errors++
        Write-Host "BLOCKED/ERROR: $_" -ForegroundColor Yellow
    }
}