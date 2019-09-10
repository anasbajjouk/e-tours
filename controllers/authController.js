const { promisify } = require('util');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const crypto = require('crypto');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, response) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000 //to milliseconds
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  response.cookie('jwt', token, cookieOptions);

  //Remove the password from the output
  user.password = undefined;

  response.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signUp = catchAsync(async (request, response, next) => {
  const newUser = await User.create(request.body);
  createSendToken(newUser, 201, response);
});

exports.login = catchAsync(async (request, response, next) => {
  const { email, password } = request.body; // const { email } = request.body.email;

  //Check if email and password exist
  if (!email || !password) {
    return next(AppError('Please provide email and password!', 400));
  }
  //Check if user exists && passowrd is correct
  const user = await User.findOne({ email }).select('+password');

  //const correctPass = await user.correctPassword(password, user.password);
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  //If everything is ok, send token to client
  createSendToken(user, 200, response);
});

exports.protect = catchAsync(async (request, response, next) => {
  // Get the token abd check if it is there
  let token;
  if (
    request.headers.authorization &&
    request.headers.authorization.startsWith('Bearer')
  ) {
    token = request.headers.authorization.split(' ')[1];
    console.log('here 2 :', token);
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // Verification (token)
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new AppError('The user belonging to this token does no longer exist', 401)
    );

  // Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  //Grant access to protected route
  request.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (request, response, next) => {
    // roles is an array ['admin', 'lead-guide']
    if (!roles.includes(request.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (request, response, next) => {
  //Get user based on posted email
  const user = await User.findOne({ email: request.body.email });
  if (!user)
    return next(new AppError('There is no user with this email address', 404));

  //Generate the random reset
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //Send it to user's email
  const resetURL = `${request.protocol}://${request.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password 
  and passwordConfirm to ${resetURL}.\nIf your didnt forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10min)',
      message
    });

    response.status(200).json({
      status: 'success',
      message: 'Token sent to email'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later'),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (request, response, next) => {
  //Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(request.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  //If token has not expired and there is a user, set the new password
  if (!user) return next(new AppError('Token is invalid or has expired', 400));
  user.password = request.body.password;
  user.passwordConfirm = request.body.passwordConfirm;
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;
  await user.save();

  //Update changedPasswordAt property for the user

  //Log the user in, send JWT
  createSendToken(newUser, 200, response);
});

exports.updatePassword = catchAsync(async (request, response, next) => {
  //Get user from the collection
  const user = await User.findById(reques.user.id).select('+password');

  //Check if posted current password is correct
  if (
    !(await user.correctPassword(requesr.body.passwordCurrent, user.password))
  )
    return next(new AppError('Your current password is wrong', 401));

  //If so update password
  user.password = request.body.password;
  user.passwordConfirm = request.body.passwordConfirm;
  await user.save();

  //Log user in, send JWT
  createSendToken(user, 200, response);
});
