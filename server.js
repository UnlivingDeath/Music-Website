// server.js

// NOTE TO SELF
// .save(): save value to database
// const user = await User.findById(req.session.userId): fetch user's data for this session;

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const ejs = require('ejs')
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');


const multer = require('multer')
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { match } = require('assert');

const app = express();


require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = 'dabeat/';
    let resourceType = 'auto';
    
    if (file.fieldname === 'audioFile') {
      folder += 'audio';
    } else if (file.fieldname === 'coverImage') {
      folder += 'covers';
    }
    
    return {
      folder: folder,
      resource_type: resourceType,
      allowed_formats: file.fieldname === 'audioFile' ? ['mp3', 'ogg', 'flac', 'm4a'] : ['jpg', 'png', 'jpeg', 'webp']
    };
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'audioFile') {
      const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/flac', 'audio/x-m4a'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid audio format'), false);
      }
    } else if (file.fieldname === 'coverImage') {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid image format'), false);
      }
    }
  }
});
// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isAdmin: { type: Boolean, default: false },
  playlists: {
  type: [
    {
      name:        { type: String, required: true },
      description: { type: String, default: '' },
      coverImage:  { type: String, default: '/img/music.jpg' },
      createdAt:   { type: Date, default: Date.now },
      songs:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'Music' }]
    }
  ],
  default: [
    {
      name: 'Favorites',
      description: 'Your favorite tracks live here',
      coverImage: '/img/music.jpg',
      songs: []
    }
  ]
}
});



const User = mongoose.model('User', userSchema);

// Add Music Schema here
const musicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artistName: { type: String, required: true },
  genre: { type: String, default: 'any' },
  description: { type: String, default: '' },
  audioFile: { type: String, required: true },
  coverImage: { type: String, default: '/img/Control-V.png' },
  favoritesCount: { type: Number, default: 0 },
  uploadedAt: { type: Date, default: Date.now },
  tags: { 
    type: [String], 
    default: [] 
  }
});

const Music = mongoose.model('Music', musicSchema);

// Middleware
app.use('/wavesurfer', express.static(__dirname + '/node_modules/wavesurfer.js/dist'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 hours
}));

// Auth middleware
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/');
  }
};


const dynamicBlockSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },  // full EJS code
  createdAt: { type: Date, default: Date.now },
  type: { type: String, required: true },
  bs_icon: { type: String, default: 'file-earmark-text'},
});

const DynamicBlock = mongoose.model('DynamicBlock', dynamicBlockSchema);

// Middleware: Only admins can access these routes
const isAdmin = async (req, res, next) => {
  const user = await User.findById(req.session.userId);
  if (user?.isAdmin) {
    req.user = user;
    next();
  } else {
    res.redirect('/dashboard?error2=Admin posting permission is denied');
  }
};

app.post('/admin/blocks/create', isAdmin, async (req, res) => {
  try {
    await DynamicBlock.create({
      title: req.body.title,
      content: req.body.content,
      type: req.body.type,
      bs_icon: req.body.bs_icon || 'file-earmark-text'
    });

    res.redirect('/dashboard?success2=Post created');
  } catch (err) {
    console.error(err);
    res.redirect('/dashboard?error2=Create failed');
  }
});

app.post('/admin/blocks/edit/:id', isAdmin, async (req, res) => {
  try {
    await DynamicBlock.findByIdAndUpdate(req.params.id, {
      title: req.body.title,
      content: req.body.content,
      type: req.body.type,
      bs_icon: req.body.bs_icon || 'file-earmark-text'
    });

    res.redirect('/dashboard?success2=Post updated');
  } catch (err) {
    console.error(err);
    res.redirect('/dashboard?error2=Update failed');
  }
});

app.post('/admin/blocks/delete/:id', isAdmin, async (req, res) => {
  try {
    await DynamicBlock.findByIdAndDelete(req.params.id);
    res.redirect('/dashboard?success2=Post deleted');
  } catch (err) {
    console.error(err);
    res.redirect('/dashboard?error2=Delete failed');
  }
});












