'use strict';

const Stream = require('stream');

const Houdin = require('houdin');
const Items = require('items');

const internals = {};

internals.validate = function (payload, accumulator) {

    return function (item, next) {

        if (!(payload[item] instanceof Stream.Readable)) {
            return next();
        }

        const stream = payload[item];

        const handler = function () {

            accumulator[item] = stream.read(64);
            stream.unshift(accumulator[item]);
            stream.removeListener('readable', handler);

            next();
        };

        stream.on('error', next).once('readable', handler);
    };
};

exports.validate = function (payload, options, next) {

    const items = Object.keys(Object.assign({}, payload));
    const result = {};
    const iterator = internals.validate(payload, result);

    Items.serial(items, iterator, () => {

        Houdin.validate(result, options, (err) => {

            if (err) {
                return next(err);
            }

            next(null, payload);
        });
    });
};
