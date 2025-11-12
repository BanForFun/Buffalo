const { performance } = require('node:perf_hooks');

const { parseBuffelaSchema } = require('@buffela/parser')
const { serializeCalf } = require('@buffela/serializer')
const { deserializeCalf } = require('@buffela/deserializer')

const sampleBuffela = require('./sampleBuffela.json')

/**
 * @type {import('./sampleBuffela').default}
 */
const buffela = parseBuffelaSchema(sampleBuffela)

const testData = {
    issuedAt: Date.now(),
    signature: Buffer.alloc(32),
    user: {
        userId: "d6c47b4b-6983-48eb-a957-a954798f6e57",
        gender: buffela.Gender.FEMALE,
        hobbies: ["coffee", "reading", "going out"],
        registeredWith: buffela.User.RegisteredWithPhone,
        countryCode: 30,
        phone: "691 234 5678"
    }
}

const warmUpReps = 10_000
const measurementReps = 10_000_000

for (let i = 0; i < warmUpReps; i++) {
    serializeCalf(buffela.AuthToken, testData)
}

const serializationStart = performance.now()
for (let i = 0; i < measurementReps; i++) {
    serializeCalf(buffela.AuthToken, testData)
}

const serializationTime = performance.now() - serializationStart
console.log('Serialization took an average of', serializationTime / measurementReps, "ms")


const buffer = serializeCalf(buffela.AuthToken, testData)
console.log('Serialized', buffer.byteLength, 'bytes')
console.log(buffer.toString('hex').match(/../g).join(' '))


for (let i = 0; i < warmUpReps; i++) {
    deserializeCalf(buffela.AuthToken, buffer)
}

const deserializationStart = performance.now()
for (let i = 0; i < measurementReps; i++) {
    deserializeCalf(buffela.AuthToken, buffer)
}

const deserializationTime = performance.now() - deserializationStart
console.log('Deserialization took an average of', deserializationTime / measurementReps, "ms")

const deserialized = deserializeCalf(buffela.AuthToken, buffer)
console.log(deserialized)