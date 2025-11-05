const {nativeTypes} = require("../../buffaloTypes");
const {repeatString} = require("../utils/stringUtils");

function nativeType(field, dimensions = field.dimensions.length) {
    const { base } = field;
    const resolvedType = typeof base === 'number' ? nativeTypes[base].kt : base.name

    const arrayPrefix = repeatString("Array<", dimensions)
    const arraySuffix = repeatString( ">", dimensions)

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