FROM node:16.14.0-alpine3.15

RUN apk add --no-cache python3 zlib-dev alpine-sdk curl

RUN curl -f https://get.pnpm.io/v6.16.js | node - add --global pnpm

ENV NODE_ENV production
WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod

ADD index.js .
ADD utils.js .
ADD config.json .
ADD data data

EXPOSE 3000

CMD [ "node", "index.js" ]
