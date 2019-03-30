FROM node:11

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

WORKDIR /workdir/server
CMD node dist/server/index.js
