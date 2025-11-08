package gr.elaevents.buffela.schema

import kotlinx.io.Buffer

abstract class Serializable {
    @Suppress("PropertyName")
    protected abstract val _leafIndex: UByte

    protected abstract fun serializeHeader(packet: Buffer)
    protected abstract fun serializeBody(packet: Buffer)

    fun serialize(packet: Buffer) {
        serializeHeader(packet)
        serializeBody(packet)
    }

    fun serialize(): Buffer {
        val packet = Buffer()
        serialize(packet)
        return packet
    }

}