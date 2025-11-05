const {typeProtectedMemberModifier, isTypeAmbiguousRoot, isTypeAbstract} = require("../utils/calfUtils");
const {readField} = require("./fieldDeserializer");

function printConstantValidatorCode(calf) {
    const values = Object.values(calf.constants)
    if (values.length === 0) return;

    printer.blockStart(`if (`)
    printer.lines(values.map(v => `packet.readUByte() != ${v}u.toUByte()`), "|| ")
    printer.blockEnd(') throw IllegalStateException("Incompatible packet version")')
}

function printDeserializerConstructor(type, depth) {
    const superCall = depth > 0 ? 'super(packet)' : 'super()'
    const modifier = typeProtectedMemberModifier(type)
    printer.blockStart(`${modifier} constructor(packet: kotlinx.io.Buffer): ${superCall} {`)

    for (const varName in type.variables)
        printer.line(`this.${varName} = ${readField(type.variables[varName])}`)

    printer.blockEnd('}')
}

function printRootTypeHeaderValidatorFunction(type) {
    printer.blockStart(`private fun validateHeader(packet: kotlinx.io.Buffer) {`)
    printConstantValidatorCode(type)
    printer.blockEnd('}')
}

function printRootTypeDeserializerFunction(type) {
    printer.blockStart(`fun deserialize(packet: kotlinx.io.Buffer): ${type.name} {`)

    printer.line(`validateHeader(packet)`)

    if (isTypeAmbiguousRoot(type)) {
        printer.blockStart(`return when(packet.readUByte().toInt()) {`)

        for (let i = 0; i < type.leafTypes.length; i++) {
            printer.line(`${i} -> ${type.leafTypes[i].map(t => t.name).join('.')}.deserialize(packet)`)
        }
        printer.line(`else -> throw IllegalStateException("Invalid subtype index")`)

        printer.blockEnd('}')
    } else {
        const leafTypePath = type.leafTypes[0]
        const leafTypeClass = leafTypePath.length > 0 ? leafTypePath.map(t => t.name).join('.') : type.name
        printer.line(`return ${leafTypeClass}(packet)`)
    }

    printer.blockEnd('}')
}

function printRootTypeDeserializerObject(type) {
    printer.blockStart(`companion object Deserializer {`)

    printRootTypeHeaderValidatorFunction(type)
    printRootTypeDeserializerFunction(type)

    printer.blockEnd('}')
}

function printSubTypeValidatorFunction(type, superClass, depth) {
    const modifier = typeProtectedMemberModifier(type)
    printer.blockStart(`${modifier} fun validateHeader(packet: kotlinx.io.Buffer) {`)

    if (depth > 1) printer.line(`${superClass}.validateHeader(packet)`)
    printConstantValidatorCode(type)

    printer.blockEnd('}')
}

function printSubTypeDeserializerFunction(type) {
    printer.blockStart(`fun deserialize(packet: kotlinx.io.Buffer): ${type.name} {`)

    printer.line(`validateHeader(packet)`)
    printer.line(`return ${type.name}(packet)`)

    printer.blockEnd('}')
}

function printSubTypeDeserializerObject(type, superClass, depth) {
    printer.blockStart(`internal companion object Deserializer {`)

    printSubTypeValidatorFunction(type, superClass, depth)
    if (!isTypeAbstract(type))
        printSubTypeDeserializerFunction(type)

    printer.blockEnd('}')
}

function printDeserializerObject(type, superClass, depth) {
    if (depth === 0)
        printRootTypeDeserializerObject(type)
    else
        printSubTypeDeserializerObject(type, superClass, depth)
}

module.exports = {
    printDeserializerConstructor,
    printDeserializerObject
}