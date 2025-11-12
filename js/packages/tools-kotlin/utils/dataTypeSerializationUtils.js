const { calfUtils } = require("@buffela/tools-common")

const { printWriteField } = require("./fieldSerializationUtils");

function printHeaderSerializerCode(values) {
    for (const value of values) {
        if (typeof value === 'number') {
            printer.line(`packet.writeUByte(${value}u)`)
        } else {
            throw new Error('Invalid constant type')
        }
    }
}

function printSerializerFunction(type, superVars, subtypeHeader, isRootAmbiguous) {
    printer.blockStart(`override fun serialize(packet: kotlinx.io.Sink) {`)

    // Header
    if (calfUtils.isTypeRoot(type)) {
        printHeaderSerializerCode(Object.values(type.constants))
    } else if (!calfUtils.isTypeAbstract(type)) {
        printer.line(`super.serialize(packet)`)

        if (isRootAmbiguous)
            printer.line(`packet.writeUByte(${type.leafIndex}u)`)

        printHeaderSerializerCode(subtypeHeader)
        printHeaderSerializerCode(Object.values(type.constants))
    }

    // Body
    if (!calfUtils.isTypeAbstract(type)) {
        for (const varName in type.variables) {
            printWriteField(type.variables[varName], `this.${varName}`)
        }

        for (const varName in superVars) {
            printWriteField(superVars[varName], `this.${varName}`)
        }
    }

    printer.blockEnd('}')
}

module.exports = {
    printSerializerFunction
};