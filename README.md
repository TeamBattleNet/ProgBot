# ProgBot 2.0

This repository contains the source code for TeamBN's progbot revival.

## Configuration

This project requires a configuration file `runtime/config.json` in the working directory of the application.

The schema of this configuration file is as follows:

```javascript
{
  "database": "runtime/progbot.db", // desired location of the sqlite3 db
  "http_bind": "0.0.0.0",
  "http_port": 32043,
  "discord_token": "someTokenForADiscordBot",
  "discord_bot_cmd_prefix": "!",
  // for twitch auth details, view this for more info: https://d-fischer.github.io/twitch-chat-client/docs/examples/basic-bot.html
  "twitch_app_client_id": "appClientID",
  "twitch_app_client_secret": "appClientSecret",
  "twitch_bot_access_token": "botOauthAccessToken",
  "twitch_bot_refresh_token": "botOauthRefreshToken",
  "twitch_bot_cmd_prefix": "!",
  "url_base": "https://my.site.com/" // used for callback when granting twitch oauth
}
```

## Development

This project uses nodejs 20+ with typescript and the [yarn](https://classic.yarnpkg.com) package manager.

After cloning, run `yarn` to install the dependencies. If this is the first time running the application,
(or first time since db models/schemas have been updated), database migrations need to run in order to
configure the database appropriately. This can be done by running `yarn migration:run`.

Once this is done, it can be started for development using `yarn start-dev`.

Docker can also be used for development if you would rather not install those dependencies locally.

`docker build . -t whatever` will build the application. Run it with `docker run -it -v $(pwd)/runtime:/app/runtime whatever`.
This does not require running the migrations seperately, as the docker container will do that automatically.
