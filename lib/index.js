'use strict';

const Stream = require('stream');

const Houdin = require('houdin');
const Items = require('items');

const internals = {};

internals.validate = function (payload, cache) {

    return function (item, next) {

        if (!(payload[item] instanceof Stream.Readable)) {
            return next();
        }

        const stream = payload[item];

        const handler = function () {

            cache[item] = stream.read(64);
            stream.unshift(cache[item]);
            stream.removeListener('readable', handler);

            next();
        };

        stream.on('error', next).once('readable', handler);
    };
};

exports.validate = function (payload, options, next) {

    const items = Object.keys(payload);
    const res = {};
    const iterator = internals.validate(payload, res);

    Items.serial(items, iterator, () => {

        Houdin.validate(res, options, (err) => {

            if (err) {
                return next(err);
            }

            next(null, payload);
        });
    });
};
