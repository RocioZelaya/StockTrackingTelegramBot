const TelegramBot = require('node-telegram-bot-api');
const { botToken } = require('./config');
const { track, portfolio, alerts, untrack, updatealerts, checkAlerts } = require('./commands');
const { db, addUser, addStockToPortfolio, getPortfolio, removeStockFromPortfolio, updateAlertThresholds } = require('./database');

const bot = new TelegramBot(botToken, { polling: true });

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    const keyboard = {
        inline_keyboard: [
            [
                { text: 'Track Stock', callback_data: '/track' },
                { text: 'View Portfolio', callback_data: '/portfolio' }
            ],
            [
                { text: 'Set Alerts', callback_data: '/alerts' },
                { text: 'Untrack Stock', callback_data: '/untrack' },
                { text: 'Update Alerts', callback_data: '/updatealerts' }
            ]
        ]
    };

    bot.sendMessage(chatId, 'Choose an action:', { reply_markup: keyboard });
});
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const command = query.data;

    // Check if the command requires additional arguments
    if (command === '/track' || command === '/alerts' || command === '/untrack' || command === '/updatealerts') {
        bot.sendMessage(chatId, `Please enter the command with arguments:\n${command} <stock_symbol> [min_price] [max_price]`);
    } else {
        switch (command) {
            case '/portfolio':
                portfolio(bot, query.message, db);
                break;
            // ... (Add cases for other commands if needed)
        }
    }
});
bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Use /track to add a stock, /portfolio to view your portfolio.');
});
bot.onText(/\/track (.+)/, (msg, match) => {
    track(bot, msg, match, db); // Call the track function from commands.js
});
bot.onText(/\/portfolio/, (msg) => {
    portfolio(bot, msg, db);
});
bot.onText(/\/alerts (.+)/, (msg, match) => {
    alerts(bot, msg, match, db);
});
bot.onText(/\/untrack (.+)/, (msg, match) => {
    untrack(bot, msg, match, db);
});
bot.onText(/\/updatealerts (.+)/, (msg, match) => {
    updatealerts(bot, msg, match, db);
});

setInterval(checkAlerts, 30 * 60 * 1000); // 5 minutes * 60 seconds/minute * 1000 milliseconds/second
