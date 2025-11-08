const { calfUtils } = require("@buffela/tools-common");

const {
    printSerializerVariables,
    printSerializerFunctions
} = require("./dataTypeSerializationUtils");
const {
    printDataVariables,
    printDataConstructor
} = require("./dataTypeInterfaceUtils");
const {
    printDeserializerConstructor,
    printDeserializerObject
} = require("./dataTypeDeserializationUtils");

function printDataTypeClass(type, superClass, superVars, depth) {
    const modifier = calfUtils.typeClassModifier(type)
    if (superClass)
        printer.blockStart(`${modifier} class ${type.name}: ${superClass} {`)
    else
        printer.blockStart(`${modifier} class ${type.name} {`)

    printDataVariables(type)
    printDataConstructor(type, superVars)

    if (options.serializerEnabled) {
        printSerializerVariables(type)
        printSerializerFunctions(type, depth)
    }

    if (options.deserializerEnabled) {
        printDeserializerConstructor(type, depth)
        printDeserializerObject(type, superClass, depth)
    }

    for (const subtype of type.subtypes) {
        printDataTypeClass(
            subtype,
            type.name,
            { ...superVars, ...type.variables },
            depth + 1
        )
    }

    printer.blockEnd('}')
}

function printDataCalfClass(calf) {
    const superClass = options.serializerEnabled ? "gr.elaevents.buffela.schema.Serializable" : ""
    printDataTypeClass(calf, superClass, {}, 0)
}

module.exports = { printDataCalfClass }