FROM node:14-alpine
WORKDIR /app

COPY package.json .
COPY yarn.lock .
RUN yarn --frozen-lockfile --non-interactive
COPY . .
CMD ["sh", "-c", "yarn lint && yarn build && yarn test"]
