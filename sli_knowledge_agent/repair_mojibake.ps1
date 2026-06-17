$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backupRoot = Join-Path $root ".encoding_backup"
$cp949 = [System.Text.Encoding]::GetEncoding(949)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$extensions = @("*.html", "*.css", "*.js", "*.md", "*.ps1", "*.csv")
$files = Get-ChildItem -Path $root -Recurse -File -Include $extensions |
  Where-Object { $_.FullName -notlike "$backupRoot*" }

function Get-TextScore([string]$text) {
  $score = 0
  foreach ($char in $text.ToCharArray()) {
    $code = [int][char]$char

    if (($code -ge 0xAC00 -and $code -le 0xD7A3) -or ($code -ge 0x3131 -and $code -le 0x318E)) {
      $score += 4
      continue
    }

    if (($code -ge 0x4E00 -and $code -le 0x9FFF) -or ($code -ge 0x3400 -and $code -le 0x4DBF)) {
      $score -= 3
      continue
    }

    if ($char -eq [char]0xFFFD) {
      $score -= 6
      continue
    }

    if ($char -eq "?") {
      $score -= 1
      continue
    }

    if ([char]::IsLetterOrDigit($char) -or [char]::IsWhiteSpace($char)) {
      $score += 1
    }
  }

  return $score
}

function Repair-Line([string]$line) {
  try {
    $candidate = [System.Text.Encoding]::UTF8.GetString($cp949.GetBytes($line))
  } catch {
    return $line
  }

  if ((Get-TextScore $candidate) -gt (Get-TextScore $line)) {
    return $candidate
  }

  return $line
}

foreach ($file in $files) {
  $relativePath = $file.FullName.Substring($root.Length).TrimStart("\")
  $backupPath = Join-Path $backupRoot $relativePath
  $backupDir = Split-Path -Parent $backupPath

  if (!(Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
  }

  if (!(Test-Path $backupPath)) {
    Copy-Item -LiteralPath $file.FullName -Destination $backupPath
  }

  $original = [System.IO.File]::ReadAllText($file.FullName)
  $lines = $original -split "`r?`n", -1
  $repairedLines = foreach ($line in $lines) { Repair-Line $line }
  $repaired = [string]::Join("`r`n", $repairedLines)

  [System.IO.File]::WriteAllText($file.FullName, $repaired, $utf8NoBom)
  Write-Output "repaired: $relativePath"
}
