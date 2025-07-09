# Create Dockerfile in /var/www/kairostudio.in
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 2500
CMD ["node", "server.js"]
