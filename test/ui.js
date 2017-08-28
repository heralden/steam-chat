var logger = require('../lib/logger');

var session = require('../lib/app')
  , ui = require('../lib/ui/ui')
  , cmd = require('../lib/ui/cmd')
  , steam = require('../lib/steam/steam');

cmd(["debug", 2]);

session.users = {
    '92837105728491852': { 
        persona_state: "offline", 
        player_name: "Gabe Newell", 
        game_name: ""
    },
    '90864320871438724': {
        persona_state: "ingame", 
        player_name: "Robin Walker", 
        game_name: "Age of Empires II HD Edition"
    },
    '93087430280872349': {
        persona_state: "online", 
        player_name: "IceFrog", 
        game_name: ""
    },
    '92934987123508759': {
        persona_state: "online", 
        player_name: "The Pink Cookie",
        game_name: ""
    },
    '93402347985239844': {
        persona_state: "ingame", 
        player_name: "Axel Gembe",
        game_name: "Board Game Simulator"
    },
};

session.friends = [ 
    '92837105728491852', 
    '90864320871438724',
    '93087430280872349'
];

session.clans = {
    '8294721957374875': {
        clan_name: "Steam Chat",
        user_count: 5,
        user_list: 5,
        members: {
            '92837105728491852': "owner",
            '90864320871438724': "officer",
            '93087430280872349': "moderator",
            '92934987123508759': "member",
            '93402347985239844': "nobody"
        }
    }
};

var userwin = require('../lib/ui/userwin');

setTimeout(() => {
    userwin.updateFriend();
    steam.emit(
        'message', 
        "92837105728491852",
        "Gabe Newell",
        "online",
        "ping"
    );
}, 500);

setTimeout(() => {
    userwin.updateGroup('8294721957374875');
}, 2000);
