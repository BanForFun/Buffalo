package gr.elaevents.buffela.schema

import kotlinx.io.Buffer
import kotlinx.io.Sink

abstract class Serializable {
    abstract fun serialize(packet: Sink)

    fun serialize(): Buffer {
        val packet = Buffer()
        serialize(packet)
        return packet
    }
}