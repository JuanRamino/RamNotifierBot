# RamNotifierBot

Is a simple Notification system based on express.js and a telegram bot.
When a webhook is called, the bot send a notification to chat members.

### Run

Create a .env file with your data (see env.dist for an example)
Run `npm run start`

### Use

Subscribe to the telegram bot as usual an you'll get an API_KEY.
Send notification like this way:

`curl --request GET 'https://MY-ENDPOINT.COM/send-notification?message=simple_message_please&' \
    --header 'x-api-key: API_KEY'`

### Demo

You can try a demo at [https://t.me/RamNotifier](https://t.me/RamNotifier)
