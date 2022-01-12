var ffmpeg = require('fluent-ffmpeg')
const pathToFfmpeg = require('ffmpeg-static')
const ffprobe = require('ffprobe-static')
var downloadedVideo = require('../downloadedVideo.json')
const eventEmitter = require('../eventEmitter')

var pathofDownloadedVideo = `./videos/${downloadedVideo.id}.mp4`
var pathOfTrimmedVideo = `./videos/trimmed/${downloadedVideo.id}.mp4`

ffmpeg.ffprobe(pathofDownloadedVideo, function (err, metadata) {
    var videoDuration = metadata.format.duration
    var goalDuration = videoDuration - 20
    ffmpeg(pathofDownloadedVideo).setFfmpegPath(pathToFfmpeg)
        .setFfprobePath(ffprobe.path).output(pathOfTrimmedVideo).setDuration(goalDuration).withVideoCodec('copy')
        .withAudioCodec('copy').on('end', function (err) {
            if (!err) {
                console.log('conversion Done')
                eventEmitter.emit('doneTrimming')
            }
        })
        .on('error', function (err) {
            console.log('error: ', err)
        })
        .run()
})

