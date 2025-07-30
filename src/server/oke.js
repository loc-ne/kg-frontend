import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import session from 'express-session';  
import MongoStore from 'connect-mongo';
import User from '../models/User.js'; // 
import bcrypt from 'bcrypt';

dotenv.config();

const app = express();
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true  // ✅ Allow cookies/sessions
}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));


app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,  // ✅ Change to false for better security
  store: MongoStore.create({  // ✅ Store sessions in MongoDB
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions'
  }),
  cookie: { 
    secure: false,    // ✅ false for HTTP, true for HTTPS
    httpOnly: true,   // ✅ Prevent XSS
    maxAge: 1000 * 60 * 60 * 24 * 7  // ✅ 7 days
  }
}));

// ✅Register Route
// ✅ Register Route - Updated for ELO object
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, elo } = req.body;

    // ✅ Input validation
    if (!username || !email || !password) {
      return res.status(400).json({ 
        error: 'Username, email, and password are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters' 
      });
    }

    // ✅ Check duplicates
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ 
          error: 'Username already exists' 
        });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ 
          error: 'Email already exists' 
        });
      }
    }

    // ✅ Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // ✅ FIX: Handle ELO as object matching User.js schema
    const defaultElo = {
      bullet: 1200,
      blitz: 1200,
      rapid: 1200
    };

    // ✅ If client sends ELO, validate and use it
    let userElo = defaultElo;
    if (elo) {
      if (typeof elo === 'number') {
        // ✅ Legacy: single ELO number → convert to object
        userElo = {
          bullet: elo,
          blitz: elo,
          rapid: elo
        };
      } else if (typeof elo === 'object' && elo !== null) {
        // ✅ Client sent ELO object → merge with defaults
        userElo = {
          bullet: elo.bullet || defaultElo.bullet,
          blitz: elo.blitz || defaultElo.blitz,
          rapid: elo.rapid || defaultElo.rapid
        };
      }
    }
    
    // ✅ Create user with proper ELO object
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      elo: userElo  // ✅ Now matches User.js schema
    });

    // ✅ Response - return full ELO object
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        elo: user.elo  // ✅ { bullet, blitz, rapid }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // ✅ Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        error: `${field} already exists` 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// ✅ Login Route - Updated to return ELO object
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // ✅ FIX: Store full ELO object in session
    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      elo: user.elo  // ✅ Full object { bullet, blitz, rapid }
    };
    
    // ✅ Save session and return response
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Session error' });
      }

      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          elo: user.elo  // ✅ { bullet: 1200, blitz: 1200, rapid: 1200 }
        }
      });
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Could not log out' });
    }
    
    // Clear the session cookie from browser
    res.clearCookie('connect.sid');
    res.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  });
});

const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
};

app.get('/api/auth/me', (req, res) => {
  if (req.session && req.session.user) {
    res.json({
      success: true,
      user: req.session.user
    });
  } else {
    res.status(401).json({ 
      success: false,
      error: 'Not authenticated' 
    });
  }
});

app.get('/', (req, res) => {
  res.send('Chess Game API Server');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});