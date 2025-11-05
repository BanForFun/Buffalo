package gr.elaevents.buffalo.schema

import kotlinx.io.Buffer

abstract class BuffaloType {
    @Suppress("PropertyName")
    protected abstract val _leafIndex: UByte

    protected abstract fun serializeHeader(packet: Buffer)
    protected abstract fun serializeBody(packet: Buffer)

    internal fun serialize(packet: Buffer) {
        serializeHeader(packet)
        serializeBody(packet)
    }

    fun serialize(): Buffer {
        val packet = Buffer()
        serialize(packet)
        return packet
    }

}