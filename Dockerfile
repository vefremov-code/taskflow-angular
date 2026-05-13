# Stage 1: Build the Angular application
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --prefer-offline

COPY . .

ARG BUILD_CONFIGURATION=production
RUN npx ng build --configuration ${BUILD_CONFIGURATION}

# Stage 2: Serve static production assets with Nginx
FROM nginx:alpine AS production

COPY --from=builder /app/dist/taskflow/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

RUN addgroup -g 1001 -S nginx-app \
  && adduser -S -D -H -u 1001 -s /sbin/nologin -G nginx-app nginx-app \
  && chown -R nginx-app:nginx-app /usr/share/nginx/html \
  && chown -R nginx-app:nginx-app /var/cache/nginx \
  && touch /var/run/nginx.pid \
  && chown nginx-app:nginx-app /var/run/nginx.pid

USER nginx-app

CMD ["nginx", "-g", "daemon off;"]