const User = require("../models/user");
const bcrypt = require("bcryptjs");
const nodeMailer = require("nodemailer");
const sendGridTransport = require("nodemailer-sendgrid-transport");

const crypto = require("crypto");

const transporter = nodeMailer.createTransport(
  sendGridTransport({
    auth: {
      api_key:
        "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",
    },
  })
);

exports.getLogin = (req, res, next) => {
  console.log("isLoggedIn", req.session.isLoggedIn);
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: message,
  });
};

exports.postLogin = (req, res, next) => {
  const { email, password } = req.body;
  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        req.flash("error", "Invalid email or password.");
        return res.redirect("/login");
      }
      bcrypt
        .compare(password, user.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            //save user to session
            req.session.user = user;
            //save session to database then redirect to index page
            return req.session.save((err) => {
              console.log(err);
              res.redirect("/");
            });
          }
          res.redirect("/login");
        })
        .catch((err) => {
          console.log(err);
          res.redirect("/login");
        });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Sign Up",
    errorMessage: message,
  });
};

exports.postSignup = (req, res, next) => {
  const { email, password, confirmPassword } = req.body;
  User.findOne({ email: email })
    .then((userDoc) => {
      if (userDoc) {
        //existing user
        req.flash(
          "error",
          "E-mail exists already, please pick a different one."
        );
        return res.redirect("/signup");
      }
      return bcrypt
        .hash(password, 12)
        .then((hashedPassword) => {
          const user = new User({
            email,
            password: hashedPassword,
            cart: { items: [] },
          });
          return user.save();
        })
        .then((result) => {
          res.redirect("/login");
          return transporter.sendMail({
            to: email,
            from: "haocong.carsonwong@gmail.com",
            subject: "Sign Up Succeed",
            html: "<h1>You Successfully Signed Up</h1>",
          });
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect("/");
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset Password",
    errorMessage: message,
  });
};

exports.postReset = (req, res, next) => {
  const { email } = req.body;
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/reset");
    }
    const token = buffer.toString("hex");
    User.findOne({ email: email })
      .then((user) => {
        if (!user) {
          req.flash("error", `No account with ${email} found`);
          return res.redirect("/reset");
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000; //token expires in 1 hour
        return user.save();
      })
      .then((result) => {
        res.redirect("/");
        transporter.sendMail({
          to: email,
          from: "haocong.carsonwong@gmail.com",
          subject: "Password Reset",
          html: `
            <p>You requested password reset</p>
            <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password</p>
          `,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

exports.getNewPwd = (req, res, next) => {
  const { token } = req.params;
  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() }, //$gt -> greater than
  })
    .then((user) => {
      let message = req.flash("error");
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render("auth/new-password", {
        path: "/new-password",
        pageTitle: "New Password",
        errorMessage: message,
        userId: user._id.toString(),
      });
    })
    .catch((err) => {
      console.log(err);
    });
};
