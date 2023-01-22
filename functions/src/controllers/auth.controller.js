const SpotifyWebApi = require("spotify-web-api-node")
const { db, auth } = require("../configs/firebase")

async function loginWithCode(req, res) {
  const code = req.body.code
  const spotifyApi = new SpotifyWebApi({
    redirectUri: process.env.REDIRECT_URI,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  })

  try {
    const sessionsToken = await spotifyApi.authorizationCodeGrant(code)
    const { access_token, refresh_token, expires_in } = sessionsToken.body

    // set header with token
    await spotifyApi.setAccessToken(access_token)
    const userData = await spotifyApi.getMe()
    const retrievedData = userData.body
    const { display_name, email, external_urls, id, images } = retrievedData

    // Locate existing user profile in Firestore
    const existingUserQuery = await db
      .collection("users")
      .where("id", "==", id)
      .get()
    let uid = ""
    if (existingUserQuery.docs.length === 1) {
      uid = existingUserQuery.docs[0].data().uid
    } else if (existingUserQuery.docs.length === 0) {
      // User is authenticating for the first time
      // Create new user in Firebase
      const newUser = await auth.createUser({
        email,
        displayName: display_name,
      })
      uid = newUser.uid
    }

    // Update user profile
    const newProfileData = {
      uid,
      id,
      name: display_name,
      urls: external_urls,
      images,
    }
    await db.collection("users").doc(uid).set(newProfileData)

    // Save access tokens
    const userApiData = {
      uid,
      name: display_name,
      urls: external_urls,
      ...retrievedData,
      accessToken: access_token,
      refreshToken: refresh_token,
      tokenExpiryMs: Date.now() + expires_in * 1000 - 10000,
    }
    await db
      .collection("users")
      .doc(uid)
      .collection("sensitive")
      .doc("api")
      .set(userApiData)

    // Generate a login token
    const customToken = await auth.createCustomToken(uid)

    res.json({
      success: true,
      customToken,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
    })
  } catch (error) {
    console.error("Login error!")
    console.log({ error })
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log(error.response.data)
      console.log(error.response.status)
      console.log(error.response.headers)
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.log(error.request)
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log("Error", error.message)
    }
    console.log(error.config)
    res.sendStatus(400)
  }
}

async function refresh(req, res) {
  const refreshToken = req.body.refreshToken
  const spotifyApi = new SpotifyWebApi({
    redirectUri: process.env.REDIRECT_URI,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken,
  })

  try {
    const refreshResult = await spotifyApi.refreshAccessToken()
    const { access_token, expires_in } = refreshResult.body

    // Save new access token
    const userApiData = {
      accessToken: access_token,
      tokenExpiryMs: Date.now() + expires_in * 1000 - 10000,
    }
    await db
      .collection("users")
      .doc(uid)
      .collection("sensitive")
      .doc("api")
      .update(userApiData)

    res.json({ success: true, accessToken: access_token })
  } catch (error) {
    console.error("Refresh token error!")
    console.log(error)
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log(error.response.data)
      console.log(error.response.status)
      console.log(error.response.headers)
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.log(error.request)
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log("Error", error.message)
    }
    console.log(error.config)
    res.sendStatus(400)
  }
}

module.exports = {
  loginWithCode,
  refresh,
}
