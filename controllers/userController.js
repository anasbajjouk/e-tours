const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const filterObj = (obj, ...allowedFileds) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFileds.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllUsers = catchAsync(async (request, response, next) => {
  const users = await User.find();
  response.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
});

exports.updateMe = catchAsync(async (request, response, next) => {
  //Create error if user POSTs password data
  if (request.body.password || request.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  //Filtered out unwanted field names
  const filteredBody = filterObj(request.body, 'name', 'email');

  //Update user document
  const updatedUser = await User.findByIdAndUpdate(
    request.user.id,
    filteredBody,
    {
      new: true,
      runValidators: true
    }
  );

  response.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (request, response, next) => {
  await User.findByIdAndUpdate(request.user.id, { active: false });

  response.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getUser = (request, response) => {
  response.status(500).json({
    status: 'error',
    message: 'Method no implemented yet!'
  });
};

exports.createUser = (request, response) => {
  response.status(500).json({
    status: 'error',
    message: 'Method no implemented yet!'
  });
};

exports.updateUser = (request, response) => {
  response.status(500).json({
    status: 'error',
    message: 'Method no implemented yet!'
  });
};

exports.deleteUser = (request, response) => {
  response.status(500).json({
    status: 'error',
    message: 'Method no implemented yet!'
  });
};
