# Simple Steam chat client for the terminal

Written using [node-steam](https://github.com/seishun/node-steam) and [blessed](https://github.com/chjj/blessed). This is a simple Steam chat client for the terminal, inspired by the likes of [irssi](https://irssi.org/).

steam-chat is currently a work-in-progress. The goal is to create a complete replacement for the chat functionality of the Steam client, but I still have a long list of features to add and bugs to fix. However, the client is in a useable state. Feel free to leave any feedback with this in mind.

**Note: Only Node.js >= v4.1.1 is supported.**

# Version 0.1.0

steam-chat has been completely rewritten from scratch. If you're using a prior version, do not update with `git pull`, instead delete the directory and run a new `git clone` followed by `npm install`.

Note: While this version is not part of the main branch, it is still under development. As of the first commit, only the tests work.

# Usage

You will need Node.js and npm (node package manager) installed on your system. Once you have those installed, run the following commands inside the directory.

```
npm install
npm start
```

Follow the on-screen instructions to input your login credentials and connect to the Steam network.
