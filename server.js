const {
    getChatsMap,
    startBot,
    startApp
} = require('.');

getChatsMap()
    .then(startBot)
    .then(startApp)
    .catch(err => console.error(err));