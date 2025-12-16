docker run --name mongodb -p 27017:27017  -e MONGO_INITDB_ROOT_USERNAME=root -e MONGO_INITDB_ROOT_PASSWORD=pass -d mongo
npm run seed
npm start