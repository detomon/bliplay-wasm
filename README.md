# bliplay WebAssembly Version

This is a version of [bliplay](https://github.com/detomon/bliplay) compiled for WebAssembly. It uses the browser's `AudioContext` API to output sound.

See the [wiki](https://github.com/detomon/bliplay/wiki) for the syntax description.

## Interactive Editor

The [interactive code editor](https://detomon.github.io/bliplay-wasm/) allows to write `.blip` code. It dynamically compiles the code and outputs the sound. It should run in all major browsers.

![bliplay editor](assets/img/editor.gif)

## Shareble URLs

The editor supports shareable URLs, which contain a compressed version of the editor code in the URL fragment. [This page](https://detomon.github.io/bliplay-wasm/links.html) contains some examples.

The format looks like this:

```
https://detomon.github.io/bliplay-wasm/#s=<data>
```

Where `<data>` is a Base64 encoded and gzip compressed (deflated) string:

```
data = base64_encode(gzcompress("a:c4;s:4;...")).
```
