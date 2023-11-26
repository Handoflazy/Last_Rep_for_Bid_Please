
// const loginSection = document.querySelector('.login-section');
const loginSect = document.querySelector('.form-box.login');
const registerSect = document.querySelector('.form-box.register')
const loginLink = document.querySelector('.login-link');
const registerLink = document.querySelector('.register-link');

loginLink.addEventListener('click', () => {
    loginSect.classList.remove('active');
    registerSect.classList.remove('active');
})



registerLink.addEventListener('click', () => {
    loginSect.classList.add('active');
    registerSect.classList.add('active');
})