// 4-digit OTP used for pickup verification (host shows this to the volunteer)
const generateOtp = () => String(Math.floor(1000 + Math.random() * 9000));

module.exports = generateOtp;
