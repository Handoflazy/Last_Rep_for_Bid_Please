const connection = require('./connect.js');

const insertBid = (productID, userID, bidAmount, biddingTime) => {
    // Truy vấn để lấy auction ID thông qua product ID
    const stringQuery = `SELECT A.AuctionID
                        FROM Auctions A
                        JOIN Products P ON A.AuctionID = P.AuctionID
                        WHERE P.ProductID = ${productID};`;

    return new Promise((resolve, reject) => {
        connection.query(stringQuery, (error, results, fields) => {
            if (error) {
                console.error("Query error: ", error);
                reject(error);
                return;
            }

            const auctionID = results[0].AuctionID;

            const query = `INSERT INTO Bids (AuctionID, UserID, BidAmount, Timestamp) VALUES (?, ?, ?, ?)`;
            const values = [auctionID, userID, bidAmount, biddingTime];

            connection.query(query, values, (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
            const lastQuery = 'SELECT * FROM bids ORDER BY BidAmount DESC';
            connection.query(query, values, (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    });
};


const insertAuction = (productId, currentPrice) => {
    const queryString = `UPDATE Auctions
                        SET CurrentPrice = ${currentPrice}
                        WHERE AuctionID = (
                        SELECT AuctionID
                        FROM Products
                        WHERE ProductID = ${productId}
                        );`;

    return new Promise((resolve, reject) => {
        connection.query(queryString, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
};


module.exports = {
    insertBid,
    insertAuction
};