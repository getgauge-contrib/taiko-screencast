const fs = require('fs'),
    os = require('os'),
    path = require('path');
    
var _deviceWidth, _deviceHeight, _client, _outFile, _framesPath;

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
    _framesPath = fs.mkdtempSync(path.join(os.tmpdir(), 'taikoCastFrames'));
    _mkdirp(outPath);
    _client.on('Page.screencastFrame', (frame) => {
        _client.send('Page.screencastFrameAck', {sessionId: frame.sessionId});
        _deviceWidth = frame.metadata.deviceWidth;
        _deviceHeight = frame.metadata.deviceHeight;
        fs.writeFile(path.join(_framesPath, 'frame_'+Date.now()+'.png'), frame.data, 'base64', (err) => {
            if(err) console.error(err);
        });
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
    const pngFileStream = require('png-file-stream');
    const encoder = new GIFEncoder(_deviceWidth, _deviceHeight);
    pngFileStream(path.join(_framesPath, 'frame_*.png'))
        .pipe(encoder.createWriteStream({ repeat: -1, delay: 1000, quality: 10 }))
        .pipe(fs.createWriteStream(_outFile))
        .on('close', () => {
            console.log('Screencast saved to ' + _outFile);
        });
};

var clientHandler = async (taiko) => {
    _client = taiko.client();
}

module.exports = {
    'ID' : 'screencast',
    'clientHandler' : clientHandler,
    'startScreencast' : start,
    'pauseScreencast' : pause,
    'resumeScreencast' : resume,
    'stopScreencast' : stop,
};