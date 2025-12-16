const router = require('express').Router()
const { auth } = require('../lib');

const { UserModel } = require('../models')
router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now().toString())
  next()
})
// PATH: <HOST_URL>/users/


router.get('/', async function (req, res) {
  const rs = await UserModel.find({})
  console.log(rs)
  res.send(rs)
})
// users/:username
router.get('/:username', async function (req, res) {
  const { username } = req.params
  const rs = await UserModel.findOne({ username: username })
  console.log(rs)
  res.send(rs)
})

router.get('/:id', async function (req, res) {
  const { id } = req.params
  const rs = await UserModel.findOne({ _id: id })
  console.log(rs)
  res.send(rs)
})


router.post('/', async function (req, res) {
  const { username, name, gender, password } = req.body
  const newUser = new UserModel({
    username: username,
    name: name,
    gender: gender,
    password: await auth.genHashPassword(password)
  })
  try {
    const createdUser = await newUser.save()
    res.send({ status: true, data: createdUser })
  }
  catch (error) {
    console.log(error)
    res.send({
      status: false,
      msg: 'Unable to insert new user',
      error
    })
  }

})
// Handle form request
router.post('/create', async function (req, res) {
  const { username, name, gender, password } = req.body
  console.log(req.body)
  const newUser = new UserModel({
    username: username,
    name: name,
    gender: gender,
    password: await auth.genHashPassword(password)
  })
  try {
    const createdUser = await newUser.save()
    res.redirect('/')
  }
  catch (error) {
    console.log(error)
    res.redirect('/')
  }
})
router.delete('/:id', async function (req, res) {
  const { userId } = req.params
  await UserModel.deleteOne({
    _id: userId
  }).then(result => {
    console.log(result);
    res.status(200).json({ status: true, message: "Success deleted !" });
  });
})

router.put('/:userId', async function (req, res) {
  const { userId } = req.params

  try {
    await newUser.save()
    res.redirect('/')
  }
  catch (error) {
    console.log(error)
    res.redirect('/')

  }
  try {
    if (!userId) res.status(404)
    const { username, name, gender } = req.body
    console.log(req.body)
    const updatedUser = new UserModel({
      username, name, gender, contactNo
    })
    UserModel.updateOne({
      _id: userId
    }).then(result => {
      console.log(result);
      res.status(200).json(result);
    }).catch((err) => {
      res.status(500).json(err)
    })

  }
  catch (err) {
    console.log(err)
    res.send({
      status: false,
      msg: 'Unable to update user',
      error: err
    })
  }
})

module.exports = router;
