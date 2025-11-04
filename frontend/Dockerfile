# Этап сборки
FROM node:18-alpine AS builder

WORKDIR /app

# Копируем package файлы
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Этап продакшена - используем nginx для раздачи статики
FROM nginx:alpine

# Устанавливаем wget для healthcheck (если его нет)
RUN apk add --no-cache wget || true

# Копируем собранные файлы из builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт
EXPOSE 80

# Nginx запускается автоматически
CMD ["nginx", "-g", "daemon off;"]

