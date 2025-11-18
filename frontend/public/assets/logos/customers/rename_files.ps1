# Скрипт для переименования файлов логотипов клиентов
# Запуск: powershell -ExecutionPolicy Bypass -File rename_files.ps1

$mapping = @{
    "1.Свердловский областной медицинский колледж.jpg" = "sverdlovsk-medical-college.jpg"
    "9. Кемеровский Государственный Институт Культуры.jpg" = "kemgik.jpg"
    "13. АКЦИОНЕРНОЕ ОБЩЕСТВО ЧУКОТЭНЕРГО.png" = "chukotenergo.png"
    "18. Публичное акционерное общество «Таттелеком».png" = "tattelcom.png"
    "19. Черноморский банк развития и реконструкции.jpg" = "bank-chbrr.jpg"
    "23. БЮДЖЕТНОЕ УЧРЕЖДЕНИЕ РЕСПУБЛИКИ АЛТАЙ ПО ЭКСПЛУАТАЦИИ РАДИОРЕЛЕЙНОЙ ЛИНИИ СВЯЗИ ЭЛ ТЕЛКОМ.jpg" = "el-telkom.jpg"
    "24. МУНИЦИПАЛЬНОЕ АВТОНОМНОЕ УЧРЕЖДЕНИЕ ГОРОДА НОВОСИБИРСКА ГОРОДСКОЙ ЦЕНТР РАЗВИТИЯ ПРЕДПРИНИМАТЕЛЬСТВА.jpeg" = "gcrp.jpeg"
    "28. ФЕДЕРАЛЬНАЯ СЛУЖБА ПО КОНТРОЛЮ ЗА АЛКОГОЛЬНЫМ И ТАБАЧНЫМ РЫНКАМИ.png" = "rosalkogol.png"
    "27. АКЦИОНЕРНОЕ ОБЩЕСТВО РЕГИОНАЛЬНЫЕ ЭЛЕКТРИЧЕСКИЕ СЕТИ.png" = "rosseti-novosibirsk.png"
    "30. ОТДЕЛЕНИЕ ФОНДА ПЕНСИОННОГО И СОЦИАЛЬНОГО СТРАХОВАНИЯ РОССИЙСКОЙ ФЕДЕРАЦИИ ПО АЛТАЙСКОМУ КРАЮ.jpg" = "social-fund-russia.jpg"
    "38. АКЦИОНЕРНОЕ ОБЩЕСТВО КРАСНОЯРСККРАЙГАЗ.png" = "kraigaz.png"
    "37. Апрель.png" = "aprel.png"
    "40. АКЦИОНЕРНОЕ ОБЩЕСТВО ЮГОРСКИЙ ЛЕСОПРОМЫШЛЕННЫЙ ХОЛДИНГ.png" = "yugorsky-holding.png"
    "41. ФЕДЕРАЛЬНОЕ ГОСУДАРСТВЕННОЕ БЮДЖЕТНОЕ НАУЧНОЕ УЧРЕЖДЕНИЕ НАУЧНЫЙ ЦЕНТР ПСИХИЧЕСКОГО ЗДОРОВЬЯ.jpg" = "mental-health.jpg"
    "5.Государственное казенное учреждение Астраханской области «Областная спасательно-пожарная служба «Волгоспас».webp" = "volgospas.webp"
    "10. ГОСУДАРСТВЕННОЕ БЮДЖЕТНОЕ УЧРЕЖДЕНИЕ КАЛУЖСКОЙ ОБЛАСТИ «АГЕНТСТВО ИНФОРМАЦИОННЫХ ТЕХНОЛОГИЙ КАЛУЖСКОЙ ОБЛАСТИ».png" = "kalugainformtech.png"
    "4.Бюджетное учреждение в сфере информационных технологий Вологодской области «Центр информационных технологий».jpg" = "tsit.jpg"
}

$currentDir = Get-Location
$renamed = 0
$notFound = 0

foreach ($oldName in $mapping.Keys) {
    $newName = $mapping[$oldName]
    $oldPath = Join-Path $currentDir $oldName
    $newPath = Join-Path $currentDir $newName
    
    if (Test-Path $oldPath) {
        if (Test-Path $newPath) {
            Write-Host "Файл уже существует: $newName" -ForegroundColor Yellow
        } else {
            Write-Host "Переименовываю: $oldName -> $newName" -ForegroundColor Green
            Rename-Item -Path $oldPath -NewName $newName -ErrorAction Stop
            $renamed++
        }
    } else {
        Write-Host "Файл не найден: $oldName" -ForegroundColor Red
        $notFound++
    }
}

Write-Host "`nГотово! Переименовано: $renamed, Не найдено: $notFound" -ForegroundColor Cyan
