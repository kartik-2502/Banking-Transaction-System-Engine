# Benchmark Runner Script for High-Concurrency Banking Transaction Engine
# Author: kartik-2502 <kartikpal2502@gmail.com>

param(
    [int]$Threads = 20,
    [int]$Transactions = 1000
)

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "  APEX BANK - HIGH CONCURRENCY BENCHMARK HARNESS" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host " Target Concurrency : $Threads Threads" -ForegroundColor Yellow
Write-Host " Target Volume      : $Transactions Transactions" -ForegroundColor Yellow
Write-Host " Database Engine    : PostgreSQL 18.3 (ACID Strict, Row-Level Locking)" -ForegroundColor Yellow
Write-Host " Runtime            : Java 17 LTS / Spring Boot 3" -ForegroundColor Yellow
Write-Host "========================================================================" -ForegroundColor Cyan

$mavenPath = "D:\Users\kfork\Downloads\apache-maven-3.9.11-bin\apache-maven-3.9.11\bin\mvn.cmd"
$backendDir = "$PSScriptRoot\backend"

Set-Location $backendDir

Write-Host "Executing HighConcurrencyBenchmarkTest suite via Maven..." -ForegroundColor Green
& $mavenPath test -Dtest=HighConcurrencyBenchmarkTest

Write-Host "`nBenchmark execution complete! Review reports in backend/target/surefire-reports/" -ForegroundColor Cyan
