const { calfUtils } = require("@buffela/tools-common");

const {
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

function printDataTypeClass(type, superClass, superVars, subtypeHeader, isRootAmbiguous) {
    const modifier = calfUtils.typeClassModifier(type)
    if (superClass)
        printer.blockStart(`${modifier} class ${type.name}: ${superClass} {`)
    else
        printer.blockStart(`${modifier} class ${type.name} {`)

    printDataVariables(type)
    printDataConstructor(type, superVars)

    if (options.serializerEnabled) {
        printSerializerFunction(type, superVars, subtypeHeader, isRootAmbiguous)
    }

    if (options.deserializerEnabled) {
        printDeserializerConstructor(type, superVars)
        printDeserializerObject(type, subtypeHeader)
    }

    for (const subtype of type.subtypes) {
        printDataTypeClass(
            subtype,
            type.name,
            { ...type.variables, ...superVars },
            calfUtils.isTypeRoot(type)
                ? subtypeHeader
                : { ...subtypeHeader, ...Object.values(type.constants) },
            isRootAmbiguous
        )
    }

    printer.blockEnd('}')
}

function printDataCalfClass(calf) {
    const superClass = options.serializerEnabled ? "gr.elaevents.buffela.schema.Serializable" : ""
    printDataTypeClass(calf, superClass, {}, [],  calfUtils.isTypeAmbiguousRoot(calf))
}

module.exports = { printDataCalfClass }