// Routes
app.get('/', (req, res) => {
  res.render('auth', { error: null, message: null, showRegister: false });
});


app.get('/song-invalid', async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    res.render('song-invalid', { user });
  } catch (error) {
    console.error(error);
    res.redirect('/');
  }
});

app.get('/song/:id', async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const song = await Music.findById(req.params.id);
    const authorExists = await User.exists({ username: song.artistName });


    let isFavorited = false;
    if (user) {
      const favoritesPlaylist = user.playlists.find(p => p.name === 'Favorites');
      isFavorited = favoritesPlaylist && favoritesPlaylist.songs.some(id => id.toString() === song._id.toString());
    } 
    res.render('song', { user, song, isFavorited, authorExists, error: req.query.error || null, success: req.query.success || null});
  } catch (error) {
    const user = await User.findById(req.session.userId);
    console.error(error);
    res.redirect(`/song-invalid`);
  }
});

app.get('/song/:id/favorite', isAuthenticated, async (req, res) => {
  try {
    const music = await Music.findById(req.params.id);
    const userId = req.session.userId;
    
    
    const user = await User.findById(userId);
    const favoritesPlaylist = user.playlists.find(p => p.name === 'Favorites');
    
    // Check if song is already in favorites
    const songIndex = favoritesPlaylist.songs.findIndex(id => id.toString() === req.params.id);
    
    if (songIndex > -1) {
      // Remove from favorites
      favoritesPlaylist.songs.splice(songIndex, 1);
      music.favoritesCount = Math.max(0, music.favoritesCount - 1);
    } else {
      // Add to favorites
      favoritesPlaylist.songs.push(req.params.id);
      music.favoritesCount++;
    }
    
    await user.save();
    await music.save();
    
    res.redirect('/song/' + req.params.id);
  } catch (error) {
    console.error(error);
    res.redirect(`/song-invalid`);
  }
});

app.post('/register', async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      return res.render('auth', { error: 'All fields are required', message: null, showRegister: true });
    }

    if (password !== confirmPassword) {
      return res.render('auth', { error: 'Passwords do not match', message: null, showRegister: true });
    }

    if (password.length < 8) {
      return res.render('auth', { error: 'Password must be at least 8 characters', message: null, showRegister: true });
    }

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.render('auth', { error: 'Username or email already exists', message: null, showRegister: true });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();
    res.render('auth', { error: null, message: 'Registration successful! Please login.', showRegister: false });
  } catch (error) {
    console.error(error);
    res.render('auth', { error: 'Registration failed. Please try again.', message: null, showRegister: true });
  }
});



app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.render('auth', { error: 'All fields are required', message: null, showRegister: false });
    }

    // Find user
    const user = await User.findOne({ $or: [{ username }, { email: username }] });
    if (!user) {
      return res.render('auth', { error: 'Invalid username or email', message: null, showRegister: false });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('auth', { error: 'Invalid password', message: null, showRegister: false });
    }

    // Create session
    req.session.userId = user._id;
    req.session.username = user.username;
    res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
    res.render('auth', { error: 'Login failed. Please try again.', message: null, showRegister: false });
  }
});

app.get('/home', async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    res.render('home', { user });
  } catch (error) {
    console.error(error);
    res.redirect('/');
  }
});


