# Simple Steam chat client for the terminal

Uses [node-steam](https://github.com/seishun/node-steam) and [blessed](https://github.com/chjj/blessed). This is a simple Steam chat client for the terminal, inspired by the likes of [irssi](https://irssi.org/).

**Note: Please update to a newer Node.js version if you get any weird errors. This project uses various ES2015 features which aren't supported in earlier Node.js releases.**

## [New Steam Chat](https://steamcommunity.com/updates/chatupdate)

As of [June 12th 2018](https://steamcommunity.com/games/593110/announcements/detail/1666776116222762142), Steam made available their new chat client through an open beta. Since then, any client not supporting the new API has been barred from joining group chats. This means that steam-chat doesn't work with group chats anymore, and will probably never again unless support for the new API is added to node-steam.

# Usage

You will need Node.js and npm (node package manager) installed on your system. Once you have those installed, run the following commands inside the directory.

```
npm install
npm start
```

Follow the on-screen instructions or documentation below to input your login credentials and connect to the Steam network.

## Login

All Steam login methods are supported. This includes with username and password, with guard code and sentry if Steam Guard via email is enabled and with two-factor code if Steam Guard via phone is enabled.

Your login credentials will be saved to `config.json` when you run `/save` or `/quit`, so the following steps need only to be done once.

### Standard authentication

```
/set username yourname
/set password yourpass
/connect
```

### Steam Guard via email (guard code)

Follow the steps for standard authentication. A Steam Guard email should be dispatched after your failed login. Once you receive your Steam Guard code:

```
/set guardcode yourcode
/connect
```

### Steam Guard via phone (two-factor mobile authenticator)

You can set your two-factor code immediately together with your username and password.

```
/set username yourname
/set password yourpass
/set twofactor yourcode
/connect
```

## Keybindings

Edit the `lib/keys.json` file if you wish to customize the keybindings. By default, the following keybindings are assigned:

- `pageup, M-v: scrollb`
- `pagedown, C-v: scrollf`
- `M-g: games`
- `M-u: scrolluser`
- `M-w: part`
- `C-c: quit`
- `M-1: w 1`
- `M-2: w 2`
- ...
- `M-9: w 9`
