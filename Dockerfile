FROM node:12 AS builder-server

RUN mkdir -p /workdir/server

COPY server/package*.json /workdir/server/
WORKDIR /workdir/server
RUN npm install

COPY common/ /workdir/common/
COPY server/ /workdir/server/
WORKDIR /workdir/server
RUN ./node_modules/.bin/tsc
COPY docker-start.sh /workdir/server

FROM node:12 as builder-client
RUN mkdir -p /workdir/client
COPY client/package*.json /workdir/client/
WORKDIR /workdir/client
RUN npm install

COPY client/ /workdir/client/
WORKDIR /workdir/client
RUN npm run build
RUN npm run tailwind

FROM node:12 as dev
COPY --from=builder-server /workdir/server /workdir/server
COPY --from=builder-client /workdir/client /workdir/client

FROM node:12-alpine as prod-intermediate
COPY --from=builder-server /workdir/server/node_modules/ /root/node_modules
RUN npm prune --production

FROM node:12-alpine AS prod

ENV NODE_ENV=production
RUN mkdir -p /workdir/server
RUN mkdir -p /workdir/client

COPY docker-start.sh /workdir/server

COPY --from=builder-server /workdir/server/package*.json /workdir/server/
COPY --from=builder-server /workdir/server/dist /workdir/server/dist

COPY --from=builder-client /workdir/client/public /workdir/client/public

WORKDIR /workdir/server
COPY --from=prod-intermediate /root/node_modules/ /workdir/server/node_modules/

CMD sh /workdir/server/docker-start.sh
