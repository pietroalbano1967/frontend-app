# build
FROM node:20-alpine as build
WORKDIR /app
COPY src ./src
# Assumi che esista package.json/lock nel root del progetto Angular
COPY package*.json ./
RUN npm ci && npm run build -- --configuration production

# serve
FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist/ /usr/share/nginx/html
