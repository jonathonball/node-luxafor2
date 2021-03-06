const assert = require('assert');
const {Luxafor, API} = require('..');
const FOO = { BAR: 0x69 }; // A value unique to this test and outside the API

describe('Luxafor', function() {

    var luxafor = null;

    beforeEach(function() {
        luxafor = new Luxafor();
        luxafor.init();
    });

    describe('#init()', function() {
        it('should check that the attached device has the correct VID', function() {
            assert.strictEqual(luxafor.readEndpoint.device.deviceDescriptor.idVendor, API.VID);
        });
        it('should check that the attached device has the correct PID', function() {
            assert.strictEqual(luxafor.writeEndpoint.device.deviceDescriptor.idProduct, API.PID);
        });
        it('should accept a callback on init', function(done) {
            luxafor.init(() => { done(); });
        });
    });

    describe('#resetWriteBuffer()', function() {
        it('should be able to reset a previously set write buffer', function() {
            luxafor.buffer = Buffer.from([FOO.BAR]);
            luxafor.resetWriteBuffer(1);
            assert.strictEqual(luxafor.buffer.readUInt8(0,1), 0);
        });
    });

    describe('#setWriteBufferByte()', function() {
        it('should be able to write a byte in the write buffer', function() {
            luxafor.resetWriteBuffer(1);
            luxafor.setWriteBufferByte(0, FOO.BAR);
            assert.strictEqual(luxafor.buffer.readUInt8(0,1), FOO.BAR);
        });
    });

    describe('#readFromDeviceUntil()', function() {
        it('should get a byte from the device', function(done) {
            luxafor.readFromDeviceUntil(API.REPLY.OFF).then(() => {
                done();
            }).catch((err) => {
                done(err);
            });
        });
    });

    describe('#writeToDevice()', function() {
        it('should be able to write to the device', function(done) {
            luxafor.buffer = Buffer.from([0,0]);
            try {
                luxafor.writeToDevice();
                done();
            } catch(err) {
                done(err);
            }
        });
        it('should accept a callback', function(done) {
            luxafor.buffer = Buffer.from([0,0]);
            try {
                luxafor.writeToDevice(() => { done(); });
            } catch(err) {
                done(err);
            }
        });
    });

    /** The light doesn't reply for these.  Not testable. */
    describe.skip('#simpleColor()', function() { });
    describe.skip('#color()', function() { });
    describe.skip('#colorFade()', function() { });

    describe('#getApiValue()', function() {
        it('should be able to fetch API values', function() {
            assert.strictEqual(Luxafor.getApiValue('color', 'blue'), API.COLOR.BLUE);
            assert.strictEqual(Luxafor.getApiValue('WAVE_TYPE', 'unknown_5'), API.WAVE_TYPE.UNKNOWN_5);
            assert.strictEqual(Luxafor.getApiValue('byte', 'TIME'), API.BYTE.TIME);
            assert.strictEqual(Luxafor.getApiValue('wave_type', 5), API.WAVE_TYPE.UNKNOWN_5);
        });
        it('should return null if there is nothing to find', function() {
            assert.strictEqual(Luxafor.getApiValue('wave_type', 'disco'), null);
        });
    });

    describe('#findApiReply()', function() {
        let goodBuffer = Buffer.from([0, 9, 0, 0, 0, 0, 0, 0]);
        let badBuffer = Buffer.from([FOO.BAR]);
        it('should return the name of a valid buffer', function() {
            assert.strictEqual(Luxafor.findApiReply(goodBuffer), 'PATTERN');
        });
        it('should throw an error if it is an unknown byte', function() {
            assert.throws(() => {
                Luxafor.findApiReply(badBuffer);
            }, Error);
        });
    });

    describe('#isDeviceInfoBuffer()', function() {
        let goodBuffer = Buffer.from([API.COMMAND.DEVICE_INFO, 0, 0, 0, 0, 0, 0, 0]);
        let badBuffer = API.REPLY.WAVE_5;
        it('should determine if a buffer is a DEVICE_INFO buffer', function() {
            assert.strictEqual(Luxafor.isDeviceInfoBuffer(goodBuffer), true);
            assert.strictEqual(Luxafor.isDeviceInfoBuffer(badBuffer), false);
        });
    });

    describe('#getDeviceInfo()', function() {
        this.retries(4);
        it('should get firmware and serial numbers from the light', function(done) {
            luxafor.getDeviceInfo().then((buffer) => {
                assert.strictEqual(buffer.readUInt8(0,1), API.COMMAND.DEVICE_INFO);
                assert.notStrictEqual(buffer.readUInt8(1,1), 0);
                assert.notStrictEqual(buffer.readUInt8(2,1), 0);
                done();
            }).catch((err) => {
                done(err);
            });
        });
    });

});
