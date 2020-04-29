const Sequelize = require("sequelize");

const sequelize = new Sequelize("simple-shop", "root", "root", {
  dialect: "mysql",
  host: "localhost"
});

module.exports = sequelize;
