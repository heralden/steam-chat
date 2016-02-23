# Simple Steam chat client for the terminal

Written using [node-steam](https://github.com/seishun/node-steam) and [blessed](https://github.com/chjj/blessed). This is a simple Steam chat client for the terminal, inspired by the likes of [irssi](https://irssi.org/).

steam-chat is currently a work-in-progress. The goal is to create a complete replacement for the chat functionality of the Steam client, but I still have a long list of features to add and bugs to fix. However, the client is in a useable state. Feel free to leave any feedback with this in mind.

**Note: Only Node.js >= v4.1.1 is supported.**

# Usage

You will need Node.js and npm (node package manager) installed on your system. Once you have those installed, run the following commands inside the directory.

```
npm install
npm start
```

Follow the on-screen instructions to input your login credentials and connect to the Steam network.

# Keybindings

Edit the `keys.js` file if you wish to customize the keybindings. By default, the following keybindings are assigned:

- `pageup, M-v: scrollb`
- `pagedown, C-v: scrollf`
- `M-w: part`
- `M-g: games`
- `M-1: w 1`
- `M-2: w 2`
- ...
- `M-9: w 9`
