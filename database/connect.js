const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'project-1'
});

connection.connect((err) => {
    if (err) {
        console.error('Connecting error: ' + err.stack);
        return;
    }
    console.log('Connect to the database is successfully!');
});


module.exports = connection;