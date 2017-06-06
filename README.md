# thurston
Route-level file type validation for [hapi](https://github.com/hapijs/hapi) parsed `multipart/form-data` stream request payloads. Also works as a standalone module, and most importantly, works in tandem with [houdin](https://github.com/ruiquelhas/houdin) for a truly magical experience.

[![NPM Version][version-img]][version-url] [![Build Status][travis-img]][travis-url] [![Coverage Status][coveralls-img]][coveralls-url] [![Dependencies][david-img]][david-url] [![Dev Dependencies][david-dev-img]][david-dev-url]

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
  - [`validate(payload, options, fn)`](#validatepayload-options-fn)
    - [Hapi](#hapi)
    - [Standalone](#standalone)
- [Supported File Types](#supported-file-types)

## Installation
Install via [NPM](https://www.npmjs.org).

```sh
$ npm install thurston
```

## Usage
### `validate(payload, options, fn)`
Validates all `Stream.Readable` values in a `payload` given a `whitelist` of file types provided in the `options`. Results in a [joi](https://github.com/hapijs/joi)-like `ValidationError` if some file type is not allowed or unknown otherwise it returns the original parsed payload to account for additional custom validation.

### Hapi

```js
const Hapi = require('hapi');
const Thurston = require('thurston');

const server = new Hapi.Server();

server.connection({
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

Fs.createWriteStream('file.png').end(Buffer.from('89504e47', 'hex'));
const png = Fs.createReadStream('file.png');

Thurston.validate({ file: png }, options, (err, value) => {

    console.log(err); // null
    console.log(value); // { file: ReadStream { _readableState: { ..., buffer: [ <Buffer 89 50> ], ... }, ... } }
});
```

```js
const Fs = require('fs');
const Thurston = require('thurston');

const options = { whitelist: ['image/png'] };

Fs.createWriteStream('file.gif').end(Buffer.from('47494638', 'hex'));
const gif = Fs.createReadStream('file.gif');

Thurston.validate({ file: gif }, options, (err, value) => {

    console.log(err); // [ValidationError: child "file" fails because ["file" type is not allowed]]
    console.log(value); // undefined
});
```

## Supported File Types
The same as [file-type](https://github.com/sindresorhus/file-type#supported-file-types).

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
