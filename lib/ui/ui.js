module.exports = {

    connected() {},
    disconnected() {},

    rejoinGroupChats() {},
    autojoinGroupChats() {},

    isTyping(steamID, user, persona) {},
    message(steamID, user, persona, msg) {},
    groupMessage(chatID, user, persona, msg) {},
    log(msg) {},

    enteredChat(chatID) {},
    activity(chatID, persona, user, actorUser) {}

};
