FROM node:14-alpine3.15

WORKDIR /app
ADD . /app/

ENV NODE_ENV production
RUN yarn install --production

EXPOSE 3000

CMD [ "yarn", "start" ]
