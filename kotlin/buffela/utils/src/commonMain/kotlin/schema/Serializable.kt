package gr.elaevents.buffela.schema

import kotlinx.io.Buffer
import kotlinx.io.Sink

abstract class Serializable {
    @Suppress("PropertyName")
    protected abstract val _leafIndex: UByte

    protected abstract fun serializeHeader(packet: Sink)
    protected abstract fun serializeBody(packet: Sink)

    fun serialize(packet: Sink) {
        serializeHeader(packet)
        serializeBody(packet)
    }

    fun serialize(): Buffer {
        val packet = Buffer()
        serialize(packet)
        return packet
    }

}