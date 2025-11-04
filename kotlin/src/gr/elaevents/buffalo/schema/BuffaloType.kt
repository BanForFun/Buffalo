package gr.elaevents.buffalo.schema

import kotlinx.io.Buffer

interface BuffaloType {
    fun serializeHeader(packet: Buffer) {

    }

    fun serializeBody(packet: Buffer) {

    }

    val leafIndex: UByte
}