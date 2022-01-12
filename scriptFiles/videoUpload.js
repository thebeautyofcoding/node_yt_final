// YouTube API video uploader using JavaScript/Node.js
// You can find the full visual guide at: https://www.youtube.com/watch?v=gncPwSEzq1s
// You can find the brief written guide at: https://quanticdev.com/articles/automating-my-youtube-uploads-using-nodejs
//
// Upload code is adapted from: https://developers.google.com/youtube/v3/quickstart/nodejs

const fs = require('fs')

const assert = require('assert')
const { google } = require('googleapis')
const OAuth2 = google.auth.OAuth2
var events = require('events')

const downloadedVideo = require('../downloadedVideo.json')

var eventEmitter = require('../eventEmitter')
// video category IDs for YouTube...google them or use youtube userinterface to choose, not possible to fetch them:
const categoryIds = {
    Entertainment: 24,
    Education: 27,
    ScienceTechnology: 28
}

// If modifying these scopes, delete your previously saved credentials in client_oauth_token.json
const SCOPES = ['https://www.googleapis.com/auth/youtube.upload']
// Contains the access_token
const TOKEN_PATH = `../credentials.json`

const express = require('express')
const app = express()
const port = 3001

/** route needed for authorization; extracts a token or "code" out of URL and emits an event with "code" attached. That code is needed to get an JWT access token, which shows youtube you are allowed to upload videos
In order to get this working, you will need to do some preperation work.
You will need a google account, of course and log into: https://console.cloud.google.com/. Then, you will need to create a project, generate an api key and make an oAuth2.0 Client there. Also, you need to allow your project to use YoutubeApi there.
 Since I have this 'http://localhost:3001/' route here, I will need to add there an authorized redirect URI that is "http://localhost". Furthermore  I have to extract the client_secret from there and add it to the "client_secret.json" file in the root of this project.
Also, you need to allow test user and register them with their gmail, so you will be able to upload. You just can use your gmail.
*/
app.get('/', (req, res) => {
    const code = req.query.code
    console.log('CODE', code)
    eventEmitter.emit('code', code)
    return res.sendStatus(200)
})

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`)
})

var videoFilePath = ''
var thumbFilePath = ''
const tags = ''
const { title, description } = downloadedVideo.snippet
const { id } = downloadedVideo

async function uploadVideo (title, description, tags, id) {

    if (fs.existsSync(`./videos/trimmed/${id}.mp4`)) {
        videoFilePath = `./videos/trimmed/${id}.mp4`
    } else {
        videoFilePath = `./videos/${id}.mp4`
    }
    thumbFilePath = `./videos/thumbnailsForLatestVideo/high.png`

    assert(fs.existsSync(videoFilePath))
    assert(fs.existsSync(thumbFilePath))

    // Load client secrets from a local file.
    fs.readFile('./client_secret.json', function processClientSecrets (err, content) {
        if (err) {
            console.log('Error loading client secret file: ' + err)
            return
        }

        // Authorize a client with the loaded credentials, then call the YouTube API.
        authorize(JSON.parse(content), (auth) => {


            upload(auth, title, description, tags)
        })
    })
}

/**
 * Upload the video file.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function upload (auth, title, description, tags) {

    const service = google.youtube('v3')

    service.videos.insert({
        auth: auth,
        part: 'snippet,status',
        requestBody: {
            snippet: {
                title,
                description,
                tags,
                categoryId: categoryIds.ScienceTechnology,
                defaultLanguage: 'en',
                defaultAudioLanguage: 'en'
            },
            status: {
                privacyStatus: "private"
            },
        },
        media: {
            body: fs.createReadStream(videoFilePath),
        },
    }, function (err, response) {
        if (err) {
            console.log(response)
            console.log('The API returned an error: ' + err)
            return
        }

        console.log('Video uploaded. Uploading the thumbnail now.')
        service.thumbnails.set({
            auth: auth,
            videoId: response.data.id,
            media: {
                body: fs.createReadStream(thumbFilePath)
            },
        }, function (err, response) {
            if (err) {
                console.log('The API returned an error: ' + err)
                return
            }
            console.log(response.data)
        })
    })
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize (credentials, callback) {

    const clientSecret = credentials.web.client_secret
    const clientId = credentials.web.client_id
    const redirectUrl = credentials.web.redirect_uris[0]
    const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl)

    // Check if we have previously stored a token
    getNewToken(oauth2Client, callback)
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken (oauth2Client, callback) {
    console.log(oauth2Client)
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
    })

    console.log('Authorize this app by visiting this url: ', authUrl)

    eventEmitter.on('code', (code) => {
        oauth2Client.getToken(code, function (err, token) {

            if (err) {
                console.log('Error while trying to retrieve access token', err)
                return
            }

            oauth2Client.credentials = token

            callback(oauth2Client)
        })
    })
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
// function storeToken (token) {


//     fs.writeFile(TOKEN_PATH, JSON.stringify({ token: token }), (err) => {

//         if (err) throw err
//         console.log('Token stored to ' + TOKEN_PATH)
//     })
// }

uploadVideo(title, description, tags, id)