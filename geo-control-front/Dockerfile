# Build de app Angular 
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production

#  Serve de applicacion con Nginx
FROM nginx:alpine
# Copiar configuración custom de nginx para manejar el routing de Angular 
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copiar el build compilado al directorio html de nginx
COPY --from=build /app/dist/geo-control-front/browser /usr/share/nginx/html
EXPOSE 80
EXPOSE 4200
CMD ["nginx", "-g", "daemon off;"]
