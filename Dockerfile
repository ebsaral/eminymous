FROM node:10.15.3-alpine as builder

WORKDIR /app

RUN apk --no-cache add python make g++

ENV NODE_ENV=production
ENV WEBSITE_NAME=eminymous
ENV VERSION=0.1.0
ENV BOT_NAME=bot.emin

COPY package*.json ./
RUN npm install

COPY . .

CMD npm run start:prod