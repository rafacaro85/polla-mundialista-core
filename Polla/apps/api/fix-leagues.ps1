$path = "apps\api\src\leagues\leagues.service.ts"
$content = Get-Content $path
$part1 = $content[0..546]
$part2 = $content[689..($content.Length - 1)]
$final = $part1 + $part2
$final | Set-Content $path -Encoding UTF8
Write-Host "Leagues file cleaned."
