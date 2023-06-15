# Compiling

This steps are only needed in case you want to recompile `bliplay.wasm`.

## 0. Setup `emscripten`

Install the `emscripten` enviroment (e.g. with `brew`):

```sh
$ brew install emscripten binaryen
```

Run the compiler command once to create the config file in `~/.emscripten`:

```sh
$ emcc
```

Edit `~/.emscripten` and make sure `LLVM_ROOT` points to the LLVM binaries inside the emscripten directory `/usr/local/Cellar/emscripten/1.37.25/libexec/llvm/bin` and `BINARYEN_ROOT` points to `/usr/local/Cellar/binaryen/89` (versions may change):

```
...
# this helps projects using emscripten find it
EMSCRIPTEN_ROOT = os.path.expanduser(os.getenv('EMSCRIPTEN', '/usr/local/Cellar/emscripten/1.37.25/libexec')) # directory
LLVM_ROOT = '/usr/local/Cellar/emscripten/1.38.11/libexec/llvm/bin'
BINARYEN_ROOT = os.path.expanduser(os.getenv('BINARYEN', '/usr/local/Cellar/binaryen/89')) # if not set, we will use it from ports
...
```

## 1. Checkout

Checkout the submodules:

```sh
git submodule update --init --recursive
```


## 2. Build

Build `bliplay.js` and `bliplay.wasm`:

```sh
$ make
```

## Running

You can now run `index.html` on a webserver. Opening it directly from the file system may not work. Or by running the following, which will start a nginx container:

```sh
make server-start
```

## Some Articles

- <https://medium.com/@eliamaino/calling-c-functions-from-javascript-with-emscripten-first-part-e99fb6eedb22>
- <https://stackoverflow.com/questions/41875728/pass-a-javascript-array-as-argument-to-a-webassembly-function>
