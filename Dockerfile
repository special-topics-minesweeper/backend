FROM node:12
WORKDIR /minesweeper/
COPY package*.json ./
RUN npm ci

COPY . .
RUN npx tsc

CMD ["npm", "run", "__internal-docker-run"]