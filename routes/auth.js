const express = require("express");

const authController = require("../controllers/auth");

const router = express.Router();

router.get("/login", authController.getLogin);

router.post("/login", authController.postLogin); //mimic login atm

router.get("/signup", authController.getSignup);

router.post("/signup", authController.postSignup);

router.post("/logout", authController.postLogout);

router.get("/reset", authController.getReset);

router.post("/reset", authController.postReset);

router.get("/reset/:token", authController.getNewPwd);

module.exports = router;