app.get('/dashboard', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 3;
    const search = req.query.search || '';
    const genre = req.query.genre || 'any';
    const sort = req.query.sort || 'new';
    const showFav = req.query.showFav === 'on';
    
    const user = await User.findById(req.session.userId)
      .populate({
        path: 'playlists.songs',
        model: 'Music',
        strictPopulate: false
      });

    let previewNormal = user?.isAdmin ? req.query.previewNormal : null;
    if (previewNormal){
      user.isAdmin = false;
    };

    let query = {};
    
    // If showFav is enabled, only show songs in user's favorites
    if (showFav) {
      const favoritesPlaylist = user.playlists.find(p => p.name === 'Favorites');
      const favoriteSongIds = favoritesPlaylist ? favoritesPlaylist.songs.map(s => s._id || s) : [];
      query._id = { $in: favoriteSongIds };
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { artistName: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Genre filter
    if (genre && genre !== 'any') {
      query.genre = genre;
    }
    
    // Sort options
    let sortOption = {};
    switch(sort) {
      case 'new': sortOption = { uploadedAt: -1 }; break;
      case 'old': sortOption = { uploadedAt: 1 }; break;
      case 'ascending': sortOption = { title: 1 }; break;
      case 'descending': sortOption = { title: -1 }; break;
      default: sortOption = { uploadedAt: -1 };
    }
    
    const totalSongs = await Music.countDocuments(query);
    const totalPages = Math.ceil(totalSongs / limit);
    
    const songs = await Music.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit);



    const blocks = await DynamicBlock.find().sort({ createdAt: 1 });

    // Execute each block's EJS content
    const renderedBlocks = blocks.map(block => ({
      _id: block._id,
      title: block.title,
      bs_icon: block.bs_icon,
      type: block.type,
      html: ejs.render(block.content, { user }, { async: false }),
      raw: block.content,
      createdAt: block.createdAt
    }));
    res.render('dashboard', {
      user,
      songs,
      currentPage: page,
      totalPages,
      search,
      genre,
      sort,
      showFav,
      error: req.query.error || null,
      message: req.query.success || null,
      error2: req.query.error2 || null,
      message2: req.query.success2 || null,
      renderedBlocks,
      previewNormal
    });

  } catch (error) {
    console.error(error);
    res.redirect('/');
  }
});

app.post('/upload', isAuthenticated, (req, res, next) => {
  upload.fields([
    { name: 'audioFile', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ])(req, res, async (err) => {
    if (err) {
      const user = await User.findById(req.session.userId);
      return res.render('upload', { 
        user, 
        error: err.message || 'File upload failed' 
      });
    }
    next();
  });
}, async (req, res) => {
  let user;
  try {
    user = await User.findById(req.session.userId);

    const { title, genre, description, tags } = req.body;

    const music = new Music({
      title,
      artistName: user.username,
      genre,
      description,
      audioFile: req.files.audioFile[0].path,
      coverImage: req.files.coverImage 
        ? req.files.coverImage[0].path
        : '/img/Control-V.png',
      tags: tags ? tags.trim().split(/\s+/) : null,
    });



    await music.save();
    res.redirect('/dashboard?success=Song uploaded successfully');
  } catch (error) {
    console.error(error);
    res.render('upload', { 
      user,
      error: 'Upload failed. Please try again.' 
    });
  }
});

app.get('/upload', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    res.render('upload', { user, error:null });  } catch (error) {
    console.error(error);
    res.redirect('/');
  }
});

app.post('/delete-song/:id', isAuthenticated, async (req, res) => {
  try {
    const music = await Music.findById(req.params.id);
    
    if (!music) {
      return res.redirect('/dashboard?error=Music not found');
    }
    
    const user = await User.findById(req.session.userId);
    
    if (music.artistName !== user.username && !user.isAdmin) {
      return res.redirect('/dashboard?error=No permission');
    }
    
    // Delete audio from Cloudinary
    if (music.audioFile.includes('cloudinary')) {
      try {
        const urlParts = music.audioFile.split('/upload/')[1]; // Get everything after /upload/
        const pathParts = urlParts.split('/').slice(1); // Remove version
        const publicId = pathParts.join('/').replace(/\.[^/.]+$/, ''); // Remove file extension
        
        console.log('deleting:', publicId);
        
        const audioResult = await cloudinary.uploader.destroy(publicId, { 
          resource_type: 'video',
          invalidate: true 
        });
        
        console.log('result:', audioResult); // Debug log
      } catch (err) {
        console.error('error:', err);
      }
    }
    
    // Delete cover image from Cloudinary
    if (music.coverImage.includes('cloudinary')) {
      try {
        const urlParts = music.coverImage.split('/upload/')[1];
        const pathParts = urlParts.split('/').slice(1);
        const publicId = pathParts.join('/').replace(/\.[^/.]+$/, '');
        
        console.log('deleting:', publicId); // Debug log
        
        const imageResult = await cloudinary.uploader.destroy(publicId, { 
          resource_type: 'image',
          invalidate: true 
        });
        
        console.log('result:', imageResult); // Debug log
      } catch (err) {
        console.error('error:', err);
      }
    }

    await User.updateMany(
      { 'playlists.songs': req.params.id },
      { $pull: { 'playlists.$[].songs': req.params.id } }
    );
    console.log('Removed song from all users\' favorites');
    // Delete from database
    await Music.findByIdAndDelete(req.params.id);
    
    res.redirect('/dashboard?success=Song deleted successfully');
  } catch (error) {
    console.error(error);
    res.redirect('/dashboard?error=Delete failed');
  }
});

