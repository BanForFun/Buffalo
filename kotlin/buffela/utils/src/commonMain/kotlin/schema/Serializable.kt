package gr.elaevents.buffela.schema

import kotlinx.io.Buffer
import kotlinx.io.Sink
import kotlinx.io.Source

abstract class Serializable {
    @Suppress("PropertyName")
    protected abstract val _leafIndex: UByte

    protected constructor() {}
    protected constructor(packet: Source) {}

    abstract fun serialize(packet: Sink)

    fun serialize(): Buffer {
        val packet = Buffer()
        serialize(packet)
        return packet
    }
}