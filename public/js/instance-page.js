// Slider of Product
const sliderContainer = document.querySelector('.slider-image-container');
const listCircle = document.querySelector('.list-circle');
const limit = sliderContainer.children.length;
const currentBidsElement = document.querySelector('.bidding-info > div:nth-child(2) > span:last-of-type');

let count = 0;

setInterval(() => {
    if (count == 5) {
        count = 0;
        sliderContainer.style.transform = `translateX(${count}%)`;
        for (const iterator of listCircle.children) {
            iterator.classList.remove('active');
        }
        listCircle.children[count].classList.add('active');
    } else {
        count++;
        sliderContainer.style.transform = `translateX(-${count * 100}%)`;

        for (const iterator of listCircle.children) {
            iterator.classList.remove('active');
        }
        listCircle.children[count].classList.add('active');
    }
}, 4000);
function showEmptyAlert() {
    Swal.fire({
        title: "Empty Bid",
        text: "Please Enter A Value",
        icon: "error"
    });
    
}

function showNoNaAlert(){
    Swal.fire({
        title: "Not A Number",
        text: "Value must be a Number",
        icon: "error"
    });
}
function showLowerAlert(){
    Swal.fire({
        title: "Lower Bid",
        text: "Value must be a higher than Current Bid ",
        icon: "error"
    });
}

// Style for time animation:
function extractTimeNumber(timeString) {
    const tString = timeString.toString().slice(0, -1);

    const t = parseInt(tString);

    return t;
}

function countdownTimer(hours, minutes, seconds, timeRemaining) {
    let totalSeconds = hours * 3600 + minutes * 60 + seconds;

    const interval = setInterval(() => {
        if (totalSeconds <= 0) {
            clearInterval(interval);
            console.log('Time out!');
            return;
        }

        totalSeconds--;

        const hoursRemaining = Math.floor(totalSeconds / 3600);
        const minutesRemaining = Math.floor((totalSeconds % 3600) / 60);
        const secondsRemaining = totalSeconds % 60;

        timeRemaining.children[0].innerHTML = hoursRemaining + 'h';
        timeRemaining.children[1].innerHTML = minutesRemaining + 'm';
        timeRemaining.children[2].innerHTML = secondsRemaining + 's';
    }, 1000);
}

const timeRemaining = document.querySelector('.bidding-info div:first-child > div');
const hour = extractTimeNumber(timeRemaining.children[0].innerHTML);
const minute = extractTimeNumber(timeRemaining.children[1].innerHTML);
const second = extractTimeNumber(timeRemaining.children[2].innerHTML);

countdownTimer(hour, minute, second, timeRemaining);


// Socket.io Event:
const biddingSection = document.querySelector('.bidding-place form');
const biddingValue = biddingSection.children[0].children[1];
const biddingButton = biddingSection.children[1];

const listBidding = document.querySelector('.list-bidding');
const productIddd = document.querySelector('.product-name > p');

biddingButton.addEventListener('click', (e) => {
    e.preventDefault();
    const currentBidValue = parseInt(currentBidsElement.innerHTML.trim());
    if (!biddingValue.value) {
        showAlert();
        return;
    } else {
        const newBidValue = parseInt(biddingValue.value);
        if (isNaN(newBidValue)) {
            showNoNaAlert();
            return;
        }
        
        if (newBidValue <= currentBidValue) {
            showLowerAlert();
            return;
        }
    }
   
    Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#1aff1a",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, Bid!"
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire({
            icon: "success",
            title: "Bid Success",
            showConfirmButton: false,
          });
    
          const biddingObjInfor = {
            productID: productIddd.classList.item(0),
            biddingTime: new Date(),
            biddingVal: parseInt(biddingValue.value)
          };
    
          socket.emit("bidding event", biddingObjInfor);
          biddingValue.value = "";
        }
      });
   
});


socket.on('recieveValues', (biddingObjInfor) => {
    const newElenment = document.createElement('div');
    newElenment.classList.add('lb-item');
    newElenment.innerHTML = `<img src="/img/icon.jpeg" alt="">
                                <div class="bidder-info">
                                    <p>
                                        ${biddingObjInfor.userName}
                                    </p>
                                    <p>
                                        ${biddingObjInfor.biddingTime}
                                    </p>
                                </div>
                                <div>
                                    ${biddingObjInfor.biddingVal}
                                </div>`;

    listBidding.prepend(newElenment);


    // Update for total bids:
    const totalBidsElement = document.querySelector('.bidding-info > div:nth-child(3) > span:last-of-type');
    console.log(totalBidsElement);
    totalBidsElement.innerHTML = (parseInt(totalBidsElement.innerHTML.trim()) + 1).toString();

    // Update for current bids:
    
    currentBidsElement.innerHTML = (biddingObjInfor.biddingVal).toString();
})

 