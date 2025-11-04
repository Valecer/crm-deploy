# Docker Deployment Guide

## Структура Docker конфигурации

Проект использует два Docker контейнера:
- **backend** - Node.js API сервер (порт 5174)
- **frontend** - Nginx статический сервер (порт 80)

## Быстрый старт

### 1. Сборка и запуск контейнеров

```bash
docker-compose up -d --build
```

### 2. Просмотр логов

```bash
# Все сервисы
docker-compose logs -f

# Только backend
docker-compose logs -f backend

# Только frontend
docker-compose logs -f frontend
```

### 3. Остановка контейнеров

```bash
docker-compose down
```

### 4. Остановка с удалением volumes (база данных будет удалена!)

```bash
docker-compose down -v
```

## Доступ к приложению

После запуска контейнеров:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:5174
- **Health Check**: http://localhost:5174/health

## Переменные окружения

Для настройки backend создайте файл `.env` в папке `backend/` или укажите переменные в `docker-compose.yml`:

```yaml
environment:
  - PORT=5174
  - DB_PATH=/app/data/database.sqlite
  - NODE_ENV=production
  - JWT_SECRET=your-secret-key
```

## База данных

База данных SQLite хранится в Docker volume `backend-data` и сохраняется между перезапусками контейнеров.

Для резервного копирования:
```bash
docker run --rm -v crm-final-v-1-0_backend-data:/data -v $(pwd):/backup alpine tar czf /backup/db-backup.tar.gz /data
```

Для восстановления:
```bash
docker run --rm -v crm-final-v-1-0_backend-data:/data -v $(pwd):/backup alpine tar xzf /backup/db-backup.tar.gz -C /
```

## Проблемы и решения

### Порт уже занят
Если порт 80 или 5174 занят, измените маппинг портов в `docker-compose.yml`:
```yaml
ports:
  - "8080:80"  # для frontend
  - "5175:5174"  # для backend
```

### Ошибки при сборке
Убедитесь, что все зависимости установлены локально:
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Проблемы с базой данных
Если база данных не создается, проверьте права доступа к volume:
```bash
docker-compose down
docker volume rm crm-final-v-1-0_backend-data
docker-compose up -d --build
```

## Продакшен деплой

Для продакшен деплоя рекомендуется:
1. Использовать HTTPS через reverse proxy (nginx, traefik)
2. Настроить правильные переменные окружения
3. Использовать внешнюю базу данных (PostgreSQL/MySQL) вместо SQLite
4. Настроить мониторинг и логирование
5. Использовать Docker secrets для чувствительных данных

## Полезные команды

```bash
# Пересобрать контейнеры
docker-compose build --no-cache

# Перезапустить сервис
docker-compose restart backend

# Войти в контейнер
docker exec -it crm-backend sh
docker exec -it crm-frontend sh

# Проверить статус
docker-compose ps

# Просмотреть использование ресурсов
docker stats
```

