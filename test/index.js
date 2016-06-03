'use strict';

const Fs = require('fs');
const Os = require('os');
const Path = require('path');

const Code = require('code');
const Form = require('multi-part').buffer;
const Hapi = require('hapi');
const Lab = require('lab');

const Thurston = require('../lib');

const lab = exports.lab = Lab.script();

lab.experiment('Thurston', () => {

    let server;

    lab.before((done) => {

        server = new Hapi.Server();
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

    lab.test('should return error if the file type validation fails', (done) => {

        const invalid = Path.join(Os.tmpdir(), 'invalid');

        Fs.createWriteStream(invalid).end(new Buffer('ffffffff', 'hex'));

        const form = new Form();
        form.append('file', Fs.createReadStream(invalid));
        form.append('foo', 'bar');

        form.getWithOptions((err, data) => {

            if (err) {
                return done(err);
            }

            server.inject({ headers: data.headers, method: 'POST', payload: data.body, url: '/' }, (response) => {

                Code.expect(response.statusCode).to.equal(400);
                Code.expect(response.result).to.include(['message', 'validation']);
                Code.expect(response.result.message).to.equal('child \"file\" fails because [\"file\" type is unknown]');
                Code.expect(response.result.validation).to.include(['source', 'keys']);
                Code.expect(response.result.validation.source).to.equal('payload');
                Code.expect(response.result.validation.keys).to.include('file');
                done();
            });
        });
    });

    lab.test('should return control to the server if all files the payload are allowed', (done) => {

        const png = Path.join(Os.tmpdir(), 'foo.png');

        Fs.createWriteStream(png).end(new Buffer('89504e47', 'hex'));

        const form = new Form();
        form.append('file1', Fs.createReadStream(png));
        form.append('file2', Fs.createReadStream(png));
        form.append('foo', 'bar');

        form.getWithOptions((err, data) => {

            if (err) {
                return done(err);
            }

            server.inject({ headers: data.headers, method: 'POST', payload: data.body, url: '/' }, (response) => {

                Code.expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });
});
