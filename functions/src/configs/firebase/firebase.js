const admin = require("firebase-admin")

const credentials = require("./type0-spotify-be-firebase-adminsdk-b388w-d8afb9194d.json")

admin.initializeApp({
  credential: admin.credential.cert(credentials),
})
const auth = admin.auth()
const db = admin.firestore()
const messaging = admin.messaging()

module.exports = { auth, db, messaging }
