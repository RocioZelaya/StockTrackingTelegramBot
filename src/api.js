async function getStockQuote(symbol) {
    const apiKey = 'DYLJ86VCHNZ78PLW'; // Replace with your Alpha Vantage API key
    const apiUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;

    try {
        const response = await axios.get(apiUrl);
        const data = response.data['Global Quote'];
        if (data) {
            return {
                symbol: data['01. symbol'],
                price: parseFloat(data['05. price']),
                change: parseFloat(data['09. change']),
                changePercent: parseFloat(data['10. change percent'].slice(0, -1)) // Remove '%' sign
            };
        } else {
            throw new Error('Invalid stock symbol');
        }
    } catch (error) {
        console.error('Error fetching stock quote:', error);
        throw error; 
    }
}