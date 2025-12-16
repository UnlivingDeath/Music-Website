// const dbClient = require('../models/db')
const constant = require('../lib/constant')
const {MongoClient} = require('mongodb')
const dbClient =  new MongoClient(`mongodb://${constant.DB_USER}:${constant.DB_PASS}@${constant.DB_HOST}:${constant.DB_PORT}/?authSource=admin`)
const auth = require('../lib/auth')
async function seedDB() {
  
    try {
        await dbClient.connect()
        const collection = dbClient.db('myapp').collection('users')
        collection.drop()      
        await collection.insertMany([{
            username: 'admin',
            name: 'administrator',
            password: await auth.genHashPassword('qwerty'),
            contactNo: '09019230122'
        }]);

        console.log("Database seeded! :)");
        dbClient.close()
    } catch (err) {
        console.log(err.stack);
    }
}

seedDB().then(console.log).catch(console.error);