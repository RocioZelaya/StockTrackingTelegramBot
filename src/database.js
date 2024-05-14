const sqlite3 = require('sqlite3').verbose();

function connectToDatabase() {
    return new sqlite3.Database('stocktracker.db', (err) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log('Connected to the stocktracker database.');
        }
    });
}

const db = connectToDatabase();

db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER UNIQUE NOT NULL
)`);

db.run(`CREATE TABLE IF NOT EXISTS tracked_stocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    symbol TEXT NOT NULL,
    min_price REAL,
    max_price REAL,
    FOREIGN KEY(user_id) REFERENCES users(id)
)`);

function addUser(telegramId, callback) {
    db.run('INSERT OR IGNORE INTO users(telegram_id) VALUES (?)', [telegramId], callback);
}

function addStockToPortfolio(userId, symbol, minPrice, maxPrice, callback) {
    db.run('INSERT INTO tracked_stocks(user_id, symbol, min_price, max_price) VALUES (?, ?, ?, ?)',
        [userId, symbol, minPrice, maxPrice], callback);
}

function getPortfolio(userId, callback) {
    db.all('SELECT * FROM tracked_stocks WHERE user_id = ?', [userId], callback);
}

function removeStockFromPortfolio(userId, symbol, callback) {
    db.run('DELETE FROM tracked_stocks WHERE user_id = ? AND symbol = ?', [userId, symbol], callback);
}

function updateAlertThresholds(userId, symbol, minPrice, maxPrice, callback) {
    db.run('UPDATE tracked_stocks SET min_price = ?, max_price = ? WHERE user_id = ? AND symbol = ?',
        [minPrice, maxPrice, userId, symbol], callback);
}

module.exports = {
    addUser,
    addStockToPortfolio,
    getPortfolio,
    removeStockFromPortfolio,
    updateAlertThresholds,
    db
  }; 