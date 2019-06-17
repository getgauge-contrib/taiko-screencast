const fs = require('fs'),
    path = require('path');
    
var _deviceWidth, _deviceHeight, _client, _outFile,_eventHandler, _frames = [];

var _mkdirp = (p) => {
    if (!fs.existsSync(p)){
        fs.mkdirSync(p, {recursive: true});
    }
};

/**
 * Starts capture of Screencast
 * The screencast captures frames in the active browser tab.
 * Use @see stopScreencast to conclude the recording.
 * {@link pause} and {@link resume} can be used to skip recording of any intermediate steps.
 * Only supports saving to 'gif' format presently.
 * @param outFile the path to save the screencast. Filename must have '.gif' extension.
 */

var start = async (outFile) => {
    if (path.extname(outFile) !== '.gif') {
        throw new Error('Outfile should have .gif extension');
    }
    _outFile = outFile;
    var outPath = path.dirname(outFile);
    _mkdirp(outPath);
    _client.on('Page.screencastFrame', (frame) => {
        _client.send('Page.screencastFrameAck', {sessionId: frame.sessionId});
        _deviceWidth = frame.metadata.deviceWidth;
        _deviceHeight = frame.metadata.deviceHeight;
        _frames.push(frame.data);
    });
    _eventHandler.once('createdSession', (client) => {
        _client = client;
        start(_outFile);
    });
    await resume();
};


/**
 * Resumes a paused screencast.
 */
var resume = async () => {
    await _client.send('Page.startScreencast', {format: 'png'});
};

/**
 * Pauses an active screencast. {@link resume} should be called to resume. 
 * Note that the screencast is still not saved at this point, and only
 * a call to {@link stopScreencast} will save the output.
 */
var pause = async () => {
    await _client.send('Page.stopScreencast');
};

/**
 * Stops the screencast recording and saves the frames as a Gif file.
 */
var stop = async () => {
    // this is required so that the screencast is not stopped prematurely.
    await new Promise(resolve => setTimeout(resolve, 500));
    await pause();
    const GIFEncoder = require('gifencoder');
    const encoder = new GIFEncoder(_deviceWidth, _deviceHeight);
    const {createCanvas, Image} = require('canvas');
    encoder.createReadStream()
        .pipe(fs.createWriteStream(_outFile))
        .on('close', () => {
            console.log('Screencast saved to ' + _outFile);
        });
    encoder.setDelay(1000);
    encoder.setRepeat(0);
    encoder.setQuality(10);
    encoder.start();
    var canvas = createCanvas(_deviceWidth, _deviceHeight);
    var ctx = canvas.getContext('2d');
    for (let i = 0; i < _frames.length; i++) {
        var img = new Image;
        img.src = 'data:image/png;base64,' + _frames[i];
        ctx.drawImage(img, 0, 0, _deviceWidth, _deviceHeight);
        encoder.addFrame(ctx);
    }
    encoder.finish();
};

var clientHandler = async (taiko, eventHandler) => {
    _eventHandler = eventHandler;
    _eventHandler.on('createdSession', () => {
        _client = taiko.client();
    });
};

module.exports = {
    'ID' : 'screencast',
    'init' : clientHandler,
    'startScreencast' : start,
    'pauseScreencast' : pause,
    'resumeScreencast' : resume,
    'stopScreencast' : stop,
};