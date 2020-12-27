FROM node:14.15.3

# Create app directory
WORKDIR /app
ADD . /app/

RUN yarn

ENV NODE_ENV production

EXPOSE 3000

# start command
CMD [ "yarn", "start" ]
