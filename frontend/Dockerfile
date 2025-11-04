# Этап сборки
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package.json
RUN npm install

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Этап продакшена - используем nginx для раздачи статики
FROM nginx:alpine

# Копируем собранные файлы из builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf
#COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт
EXPOSE 80

# Nginx запускается автоматически
CMD ["nginx", "-g", "daemon off;"]

