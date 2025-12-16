const bcrypt = require('bcrypt')
const constant = require('./constant')
const checkLoggedIn = function (req, res, next) {
  if (req.session.loggedIn === true) {
    next()
  } else {
    res.redirect("/login")
  }
}


module.exports = {
  async genHashPassword(plaintextPassword) {
    return new Promise((resolve, reject) => {
        bcrypt.genSalt(constant.SALT_ROUND, function (err, salt) {
          if (err) reject(false)
          bcrypt.hash(plaintextPassword, salt, function(err, hashedPassword) {
            if (err) reject(false)
            return resolve(hashedPassword)
          })
        })
    })
  },
  checkLoggedIn
}