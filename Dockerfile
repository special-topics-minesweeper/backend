FROM node:12
WORKDIR /minesweeper/
COPY package*.json ./
RUN npm ci

COPY . .
RUN npx tsc

CMD ["node", "./dist/index.js"]