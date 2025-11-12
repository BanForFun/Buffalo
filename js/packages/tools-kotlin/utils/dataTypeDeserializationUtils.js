const { calfUtils } = require("@buffela/tools-common")

const {readField} = require("./fieldDeserializationUtils");

function printHeaderValidatorCode(values) {
    if (values.length === 0) return;

    printer.blockStart(`if (`)
    printer.lines(values.map(v => `packet.readUByte() != ${v}u.toUByte()`), "|| ")
    printer.blockEnd(') throw IllegalStateException("Incompatible packet version")')
}

function leafPathToClassPath(calf, leafPath) {
    if (leafPath.length === 0) return calf.name;
    return leafPath.map(t => t.name).join('.')
}

function printDeserializerObject(type) {
    if (!calfUtils.isTypeRoot(type)) return;

    printer.blockStart(`companion object Deserializer {`)
    printer.blockStart(`fun deserialize(packet: kotlinx.io.Source): ${type.name} {`)

    printHeaderValidatorCode(Object.values(type.constants))

    if (calfUtils.isTypeAmbiguousRoot(type)) {
        printer.blockStart(`return when(packet.readUByte().toInt()) {`)

        for (let i = 0; i < type.leafPaths.length; i++) {
            const leafPath = type.leafPaths[i]
            printer.line(`${i} -> ${leafPathToClassPath(type, leafPath)}(packet)`)
        }
        printer.line(`else -> throw IllegalStateException("Invalid subtype index")`)

        printer.blockEnd('}')
    } else {
        printer.line(`return ${leafPathToClassPath(type, type.leafPaths[0])}(packet)`)
    }

    printer.blockEnd('}')
    printer.blockEnd('}')
}

function printDeserializerConstructor(type) {
    const modifier = calfUtils.typeInternalMemberModifier(type)
    printer.blockStart(`${modifier} constructor(packet: kotlinx.io.Source): super(packet) {`)

    if (!calfUtils.isTypeRoot(type))
        printHeaderValidatorCode(Object.values(type.constants))

    for (const varName in type.variables)
        printer.line(`this.${varName} = ${readField(type.variables[varName])}`)

    printer.blockEnd('}')
}

module.exports = {
    printDeserializerConstructor,
    printDeserializerObject
}