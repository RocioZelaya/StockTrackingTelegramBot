// commands.js
const { getStockQuote } = require('./api');
const { addUser, addStockToPortfolio } = require('./database');

async function track(bot, msg, match) {
    const chatId = msg.chat.id;
    const symbol = match[1].toUpperCase();
    const telegramId = msg.from.id;  // Get the user's Telegram ID

    try {
        addUser(telegramId, (err) => {
            if (err) {
                console.error('Error adding user:', err);
                bot.sendMessage(chatId, 'An error occurred. Please try again later.');
                return;
            }
            db.get('SELECT id FROM users WHERE telegram_id = ?', [telegramId], (err, row) => {
                if (err) {
                    console.error('Error getting user ID:', err);
                    // ... handle error
                    return;
                }

                const userId = row.id;
                addStockToPortfolio(userId, symbol, null, null, (err) => {
                    // (We are setting the thresholds to null initially)
                    if (err) {
                        console.error('Error adding stock to portfolio:', err);
                        // ... handle error
                        return;
                    }
                    bot.sendMessage(chatId, `Stock ${symbol} added to your portfolio.`);
                });
            });
        });

        const quote = await getStockQuote(symbol);
        // ... (send the stock quote) 
    } catch (error) {
        bot.sendMessage(chatId, 'Invalid stock symbol or error adding to portfolio. Please try again.');
    }
}

async function portfolio(bot, msg) {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;

    db.get('SELECT id FROM users WHERE telegram_id = ?', [telegramId], async (err, row) => {
        if (err) {
            console.error('Error getting user ID:', err);
            bot.sendMessage(chatId, 'An error occurred. Please try again later.');
            return;
        }

        const userId = row.id;

        getPortfolio(userId, async (err, rows) => {
            if (err) {
                console.error('Error getting portfolio:', err);
                bot.sendMessage(chatId, 'An error occurred. Please try again later.');
                return;
            }

            if (rows.length === 0) {
                bot.sendMessage(chatId, 'Your portfolio is empty.');
                return;
            }

            let portfolioMessage = 'Your Portfolio:\n';
            for (const stock of rows) {
                try {
                    const quote = await getStockQuote(stock.symbol);
                    portfolioMessage += `${quote.symbol}: ${quote.price} (${quote.changePercent}%)\n`;
                } catch (error) {
                    portfolioMessage += `${stock.symbol}: Error fetching data\n`;
                }
            }
            bot.sendMessage(chatId, portfolioMessage);
        });
    });
}

async function alerts(bot, msg, match) {
    const chatId = msg.chat.id;
    const args = match[1].split(' '); // Split arguments (symbol, min, max)
    if (args.length !== 3) {
        bot.sendMessage(chatId, 'Invalid format. Use: /alerts <symbol> <min_price> <max_price>');
        return;
    }

    const symbol = args[0].toUpperCase();
    const minPrice = parseFloat(args[1]);
    const maxPrice = parseFloat(args[2]);
    const telegramId = msg.from.id; // Get the user's Telegram ID

    // ... (Get user ID using db.get, similar to how it's done in track and portfolio)

    // Update thresholds in the database
    db.run('UPDATE tracked_stocks SET min_price = ?, max_price = ? WHERE user_id = ? AND symbol = ?',
        [minPrice, maxPrice, userId, symbol], (err) => {
            if (err) {
                console.error('Error updating alert thresholds:', err);
                bot.sendMessage(chatId, 'An error occurred. Please try again later.');
            } else {
                bot.sendMessage(chatId, `Alert thresholds updated for ${symbol}.`);
            }
        });
}

async function checkAlerts() {
    db.all('SELECT * FROM tracked_stocks', [], async (err, rows) => {
        if (err) {
            console.error('Error fetching tracked stocks:', err);
            return;
        }

        for (const stock of rows) {
            try {
                const quote = await getStockQuote(stock.symbol);
                const chatId = stock.user_id;  // Assuming we store Telegram user ID directly for simplicity

                if (stock.min_price && quote.price < stock.min_price) {
                    bot.sendMessage(chatId, `Alert: ${quote.symbol} price (${quote.price}) is below your minimum threshold (${stock.min_price}).`);
                }
                if (stock.max_price && quote.price > stock.max_price) {
                    bot.sendMessage(chatId, `Alert: ${quote.symbol} price (${quote.price}) is above your maximum threshold (${stock.max_price}).`);
                }
            } catch (error) {
                console.error(`Error processing alert for ${stock.symbol}:`, error);
            }
        }
    });
}

async function untrack(bot, msg, match) {
    const chatId = msg.chat.id;
    const symbol = match[1].toUpperCase();
    const telegramId = msg.from.id;

    db.get('SELECT id FROM users WHERE telegram_id = ?', [telegramId], (err, row) => {
        if (err) {
            console.error('Error getting user ID:', err);
            bot.sendMessage(chatId, 'An error occurred. Please try again later.');
            return;
        }
        const userId = row.id;

        removeStockFromPortfolio(userId, symbol, (err) => {
            if (err) {
                console.error('Error removing stock from portfolio:', err);
                bot.sendMessage(chatId, 'An error occurred. Please try again later.');
            } else {
                bot.sendMessage(chatId, `Stock ${symbol} removed from your portfolio.`);
            }
        });
    });
}

async function updatealerts(bot, msg, match) {
    const chatId = msg.chat.id;
    const args = match[1].split(' ');
    if (args.length !== 3) {
        bot.sendMessage(chatId, 'Invalid format. Use: /updatealerts <symbol> <min_price> <max_price>');
        return;
    }

    const symbol = args[0].toUpperCase();
    const minPrice = parseFloat(args[1]);
    const maxPrice = parseFloat(args[2]);
    const telegramId = msg.from.id;

    // ... (Get user ID using db.get, similar to how it's done in track and portfolio)
    updateAlertThresholds(userId, symbol, minPrice, maxPrice, (err) => {
        if (err) {
            console.error('Error updating alert thresholds:', err);
            bot.sendMessage(chatId, 'An error occurred. Please try again later.');
        } else {
            bot.sendMessage(chatId, `Alert thresholds updated for ${symbol}.`);
        }
    });
}

module.exports = {
    checkAlerts,
    alerts,
    portfolio,
    untrack,
    updatealerts
};