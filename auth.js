const bcrypt = require("bcrypt");
const express = require("express");
const jwt = require("jsonwebtoken");

const currentUser = (req, res, next) => {
    if (!req.session?.jwt) {
        return next();
    }

    try {
        req.currentUser = jwt.verify(
            req.session.jwt,
            process.env.JWT_SECRET
        );
    } catch (err) {}

    next();
};

const requireAuth = (
    req,
    res,
    next
) => {
    if (!req.currentUser) {
        return res.sendFile(__dirname + "/public/error.html");
    }

    next();
};

const requireAdmin = (
    req,
    res,
    next
) => {
    if (!req.currentUser.admin) {
        return res.sendFile(__dirname + "/public/error.html");
    }

    next();
};

const router = express.Router();

router.post("/test", (req, res) => {
    res.send({test: bcrypt.hashSync("test1234", 10)});
});

router.post("/login", async (req, res) => {
    const {password} = req.body;
    let admin = false;

    if (!password) {
        return res.redirect("/?error="+encodeURIComponent("Podaj hasło"));
    }

    let result = await bcrypt.compare(password, process.env.HASH);

    if (!result) {
        result = await bcrypt.compare(password, process.env.ADMIN_HASH);
        admin = true;
    }

    if (!result) {
        return res.redirect("/?error="+encodeURIComponent("Nieprawidłowe hasło"));
    }

    const token = jwt.sign({admin: admin}, process.env.JWT_SECRET);

    req.session = {
        jwt: token,
    };

    if (admin) {
        res.redirect("/adminpanel");
    } else {
        res.redirect("/successful");
    }
});

module.exports = {
    authRouter: router,
    currentUser,
    requireAuth,
    requireAdmin
};