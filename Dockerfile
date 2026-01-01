FROM node:20-alpine AS builder

WORKDIR /app
# Copia o package.json e package-lock.json (ou yarn.lock)
# Isso aproveita o cache do Docker. Se esses arquivos não mudarem, o 'npm install' não será executado novamente.
COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build --mode=production

FROM nginx:stable-alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos estáticos gerados no estágio 'builder' para o diretório padrão do NGINX
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]