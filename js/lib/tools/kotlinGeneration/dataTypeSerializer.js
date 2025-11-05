const {printWriteField} = require("./fieldSerializer");
const {isTypeAmbiguousRoot} = require("../utils/calfUtils");

function printSerializerVariables(type) {
    if (type.leafIndex != null)
        printer.line(`override val _leafIndex: UByte = ${type.leafIndex}u`)
}

function printHeaderSerializerFunction(type, depth) {
    printer.blockStart(`override fun serializeHeader(packet: kotlinx.io.Buffer) {`)

    if (depth > 0)
        printer.line(`super.serializeHeader(packet)`)

    for (const constName in type.constants) {
        const field = type.constants[constName];
        if (typeof field === 'number') {
            printer.line(`packet.writeUByte(${field}u)`)
        } else {
            throw new Error('Invalid constant type')
        }
    }

    if (isTypeAmbiguousRoot(type))
        printer.line(`packet.writeUByte(_leafIndex)`)

    printer.blockEnd('}')
}

function printBodySerializerFunction(type, depth) {
    printer.blockStart(`override fun serializeBody(packet: kotlinx.io.Buffer) {`)

    if (depth > 0)
        printer.line(`super.serializeBody(packet)`)

    for (const varName in type.variables) {
        const field = type.variables[varName];
        printWriteField(field, `this.${varName}`)
    }

    printer.blockEnd('}')
}

module.exports = {
    printHeaderSerializerFunction,
    printBodySerializerFunction,
    printSerializerVariables
};