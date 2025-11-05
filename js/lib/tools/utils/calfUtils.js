function isTypeAbstract(type) {
    return type.subtypes.length > 0
}

function isTypeRoot(type) {
    return type.leafTypes != null
}

function isTypeAmbiguousRoot(type) {
    return isTypeRoot(type) && type.leafTypes.length > 1
}

function typeClassModifier(type) {
    return isTypeAbstract(type) ? "sealed" : "public"
}

function typeProtectedMemberModifier(type) {
    return isTypeAbstract(type) ? "protected" : "private"
}

module.exports = {
    isTypeAbstract,
    isTypeRoot,
    isTypeAmbiguousRoot,
    typeClassModifier,
    typeProtectedMemberModifier
}