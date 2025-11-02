const lengthTypes = {
    "UByte":        { ts: "number",     kt: "UByte" },
    "UShort":       { ts: "number",     kt: "UShort" },
    "UInt":         { ts: "number",     kt: "UInt" },
    "ULong":        { ts: "BigInt",     kt: "ULong" },
}

const primitiveTypes = {
    ...lengthTypes,
    "String":       { ts: "string",     kt: "String" },
    "Boolean":      { ts: "boolean",    kt: "Boolean" },
    "Byte":         { ts: "number",     kt: "Byte" },
    "Short":        { ts: "number",     kt: "Short" },
    "Int":          { ts: "number",     kt: "Int" },
    "Long":         { ts: "BigInt",     kt: "Long" },
    "Float":        { ts: "number",     kt: "Float" },
    "Double":       { ts: "number",     kt: "Double" },
}

const arrayTypes = {
    "UByteArray":   { ts: "Uint8Array",         kt: "UByteArray" },
    "UShortArray":  { ts: "Uint16Array",        kt: "UShortArray" },
    "UIntArray":    { ts: "Uint32Array",        kt: "UIntArray" },
    "ULongArray":   { ts: "BigUint64Array",     kt: "ULongArray" },
    "BooleanArray": { ts: "Uint8ClampedArray",  kt: "BooleanArray" },
    "ByteArray":    { ts: "Int8Array",          kt: "ByteArray" },
    "ShortArray":   { ts: "Int16Array",         kt: "ShortArray" },
    "IntArray":     { ts: "Int32Array",         kt: "IntArray" },
    "LongArray":    { ts: "BigInt64Array",      kt: "LongArray" },
    "FloatArray":   { ts: "Float32Array",       kt: "FloatArray" },
    "DoubleArray":  { ts: "Float64Array",       kt: "DoubleArray" },
    "Buffer":       { ts: "Buffer",             kt: "ByteArray" },
}

const schemaTypes = { ...primitiveTypes, ...arrayTypes }

/**
 * @type {{ [K in keyof typeof schemaTypes]: number }}
 */
const schemaTypeIndices = {};

let count = 0;
for (const name in schemaTypes) {
    schemaTypeIndices[name] = count++;
}

module.exports = {
    lengthTypes: Object.keys(lengthTypes),
    arrayTypes: Object.keys(arrayTypes),
    schemaTypes: Object.keys(schemaTypes),
    nativeTypes: Object.values(schemaTypes),
    schemaTypeIndices,
    typeType: "Type"
}