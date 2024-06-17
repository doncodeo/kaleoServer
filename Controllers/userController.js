const asyncHandler = require('express-async-handler');
const userData = require('../Models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
// const paypal = require('paypal-rest-sdk');
const subscriptionData = require('../Models/subscriptionModel');
const crypto = require('crypto');



function isValidEmail(email) {
  // Regular expression for email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}  

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});


const registerUser = asyncHandler(async (req, res) => {
  try {
    const { username, email, password, fullName, DOB, gender, phoneNumber, address, subscription } = req.body;

    // Check if all required fields are provided
    if (!username || !email || !password || !fullName || !phoneNumber || !subscription) {
      return res.status(400).json({ error: 'Important fields missing!' });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email' });
    }

    // Check for existing user by email or username
    const userExistByEmail = await userData.findOne({ email });
    const userExistByUsername = await userData.findOne({ username });

    if (userExistByEmail) {
      return res.status(400).json({ error: "User already exists with this email." });
    }
 
    if (userExistByUsername) {
      return res.status(400).json({ error: "User already exists with this username." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Fetch the subscription details from the database
    const subscriptionDetails = await subscriptionData.findById(subscription);

    if (!subscriptionDetails) {
      return res.status(400).json({ error: 'Invalid subscription' });
    }

    // Calculate start and end dates based on subscription duration
    const startDate = new Date();
    const endDate = new Date(startDate);
    switch (subscriptionDetails.duration) {
      case '1 day':
        endDate.setDate(endDate.getDate() + 1);
        break;
      case '1 month':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case '3 months':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case '6 months':
        endDate.setMonth(endDate.getMonth() + 6);
        break;
      case '1 year':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      default:
        throw new Error('Invalid subscription duration');
    }

    // Create user with subscription details
    const user = await userData.create({
      username,
      email,
      password: hashedPassword,
      fullName,
      DOB,
      gender,
      phoneNumber,
      address,
      subscriptions: [{
        subscriptionId: subscriptionDetails._id,
        startDate,
        endDate,
        status: 'inactive' // Default status is 'inactive'
      }]
    });

    if (!user) {
      return res.status(400).json({ error: 'Failed to create user' });
    }

    console.log('User created:', user.email);

    // Send confirmation email
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
    

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    res.status(201).json({ user });

  } catch (error) {
    console.error('Error registering user:', error);
    if (error.code === 11000) {
      // MongoDB duplicate key error
      if (error.keyPattern.email) {
        return res.status(400).json({ error: "User already exists with this email." });
      }
      if (error.keyPattern.username) {
        return res.status(400).json({ error: "User already exists with this username." });
      }
    }
    res.status(500).json({ error: 'Server error' });
  }
});


const createUser = asyncHandler(async (req, res) => {
  try {
    const { username, email, password, fullName, DOB, gender, phoneNumber, address, role, subscription } = req.body;

    // Check if all required fields are provided
    if (!username || !email || !password || !fullName || !DOB || !gender || !phoneNumber || !role || !subscription) {
      return res.status(400).json({ error: 'Important fields missing!' });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email' });
    }

    // Check for existing user by email or username
    const userExistByEmail = await userData.findOne({ email });
    const userExistByUsername = await userData.findOne({ username });

    if (userExistByEmail) {
      return res.status(400).json({ error: "User already exists with this email." });
    }

    if (userExistByUsername) {
      return res.status(400).json({ error: "User already exists with this username." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await userData.create({
      username,
      email,
      password: hashedPassword,
      fullName,
      DOB,
      gender,
      phoneNumber,
      address,
      role, // Set role provided by admin
      subscription, // Set subscription provided by admin
    });

    if (!user) {
      return res.status(400).json({ error: 'Failed to create user' });
    }

    console.log('User created:', user.email);

    // Send confirmation email
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
              .footer {
                margin-top: 20px;
                text-align: center;
                color: #666;
                font-size: 12px;
              }
              .button {
                display: inline-block;
                background-color: #4CAF50;
                color: white;
                text-decoration: none;
                padding: 10px 20px;
                border-radius: 5px;
                margin-top: 15px;
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
                <p>Thank you for registering with Kaleo Gym! Your account has been successfully created.</p>
                <p>Please click the button below to log in to your account:</p>
                <a href="http://yourfrontendurl/login" class="button">Log In</a>
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

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    res.status(201).json({ user });

  } catch (error) {
    console.error('Error creating user:', error);

    if (error.code === 11000) {
      // MongoDB duplicate key error
      if (error.keyPattern.email) {
        return res.status(400).json({ error: "User already exists with this email." });
      }
      if (error.keyPattern.username) {
        return res.status(400).json({ error: "User already exists with this username." });
      }
    }

    res.status(500).json({ error: 'Server error' });
  }
});



const getUsers = asyncHandler(async (req, res) => {
  try {
    const users = await userData.find().populate('subscriptions.subscriptionId', 'name duration price');

    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

const getUsersBySubscription = asyncHandler(async (req, res) => {
  try {
    const subscriptionId = req.params.id;

    // Check if the subscription exists
    const subscription = await subscriptionData.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Find users with this subscription
    const users = await userData.find({ 'subscriptions.subscriptionId': subscriptionId })
                                .populate('subscriptions.subscriptionId', 'name duration price')
                                .select('_id username email');

    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'No users found for this subscription' });
    }

    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

const loginUser = asyncHandler(async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Check if identifier (email or username) and password are provided
    if (!identifier || !password) {
      res.status(400).json({ error: 'Please provide email/username and password' });
      return;
    };

    // Check if the identifier is a valid email
    if (isValidEmail(identifier)) {
      // Check if the user exists by email
      const user = await userData.findOne({ email: identifier });

      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      // Check if the password is correct
      const isPasswordMatch = await bcrypt.compare(password, user.password);

      if (!isPasswordMatch) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      // Generate JWT token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });

      res.status(200).json({
        status: 'success',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } else {
      // Assuming the identifier is a username
      // Check if the user exists by username
      const user = await userData.findOne({ username: identifier });

      if (!user) {
        res.status(401).json({ error: 'Invalid username or password' });
        return;
      }

      // Check if the password is correct
      const isPasswordMatch = await bcrypt.compare(password, user.password);

      if (!isPasswordMatch) {
        res.status(401).json({ error: 'Invalid username or password' });
        return;
      }

      // Generate JWT token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
      });

      res.status(200).json({
        status: 'success',
        id: user._id,
        token,
        user: {
          // id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    }
  } catch (error) {
    console.error(error); // Log any errors to the console for debugging
    res.status(500).json({ error: 'Server error' });
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  // Clear the token from the client-side (e.g., delete it from cookies, local storage, etc.)
 
  //Clear JWT tokens stored in cookies:
  res.clearCookie('token');
  
  res.status(200).json({ success: true, message: 'Logout successful' });
});

const deleteUser = asyncHandler(async (req, res) => {
  try {
    // Get the user ID from request parameters
    const userId = req.params.id;

    // Check if the user exists
    const user = await userData.findById(userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Perform the deletion
    await userData.findByIdAndDelete(userId);

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

const updateUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const updates = req.body;

  try {
    // Find the user by ID
    let user = await userData.findById(userId);

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Exclude sensitive fields from updates (e.g., password)
    if (updates.password) {
      delete updates.password; // Ensure password is not updated directly
    }

    // Update user fields
    for (const key in updates) {
      user[key] = updates[key];
    }

    // Save the updated user
    user = await user.save();

    // Omit sensitive fields from response (e.g., password)
    user.password = undefined;

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

const updatePassword = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const { newPassword } = req.body;

  try {
    // Find the user by ID
    const user = await userData.findById(userId);

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user's password
    user.password = hashedPassword;
    await user.save();

    // Omit password field from response
    user.password = undefined;
    
     // Send reset email
     const mailOptions = {
      to: user.email,
      from: `"Kaleo Gym 💪💪" <${process.env.EMAIL_USERNAME}>`,
      subject: 'Password Reset Confirmation',
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
                <h2>Password Reset Confirmation</h2>
              </div>
              <div class="content">
                <p>Dear ${user.username},</p>
                <p>Your password for your Kaleo account has been successfully updated.</p>
                <p>If you did not initiate this change, please contact our support team immediately.</p>
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
    
    

  await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Route to initiate password reset (send reset link to email)
const initiatePasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Find user by email
  const user = await userData.findOne({ email });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Generate password reset token (unique and short-lived)
  const resetToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiry

  // Save user with reset token and expiry
  await user.save();

  // Send reset email
  const resetURL = `http://localhost:3000/reset/${resetToken}`; // Replace with your frontend reset URL

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
  

  await transporter.sendMail(mailOptions);

  res.status(200).json({ success: true, message: 'Password reset link sent to your email' });
});

// Route to handle password reset request
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  // Find user by reset token and check expiry
  const user = await userData.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({ error: 'Password reset token is invalid or has expired' });
  }

  // Hash the new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update user's password and clear reset token fields
  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  // Save updated user
  await user.save();

  // Optionally, send an email notifying the user of password change
  const mailOptions = {
    from: `"Kaleo Gym 💪💪" <${process.env.EMAIL_USERNAME}>`,
    to: user.email,
    subject: 'Your Password Has Been Changed',
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
              <h2>Your Password Has Been Changed</h2>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>This is a confirmation that the password for your account <strong>${user.email}</strong> has just been changed.</p>
              <p>If you did not make this change, please contact our support immediately.</p>
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
  

  await transporter.sendMail(mailOptions);

  res.status(200).json({ success: true, message: 'Password reset successful' });
});




// const updateUser = asyncHandler(async (req, res) => {
//   const userId = req.params.id;
//   const updates = req.body;

//   try {
//     // Find the user by ID
//     let user = await userData.findById(userId);

//     // Check if the user exists
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // Exclude password field from updates
//     delete updates.password;

//     // Update user fields
//     for (const key in updates) {
//       user[key] = updates[key];
//     }

//     // Save the updated user
//     user = await user.save();

//     // Omit password field from response
//     user.password = undefined;

//     res.status(200).json({ success: true, user });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });


// const changePassword = asyncHandler(async (req, res) => {
//   const { userId } = req.params;
//   const { currentPassword, newPassword } = req.body;

//   try {
//     // Find the user by ID
//     const user = await userData.findById(userId);

//     // Check if the user exists
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // Check if the current password provided matches the stored password
//     const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);
//     if (!isPasswordMatch) {
//       return res.status(401).json({ error: 'Current password is incorrect' });
//     }

//     // Hash the new password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(newPassword, salt);

//     // Update the user's password
//     user.password = hashedPassword;

//     // Save the updated user
//     await user.save();

//     // Respond with success message
//     res.status(200).json({ success: true, message: 'Password updated successfully' });
//   } catch (error) {
//     console.error('Error updating password:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });


module.exports = { 
    registerUser,
    createUser,
    getUsers,
    getUsersBySubscription,
    loginUser,
    logoutUser,
    deleteUser,
    updateUser,
    updatePassword,
    initiatePasswordReset,
    resetPassword,
    // changePassword
};
