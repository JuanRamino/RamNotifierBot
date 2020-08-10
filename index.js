require('dotnev').config();

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

let chatIds = [];

const startBot = async () => {
    const bot = new TelegramBot(TOKEN, {polling: true});

    bot.on(/\/start/, async (msg) => {
        const curentChatId = msg.chat.id;

        if (chatIds.indexOf(curentChatId) === -1) {
            try{
                await writeFile(CHAT_IDS_FILE, curentChatId, {
                    flag: 'a'
                });
            }
            catch (err) {
                console.error(err);
            }

            chatIds.push(curentChatId);
        }

        try {
            await bot.sendMessage(curentChatId, 'Subscribed to notification');
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

            const message = req.query.message;

            if (!message) {
                return res.sendStatus(400); 
            }

            await Promise.all(chatIds.map((chatId) => bot.sendMessage(chatId, message)));

            res.sendStatus(200);
        }
        catch (err) {
            console.error(err);
            res.sendStatus(500);
        }
    });

    app.listen(PORT, '0.0.0.0', resolve);
});

const getChatIds = async () => {
    try {
        chatIds = (await readFile(CHAT_IDS_FILE)).split('\n');
    }
    catch (err) {
        console.error(err);
    }
};

getChatIds()
    .then(startBot)
    .then(startApp)
    .catch(err => console.error(err));
