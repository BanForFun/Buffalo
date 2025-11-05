function Printer(stream) {
    let indent = 0;
    let isBlockEmpty = false;

    function print(string) {
        stream.write(string)
    }

    function printIndented(string) {
        print("".padEnd(indent * 4))
        print(string)
    }

    this.line = function(string) {
        if (isBlockEmpty) print('\n')

        printIndented(string)
        print('\n')

        isBlockEmpty = false
    }

    this.lines = function(lines, separator = "") {
        if (isBlockEmpty) print('\n')

        for (let i = 0; i < lines.length; i++) {
            if (i > 0) print(separator)
            printIndented(lines[i])
            print('\n')
        }

        isBlockEmpty = false
    }

    this.blockStart = function(string) {
        print('\n')

        printIndented(string)

        indent++
        isBlockEmpty = true
    }

    this.blockEnd = function(string) {
        indent--

        if (isBlockEmpty)
            print(string)
        else
            printIndented(string)

        print('\n')

        isBlockEmpty = false
    }

    this.blockEndStart = function(string) {
        indent--

        if (isBlockEmpty)
            print(string)
        else
            printIndented(string)

        indent++
        isBlockEmpty = true
    }
}

module.exports = Printer;
