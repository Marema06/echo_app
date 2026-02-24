const mongoose = require('mongoose');

const connectDb = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI manquant');
  }

  await mongoose.connect(uri);
  return mongoose.connection;
};

module.exports = { connectDb };
