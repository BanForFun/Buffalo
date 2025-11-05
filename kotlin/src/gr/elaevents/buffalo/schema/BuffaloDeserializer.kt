package gr.elaevents.buffalo.schema

import kotlinx.io.Buffer

abstract class BuffaloDeserializer<T : BuffaloType> {
    abstract fun deserialize(packet: Buffer) : T
}