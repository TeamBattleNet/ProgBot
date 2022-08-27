FROM node:16-alpine
WORKDIR /app

RUN apk --no-cache add python3-dev musl-dev make g++ git
COPY package.json .
COPY yarn.lock .
RUN yarn --frozen-lockfile --non-interactive
COPY . .
CMD ["sh", "-c", "yarn lint && yarn build && yarn test"]
