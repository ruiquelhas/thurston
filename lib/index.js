'use strict';

const Stream = require('stream');
const Houdin = require('houdin');

const internals = {};

internals.transform = function (item) {

    return new Promise((resolve, reject) => {

        if (!(item instanceof Stream.Readable)) {
            return resolve(item);
        }

        const transform = () => {

            const buffer = item.read(64);
            item.unshift(buffer);
            item.removeListener('readable', transform);

            return resolve(buffer);
        };

        return item.on('error', reject).once('readable', transform);
    });
};

exports.validate = async function (payload, options) {

    const items = Object.keys(Object.assign({}, payload));
    const dataPayload = {};

    for (const item of items) {
        dataPayload[item] = await internals.transform(payload[item]);
    }

    return Houdin.validate(dataPayload, options);
};
