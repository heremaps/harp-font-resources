# @here/harp-font-resources [![Build Status](https://travis-ci.com/heremaps/harp-font-resources.svg?branch=master)](https://travis-ci.com/heremaps/harp-font-resources)

This repo is __DEPRECATED__, please use [fontcatalog](https://github.com/heremaps/harp-fontcatalog) instead.

This module contains a font catalog to be used in the `harp.gl` renderer.

For information about coding style or contributing, please refer to the information main project [harp.gl](https://github.com/heremaps/harp.gl).

## Development

### Prerequisites

* __Node.js__ - Please see [nodejs.org](https://nodejs.org/) for installation instructions
* __Yarn__ -  Please see [yarnpkg.com](https://yarnpkg.com/en/) for installation instructions.

### Download dependencies

Run:

```sh
yarn install
```

to download and install all required packages and set up the yarn workspace.

### Run unit tests in Node.js environment

Run:

```sh
yarn test
```

### FontCatalog Description

To generate your own __FontCatalog__ assets to use with [harp.gl](https://github.com/heremaps/harp.gl), you need to supply a __JSON__ file containing your __FontCatalog__ description. This file is composed of the following paremeters:

* __name__: FontCatalog's name (Default: __Default__).
* __size__: FontCatalog's glyph pixel size (Default: __32__).
* __distance__: FontCatalog's glyph pixel distance (Default: __8__).
* __type__: FontCatalog's glyph type, which could be regular __SDF__ or __MSDF__ (Default: __SDF__).
* __fontsDir__: Relative path to the directory where all the __.ttf__ font files for this FontCatalog are stored.
* __fonts__: Array containing all the fonts to be included in this FontCatalog. Every font entry is composed of:
  - __name__: Font's name.
  - __bold__: Font's bold variant (__Optional__).
  - __italic__: Font's italic variant (__Optional__).
  - __boldItalic__: Font's boldItalic variant (__Optional__).
  - __blocks__: Array containing the specific [Unicode Blocks](https://en.wikipedia.org/wiki/Unicode_block) of this font for which we want to generate glyphs (__Optional__).

The __size__, __distance__ and __type__ parameters influence how __SDF__ glyphs are rasterize, and thus, can affect the quality of the output FontCatalog. To learn more about __Font SDF Rasterization__, visit the [msdfgen](https://github.com/Chlumsky/msdfgen) repository.

### FontCatalog Generation

Run:

```sh
yarn create-font-catalog -- -i <PATH_TO_DESCRIPTION> -o <OUTPUT_PATH>
```

Which will output assets in the following directory structure:

```
├── <NAME>_Assets
│   ├── Extra
│   │   ├── Specials.json
│   │   └── Specials.png
│   ├── FontA
│   │   ├── Basic_Latin.json
│   │   ├── Basic_Latin.png
│   │   └── ...
│   ├── FontB
│   │   ├── Basic_Latin.json
│   │   ├── Basic_Latin.png
│   │   └── ...
│   └── ...
├── <NAME>_BoldAssets (if any)
│   └── ...
├── <NAME>_ItalicAssets (if any)
│   └── ...
├── <NAME>_BoldItalicAssets (if any)
│   └── ...
└── <NAME>_FontCatalog.json
```

To use these assets with your [harp.gl](https://github.com/heremaps/harp.gl) theme files, copy all of them to your ``resources`` folder and reference them from the theme with a __relative path__:

```json
"fontCatalogs": [
    {
        "name": "<NAME>",
        "url": "./<NAME>_FontCatalog.json"
    }
]
```


## License

Copyright (C) 2018-2019 HERE Europe B.V.

See the [LICENSE](./LICENSE) file in the root of this project for license details.

Please note that the individual fonts are under different licenses: [resources-dev/fonts/README.md](resources-dev/fonts/README.md)
