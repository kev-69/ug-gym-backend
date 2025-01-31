const nodemailer = require('nodemailer');

const sendEmail = async (email, subject, message, htmlMessage) => {
    const transporter = nodemailer.createTransport({
        host: process.env.MAILSEND_SMTP_HOST, // Your MailSend SMTP host
        port: process.env.MAILSEND_SMTP_PORT, // Your MailSend SMTP port
        secure: false,
        auth: {
            user: process.env.MAILSEND_SMTP_LOGIN, // Your MailSend SMTP login
            pass: process.env.MAILSEND_SMTP_PASSWORD // Your MailSend SMTP password
        }
    });
    
    const mailOptions = {
        from: process.env.MAILSEND_SMTP_LOGIN, // Your verified MailSend email
        to: email,
        subject: subject,
        // text: message,
        html: htmlMessage,
        // headers: {
        //     'Content-Type': 'text/html; charset=utf-8',
        // },
    };
    
    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

module.exports = sendEmail;