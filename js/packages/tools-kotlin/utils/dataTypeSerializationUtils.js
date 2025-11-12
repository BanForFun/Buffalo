const { calfUtils } = require("@buffela/tools-common")

const { printWriteField } = require("./fieldSerializationUtils");

function printSerializerVariables(type) {
    if (type.leafIndex != null)
        printer.line(`override val _leafIndex: UByte = ${type.leafIndex}u`)
}

function printHeaderSerializerCode(values) {
    for (const value of values) {
        if (typeof value === 'number') {
            printer.line(`packet.writeUByte(${value}u)`)
        } else {
            throw new Error('Invalid constant type')
        }
    }
}

function printSerializerFunction(type) {
    printer.blockStart(`override fun serialize(packet: kotlinx.io.Sink) {`)

    if (calfUtils.isTypeRoot(type)) {
        printHeaderSerializerCode(Object.values(type.constants))

        if (calfUtils.isTypeAmbiguousRoot(type))
            printer.line(`packet.writeUByte(this._leafIndex)`)

        for (const varName in type.variables) {
            printWriteField(type.variables[varName], `this.${varName}`)
        }
    } else {
        printer.line(`super.serialize(packet)`)

        printHeaderSerializerCode(Object.values(type.constants))

        for (const varName in type.variables) {
            printWriteField(type.variables[varName], `this.${varName}`)
        }
    }

    printer.blockEnd('}')
}

module.exports = {
    printSerializerFunction,
    printSerializerVariables
};