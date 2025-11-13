const { typeMap } = require("@buffela/parser");
const { stringUtils } = require("@buffela/tools-common");

const nativeTypes = Object.fromEntries(Object.values(typeMap).map(t => [t.index, t.kt]))

function nativeType(field, dimensions = field.dimensions.length) {
    const { base } = field;
    const resolvedType = typeof base === 'number' ? nativeTypes[base] : base.name

    const arrayPrefix = stringUtils.repeat("Array<", dimensions)
    const arraySuffix = stringUtils.repeat( ">", dimensions)

    return arrayPrefix + resolvedType + arraySuffix
}

function printDataVariables(type) {
    for (const varName in type.variables)
        printer.line(`val ${varName}: ${nativeType(type.variables[varName])}`)
}

function printDataConstructor(type, superVars) {
    printer.blockStart(`constructor(`)

    for (const superVarName in superVars)
        printer.line(`${superVarName}: ${nativeType(superVars[superVarName])},`)

    for (const varName in type.variables)
        printer.line(`${varName}: ${nativeType(type.variables[varName])},`)

    printer.blockEndStart(`): super(`)

    for (const superVarName in superVars)
        printer.line(`${superVarName},`)

    printer.blockEndStart(`) {`)

    for (const varName in type.variables)
        printer.line(`this.${varName} = ${varName}`)

    printer.blockEnd('}')
}

module.exports = { printDataVariables, printDataConstructor }