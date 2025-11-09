package gr.elaevents.buffela.internal.utils

import kotlinx.io.Sink
import kotlinx.io.writeString

fun Sink.writeStringNt(str: String): Unit {
    this.writeString(str)
    this.writeByte(0)
}