'use strict';

const Fs = require('fs');
const Os = require('os');
const Path = require('path');

const Code = require('code');
const Form = require('multi-part');
const Hapi = require('hapi');
const Lab = require('lab');

const Thurston = require('../lib');

const lab = exports.lab = Lab.script();

lab.experiment('Thurston', () => {

    let server;
    let invalid;
    let png;

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

    lab.beforeEach((done) => {
        // Create invalid format file
        invalid = Path.join(Os.tmpdir(), 'invalid');
        Fs.createWriteStream(invalid).on('error', done).end(Buffer.from('ffffffff', 'hex'), done);
    });

    lab.beforeEach((done) => {
        // Create fake png file
        png = Path.join(Os.tmpdir(), 'foo.png');
        Fs.createWriteStream(png).on('error', done).end(Buffer.from('89504e47', 'hex'), done);
    });

    lab.test('should return error if the file type validation fails', (done) => {

        const form = new Form();
        form.append('file', Fs.createReadStream(invalid));
        form.append('foo', 'bar');

        server.inject({ headers: form.getHeaders(), method: 'POST', payload: form.stream(), url: '/' }, (response) => {

            Code.expect(response.statusCode).to.equal(400);
            Code.expect(response.result).to.include(['message', 'validation']);
            Code.expect(response.result.message).to.equal('child \"file\" fails because [\"file\" type is unknown]');
            Code.expect(response.result.validation).to.include(['source', 'keys']);
            Code.expect(response.result.validation.source).to.equal('payload');
            Code.expect(response.result.validation.keys).to.include('file');
            done();
        });
    });

    lab.test('should return control to the server if all files the payload are allowed', (done) => {

        const form = new Form();
        form.append('file1', Fs.createReadStream(png));
        form.append('file2', Fs.createReadStream(png));
        form.append('foo', 'bar');

        server.inject({ headers: form.getHeaders(), method: 'POST', payload: form.stream(), url: '/' }, (response) => {

            Code.expect(response.statusCode).to.equal(200);
            done();
        });
    });
});
