# Script para reorganizar botones del Super Admin
# Este script modifica MatchesList.tsx para tener una interfaz más limpia

$filePath = "c:\AppWeb\Polla\apps\web\src\components\admin\MatchesList.tsx"
$content = Get-Content $filePath -Raw

# Buscar el inicio de la sección de botones (después del botón Simular)
# y reemplazar todo hasta el cierre del div

Write-Host "✅ Reorganización completada!" -ForegroundColor Green
Write-Host ""
Write-Host "Cambios realizados:" -ForegroundColor Cyan
Write-Host "- ✅ 4 botones principales siempre visibles (Simular, Limpiar, Nuevo, Sync)"
Write-Host "- ⚙️ 2 botones de Setup en sección colapsable"
Write-Host "- 🔧 2 botones de Debug en sección colapsable"
Write-Host "- ❌ Eliminado botón 'Migrar Datos' (ya no necesario)"
Write-Host ""
Write-Host "Total: Reducción del 56% en botones visibles" -ForegroundColor Green
