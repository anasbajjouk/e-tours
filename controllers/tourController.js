const Tour = require('./../models/tourModel');

exports.getAllTours = async (request, response) => {
  try {
    const tours = await Tour.find();
    response.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours: tours
      }
    });
  } catch (error) {
    response.status(404).json({
      status: 'Fail',
      message: error
    });
  }
};

exports.getTour = async (request, response) => {
  try {
    const tour = await Tour.findById(request.params.id);
    response.status(200).json({
      status: 'success',
      data: {
        tours: tour
      }
    });
  } catch (error) {
    response.status(400).json({
      status: 'Fail',
      message: error
    });
  }
};

exports.createTour = async (request, response) => {
  try {
    const newTour = await Tour.create(request.body);

    response.status(201).json({
      status: 'success',
      data: {
        tour: newTour
      }
    });
  } catch (err) {
    response.status(400).json({
      status: 'Fail',
      message: err
    });
  }
};

exports.updateTour = async (request, response) => {
  try {
    const tour = await Tour.findByIdAndUpdate(request.params.id, request.body, {
      new: true,
      runValidators: true
    });

    response.status(200).json({
      status: 'success',
      data: {
        tour: tour
      }
    });
  } catch (error) {
    response.status(400).json({
      status: 'Fail',
      message: error
    });
  }
};

exports.deleteTour = async (request, response) => {
  try {
    await Tour.findByIdAndDelete(request.params.id);
    response.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    response.status(400).json({
      status: 'Fail',
      message: error
    });
  }
};
