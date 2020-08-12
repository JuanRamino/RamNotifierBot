require('dotenv').config();

const util = require('util');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const {
    CHAT_IDS_FILE,
    TOKEN,
    API_KEY,
    PORT
} = process.env;

let chatsMap = {};

const getUserChats = (firstName) => {
    const chatIds = [];

    for (const id of Object.keys(chatsMap)) {
        if (chatsMap[id].toLowerCase() === firstName.toLowerCase()) {
            chatIds.push(id);
        }
    }

    return chatIds;
};

const removeChat = async (chatId) => {
    delete chatsMap[chatId];
    await syncChatsMap();
};

const syncChatsMap = async () => {
    try {
        await writeFile(CHAT_IDS_FILE, JSON.stringify(chatsMap));
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
    const bot = new TelegramBot(TOKEN, {polling: true});

    bot.onText(/\/start/, async (msg) => {
        const curentChatId = msg.chat.id;
        const firstName = msg.chat.first_name

        if (!chatsMap[curentChatId]) {
            chatsMap[curentChatId] = firstName;
            await syncChatsMap();
        }

        try {
            await bot.sendMessage(curentChatId, `Subscribed to notifications from ${firstName} `);
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
            if (req.headers['x-api-key'] !== API_KEY) {
                return res.sendStatus(403);
            }

            const {message, from} = req.query;

            if (!message || !from) {
                return res.sendStatus(400);
            }

            const receiverChats = getUserChats(from);

            if (!receiverChats.length) {
                return res.sendStatus(404);
            }

            await Promise.all(receiverChats
                .map((chatId) => bot
                    .sendMessage(chatId, message)
                    .catch((err) => handleSendMessageError(err, chatId))));

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
        chatsMap = JSON.parse(await readFile(CHAT_IDS_FILE).toString());
    }
    catch (err) {
        console.error(err);
    }
};

getChatsMap()
    .then(startBot)
    .then(startApp)
    .catch(err => console.error(err));
