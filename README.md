# thurston
Route-level file type validation for [hapi](https://github.com/hapijs/hapi) parsed `multipart/form-data` stream request payloads. Also works as a standalone module, and most importantly, works in tandem with [houdin](https://github.com/ruiquelhas/houdin) for a truly magical experience.

[![NPM Version][version-img]][version-url] [![Build Status][travis-img]][travis-url] [![Coverage Status][coveralls-img]][coveralls-url] [![Dependencies][david-img]][david-url] [![Dev Dependencies][david-dev-img]][david-dev-url]

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
  - [`async validate(payload, options)`](#async-validatepayload-options)
    - [Hapi](#hapi)
    - [Standalone](#standalone)
- [Supported File Types](#supported-file-types)

## Installation
Install via [NPM](https://www.npmjs.org).

```sh
$ npm install thurston
```

## Usage
### `async validate(payload, options)`
Validates all `Stream.Readable` values in a `payload` given a `whitelist` of file types provided in the `options`. Throws a [joi](https://github.com/hapijs/joi)-like `ValidationError` if some file type is not allowed or unknown otherwise it returns the original parsed payload.

### Hapi

```js
const Hapi = require('hapi');
const Thurston = require('thurston');

const server = new Hapi.Server({
    routes: {
        validate: {
            options: {
                whitelist: ['image/png']
            }
        }
    }
});

server.route({
    config: {
        validate: {
            // override the default `failAction` if you want further
            // details about the validation error
            failAction: (request, h, err) => {
                // throw the error as is
                throw err;
            },
            payload: Thurston.validate
        },
        payload: {
            output: 'stream',
            parse: true
        }
    }
});
```

### Standalone

```js
const Fs = require('fs');
const Thurston = require('thurston');

const options = { whitelist: ['image/png'] };

Fs.createWriteStream('file.png').end(Buffer.from('89504e470d0a1a0a', 'hex'));
const png = Fs.createReadStream('file.png');

try {
    const payload = await Thurston.validate({ file: png }, options);
    console.log(payload); // { file: ReadStream { _readableState: { ..., buffer: [ <Buffer 89 50> ], ... }, ... } }
}
catch (err) {
    // Unreachable code.
});
```

```js
const Fs = require('fs');
const Thurston = require('thurston');

const options = { whitelist: ['image/png'] };

Fs.createWriteStream('file.gif').end(Buffer.from('474946383761', 'hex'));
const gif = Fs.createReadStream('file.gif');

try {
    await Thurston.validate({ file: gif }, options);
}
catch (err) {
    console.log(err); // [ValidationError: child "file" fails because ["file" type is not allowed]]
}
```

## Supported File Types
The same as [file-type](https://github.com/sindresorhus/file-type/tree/v7.0.0#supported-file-types).

[coveralls-img]: https://img.shields.io/coveralls/ruiquelhas/thurston.svg?style=flat-square
[coveralls-url]: https://coveralls.io/github/ruiquelhas/thurston
[david-img]: https://img.shields.io/david/ruiquelhas/thurston.svg?style=flat-square
[david-url]: https://david-dm.org/ruiquelhas/thurston
[david-dev-img]: https://img.shields.io/david/dev/ruiquelhas/thurston.svg?style=flat-square
[david-dev-url]: https://david-dm.org/ruiquelhas/thurston?type=dev
[version-img]: https://img.shields.io/npm/v/thurston.svg?style=flat-square
[version-url]: https://www.npmjs.com/package/thurston
[travis-img]: https://img.shields.io/travis/ruiquelhas/thurston.svg?style=flat-square
[travis-url]: https://travis-ci.org/ruiquelhas/thurston
