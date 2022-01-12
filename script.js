

const eventEmitter = require(`./eventEmitter.js`)


const functionToRun = () => {
    if (process.argv[2] === 'start') {
        download()
        eventEmitter.on('doneDownloading', () => {
            console.log('done downloading and processing')
            trim()

            eventEmitter.on('doneTrimming', () => {
                console.log('done trimming')
                upload()
            })
        })

    } else {
        console.log('use the start command to start the script')
    }

}

function download () {
    require(`./scriptFiles/quickstart.js`)
}

function trim () {
    require(`./scriptFiles/trimVideo.js`)
}

function upload () {
    require(`./scriptFiles/videoUpload.js`)
}

functionToRun()