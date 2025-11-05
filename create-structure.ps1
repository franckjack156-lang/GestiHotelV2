# Script de création de la structure GestiHôtel V2
Write-Host "🚀 Création de la structure du projet..." -ForegroundColor Cyan

$folders = @(
    "src/app",
    "src/features/auth/components",
    "src/features/auth/hooks",
    "src/features/auth/services",
    "src/features/auth/stores",
    "src/features/auth/types",
    "src/features/interventions/components",
    "src/features/interventions/hooks",
    "src/features/interventions/services",
    "src/features/interventions/stores",
    "src/features/interventions/types",
    "src/features/interventions/utils",
    "src/features/establishments/components",
    "src/features/establishments/hooks",
    "src/features/establishments/services",
    "src/features/establishments/stores",
    "src/features/establishments/types",
    "src/features/users/components",
    "src/features/users/hooks",
    "src/features/users/services",
    "src/features/users/stores",
    "src/features/users/types",
    "src/features/rooms/components",
    "src/features/rooms/hooks",
    "src/features/rooms/services",
    "src/features/rooms/stores",
    "src/features/rooms/types",
    "src/features/analytics/components",
    "src/features/analytics/hooks",
    "src/features/analytics/services",
    "src/features/analytics/stores",
    "src/features/analytics/types",
    "src/features/planning/components",
    "src/features/planning/hooks",
    "src/features/planning/services",
    "src/features/planning/stores",
    "src/features/planning/types",
    "src/features/notifications/components",
    "src/features/notifications/hooks",
    "src/features/notifications/services",
    "src/features/notifications/stores",
    "src/features/notifications/types",
    "src/features/qrcodes/components",
    "src/features/qrcodes/hooks",
    "src/features/qrcodes/services",
    "src/features/qrcodes/types",
    "src/features/templates/components",
    "src/features/templates/hooks",
    "src/features/templates/services",
    "src/features/templates/stores",
    "src/features/templates/types",
    "src/features/messaging/components",
    "src/features/messaging/hooks",
    "src/features/messaging/services",
    "src/features/messaging/stores",
    "src/features/messaging/types",
    "src/shared/components/ui",
    "src/shared/components/forms",
    "src/shared/components/layouts",
    "src/shared/components/feedback",
    "src/shared/components/misc",
    "src/shared/hooks",
    "src/shared/utils",
    "src/shared/constants",
    "src/shared/types",
    "src/core/config",
    "src/core/api/firebase",
    "src/core/lib",
    "src/styles",
    "src/tests/unit",
    "src/tests/integration",
    "src/tests/e2e",
    "functions/src",
    "firebase"
)

$count = 0
foreach ($folder in $folders) {
    if (!(Test-Path $folder)) {
        New-Item -ItemType Directory -Force -Path $folder | Out-Null
        Write-Host "✅ Créé: $folder" -ForegroundColor Green
        $count++
    } else {
        Write-Host "⏭️  Existe déjà: $folder" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎉 Terminé ! $count dossiers créés." -ForegroundColor Cyan