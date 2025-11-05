package gr.elaevents.buffalo.schema

import kotlinx.io.Buffer

abstract class BuffaloType {
    @Suppress("PropertyName")
    protected abstract val _leafIndex: UByte

    internal abstract fun serializeHeader(packet: Buffer)
    internal abstract fun serializeBody(packet: Buffer)

    fun serialize(): Buffer {
        val packet = Buffer()
        serializeHeader(packet)
        serializeBody(packet)
        return packet
    }

}