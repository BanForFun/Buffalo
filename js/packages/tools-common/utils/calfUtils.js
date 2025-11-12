function isTypeAbstract(type) {
    return type.subtypes.length > 0
}

function isTypeRoot(type) {
    return type.leafPaths != null
}

function isTypeAmbiguousRoot(type) {
    return isTypeRoot(type) && type.leafPaths.length > 1
}

function typeClassModifier(type) {
    return isTypeAbstract(type) ? "sealed" : "final"
}

function typeProtectedMemberModifier(type) {
    return isTypeAbstract(type) ? "protected" : "private"
}

function typeInternalMemberModifier(type) {
    return isTypeAbstract(type) ? "protected" : "internal"
}

module.exports = {
    isTypeAbstract,
    isTypeRoot,
    isTypeAmbiguousRoot,
    typeClassModifier,
    typeProtectedMemberModifier,
    typeInternalMemberModifier
}