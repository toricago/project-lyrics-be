const express = require("express")
const router = express.Router()
const authController = require("../controllers/auth.controller")

router.post("/loginWithCode", authController.loginWithCode)

router.post("/refresh", authController.refresh)

module.exports = router
