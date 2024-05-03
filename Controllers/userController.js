const asyncHandler = require('express-async-handler');
const userData = require('../Models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

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
    const { username, email, password, firstName, lastName, DOB, gender, phoneNumber, address } = req.body;

    // Check if all required fields are provided
    if (!username || !email || !password || !firstName || !lastName || !DOB || !gender || !phoneNumber || !address) {
      res.status(400).json({ error: 'Important fields missing!' });
      return;
    }

    // Check if email is in a valid format
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Please provide a valid email' });
      return;
    }

    // Check for existing user by email or username
    const userExistByEmail = await userData.findOne({ email });
    const userExistByUsername = await userData.findOne({ username });

    if (userExistByEmail) {
      console.log("User already exists with email:", email);
      return res.status(400).json({ error: "User already exists with this email." });
    }

    if (userExistByUsername) {
      console.log("User already exists with username:", username);
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
      firstName,
      lastName,
      DOB,
      gender,
      phoneNumber,
      address,
    });

    if (user) {
      console.log('User created:', user.email);

      // Send confirmation email
      const mailOptions = {
        // from: process.env.EMAIL_USERNAME,
        from: `"Kaleo Gym 💪💪" <${process.env.EMAIL_USERNAME}>`,
        to: user.email,
        subject: 'Registration Confirmation',
        html: `<p>Dear ${user.username},</p><p>Thank you for registering with us!</p>`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
        } else {
          console.log('Email sent:', info.response);
        }
      });

      res.status(201).json({ user });
    } else {
      console.log('User creation failed');
      res.status(400).json({ error: 'Invalid user data' });
    }

    console.log('User registration completed'); // Log exit point

  } catch (error) {
    console.error(error);
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

// Action by only Admin
const createUser = asyncHandler(async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, DOB, gender, phoneNumber, address, role, subscription } = req.body;

    // Check if all required fields are provided
    if (!username || !email || !password || !firstName || !lastName || !DOB || !gender || !phoneNumber || !address || !role) {
      res.status(400).json({ error: 'Important fields missing!' });
      return;
    }

    // Check if email is in a valid format
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Please provide a valid email' });
      return;
    }

    // Check for existing user by email or username
    const userExistByEmail = await userData.findOne({ email });
    const userExistByUsername = await userData.findOne({ username });

    if (userExistByEmail) {
      console.log("User already exists with email:", email);
      return res.status(400).json({ error: "User already exists with this email." });
    }

    if (userExistByUsername) {
      console.log("User already exists with username:", username);
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
      firstName,
      lastName,
      DOB,
      gender,
      phoneNumber,
      address,
      role, // Set role provided by admin
      subscription, // Set subscription provided by admin
    });

    if (user) {
      console.log('User created:', user.email);

      // Send confirmation email
      const mailOptions = {
        from: `"Kaleo Gym 💪💪" <${process.env.EMAIL_USERNAME}>`,
        to: user.email,
        subject: 'Registration Confirmation',
        html: `<p>Dear ${user.username},</p><p>Thank you for registering with us!</p>`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
        } else {
          console.log('Email sent:', info.response);
        }
      });

      res.status(201).json({ user });
    } else {
      console.log('User creation failed');
      res.status(400).json({ error: 'Invalid user data' });
    }

    console.log('User registration completed'); // Log exit point

  } catch (error) {
    console.error(error);
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
  // Assuming you want to retrieve all users
  const users = await userData.find();

  // Send the users as a response
  res.status(200).json({ success: true, users });
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

// const loginUser = asyncHandler(async (req, res) => {
//   const { identifier, password } = req.body;

//   // Check if identifier (email or username) and password are provided
//   if (!identifier || !password) {
//     res.status(400).json({ error: 'Please provide email/username and password' });
//     return;
//   };

//   // Check if the identifier is a valid email
//   if (isValidEmail(identifier)) {
//     // Check if the user exists by email
//     const user = await userData.findOne({ email: identifier });

//     if (!user) {
//       res.status(401).json({ error: 'Invalid email or password' });
//       return;
//     }

//     // Check if the password is correct
//     const isPasswordMatch = await bcrypt.compare(password, user.password);

//     if (!isPasswordMatch) {
//       res.status(401).json({ error: 'Invalid email or password' });
//       return;
//     }

//     // Generate JWT token
//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//       expiresIn: process.env.JWT_EXPIRES_IN,
//     });

//     res.status(200).json({
//       status: 'success',
//       token,
//       user: {
//         id: user._id,
//         username: user.username,
//         email: user.email,
//         role: user.role,
//       },
//     });
//   } else {
//     // Assuming the identifier is a username
//     // Check if the user exists by username
//     const user = await userData.findOne({ username: identifier });

//     if (!user) {
//       res.status(401).json({ error: 'Invalid username or password' });
//       return;
//     }

//     // Check if the password is correct
//     const isPasswordMatch = await bcrypt.compare(password, user.password);

//     if (!isPasswordMatch) {
//       res.status(401).json({ error: 'Invalid username or password' });
//       return;
//     }

//     // Generate JWT token
//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//       expiresIn: process.env.JWT_EXPIRES_IN,
//     });

//     res.status(200).json({
//       status: 'success',
//       token,
//       user: {
//         id: user._id,
//         username: user.username,
//         email: user.email,
//         role: user.role,
//       },
//     });
//   }
// });

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
    console.error(error); // Log any errors to the console for debugging
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

    // Exclude password field from updates
    delete updates.password;

    // Update user fields
    for (const key in updates) {
      user[key] = updates[key];
    }

    // Save the updated user
    user = await user.save();

    // Omit password field from response
    user.password = undefined;

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
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

//     // Update user fields
//     for (const key in updates) {
//       user[key] = updates[key];
//     }

//     // Save the updated user
//     user = await user.save();

//     res.status(200).json({ success: true, user });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });



// const updateUser = asyncHandler(async (req, res) => {
//   try {
//     // Get the user ID from request parameters
//     const userId = req.params.id;

//     // Check if the user exists
//     const user = await userData.findById(userId);

//     if (!user) {
//       res.status(404).json({ error: 'User not found' });
//       return;
//     }

//     // Update user data based on request body
//     const { username, email, firstName, lastName, DOB, gender, phoneNumber, address } = req.body;

//     if (username) user.username = username;
//     if (email) user.email = email;
//     if (firstName) user.firstName = firstName;
//     if (lastName) user.lastName = lastName;
//     if (DOB) user.DOB = DOB;
//     if (gender) user.gender = gender;
//     if (phoneNumber) user.phoneNumber = phoneNumber;
//     if (address) user.address = address;

//     // Save the updated user data
//     await user.save();

//     res.status(200).json({ success: true, message: 'User updated successfully', user });
//   } catch (error) {
//     console.error(error); // Log any errors to the console for debugging
//     res.status(500).json({ error: 'Server error' });
//   }
// });



module.exports = { 
    registerUser,
    createUser,
    getUsers,
    loginUser,
    logoutUser,
    deleteUser,
    updateUser
};
