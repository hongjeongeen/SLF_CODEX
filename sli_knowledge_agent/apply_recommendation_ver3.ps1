$ErrorActionPreference = "Stop"

$baseDir = Join-Path $PSScriptRoot "data"
$uploadDir = Join-Path $baseDir "upload"
$refFile = Get-ChildItem -LiteralPath $baseDir -Filter "*ver3.csv" | Select-Object -First 1

if (-not $refFile) {
    throw "Could not find the ver3 reference CSV in data/."
}

$referenceRows = Import-Csv -LiteralPath $refFile.FullName
$knownColumns = @(
    "source_csv",
    "match_key",
    "match_value",
    "secondary_key",
    "secondary_value",
    "used_in_surface",
    "text_column",
    "text_type",
    "current_text",
    "operator_note"
)

$recommendationColumn = @($referenceRows | Select-Object -First 1 | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name | Where-Object { $_ -notin $knownColumns })[0]

if (-not $recommendationColumn) {
    throw "Could not identify the recommendation column in the ver3 CSV."
}

$keyRepairColumns = @(
    "term_label",
    "aliases_csv",
    "datajs_rider_id",
    "minor_category"
)

$rulesByFile = @{}
foreach ($row in $referenceRows) {
    if (-not $rulesByFile.ContainsKey($row.source_csv)) {
        $rulesByFile[$row.source_csv] = New-Object System.Collections.ArrayList
    }

    [void]$rulesByFile[$row.source_csv].Add($row)
}

$summary = New-Object System.Collections.ArrayList

foreach ($sourceCsv in ($rulesByFile.Keys | Sort-Object)) {
    $uploadPath = Join-Path $uploadDir $sourceCsv
    $rows = Import-Csv -LiteralPath $uploadPath
    $fieldOrder = @($rows | Select-Object -First 1 | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name)
    $updates = 0

    foreach ($rule in $rulesByFile[$sourceCsv]) {
        $matchKey = $rule.match_key
        $matchValue = $rule.match_value
        $secondaryKey = $rule.secondary_key
        $secondaryValue = $rule.secondary_value
        $textColumn = $rule.text_column
        $recommendation = $rule.$recommendationColumn
        $currentText = $rule.current_text
        $primaryMatches = @($rows | Where-Object { $_.$matchKey -eq $matchValue })
        if ($primaryMatches.Count -eq 0) {
            continue
        }

        $targetRow = $null
        if (-not [string]::IsNullOrWhiteSpace($secondaryKey)) {
            $exactMatches = @($primaryMatches | Where-Object { $_.$secondaryKey -eq $secondaryValue })
            if ($exactMatches.Count -gt 0) {
                $targetRow = $exactMatches[0]
            } elseif ($primaryMatches.Count -eq 1) {
                $targetRow = $primaryMatches[0]
                if ($fieldOrder -contains $secondaryKey -and -not [string]::IsNullOrWhiteSpace($secondaryValue) -and $targetRow.$secondaryKey -ne $secondaryValue) {
                    $targetRow.$secondaryKey = $secondaryValue
                    $updates++
                }
            }
        } elseif ($primaryMatches.Count -ge 1) {
            $targetRow = $primaryMatches[0]
        }

        if (-not $targetRow) {
            continue
        }

        $desiredText = $null
        if (-not [string]::IsNullOrWhiteSpace($recommendation)) {
            $desiredText = $recommendation
        } elseif (($keyRepairColumns -contains $textColumn) -and -not [string]::IsNullOrWhiteSpace($currentText)) {
            $desiredText = $currentText
        }

        if (($fieldOrder -contains $textColumn) -and $null -ne $desiredText -and $targetRow.$textColumn -ne $desiredText) {
            $targetRow.$textColumn = $desiredText
            $updates++
        }
    }

    $orderedRows = foreach ($row in $rows) {
        $ordered = [ordered]@{}
        foreach ($column in $fieldOrder) {
            $ordered[$column] = $row.$column
        }
        [pscustomobject]$ordered
    }

    $orderedRows | Export-Csv -LiteralPath $uploadPath -NoTypeInformation -Encoding UTF8

    [void]$summary.Add([pscustomobject]@{
        source_csv = $sourceCsv
        reference_rules = $rulesByFile[$sourceCsv].Count
        updated_cells = $updates
    })
}

$summary | Format-Table -AutoSize
