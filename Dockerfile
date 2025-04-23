# Step 1: Build Angular App
FROM node:18 AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN ./node_modules/.bin/ng build --configuration=production

# Step 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build-stage /app/dist/ktt /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
