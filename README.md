# Taiko Screencast Plugin

A plugin to record a gif video of a [taiko](https://github.com/getgauge/taiko) script run.

## Install


```
npm install --save-dev taiko-screencast
```

## Example

```
const {startScreencast, stopScreencast} = require('./taiko-screencast');

(async () => {
    try {
        await openBrowser();
        await startScreencast('output.gif');
        // more actions
        // ...
    } finally {
        await stopScreencast();
        await closeBrowser();
    }
})();

```

## License

MIT