package gr.elaevents.buffela.internal.utils

import kotlinx.io.Source
import kotlinx.io.indexOf
import kotlinx.io.readString

fun Source.readStringNt(): String {
    val length = this.indexOf(0)
    val string = this.readString(length)
    this.skip(1)

    return string
}