function isEmpty(object) {
    for (let _ in object) {
        return false;
    }

    return true;
}

module.exports = { isEmpty }