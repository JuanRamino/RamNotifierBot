# RamNotifierBot

Is a telegram bot that send notification to users when a webhook is called.
It's usefull when you have a long task running and you want to be notified when it is finished.

### Use
Create a .env file with your data (see env.dist for an example)
Run `npm run start`
Subscribe to the telegram bot as usual.
Send notification like this way:

`curl --request GET 'https://MY-ENDPOINT.COM/send-notification?message=simple_message_please' \
    --header 'x-api-key: API_KEY'`