app.post('/delete-song-from-profile/:id', isAuthenticated, async (req, res) => {
  try {
    const music = await Music.findById(req.params.id);
    
    if (!music) {
      return res.redirect(`/dashboard?error=Music not found, fallling back to dashboard`);
    }
    
    const user = await User.findById(req.session.userId);
    
    // Check if user owns this music OR is an admin
    if (music.artistName !== user.username && !user.isAdmin) {
      return res.redirect(`/profile/${music.artistName}?error=No permission`);
    }
    
    // Delete audio from Cloudinary
    if (music.audioFile.includes('cloudinary')) {
      try {
        const urlParts = music.audioFile.split('/upload/')[1]; // Get everything after /upload/
        const pathParts = urlParts.split('/').slice(1); // Remove version
        const publicId = pathParts.join('/').replace(/\.[^/.]+$/, ''); // Remove file extension
        
        console.log('Deleting audio with public_id:', publicId); // Debug log
        
        const audioResult = await cloudinary.uploader.destroy(publicId, { 
          resource_type: 'video',
          invalidate: true 
        });
        
        console.log('Audio deletion result:', audioResult); // Debug log
      } catch (err) {
        console.error('Error deleting audio from Cloudinary:', err);
      }
    }
    
    // Delete cover image from Cloudinary
    if (music.coverImage.includes('cloudinary')) {
      try {
        const urlParts = music.coverImage.split('/upload/')[1];
        const pathParts = urlParts.split('/').slice(1);
        const publicId = pathParts.join('/').replace(/\.[^/.]+$/, '');
        
        console.log('Deleting image with public_id:', publicId); // Debug log
        
        const imageResult = await cloudinary.uploader.destroy(publicId, { 
          resource_type: 'image',
          invalidate: true 
        });
        
        console.log('Image deletion result:', imageResult); // Debug log
      } catch (err) {
        console.error('Error deleting image from Cloudinary:', err);
      }
    }
    
    await User.updateMany(
      { 'playlists.songs': req.params.id },
      { $pull: { 'playlists.$[].songs': req.params.id } }
    );
    console.log('Removed song from all users\' favorites');

    // Delete from database
    await Music.findByIdAndDelete(req.params.id);
    
    res.redirect(`/profile/${music.artistName}?success=Song deleted successfully`);
  } catch (error) {
    console.error(error);
    res.redirect(`/dashboard?error=Delete failed, falling back to dashboard`);
  }
});

// GET edit page
app.get('/edit-song/:id', isAuthenticated, async (req, res) => {
  try {
    const song = await Music.findById(req.params.id);
    const user = await User.findById(req.session.userId);
    
    if (!song) {
      return res.redirect('/dashboard?error=Song not found');
    }
    
    // Check if user owns this song OR is admin
    if (song.artistName !== user.username && !user.isAdmin) {
      return res.redirect('/dashboard?error=You can only edit your own songs');
    }
    
    res.render('edit', { song, user, error: null });
  } catch (error) {
    console.error(error);
    res.redirect(`/song-invalid`);
  }
});

