const { performance } = require('node:perf_hooks');

const readBuffalo = require('./lib/buffaloReader')
const serializeBuffalo = require('./lib/buffaloSerializer')
const deserializeBuffalo = require('./lib/buffaloDeserializer')

/**
 * @type {import('./buffalo').buffalo}
 */
const buffalo = readBuffalo('../buffalo.yaml')

const testData = {
    expiration: 1000,
    signature: Buffer.alloc(32),
    payload: {
        userId: Buffer.alloc(16),

        role: buffalo.TokenPayload.Registered,
        gender: buffalo.Gender.FEMALE,
        hobbies: ["coffee", "going out"],

        with: buffalo.TokenPayload.Registered.Phone,
        phone: "This is my phone"
    }
}

const serializationStartTime = performance.now()
const buffer = serializeBuffalo(buffalo.Token, testData)
const serializationEndTime = performance.now()

console.log(buffer.toString('hex').match(/../g).join(' '))
console.log('Serialized', buffer.byteLength, 'bytes in', serializationEndTime - serializationStartTime, 'milliseconds')

const deserializationStartTime = performance.now()
const deserialized = deserializeBuffalo(buffalo.Token, buffer)
const deserializationEndTime = performance.now()

console.log(deserialized)
console.log('Deserialized in', deserializationEndTime - deserializationStartTime, 'milliseconds')