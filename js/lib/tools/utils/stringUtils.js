function repeatString(string, times) {
    return Array(times).fill(string).join("")
}

module.exports = {repeatString}