// POST edit song
app.post('/edit-song/:id', isAuthenticated, upload.single('coverImage'), async (req, res) => {
  let oldCoverPublicId = null;
  
  try {
    const song = await Music.findById(req.params.id);
    const user = await User.findById(req.session.userId);
    
    if (!song) {
      return res.redirect('/dashboard?error=Song not found');
    }
    
    // Check ownership
    if (song.artistName !== user.username && !user.isAdmin) {
      return res.redirect('/dashboard?error=Unauthorized');
    }
    
    const { title, genre, description, tags } = req.body;
    
    // Update basic fields
    if (title) song.title = title;
    if (genre) song.genre = genre;
    song.description = description || '';
    
    // Process tags
    if (tags) {
      song.tags = tags.split(' ')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0);
    } else {
      song.tags = [];
    }
    
    if (req.file) {
      if (song.coverImage.includes('cloudinary')) {
        const urlParts = song.coverImage.split('/upload/')[1];
        const pathParts = urlParts.split('/').slice(1);
        oldCoverPublicId = pathParts.join('/').replace(/\.[^/.]+$/, '');
      }
      
      song.coverImage = req.file.path;
    }
    
    await song.save();
    
    if (oldCoverPublicId) {
      try {
        await cloudinary.uploader.destroy(oldCoverPublicId, { 
          resource_type: 'image',
          invalidate: true 
        });
        console.log('deleted:', oldCoverPublicId);
      } catch (err) {
        console.error('error:', err);
      }
    }
    
    res.redirect(`/song/${song._id}?success=Song updated successfully`);
  } catch (error) {
    console.error(error);
    
    if (req.file && req.file.path.includes('cloudinary')) {
      try {
        const urlParts = req.file.path.split('/upload/')[1];
        const pathParts = urlParts.split('/').slice(1);
        const publicId = pathParts.join('/').replace(/\.[^/.]+$/, '');
        await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
      } catch (err) {
        console.error('error:', err);
      }
    }
    
    const song = await Music.findById(req.params.id);
    const user = await User.findById(req.session.userId);
    res.render('edit', { song, user, error: 'Failed to update song. Please try again.' });
  }
});

app.get('/profile', async (req, res) => {
  // try {
  //   const user = await User.findById(req.session.userId);
  //   const songs = await Music.find({ artistName: user.username });
  //   const favSongs = await Music.find({ _id: { $in: user.playlists.find(p => p.name === 'Favorites').songs } });
  //   res.render('profile', { user, songs, message: null, error: null , favSongs});
  // } catch (error) {
  //   console.error(error);
  //   res.redirect('/');
  // }
  try{
    res.redirect('/profile/' + req.session.username);
  }
  catch (error) {
    console.error(error);
    res.redirect('/');
  }
  
});

app.get('/profile/:username', async (req, res) => {
  try {
    const findUser = await User.findOne({ username: req.params.username });
    if (!findUser) {
      return res.redirect('/dashboard');
    }
    const user = await User.findById(req.session.userId);

    const songs = await Music.find({ artistName: findUser.username });
    const favSongs = await Music.find({ _id: { $in: findUser.playlists.find(p =>  p.name === 'Favorites').songs } });
    const accountAgeDays = Math.floor((Date.now() - findUser.createdAt) / (1000 * 60 * 60 * 24));
    res.render('profile', { findUser,
      user,
      songs,
      message: req.query.message || null,
      success: req.query.success || null,
      error: req.query.error || null ,
      favSongs,
      accountAgeDays});
  } catch (error) {
    console.error(error);
    res.redirect('/');
  }
  // try{
  //   res.redirect('/profile');
  // }
  // catch (error) {
  //   console.error(error);
  //   res.redirect('/');
  // }
});



app.get('/logout', (req, res) => {
  req.session.destroy((err) => { //destroy session meaning log out
    if (err) {
      console.error(err);
    }
    // Refresh current page after logout
      res.redirect(req.headers.referer);
    
  });
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});