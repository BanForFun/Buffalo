const { calfUtils } = require("@buffela/tools-common")

const {readField} = require("./fieldDeserializationUtils");

function getSubtypeRelativePath(type) {
    const path = [];
    while (!calfUtils.isTypeRoot(type)) {
        path.push(type.name);
        type = type.parent;
    }

    path.reverse()
    return path;
}

function printHeaderValidatorCode(values) {
    if (values.length === 0) return;

    printer.blockStart(`if (`)
    printer.lines(values.map(v => `packet.readUByte() != ${v}u.toUByte()`), "|| ")
    printer.blockEnd(') throw IllegalStateException("Incompatible packet version")')
}

function printRootTypeDeserializerObject(type) {
    printer.blockStart(`companion object Deserializer {`)
    printer.blockStart(`fun deserialize(packet: kotlinx.io.Source): ${type.name} {`)

    printHeaderValidatorCode(Object.values(type.constants))

    if (calfUtils.isTypeAmbiguousRoot(type)) {
        printer.blockStart(`return when(packet.readUByte().toInt()) {`)

        for (let i = 0; i < type.leafTypes.length; i++) {
            const leafType = type.leafTypes[i]
            printer.line(`${i} -> ${getSubtypeRelativePath(leafType).join('.')}.deserialize(packet)`)
        }
        printer.line(`else -> throw IllegalStateException("Invalid subtype index")`)

        printer.blockEnd('}')
    } else if (type.leafTypes[0] === type) {
        printer.line(`return ${type.name}(packet)`)
    } else {
        printer.line(`${getSubtypeRelativePath(type.leafTypes[0]).join('.')}.deserialize(packet)`)
    }

    printer.blockEnd('}')
    printer.blockEnd('}')
}

function printSubTypeDeserializerObject(type, subtypeHeader) {
    printer.blockStart(`internal companion object Deserializer {`)
    printer.blockStart(`fun deserialize(packet: kotlinx.io.Source): ${type.name} {`)

    printHeaderValidatorCode(subtypeHeader)
    printer.line(`return ${type.name}(packet)`)

    printer.blockEnd('}')
    printer.blockEnd('}')
}

function printDeserializerObject(type, subtypeHeader) {
    if (calfUtils.isTypeRoot(type))
        printRootTypeDeserializerObject(type)
    else if (!calfUtils.isTypeAbstract(type))
        printSubTypeDeserializerObject(type, subtypeHeader)
}

function printDeserializerConstructor(type, superVars) {
    if (calfUtils.isTypeAbstract(type)) return;

    printer.blockStart(`private constructor(packet: kotlinx.io.Source): this(`)

    for (const varName in type.variables)
        printer.line(`${varName} = ${readField(type.variables[varName])},`)

    for (const varName in superVars)
        printer.line(`${varName} = ${readField(superVars[varName])},`)

    printer.blockEnd(')')
}

module.exports = {
    printDeserializerConstructor,
    printDeserializerObject
}