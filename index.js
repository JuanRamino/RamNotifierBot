require('dotenv').config();

const util = require('util');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const {nanoid} = require('nanoid');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

let chatsMap = {};
const CHATS_MAP_CACHE = './chats_map.json';
const {
    TG_TOKEN,
    PORT,
    API_END_POINT
} = process.env;

const apiKeyRegistered = (chatId) => {
    for (const apiKey of Object.keys(chatsMap)) {
        if (chatsMap[apiKey] === chatId) {
            return apiKey;
        }
    }
};

const removeChat = async (chatId) => {
    for (const apiKey of Object.keys(chatsMap)) {
        if (chatsMap[apiKey] === chatId) {
            delete chatsMap[apiKey];
        }
    }
    await syncChatsMapCache();
};

const syncChatsMapCache = async () => {
    try {
        await writeFile(CHATS_MAP_CACHE, JSON.stringify(chatsMap));
    }
    catch (err) {
        console.error(err);
    }
};

const handleSendMessageError = async (err, chatId) => {
    console.error(`Error on chat ${chatId}, ${err.message}`);

    if (/chat not found/.test(err.message)) {
        await removeChat(chatId);
    }
}

const startBot = async () => {
    const bot = new TelegramBot(TG_TOKEN, {polling: true});

    bot.onText(/\/start/, async (msg) => {
        const curentChatId = msg.chat.id;
        let apiKey = nanoid();
        const oldApiKey = apiKeyRegistered(curentChatId);
        
        if (oldApiKey) {
            delete chatsMap[oldApiKey];
        }

        chatsMap[apiKey] = curentChatId;
        syncChatsMapCache();

        try {
            await bot.sendMessage(curentChatId, 'Your api key is:');
            await bot.sendMessage(curentChatId, `${apiKey}`);
            await bot.sendMessage(curentChatId, 'Try it:');
            await bot.sendMessage(curentChatId, `\`curl --request GET 'https://${API_END_POINT}/send-notification?message=simple_message_please' --header 'x-api-key: ${apiKey}'\``, {parse_mode : 'markdown'});
        }
        catch (err) {
            console.error(err);
        }
    });

    return bot;
};

const startApp = (bot) => new Promise((resolve) => {
    const app = express();

    app.get('/send-notification', async (req, res) => {
        try {
            const chatId = chatsMap[req.headers['x-api-key']];

            if (!chatId) {
                return res.sendStatus(403);
            }

            const {message} = req.query;

            if (!message) {
                return res.sendStatus(400);
            }

            await bot
                .sendMessage(chatId, message)
                .catch((err) => handleSendMessageError(err, receiverChat));

            res.sendStatus(200);
        }
        catch (err) {
            console.error(err);
            res.sendStatus(500);
        }
    });

    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server listening at ${PORT}`);
        resolve();
    });
});

const getChatsMap = async () => {
    try {
        chatsMap = JSON.parse((await readFile(CHATS_MAP_CACHE)).toString());
    }
    catch (err) {
        console.error(err);
    }
};

getChatsMap()
    .then(startBot)
    .then(startApp)
    .catch(err => console.error(err));
