FROM node:12 AS builder

RUN mkdir -p /workdir/server
RUN mkdir -p /workdir/client

COPY server/package*.json /workdir/server/

WORKDIR /workdir/server
RUN npm install

COPY client/package*.json /workdir/client/

WORKDIR /workdir/client
RUN npm install

COPY common/ /workdir/common/

COPY server/ /workdir/server/
WORKDIR /workdir/server
RUN ./node_modules/.bin/tsc

COPY client/ /workdir/client/
WORKDIR /workdir/client
RUN npm run build
RUN npm run tailwind

WORKDIR /workdir/server
CMD /workdir/server/docker-start.sh

FROM node:12-alpine as intermediate
COPY --from=builder /workdir/server/node_modules/ /root/node_modules
RUN npm prune --production

FROM node:12-alpine AS runner

ENV NODE_ENV=production
RUN mkdir -p /workdir/server
RUN mkdir -p /workdir/client

COPY docker-start.sh /workdir/server

COPY --from=builder /workdir/server/package*.json /workdir/server/
COPY --from=builder /workdir/server/dist /workdir/server/dist

COPY --from=builder /workdir/client/public /workdir/client/public

WORKDIR /workdir/server
COPY --from=intermediate /root/node_modules/ /workdir/server/node_modules/

CMD /workdir/server/docker-start.sh
