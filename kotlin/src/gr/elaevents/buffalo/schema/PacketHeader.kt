@file:OptIn(ExperimentalUnsignedTypes::class)

package gr.elaevents.buffalo.schema

@Target(AnnotationTarget.CLASS)
annotation class PacketHeader(vararg val bytes: UByte)
