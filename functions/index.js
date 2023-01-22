const functions = require("firebase-functions")
require("dotenv").config()
const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const lyricsFinder = require("lyrics-finder")

const port = process.env.PORT || 3001
const authRouter = require("./src/routes/auth.route")

const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get("/", (req, res) => {
  res.json({ message: "ok" })
})

app.use("/auth", authRouter)

app.get("/lyrics", async (req, res) => {
  const lyrics =
    (await lyricsFinder(req.query.artist, req.query.track)) || "No Lyrics Found"
  res.json({ lyrics })
})

/* Error handler middleware */
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500
  console.error(err.message, err.stack)
  res.status(statusCode).json({ message: err.message })

  return
})

// app.listen(port, "0.0.0.0", () => {
//   console.log(`App listening at http://localhost:${port}`)
// })

exports.api = functions.https.onRequest(app)
