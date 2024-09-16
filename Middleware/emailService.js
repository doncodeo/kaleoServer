const nodemailer = require('nodemailer');

// Set up the Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use your email service
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Function to send registration confirmation email
const sendRegistrationConfirmation = async (user) => {
  const mailOptions = {
    from: `"Kaleo Gym 💪💪" <${process.env.EMAIL_USERNAME}>`,
    to: user.email,
    subject: 'Registration Confirmation',
    html: `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f0f0f0;
              color: #333;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
            }
            .header {
              background-color: #4CAF50;
              color: white;
              padding: 10px;
              text-align: center;
              border-top-left-radius: 8px;
              border-top-right-radius: 8px;
            }
            .content {
              padding: 20px;
            }
            .login-button {
              display: inline-block;
              padding: 10px 20px;
              background-color: #4CAF50;
              color: white;
              text-decoration: none;
              border-radius: 5px;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Welcome to Kaleo Gym!</h2>
            </div>
            <div class="content">
              <p>Dear ${user.username},</p>
              <p>Thank you for registering with Kaleo Gym! We're excited to have you on board.</p>
              <p>Please use the following button to log in to your account:</p>
              <a class="login-button" href="http://localhost:3000/login" target="_blank">Login to Your Account</a>
              <p>We look forward to helping you achieve your fitness goals.</p>
            </div>
            <div class="footer">
              <p>Best regards,</p>
              <p>The Kaleo Gym Team</p>
            </div>
          </div>
        </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Registration email sent successfully');
  } catch (error) {
    console.error('Error sending registration email:', error);
  }
};

// Function to send birthday email
const sendBirthdayEmail = async (user) => {
  const mailOptions = {
    from: `"Kaleo Gym 🎉🎉" <${process.env.EMAIL_USERNAME}>`,
    to: user.email,
    subject: 'Happy Birthday!',
    html: `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f0f0f0;
              color: #333;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
            }
            .header {
              background-color: #FF6347;
              color: white;
              padding: 10px;
              text-align: center;
              border-top-left-radius: 8px;
              border-top-right-radius: 8px;
            }
            .content {
              padding: 20px;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Happy Birthday, ${user.fullName}!</h2>
            </div>
            <div class="content">
              <p>Dear ${user.username},</p>
              <p>Wishing you a day filled with joy, laughter, and celebration. May your birthday be as wonderful as you are!</p>
              <p>Thank you for being a part of the Kaleo Gym family. We appreciate you!</p>
            </div>
            <div class="footer">
              <p>Best wishes,</p>
              <p>The Kaleo Gym Team</p>
            </div>
          </div>
        </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Birthday email sent successfully');
  } catch (error) {
    console.error('Error sending birthday email:', error);
  }
};

const passwordResetMail = async (user, resetURL) => {
    const mailOptions = {
      to: user.email,
      from: `"Kaleo Gym 💪💪" <${process.env.EMAIL_USERNAME}>`,
      subject: 'Password Reset Link',
      html: `
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f0f0f0;
                color: #333;
                padding: 20px;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
              }
              .header {
                background-color: #4CAF50;
                color: white;
                padding: 10px;
                text-align: center;
                border-top-left-radius: 8px;
                border-top-right-radius: 8px;
              }
              .content {
                padding: 20px;
              }
              .reset-button {
                display: inline-block;
                padding: 10px 20px;
                background-color: #4CAF50;
                color: white;
                text-decoration: none;
                border-radius: 5px;
              }
              .footer {
                margin-top: 20px;
                text-align: center;
                color: #666;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Password Reset Link</h2>
              </div>
              <div class="content">
                <p>You are receiving this email because you (or someone else) has requested the reset of the password for your account.</p>
                <p>Please click on the following button to reset your password:</p>
                <a class="reset-button" href="${resetURL}" target="_blank">Reset Password</a>
                <p>If you did not request this password reset, please take immediate action to secure your account by changing your password or contacting support.</p>
              </div>
              <div class="footer">
                <p>Thank you,</p>
                <p>The Kaleo Team</p>
              </div>
            </div>
          </body>
        </html>
      `
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log('Password reset email sent to:', user.email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
    }
};

const expiredSubscriptionMail = (user) => {
    const mailOptions = {
      from: `"Kaleo Gym 💪💪" <${process.env.EMAIL_USERNAME}>`,
      to: user.email,
      subject: 'Subscription Expired',
      html: `
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f0f0f0;
                color: #333;
                padding: 20px;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
              }
              .header {
                background-color: #FF6347;
                color: white;
                padding: 10px;
                text-align: center;
                border-top-left-radius: 8px;
                border-top-right-radius: 8px;
              }
              .content {
                padding: 20px;
              }
              .footer {
                margin-top: 20px;
                text-align: center;
                color: #666;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Subscription Expired</h2>
              </div>
              <div class="content">
                <p>Dear ${user.username},</p>
                <p>Your subscription has expired, or you Don't have any Active Subscription with us. Please log in to your dashboard to renew your subscription or contact our admin for further assistance.</p>
                <p>We look forward to having you back on board!</p>
              </div>
              <div class="footer">
                <p>Best regards,</p>
                <p>The Kaleo Gym Team</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });
  };
  
  
  
  

module.exports = {
  sendRegistrationConfirmation,
  sendBirthdayEmail,
  passwordResetMail,
  expiredSubscriptionMail

};
