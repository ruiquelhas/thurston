'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const Code = require('code');
const FormData = require('form-data');
const Hapi = require('hapi');
const Lab = require('lab');
const streamToPromise = require('stream-to-promise');

const lab = exports.lab = Lab.script();
const Thurston = require('../lib');

lab.experiment('Thurston', () => {

    let server;

    lab.before((done) => {

        server = new Hapi.Server();
        server.connection({
            routes: {
                validate: {
                    options: {
                        whitelist: ['png']
                    }
                }
            }
        });

        server.route({
            config: {
                handler: (request, reply) => reply(),
                payload: {
                    output: 'stream',
                    parse: true
                },
                validate: {
                    payload: Thurston.validate
                }
            },
            method: 'POST',
            path: '/'
        });

        done();
    });

    lab.test('should return control to the server if the payload does not contain any file', (done) => {

        const form = new FormData();
        form.append('foo', 'bar');

        streamToPromise(form).then((payload) => {

            server.inject({ headers: form.getHeaders(), method: 'POST', payload: payload, url: '/' }, (response) => {

                Code.expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });

    lab.test('should return error if the file type validation fails', (done) => {

        const invalid = path.join(os.tmpdir(), 'invalid');

        fs.createWriteStream(invalid).end(new Buffer([0x00]));

        const form = new FormData();
        form.append('file', fs.createReadStream(invalid));
        form.append('foo', 'bar');

        streamToPromise(form).then((payload) => {

            server.inject({ headers: form.getHeaders(), method: 'POST', payload: payload, url: '/' }, (response) => {

                Code.expect(response.statusCode).to.equal(400);
                Code.expect(response.result).to.include(['message', 'validation']);
                Code.expect(response.result.message).to.equal('child \"file\" fails because [\"file\" could not be validated]');
                Code.expect(response.result.validation).to.include(['source', 'keys']);
                Code.expect(response.result.validation.source).to.equal('payload');
                Code.expect(response.result.validation.keys).to.include('file');
                done();
            });
        });
    });

    lab.test('should return control to the server if all files the payload are allowed', (done) => {

        const png = path.join(os.tmpdir(), 'foo.png');

        fs.createWriteStream(png).end(new Buffer([0x89, 0x50]));

        const form = new FormData();
        form.append('file1', fs.createReadStream(png));
        form.append('file2', fs.createReadStream(png));
        form.append('foo', 'bar');

        streamToPromise(form).then((payload) => {

            server.inject({ headers: form.getHeaders(), method: 'POST', payload: payload, url: '/' }, (response) => {

                Code.expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });
});
