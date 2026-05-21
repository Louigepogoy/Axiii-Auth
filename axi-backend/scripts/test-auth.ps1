# Run after: npm run dev
$base = "http://localhost:8000"
$email = "test@example.com"
$password = "password123"

Write-Host "`n--- Register ---"
try {
  $reg = Invoke-RestMethod -Method POST -Uri "$base/api/auth/register" `
    -ContentType "application/json" `
    -Body (@{ email = $email; password = $password; name = "Test User" } | ConvertTo-Json)
  $reg | ConvertTo-Json -Depth 5
  $token = $reg.data.token
} catch {
  Write-Host $_.ErrorDetails.Message
  exit 1
}

Write-Host "`n--- Login ---"
$login = Invoke-RestMethod -Method POST -Uri "$base/api/auth/login" `
  -ContentType "application/json" `
  -Body (@{ email = $email; password = $password } | ConvertTo-Json)
$login | ConvertTo-Json -Depth 5
$token = $login.data.token

Write-Host "`n--- Me (authenticated) ---"
$headers = @{ Authorization = "Bearer $token" }
$me = Invoke-RestMethod -Uri "$base/api/auth/me" -Headers $headers
$me | ConvertTo-Json -Depth 5

Write-Host "`n--- Logout ---"
$logout = Invoke-RestMethod -Method POST -Uri "$base/api/auth/logout"
$logout | ConvertTo-Json

Write-Host "`nAll auth endpoints OK`n"
