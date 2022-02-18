FROM node:14-alpine3.15

RUN apk add python3 zlib-dev alpine-sdk

WORKDIR /app

ADD index.js .
ADD utils.js .
ADD config.json .
ADD data data

ADD package.json .
ADD yarn.lock .

ENV NODE_ENV production
RUN yarn install --production

EXPOSE 3000

CMD [ "yarn", "start" ]
