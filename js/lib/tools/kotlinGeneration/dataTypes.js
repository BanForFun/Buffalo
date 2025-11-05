const {typeClassModifier} = require("../utils/calfUtils");
const {printSerializerVariables, printHeaderSerializerFunction, printBodySerializerFunction} = require("./dataTypeSerializer");
const {printDataVariables, printDataConstructor} = require("./dataTypeInterface");
const {printDeserializerConstructor, printDeserializerObject} = require("./dataTypeDeserializer");

function printDataTypeClass(
    type,
    superClass = "gr.elaevents.buffalo.schema.BuffaloType",
    superVars = {},
    depth = 0
) {

    const modifier = typeClassModifier(type)
    printer.blockStart(`${modifier} class ${type.name}: ${superClass} {`)

    printSerializerVariables(type)
    printDataVariables(type)

    printDataConstructor(type, superVars)
    printDeserializerConstructor(type, depth)

    printDeserializerObject(type, superClass, depth)

    printHeaderSerializerFunction(type, depth)
    printBodySerializerFunction(type, depth)

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

module.exports = { printDataTypeClass }