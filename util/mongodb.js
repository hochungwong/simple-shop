const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;

const mongoConnect = callBack => {
  MongoClient.connect(
    "mongodb+srv://carsonwong:zxvy123@carsoncluster-y0mmo.mongodb.net/test?retryWrites=true&w=majority"
  )
    .then(client => {
      console.log("Connected to MongoDB");
      callBack(client);
    })
    .catch(err => {
      console.log(err);
    });
};

module.exports = mongoConnect;
