const router = require('express').Router()
const { UserModel } = require('../models')
const { checkLoggedIn } = require('../lib/auth')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const auth = require('../lib/auth')


function generateAccessToken(username) {
  return jwt.sign(username, process.env.TOKEN_SECRET || 'mysecret', { expiresIn: '1800s' });
}

router.get('/', checkLoggedIn, async(req, res, next) => {
  const users = await UserModel.find({})
  console.log(users)
  res.render('user', { data: users || [] })
});

// This will serve the login page
router.get('/login', function(req, res) {
  if(req.session.loggedIn) res.redirect('/users')
  res.render('login')
})

const logout = function(req, res, next) {
  req.session.loggedIn = false;
  res.redirect("/")
}
router.get('/register', function(req, res) {
  res.render('register')
})
router.post('/register',async function(req, res) {
  const { username, name, password, gender } = req.body 
    console.log(req.body)
    const newUser = new UserModel({
        username: username,
        name: name,
        password: await auth.genHashPassword(password),
        gender: gender
    })
    try {
        await newUser.save()
        res.redirect('/login')
    }
    catch(error) {
        console.log(error)
       
  }
})
router.get("/logout", logout, (req, res) => {
  res.render('login')
})



// this is Login controller that handle HTTP form request
router.post('/login', async function(req, res) {
  const { username, password } = req.body     
    try {
        const user = await UserModel.findOne({ username: username })
        const users = await UserModel.find({})
        console.log(users)
        console.log(user)
        // FAIL-FAST 
        if(!user || user.username !== username || !bcrypt.compareSync(password, user.password)) {
          res.render("login", { error: { type: "loginFailed", msg: 'Username or password is not correct!' }});

        } else {
          console.log('LOGIN SUCCEEDED!!!')

          req.session.loggedIn = true
          res.redirect('/')
        }
    }
    catch(error) {
      console.log(error)
      res.render("login", { error: { type: "loginFailed", msg: 'Username or password is not correct!' }});
    }
})

module.exports = router
