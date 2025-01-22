# Senior Project README

## Installation

For precompiled binaries, visit our [Releases](https://github.com/COSC481W-2025Winter/KeepOrDelete/releases) page.

### Install from source

<!-- inspo from https://github.com/neovim/neovim/blob/master/INSTALL.md#install-from-source -->

Prerequisites:

+ [Git](https://git-scm.com)
+ [npm](https://www.npmjs.com/)

Clone this repo using Git.

<!-- https://github.com/COSC481W-2025Winter/KeepOrDelete -->

```
git clone https://github.com/massivebird/electron-forge-test
```

Install project dependencies:

```
cd electron-forge-test
npm install
```

Run the application:

```
npm start
```

#### NixOS

If you are on NixOS and receive the following error:

```
$ npm start
# ...
/home/user/KeepOrDelete/node_modules/electron/dist/electron: error while loading shared libraries: libglib-2.0.so.0: cannot open shared object file: No such file or directory
```

Replace the Electron binary at `node_modules/electron/dist/electron` with a soft link to one installed via Nix (wherever that may be on your system):

```
rm node_modules/electron/dist/electron
ln -s /run/current-system/sw/bin/electron node_modules/electron/dist/electron
```
