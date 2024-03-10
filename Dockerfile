# syntax=docker/dockerfile:1

ARG NODE_VERSION=18.18.2

FROM node:${NODE_VERSION}-alpine as builder

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:${NODE_VERSION}-alpine

ENV NODE_ENV production
USER node

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 2525
CMD [ "node", "dist/index.js" ]