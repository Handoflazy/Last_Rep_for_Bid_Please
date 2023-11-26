const db = require('./connect.js');

const fetchData = (queryString) => {
    return new Promise((resolve, reject) => {
        db.query(queryString, (error, results, fields) => {
            if (error) {
                console.error('Query error: ' + error.stack);
                reject(error);
                return;
            }
            resolve(results);
        });
    });
};

const servedDataFnc = async (queryString) => {
    try {
        const data = await fetchData(queryString);
        return data;
    } catch (error) {
        console.error('Error: ' + error.stack);
        return null;
    } /*finally {
        // Close the connection to the database
        db.end((err) => {
            if (err) {
                console.error('Error connection: ' + err.stack);
                return;
            }
            console.log('Closed the connection successfully!');
        });
    }*/
};

module.exports = servedDataFnc;