# Используем официальный Node.js образ
FROM node:18-alpine

# Устанавливаем wget для healthcheck
RUN apk add --no-cache wget

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем исходный код
COPY . .

# Создаем директорию для базы данных
RUN mkdir -p /app/data

# Открываем порт
EXPOSE 5174

# Запускаем приложение
CMD ["node", "src/api/server.js"]

