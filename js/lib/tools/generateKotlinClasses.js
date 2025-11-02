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

function resolveFieldType(field) {
    const { base, dimensions } = field;
    const resolvedType = typeof base === 'number' ? nativeTypes[base].kt : base.typeName
    const arrayPrefix = dimensions.map(() => "List<").join("")
    const arraySuffix = dimensions.map(() => ">").join("")

    return arrayPrefix + resolvedType + arraySuffix
}

function outDataType(calf, name, superName, inheritedFields) {
    out('\n')

    const isAbstract = calf.subtypes.length > 0
    if (isAbstract) {
        if (superName)
            out(`sealed interface ${name}: ${superName} {`, +1)
        else
            out(`sealed interface ${name} {`, +1)

        if (!isEmpty(calf.fields)) out('\n')

        for (const fieldName in calf.fields) {
            const field = calf.fields[fieldName];
            if (typeof field !== "object") continue;

            out(`val ${fieldName}: ${resolveFieldType(field)}\n`)
        }

        for (const subtype of calf.subtypes) {
            outDataType(subtype, subtype.name, name, { ...inheritedFields, ...calf.fields })
        }

        out('}\n', -1)
    } else {
        out(`class ${name} (`, +1)

        if (!isEmpty(inheritedFields) || !isEmpty(calf.fields)) out('\n')

        for (const fieldName in inheritedFields) {
            const field = inheritedFields[fieldName];
            if (typeof field !== "object") continue;

            out(`override val ${fieldName}: ${resolveFieldType(field)},\n`)
        }

        for (const fieldName in calf.fields) {
            const field = calf.fields[fieldName];
            if (typeof field !== "object") continue;

            out(`val ${fieldName}: ${resolveFieldType(field)},\n`)
        }

        for (const subtype of calf.subtypes) {
            outDataType(subtype, subtype.name, name, { ...inheritedFields, ...calf.fields })
        }

        if (superName)
            out(`): ${superName}\n`, -1)
        else
            out(')\n', -1)
    }
}

for (const calfName in buffalo) {
    const calf = buffalo[calfName]

    if (calf.type === "enum") {
        outEnumValues(calf, calfName)
    } else if (calf.type === "data") {
        outDataType(calf, calfName, null, {})
    } else {
        throw new Error(`Unknown definition type '${calf.type}' at '${calf.name}'`)
    }
}
