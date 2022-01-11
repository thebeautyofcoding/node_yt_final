const axios = require('axios')
require('dotenv').config()
const fs = require('fs')
const apiKEY = process.env.API_KEY
const baseUrl = "https://www.googleapis.com/youtube/v3"
// const ytdl = require('youtube-dl-exec')
const ytdl = require('ytdl-core')
const download = require('./downloadVideo')

request = require('request')


let playListId = ''

const channelId = process.argv[2]


async function startDownload (channelId) {

    if (!channelId) {
        console.log('Please provide an actual channelId')
        return
    }

    playListId = await getPlayListIdofChannelByChannelId(channelId)
    getVideosByPlayListId(playListId)
}

// async function getPlayListIdofChannelByUser (channelName) {


//     const url = `${baseUrl}/channels?key=${apiKEY}&type=channel&part=contentDetails&forUsername=${channelName}`
//     const response = await axios.get(url).catch(err => console.log(err))
//     console.log(response.data)
//     if (response.data.pageInfo.totalResults === 0) {
//         console.log('There was no channel with the')
//         return
//     }
//     playListId = response.data.items[0].contentDetails.relatedPlaylists.uploads


//     return playListId
// }
// async function getPlayListIdofChannelName (channelName) {


//     const url = `${baseUrl}/channels?key=${apiKEY}&type=channel&part=contentDetails&forUsername=${channelName}`
//     const response = await axios.get(url).catch(err => console.log(err))
//     console.log(response.data)
//     if (response.data.pageInfo.totalResults === 0) {
//         console.log('There was no channel with the')
//         return
//     }
//     playListId = response.data.items[0].contentDetails.relatedPlaylists.uploads


//     return playListId
// }

async function getPlayListIdofChannelByChannelId (channelId) {

    const url = `${baseUrl}/channels?key=${apiKEY}&type=playlist&part=snippet,contentDetails&id=${channelId}`
    const response = await axios.get(url)
    console.log(response.data)

    if (response.data.pageInfo.totalResults === 0) {

        console.log(`There was no channel with the id of ${channelId}`)
        return
    }
    playListId = response.data.items[0].contentDetails.relatedPlaylists.uploads
    return playListId
}

async function getVideosByPlayListId (playListId) {

    const url = `${baseUrl}/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playListId}&key=${apiKEY}`
    const response = await axios(url).catch(err => console.log)

    fs.writeFileSync('videos.json', JSON.stringify(response.data.items))
    await getRandomVideo(response.data.items)


}

async function getRandomVideo (videos) {

    const randomIndex = Math.floor(Math.random() * (videos.length - 1))
    const videoToDownload = videos[randomIndex]

    const videoUrl = `https://youtube.com/watch?v=${videoToDownload.snippet.resourceId.videoId}`
    await download(videoUrl, videoToDownload.id)

    for (const [key, value] of Object.entries(videoToDownload.snippet.thumbnails)) {
        request(value.url).pipe(fs.createWriteStream(`${__dirname}/videos/thumbnailsForLatestVideo/${key}.png`))
    }
    fs.writeFile('downloadedVideo.json', JSON.stringify(videoToDownload), (err) => console.log(err))

}

async function letsGo () {
    await startDownload(channelId)
}

letsGo()

