# Taiko Screencast Plugin

A plugin to record a gif video of a [taiko](https://github.com/getgauge/taiko) script run.

## Install


```
npm install --save-dev taiko-screencast
```

## Example

Add this script in a file `script.js`.

```
const { openBrowser, closeBrowser, click, screencast } = require('taiko');

(async () => {
    try {
        await openBrowser();
        await screencast.startScreencast('output.gif');
        await goto('gauge.org');
        await click('Plugins');
        // more actions
        // ...
    } finally {
        await screencast.stopScreencast();
        await closeBrowser();
    }
})();

```

Run script with:
```
taiko script.js
taiko script.js --plugin taiko-screencast //Use --plugin to load a plugin in case of multiple plugins.
```


## License

MIT