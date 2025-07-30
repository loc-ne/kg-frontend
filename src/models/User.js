import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  elo: {
    bullet: { type: Number, default: 1200 },
    blitz:  { type: Number, default: 1200 },
    rapid:  { type: Number, default: 1200 }
  }
});

const User = mongoose.model('User', userSchema);

export default User;
