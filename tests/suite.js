/*
 Copyright 2013 Daniel Wirtz <dcode@dcode.io>

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/**
 * ByteBuffer.js Test Suite.
 * @author Daniel Wirtz <dcode@dcode.io>
 */

/**
 * File to use.
 * @type {string}
 */
var BYTEBUFFER_FILE = "../ByteBuffer.min.js";

/**
 * ByteBuffer.
 * @type {ByteBuffer}
 */
var ByteBuffer = require(BYTEBUFFER_FILE);

/**
 * Constructs a new Sandbox for module loaders and shim testing.
 * @param {Object.<string,*>} properties Additional properties to set
 * @constructor
 */
var Sandbox = function(properties) {
    this.Int8Array = function() {};
    this.Uint8Array = function() {};
    this.Int16Array = function() {};
    this.Uint16Array = function() {};
    this.Int32Array = function() {};
    this.Uint32Array = function() {};
    this.Float32Array = function() {};
    this.Float64Array = function() {};
    for (var i in properties) {
        this[i] = properties[i];
    }
    this.console = {
        log: function(s) {
            console.log(s);
        }
    };
};

/**
 * Test suite.
 * @type {Object.<string,function>}
 */
var suite = {

    setUp: function (callback) {
        callback();
    },
    
    tearDown: function (callback) {
        callback();
    },
    
    "init": function(test) {
        test.ok(typeof ByteBuffer == "function");
        test.ok(typeof ByteBuffer.encodeUTF8Char == "function");
        test.done();
    },

    "construct/allocate": function(test) {
        var bb = new ByteBuffer();
        test.equal(bb.array.byteLength, ByteBuffer.DEFAULT_CAPACITY);
        bb = ByteBuffer.allocate();
        test.equal(bb.array.byteLength, ByteBuffer.DEFAULT_CAPACITY);
        test.done();
    },
    
    "wrap(ArrayBuffer)": function(test) {
        var buf = new ArrayBuffer(1);
        var bb = ByteBuffer.wrap(buf);
        test.strictEqual(bb.array, buf);
        test.equal(bb.offset, 0);
        test.equal(bb.length, 1);
        test.done();
    },
    
    "wrap(Uint8Array)": function(test) {
        var buf = new Uint8Array(1);
        var bb = ByteBuffer.wrap(buf);
        test.strictEqual(bb.array, buf.buffer);
        test.done();
    },
    
    "wrap(ByteBuffer)": function(test) {
        var bb2 = new ByteBuffer(1);
        var bb = ByteBuffer.wrap(bb2);
        test.strictEqual(bb.array, bb2.array);
        test.done();
    },
    
    "wrap(String)": function(test) {
        var bb = ByteBuffer.wrap("test");
        test.equal(bb.offset, 0);
        test.equal(bb.length, 4);
        test.equal(bb.readUTF8String(4), "test");
        test.done();
    },

    "resize": function(test) {
        var bb = new ByteBuffer(1);
        bb.resize(2);
        test.equal(bb.array.byteLength, 2);
        test.equal(bb.toHex(), "|00 00 ");
        test.done();
    },
    
    "slice": function(test) {
        var bb = new ByteBuffer(3);
        bb.writeUint8(0x12).writeUint8(0x34).writeUint8(0x56);
        var bb2 = bb.slice(1,2);
        test.strictEqual(bb.array, bb2.array);
        test.equal(bb.offset, 3);
        test.equal(bb.length, 0);
        test.equal(bb2.offset, 1);
        test.equal(bb2.length, 2);
        test.done();
    },

    "sliceAndCompact": function(test) {
        var bb = new ByteBuffer(3);
        bb.writeUint8(0x12).writeUint8(0x34).writeUint8(0x56);
        var bb2 = bb.sliceAndCompact(1,2);
        test.notStrictEqual(bb, bb2);
        test.notStrictEqual(bb.array, bb2.array);
        test.equal(bb2.offset, 0);
        test.equal(bb2.length, 1);
        test.equal(bb2.toHex(), "<34>");
        test.done();
    },

    "ensureCapacity": function(test) {
        var bb = new ByteBuffer(5);
        test.equal(bb.array.byteLength, 5);
        bb.ensureCapacity(6);
        test.equal(bb.array.byteLength, 10);
        bb.ensureCapacity(21);
        test.equal(bb.array.byteLength, 21);
        test.done();
    },

    "flip": function(test) {
        var bb = new ByteBuffer(4);
        bb.writeUint32(0x12345678);
        test.equal(bb.offset, 4);
        test.equal(bb.length, 0);
        bb.flip();
        test.equal(bb.offset, 0);
        test.equal(bb.length, 4);
        test.done();
    },

    "reset": function(test) {
        var bb = new ByteBuffer(4);
        bb.writeUint32(0x12345678);
        bb.reset();
        test.equal(bb.offset, 0);
        test.equal(bb.length, 0);
        test.done();
    },


    "clone": function(test) {
        var bb = new ByteBuffer(1);
        var bb2 = bb.clone();
        test.strictEqual(bb.array, bb2.array);
        test.equal(bb.offset, bb2.offset);
        test.equal(bb.length, bb2.length);
        test.notStrictEqual(bb, bb2);
        test.done();
    },
    
    "copy": function(test) {
        var bb = new ByteBuffer(1);
        bb.writeUint8(0x12);
        var bb2 = bb.copy();
        test.notStrictEqual(bb, bb2);
        test.notStrictEqual(bb.array, bb2.array);
        test.equal(bb2.offset, bb.offset);
        test.equal(bb2.length, bb.length);
        test.done();
    },
    
    "compact": function(test) {
        var bb = new ByteBuffer(2);
        bb.writeUint8(0x12);
        var prevArray = bb.array;
        bb.compact();
        test.notStrictEqual(bb.array, prevArray);
        test.equal(bb.array.byteLength, 1);
        test.equal(bb.offset, 0);
        test.equal(bb.length, 1);
        test.done();
    },
    
    "destroy": function(test) {
        var bb = new ByteBuffer(1);
        bb.writeUint8(0x12);
        bb.destroy();
        test.strictEqual(bb.array, null);
        test.equal(bb.offset, 0);
        test.equal(bb.length, 0);
        test.equal(bb.toHex(), "DESTROYED");
        test.done();
    },
    
    "reverse": function(test) {
        var bb = new ByteBuffer(4);
        bb.writeUint32(0x12345678);
        bb.flip();
        bb.reverse();
        test.equal(bb.toHex(), "<78 56 34 12>");
        test.done();
    },
    
    "append": function(test) {
        var bb = new ByteBuffer(2);
        bb.writeUint16(0x1234);
        bb.flip();
        var bb2 = new ByteBuffer(2);
        bb2.writeUint16(0x5678);
        bb2.flip();
        bb.append(bb2);
        test.equal(bb.toHex(), "<12 34 56 78>");
        bb.length = 0;
        bb.append(bb2, 1);
        test.equal(bb.toHex(), "|12 56 78 78 ");
        test.done();
    },
    
    "prepend": function(test) {
        var bb = new ByteBuffer(2);
        bb.writeUint16(0x1234);
        bb.flip();
        var bb2 = new ByteBuffer(2);
        bb2.writeUint16(0x5678);
        bb2.flip();
        bb.prepend(bb2);
        test.equal(bb.toHex(), "<56 78 12 34>");
        bb.offset = 4;
        bb.prepend(bb2, 3);
        test.equal(bb.toHex(), " 56 56 78 34|")
        test.done();
    },
    
    "write/readInt8": function(test) {
        var bb = new ByteBuffer(1);
        bb.writeInt8(0xFF);
        bb.flip();
        test.equal(-1, bb.readInt8());
        test.done();
    },

    "write/readByte": function(test) {
        var bb = new ByteBuffer(1);
        test.strictEqual(bb.readInt8, bb.readByte);
        test.strictEqual(bb.writeInt8, bb.writeByte);
        test.done();
    },
    
    "write/readUint8": function(test) {
        var bb = new ByteBuffer(1);
        bb.writeUint8(0xFF);
        bb.flip();
        test.equal(0xFF, bb.readUint8());
        test.done();
    },
    
    "write/readInt16": function(test) {
        var bb = new ByteBuffer(2);
        bb.writeInt16(0xFFFF);
        bb.flip();
        test.equal(-1, bb.readInt16());
        test.done();
    },
    
    "write/readShort": function(test) {
        var bb = new ByteBuffer(1);
        test.strictEqual(bb.readInt16, bb.readShort);
        test.strictEqual(bb.writeInt16, bb.writeShort);
        test.done();
    },

    "write/readUint16": function(test) {
        var bb = new ByteBuffer(2);
        bb.writeUint16(0xFFFF);
        bb.flip();
        test.equal(0xFFFF, bb.readUint16());
        test.done();
    },
    
    "write/readInt32": function(test) {
        var bb = new ByteBuffer(4);
        bb.writeInt32(0xFFFFFFFF);
        bb.flip();
        test.equal(-1, bb.readInt32());
        test.done();
    },
    
    "write/readInt": function(test) {
        var bb = new ByteBuffer(1);
        test.strictEqual(bb.readInt32, bb.readInt);
        test.strictEqual(bb.writeInt32, bb.writeInt);
        test.done();
    },
    
    "write/readUint32": function(test) {
        var bb = new ByteBuffer(4);
        bb.writeUint32(0x12345678);
        bb.flip();
        test.equals(0x12345678, bb.readUint32());
        test.done();
    },
    
    "write/readFloat32": function(test) {
        var bb = new ByteBuffer(4);
        bb.writeFloat32(0.5);
        bb.flip();
        test.equals(0.5, bb.readFloat32()); // 0.5 remains 0.5 if Float32
        test.done();
    },
    
    "write/readFloat": function(test) {
        var bb = new ByteBuffer(1);
        test.strictEqual(bb.readFloat32, bb.readFloat);
        test.strictEqual(bb.writeFloat32, bb.writeFloat);
        test.done();
    },
    
    "write/readFloat64": function(test) {
        var bb = new ByteBuffer(8);
        bb.writeFloat64(0.1);
        bb.flip();
        test.equals(0.1, bb.readFloat64()); // would be 0.10000000149011612 if Float32
        test.done();
    },
    
    "write/readDouble": function(test) {
        var bb = new ByteBuffer(1);
        test.strictEqual(bb.readFloat64, bb.readDouble);
        test.strictEqual(bb.writeFloat64, bb.writeDouble);
        test.done();
    },
    
    "write/readLong": function(test) {
        var bb = new ByteBuffer(8);
        test.strictEqual(bb.writeFloat64, bb.writeLong);
        var max = Math.pow(2,52)-0.5;
        bb.writeLong(max);
        test.notEqual(max, bb.readLong(0));
        test.equal(Math.round(max), bb.readLong(0));
        max = Math.pow(2,53)-1;
        bb.reset();
        bb.writeLong(max);
        bb.flip();
        test.equal(max, bb.readLong());
        bb.reset();
        bb.writeLong(max+2);
        bb.flip();
        test.equal(max+2, bb.readLong());
        test.done();
    },
    
    "zigZagEncode/Decode32": function(test) {
        var values = [
            [ 0, 0],
            [-1, 1],
            [ 1, 2],
            [-2, 3],
            [ 2, 4],
            [-3, 5],
            [ 3, 6],
            [ 2147483647, 4294967294],
            [-2147483648, 4294967295]
        ];
        for (var i=0; i<values.length; i++) {
            test.equal(ByteBuffer.zigZagEncode32(values[i][0]), values[i][1]);
            test.equal(ByteBuffer.zigZagDecode32(values[i][1]), values[i][0]);
        }
        test.done();
    },
    
    "write/readVarint32": function(test) {
        var values = [
            [1,1],
            [300,300],
            [0x7FFFFFFF, 0x7FFFFFFF],
            [0xFFFFFFFF, -1],
            [0x80000000, -2147483648]
        ];
        var bb = new ByteBuffer(10);
        for (var i=0; i<values.length; i++) {
            var calcLen = ByteBuffer.calculateVarint32(values[i][0]);
            var encLen = bb.writeVarint32(values[i][0], 0);
            var dec = bb.readVarint(0);
            // console.log("  Testing Varint32: "+values[i][0]+" == "+values[i][1]+"\n    calc: length="+calcLen+"\n    enc:  length="+encLen+"\n    dec:  length="+dec['length']+", value="+dec['value']);
            test.equal(values[i][1], dec['value']);
            test.equal(encLen, dec['length']);
        }
        test.done();
    },
    
    "write/readVarint": function(test) {
        var bb = new ByteBuffer(1);
        test.strictEqual(bb.readVarint32, bb.readVarint);
        test.strictEqual(bb.writeVarint32, bb.writeVarint);
        test.done();
    },
    
    "write/readLString": function(test) {
        var bb = new ByteBuffer(2);
        bb.writeLString("ab"); // resizes to 4
        test.equal(bb.array.byteLength, 4);
        test.equal(bb.offset, 3);
        test.equals(bb.length, 0);
        bb.flip();
        test.equal(bb.toHex(), "<02 61 62>00 ");
        test.deepEqual({"string": "ab", "length": 3}, bb.readLString(0));
        test.equal(bb.toHex(), "<02 61 62>00 ");
        test.equal("ab", bb.readLString());
        test.equal(bb.toHex(), " 02 61 62|00 ");
        test.done();
    },

    "write/readVString": function(test) {
        var bb = new ByteBuffer(2);
        bb.writeVString("ab"); // resizes to 4
        test.equal(bb.array.byteLength, 4);
        test.equal(bb.offset, 3);
        test.equals(bb.length, 0);
        bb.flip();
        test.equal(bb.toHex(), "<02 61 62>00 ");
        test.deepEqual({"string": "ab", "length": 3}, bb.readVString(0));
        test.equal(bb.toHex(), "<02 61 62>00 ");
        test.equal("ab", bb.readLString());
        test.equal(bb.toHex(), " 02 61 62|00 ");
        test.done();
    },
    
    "write/readCString": function(test) {
        var bb = new ByteBuffer(2);
        bb.writeCString("ab"); // resizes to 4
        test.equal(bb.array.byteLength, 4);
        test.equal(bb.offset, 3);
        test.equal(bb.length, 0);
        bb.flip();
        test.equal(bb.toHex(), "<61 62 00>00 ");
        test.deepEqual({"string": "ab", "length": 3}, bb.readCString(0));
        test.equal(bb.toHex(), "<61 62 00>00 ");
        test.equal("ab", bb.readCString());
        test.equal(bb.toHex(), " 61 62 00|00 ");
        test.done();
    },
    
    "write/readJSON": function(test) {
        var bb = new ByteBuffer();
        var data = {"x":1};
        bb.writeJSON(data);
        bb.flip();
        test.deepEqual(data, bb.readJSON());
        test.done();
    },
    
    "toHex": function(test) {
        var bb = new ByteBuffer(3);
        bb.writeUint16(0x1234);
        test.equal(bb.toHex(), ">12 34<00 ");
        test.done();
    },
    
    "toString": function(test) {
        var bb = new ByteBuffer(3);
        bb.writeUint16(0x1234);
        test.equal(bb.toString(), "ByteBuffer(offset=2,length=0,capacity=3)");
        test.done();
    },
    
    "toArrayBuffer": function(test) {
        var bb = new ByteBuffer(3);
        bb.writeUint16(0x1234);
        var buf = bb.toArrayBuffer();
        test.equal(buf.byteLength, 2);
        test.equal(buf[0], 0x12);
        test.equal(buf[1], 0x34);
        test.equal(bb.offset, 2);
        test.equal(bb.length, 0);
        test.equal(bb.array.byteLength, 3);
        test.done();
    },
    
    "printDebug": function(test) {
        var bb = new ByteBuffer(3);
        test.ok(typeof bb.printDebug(true) == 'string');
        function callMe() { callMe.called = true; };
        bb.printDebug(callMe);
        test.ok(callMe.called);
        test.done();
    },
    
    "encode/decode/calculateUTF8Char": function(test) {
        var bb = new ByteBuffer(6)
          , chars = [0x00, 0x7F, 0x80, 0x7FF, 0x800, 0xFFFF, 0x10000, 0x1FFFFF, 0x200000, 0x3FFFFFF, 0x4000000, 0x7FFFFFFF]
          , dec;
        for (var i=0; i<chars.length;i++) {
            ByteBuffer.encodeUTF8Char(chars[i], bb, 0);
            dec = ByteBuffer.decodeUTF8Char(bb, 0);
            test.equals(chars[i], dec['char']);
            test.equals(ByteBuffer.calculateUTF8Char(chars[i]), dec["length"]);
            test.equals(String.fromCharCode(chars[i]), String.fromCharCode(dec['char']));
        }
        test.throws(function() {
            ByteBuffer.encodeUTF8Char(-1, bb, 0);
        });
        test.throws(function() {
            ByteBuffer.encodeUTF8Char(0x80000000, bb, 0);
        });
        bb.reset();
        bb.writeByte(0xFE).writeByte(0).writeByte(0).writeByte(0).writeByte(0).writeByte(0);
        bb.flip();
        test.throws(function() {
            ByteBuffer.decodeUTF8Char(bb, 0);
        });
        test.done();
    },
    
    "commonjs": function(test) {
        var fs = require("fs")
          , vm = require("vm")
          , util = require('util');
        
        var code = fs.readFileSync(__dirname+"/"+BYTEBUFFER_FILE);
        var sandbox = new Sandbox({
            module: {
                exports: {}
            }
        });
        vm.runInNewContext(code, sandbox, "ByteBuffer.js in CommonJS-VM");
        // console.log(util.inspect(sandbox));
        test.ok(typeof sandbox.module.exports == 'function');
        test.done();
    },
    
    "amd": function(test) {
        var fs = require("fs")
          , vm = require("vm")
          , util = require('util');

        var code = fs.readFileSync(__dirname+"/"+BYTEBUFFER_FILE);
        var sandbox = new Sandbox({
            require: function() {},
            define: (function() {
                function define() {
                    define.called = true;
                }
                define.amd = true;
                define.called = false;
                return define;
            })()
        });
        vm.runInNewContext(code, sandbox, "ByteBuffer.js in AMD-VM");
        // console.log(util.inspect(sandbox));
        test.ok(sandbox.define.called == true);
        test.done();
    },
    
    "shim": function(test) {
        var fs = require("fs")
            , vm = require("vm")
            , util = require('util');

        var code = fs.readFileSync(__dirname+"/"+BYTEBUFFER_FILE);
        var sandbox = new Sandbox();
        vm.runInNewContext(code, sandbox, "ByteBuffer.js in shim-VM");
        // console.log(util.inspect(sandbox));
        test.ok(typeof sandbox.dcodeIO != 'undefined' && typeof sandbox.dcodeIO.ByteBuffer != 'undefined');
        test.done();
    },
    
    "helloworld": function(test) {
        var bb = new ByteBuffer();
        bb.writeUTF8String("Hello world! from ByteBuffer.js. This is just a last visual test of ByteBuffer#printDebug.");
        bb.flip();
        console.log("");
        bb.printDebug(console.log);
        test.done();
    }
};

module.exports = suite;
