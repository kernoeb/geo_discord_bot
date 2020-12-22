FROM node:14

# Create app directory
WORKDIR /app
ADD . /app/

RUN yarn
RUN yarn build

ENV NODE_ENV production

EXPOSE 3000

# start command
CMD [ "yarn", "start" ]
