const { calfUtils } = require("@buffela/tools-common");

const {
    printSerializerVariables,
    printSerializerFunction
} = require("./dataTypeSerializationUtils");
const {
    printDataVariables,
    printDataConstructor
} = require("./dataTypeInterfaceUtils");
const {
    printDeserializerConstructor,
    printDeserializerObject
} = require("./dataTypeDeserializationUtils");

function printDataTypeClass(type, superClass, superVars) {
    const modifier = calfUtils.typeClassModifier(type)
    if (superClass)
        printer.blockStart(`${modifier} class ${type.name}: ${superClass} {`)
    else
        printer.blockStart(`${modifier} class ${type.name} {`)

    printDataVariables(type)
    printDataConstructor(type, superVars)

    if (options.serializerEnabled) {
        printSerializerVariables(type)
        printSerializerFunction(type)
    }

    if (options.deserializerEnabled) {
        printDeserializerConstructor(type)
        printDeserializerObject(type)
    }

    for (const subtype of type.subtypes) {
        printDataTypeClass(
            subtype,
            type.name,
            { ...superVars, ...type.variables }
        )
    }

    printer.blockEnd('}')
}

function printDataCalfClass(calf) {
    const superClass = options.serializerEnabled ? "gr.elaevents.buffela.schema.Serializable" : ""
    printDataTypeClass(calf, superClass, {})
}

module.exports = { printDataCalfClass }