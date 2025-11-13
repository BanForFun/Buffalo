export function isTypeAbstract(type) {
    return type.subtypes.length > 0
}

export function isTypeRoot(type) {
    return type.leafPaths != null
}

export function isTypeAmbiguousRoot(type) {
    return isTypeRoot(type) && type.leafPaths.length > 1
}