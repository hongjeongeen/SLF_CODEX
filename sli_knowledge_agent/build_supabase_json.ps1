param(
    [Parameter(Mandatory = $true)]
    [string]$CsvName
)

$ErrorActionPreference = "Stop"

$path = Join-Path $PSScriptRoot ("data\\upload\\" + $CsvName)
$rows = Get-Content -LiteralPath $path -Encoding UTF8 | ConvertFrom-Csv

$compressed = $rows | ConvertTo-Json -Compress -Depth 5
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Output $compressed
