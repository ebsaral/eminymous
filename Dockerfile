FROM node:10.15.3-alpine as builder

WORKDIR /app

RUN apk --no-cache add python make g++

ENV NODE_ENV=production
ENV WEBSITE_NAME=eminymous
ENV VERSION=0.0.4

COPY package*.json ./
RUN npm install

COPY . .

CMD npm run start:prod