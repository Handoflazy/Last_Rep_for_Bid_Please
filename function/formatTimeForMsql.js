const moment = require('moment');

const formatBiddingTime = (biddingTime) => {
    const formattedTime = moment(biddingTime).format('YYYY-MM-DD HH:mm:ss');
    return formattedTime;
}

module.exports = formatBiddingTime;
