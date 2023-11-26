const getArrTime = (results) => {
    const endTime = results[0].EndTime;

    const endHour = endTime.getHours();
    const endMinute = endTime.getMinutes();
    const endSecond = endTime.getSeconds();

    // console.log(`End Time: ${endHour}:${endMinute}:${endSecond}`);

    const currentTime = new Date();

    const timeRemaining = endTime - currentTime;

    const remainingHours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const remainingMinutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const remainingSeconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    const arrTime = [
        remainingHours,
        remainingMinutes,
        remainingSeconds
    ];

    return arrTime;
}

module.exports = getArrTime;