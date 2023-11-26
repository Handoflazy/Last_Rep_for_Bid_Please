const express = require('express');
const session = require('express-session');
const sharedSession = require('express-socket.io-session');
const app = express();
const port = 3000;
const { createServer } = require('node:http');
const { Server } = require('socket.io');
const connection = require('./database/connect.js');
const getData = require('./database/serve-data.js');
const getArrTime = require('./function/getArrTime.js');
const server = createServer(app);
const io = new Server(server);
const formatTime = require('./function/formatTimeForMsql.js');
const { insertBid, insertAuction } = require('./database/insertToDB.js');

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({
    extended: true
}))

app.use(express.static('public'));

const sessionMiddleware = session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
});

app.use(sessionMiddleware);

app.get('/', (req, res) => {
    getData('SELECT * FROM Products')
        .then((dataList) => {
            res.render('./index', { productList: dataList });
        })
        .catch((error) => {
            console.error('Error: ' + error.stack);
            res.sendStatus(500);
        });
})

app.get('/product', (req, res) => {
    let dataListTmp = null;
    getData('SELECT * FROM Products')
        .then((dataList) => {
            dataListTmp = dataList;
            return getData(`SELECT a.StartingPrice, a.CurrentPrice
                                FROM Auctions a
                                JOIN Products p ON a.AuctionID = p.AuctionID;`);
        })
        .then((otherDataList) => {
            res.render('./product', { productList: dataListTmp, otherDataList: otherDataList });
        })
        .catch((error) => {
            console.error('Error: ' + error.stack);
            res.sendStatus(500);
        });
});

app.get('/sign-in', (req, res) => {
    const isCorretTmp = true;
    res.render('./sign-in', { isCorrect: isCorretTmp });
});

app.post('/login', (request, response) => {
    let email = request.body.email;
    let password = request.body.password;
    if (email && password) {
        connection.query('SELECT * FROM users WHERE Email = ? AND Password = ?', [email, password], (error, results, fields) => {
            let isCorretTmp = false;
            if (error) throw error;
            if (results.length > 0) {
                isCorretTmp = true;
                // Authenticate the user
                request.session.isLoggedIn = true;
                request.session.email = email;
                request.session.userId = results[0].UserID;
                request.session.userName = results[0].Username;
                // Redirect to product page
                response.redirect('/product');
            } else {
                response.render('./sign-in', { isCorrect: isCorretTmp });
            }
            response.end();
        });
    } else {
        response.send('Please enter Username and Password!');
        response.end();
    }
});


app.get('/instance-page/:id', (req, res) => {
    let isLogginTmp = true;
    if (!req.session.isLoggedIn) {
        isLogginTmp = false;
        res.render(`./instance-page`, { isLoggin: isLogginTmp });
    } else {
        // Truy van cho tat ca thong tin chi tiet cua 1 product (cu the la Slider Image va Product Name and so on)
        connection.query(`SELECT * FROM products WHERE productID = ${req.params.id}`, (erro, results, fields) => {
            if (erro) {
                console.error('Query Error:', erro);
                return;
            }

            const productDetailsTmp = results;

            let secondQuery = `SELECT A.StartTime, A.EndTime, A.CurrentPrice
                           FROM Auctions A
                           JOIN Products P ON A.AuctionID = P.AuctionID
                           WHERE P.ProductID = ${req.params.id};`
            // Truy van va tinh toan cho thoi gian ket thuc cua 1 auction:
            connection.query(secondQuery, (err, results, fields) => {
                if (err) {
                    console.error('Query Error:', err);
                    return;
                }

                const arrTime = getArrTime(results);

                const currentBidTmp = results[0].CurrentPrice;

                // Truy Total Bids:
                let thirdQuery = `SELECT B.BidID, B.Timestamp, B.BidAmount, U.Username
                                FROM Bids B
                                JOIN Auctions A ON B.AuctionID = A.AuctionID
                                JOIN Products P ON A.AuctionID = P.AuctionID
                                JOIN Users U ON B.UserID = U.UserID
                                WHERE P.ProductID = ${req.params.id};`;

                connection.query(thirdQuery, (error, results, fields) => {
                    if (error) {
                        console.error('Query Error:', error);
                        return;
                    }

                    const biddingItemsTmp = results;

                    res.render('./instance-page', { productDetails: productDetailsTmp, timeRemainingVal: arrTime, currentBid: currentBidTmp, biddingItems: biddingItemsTmp, isLoggin: isLogginTmp });
                })

            });
        });
    }
});


// Kết nối Socket.IO với session middleware
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

