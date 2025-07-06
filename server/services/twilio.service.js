const twilio = require('twilio');

const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const TwilioService = {
    sendOTP: async (toNumber, otp) => {
        try {
            const message = await twilioClient.messages.create({
                body: `Your OTP is: ${otp}. This OTP will expire in 15 minutes.`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: toNumber
            });
            return message;
        } catch (error) {
            console.error('Error sending OTP:', error);
            throw error;
        }
    }
};

module.exports = TwilioService;
