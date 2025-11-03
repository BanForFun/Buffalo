const readBuffalo = require("../buffaloReader");
const Printer = require("./models/Printer");
const {getOutputStream} = require("./utils/fileUtils");
const path = require("node:path");
const {isEmpty} = require("./utils/objectUtils");
const {nativeTypes} = require("../buffaloTypes");

if (process.argv.length < 3 || process.argv.length > 4) {
    console.error("Usage: node generateKotlinClasses.js BUFFALO_FILE [OUTPUT_FILE_OR_DIRECTORY]")
    process.exit(1)
}

const inputPath = process.argv[2]
const buffalo = readBuffalo(inputPath)
const objectName = path.basename(inputPath, ".yaml")

const outputStream = getOutputStream(process.argv[3], objectName + ".kt")
const { out } = new Printer(outputStream)

function outEnumValues(calf, name) {
    out('\n')
    if (calf.values.length > 0) {
        out(`enum class ${name} {\n`, +1)

        for (const {name} of calf.values)
            out(`${name},\n`)

        out('}\n', -1)
    } else {
        out(`enum class ${name} { }\n`)
    }
}

function nativeType(field) {
    const { base, dimensions } = field;
    const resolvedType = typeof base === 'number' ? nativeTypes[base].kt : base.typeName
    const arrayPrefix = dimensions.map(() => "Array<").join("")
    const arraySuffix = dimensions.map(() => ">").join("")

    return arrayPrefix + resolvedType + arraySuffix
}

function sizeAnnotation(field) {
    if (typeof field === "number")
        return `FieldSize(size = ${field}U)`

    return `FieldSize(type = ${nativeType(field)}::class)`
}

function dimensionAnnotation(dimensions) {
    return `FieldDimensions(${dimensions.map(sizeAnnotation).join(", ")})`
}

function outVariableAnnotations(field) {
    const { dimensions, size } = field;

    if (size != null)
        out(`@${sizeAnnotation(size)}\n`)

    if (dimensions.length > 0)
        out(`@${dimensionAnnotation(dimensions)}\n`)
}

function outDataType(calf, name, superName, superVars, header) {
    out('\n')

    const isAbstract = calf.subtypes.length > 0
    if (isAbstract) {
        if (superName)
            out(`sealed interface ${name}: ${superName} {`, +1)
        else
            out(`sealed interface ${name} {`, +1)

        if (!isEmpty(calf.variables)) out('\n')

        for (const varName in calf.variables) {
            const field = calf.variables[varName];
            out(`val ${varName}: ${nativeType(field)}\n`)
        }

        for (const subtype of calf.subtypes) {
            outDataType(
                subtype, subtype.name, name,
                { ...calf.variables, ...superVars }, //Ordering matters
                [...header, ...Object.values(subtype.constants), subtype.index]
            )
        }

        out('}\n', -1)
    } else {
        if (header.length > 0)
            out(`@PacketHeader(${header.map(b => b + "u").join(", ")})\n`)

        out(`class ${name} (`, +1)

        if (!isEmpty(superVars) || !isEmpty(calf.variables)) out('\n')

        for (const varName in calf.variables) {
            const field = calf.variables[varName];
            outVariableAnnotations(field)
            out(`val ${varName}: ${nativeType(field)},\n`)
        }

        for (const superVarName in superVars) {
            const field = superVars[superVarName];
            outVariableAnnotations(field)
            out(`override val ${superVarName}: ${nativeType(field)},\n`)
        }

        if (superName)
            out(`): ${superName}, BuffaloPacket()\n`, -1)
        else
            out('): BuffaloPacket()\n', -1)
    }
}

out("import gr.elaevents.buffalo.schema.*\n")

for (const calfName in buffalo) {
    const calf = buffalo[calfName]

    if (calf.type === "enum") {
        outEnumValues(calf, calfName)
    } else if (calf.type === "data") {
        outDataType(calf, calfName, null, {}, Object.values(calf.constants))
    } else {
        throw new Error(`Unknown definition type '${calf.type}' at '${calf.name}'`)
    }
}