io.on('connection', (socket) => {

    console.log("Client connected successfully!");


    // let userId = socket.request.session.userId;
    // let userName = socket.request.session.userName;

    // socket.userId = socket.request.session.userId;
    // socket.userName = socket.request.session.userName;

    // console.log(userId, userName);

    // console.log(socket.id);

    // Gui tra lai cho Client
    socket.on('bidding event', (biddingObjInfor) => {
        let userId = socket.request.session.userId;
        let userName = socket.request.session.userName;

        // const localUserId = userId;
        // const localUserName = userName;

        // console.log(localUserId);
        // console.log(localUserName);

        // console.log(socket.userId);
        // console.log(socket.userName);

        // Format lai thoi gian:
        biddingObjInfor.biddingTime = formatTime(biddingObjInfor.biddingTime);

        insertBid(biddingObjInfor.productID, userId, biddingObjInfor.biddingVal, biddingObjInfor.biddingTime)
            .then(() => {
                biddingObjInfor.userName = userName;
                return insertAuction(biddingObjInfor.productID, biddingObjInfor.biddingVal);
            })
            .then(() => {
                io.emit('recieveValues', biddingObjInfor);
            })
            .catch((error) => {
                console.error('Insert error', error);
            });
    })

});








// // Đối tượng lưu trữ thông tin người dùng
// const userStore = {};

// io.on('connection', (socket) => {
//     console.log("Client connected successfully!");

//     const key = socket.id;

//     const userId = socket.request.session.userId;
//     const userName = socket.request.session.userName;
//     console.log(userId, userName);
//     userStore[socket.id] = { userId: userId, userName: userName }

//     // Gui tra lai cho Client
//     socket.on('bidding event', (biddingObjInfor) => {
//         // const localUserId = socket.userId;
//         // const localUserName = socket.userName;

//         // const newKey = socket.id;

//         // console.log(newKey);
//         // console.log(userStore[newKey]);

//         // console.log(localUserId);
//         // console.log(localUserName);

//         // console.log(socket.id);

//         // Format lai thoi gian:
//         // biddingObjInfor.biddingTime = formatTime(biddingObjInfor.biddingTime);

//         // insertBid(biddingObjInfor.productID, localUserId, biddingObjInfor.biddingVal, biddingObjInfor.biddingTime)
//         //     .then(() => {
//         //         biddingObjInfor.userName = localUserName;
//         //         return insertAuction(biddingObjInfor.productID, biddingObjInfor.biddingVal);
//         //     })
//         //     .then(() => {
//         //         io.emit('recieveValues', biddingObjInfor);
//         //     })
//         //     .catch((error) => {
//         //         console.error('Insert error', error);
//         //     });
//     });

//     // Xử lý sự kiện khi client mất kết nối
//     // socket.on('disconnect', () => {
//     //     // Xóa thông tin người dùng khỏi đối tượng lưu trữ
//     //     // delete userStore[socket.id];
//     //     delete userStore.socket.id;
//     //     console.log("Client disconnected");
//     // });
// });

















// io.on('connection', (socket) => {
//     console.log("Client connected successfully!");
  
//     // Tạo closure ngoài cùng để lưu trữ giá trị userId và userName cho mỗi client
//     const createBiddingEventHandler = (userId, userName) => {
//       return (biddingObjInfor) => {
//         console.log(userId);
//         console.log(userName);
  
//         // Format lại thời gian:
//         biddingObjInfor.biddingTime = formatTime(biddingObjInfor.biddingTime);
  
//         insertBid(biddingObjInfor.productID, userId, biddingObjInfor.biddingVal, biddingObjInfor.biddingTime)
//           .then(() => {
//             biddingObjInfor.userName = userName;
//             return insertAuction(biddingObjInfor.productID, biddingObjInfor.biddingVal);
//           })
//           .then(() => {
//             io.emit('recieveValues', biddingObjInfor);
//           })
//           .catch((error) => {
//             console.error('Insert error', error);
//           });
//       };
//     };
  
//     // Lấy userId và userName từ session của client
//     const userId = socket.request.session.userId;
//     const userName = socket.request.session.userName;
  
//     console.log(userId, userName);
  
//     // Tạo sự kiện "bidding event" với closure đã tạo
//     const handleBiddingEvent = createBiddingEventHandler(userId, userName);
//     socket.on('bidding event', handleBiddingEvent);
  
//     // ...
//   });













// io.on('connection', (socket) => {
//     console.log("Client connected successfully!");
  
//     // Lấy userId và userName từ session của client
//     const userId = socket.request.session.userId;
//     const userName = socket.request.session.userName;
  
//     console.log(userId, userName);
  
//     // Tạo closure để lưu trữ giá trị userId và userName cho mỗi client
//     const handleBiddingEvent = (biddingObjInfor) => {
//       console.log(userId);
//       console.log(userName);
  
//       // Format lại thời gian:
//       biddingObjInfor.biddingTime = formatTime(biddingObjInfor.biddingTime);
  
//       insertBid(biddingObjInfor.productID, userId, biddingObjInfor.biddingVal, biddingObjInfor.biddingTime)
//         .then(() => {
//           biddingObjInfor.userName = userName;
//           return insertAuction(biddingObjInfor.productID, biddingObjInfor.biddingVal);
//         })
//         .then(() => {
//           io.emit('recieveValues', biddingObjInfor);
//         })
//         .catch((error) => {
//           console.error('Insert error', error);
//         });
//     };
  
//     // Đăng ký sự kiện 'bidding event' với closure đã tạo
//     socket.on('bidding event', handleBiddingEvent);
  
//     // ...
//   });


server.listen(3000, () => {
    console.log(`server running on port ${port}`);
});
