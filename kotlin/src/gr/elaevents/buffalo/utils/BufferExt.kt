package gr.elaevents.buffalo.utils

import kotlinx.io.Buffer
import kotlinx.io.indexOf
import kotlinx.io.readString
import kotlinx.io.writeString

fun Buffer.writeStringNt(str: String): Unit {
    this.writeString(str)
    this.writeByte(0)
}

fun Buffer.readStringNt(): String {
    val length = this.indexOf(0)
    val string = this.readString(length)
    this.skip(1)

    return string
}