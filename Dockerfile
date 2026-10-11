
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm install --omit=dev

COPY server.js ./server.js
COPY public ./public

EXPOSE 3000

CMD ["npm", "start"]
