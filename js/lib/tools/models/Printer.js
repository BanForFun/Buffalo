function Printer(stream) {
    let indent = 0;
    let isNewLine = true;

    this.out = function(string, indentOffset = 0) {
        if (indentOffset < 0)
            indent += indentOffset

        const space = isNewLine ? "".padEnd(indent * 2) : ""
        const output = space + string

        if (indentOffset > 0)
            indent += indentOffset

        stream.write(output)

        isNewLine = output.endsWith("\n")
    }
}

module.exports = Printer;
