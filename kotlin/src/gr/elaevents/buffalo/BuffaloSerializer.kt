@file:OptIn(ExperimentalUnsignedTypes::class)

package gr.elaevents.buffalo

import gr.elaevents.buffalo.schema.BuffaloPacket
import gr.elaevents.buffalo.schema.FieldDimensions
import gr.elaevents.buffalo.schema.FieldSize
import gr.elaevents.buffalo.schema.PacketHeader
import gr.elaevents.buffalo.utils.EmptyIterator
import gr.elaevents.buffalo.utils.ReverseArrayIterator
import gr.elaevents.buffalo.utils.writeStringNt
import kotlin.reflect.full.findAnnotation
import kotlinx.io.Buffer
import kotlinx.io.writeDouble
import kotlinx.io.writeFloat
import kotlinx.io.writeUByte
import kotlinx.io.writeUInt
import kotlinx.io.writeULong
import kotlinx.io.writeUShort
import kotlin.reflect.full.declaredMemberProperties
import kotlin.reflect.full.primaryConstructor

private fun writePrimitive(value: Any?, packet: Buffer) {
    when (value) {
        is String -> packet.writeStringNt(value)
        is Boolean -> packet.writeUByte(if (value) 1u else 0u)
        is Byte -> packet.writeByte(value)
        is Short -> packet.writeShort(value)
        is Int -> packet.writeInt(value)
        is Long -> packet.writeLong(value)
        is Float -> packet.writeFloat(value)
        is Double -> packet.writeDouble(value)
        is UByte -> packet.writeUByte(value)
        is UShort -> packet.writeUShort(value)
        is UInt -> packet.writeUInt(value)
        is ULong -> packet.writeULong(value)
        else -> throw IllegalStateException("Illegal type")
    }
}

private fun writeLength(fieldSize: FieldSize, length: Int, packet: Buffer) {
    if (fieldSize.type == Nothing::class) return

    when (fieldSize.type) {
        UByte::class -> packet.writeUByte(length.toUByte())
        UShort::class -> packet.writeUShort(length.toUShort())
        Int::class -> packet.writeInt(length)
        else -> throw IllegalStateException("Illegal field size type")
    }
}

private fun writeField(
    value: Any?,
    fieldSize: FieldSize?,
    fieldDimensions: Iterator<FieldSize>,
    packet: Buffer
) {
    if (fieldDimensions.hasNext()) {
        val dimension = fieldDimensions.next()
        val array = value as Array<*>

        writeLength(dimension, array.size, packet)
        for (item in array)
            writeField(item, fieldSize, fieldDimensions, packet)

        return
    }

    when (value) {
        is BuffaloPacket -> writeProperties(value, packet)

        is IntArray -> {
            writeLength(fieldSize!!, value.size, packet)
            for (item in value) writePrimitive(item, packet)
        }
        is ShortArray -> {
            writeLength(fieldSize!!, value.size, packet)
            for (item in value) writePrimitive(item, packet)
        }
        is FloatArray -> {
            writeLength(fieldSize!!, value.size, packet)
            for (item in value) writePrimitive(item, packet)
        }
        is DoubleArray -> {
            writeLength(fieldSize!!, value.size, packet)
            for (item in value) writePrimitive(item, packet)
        }
        is UByteArray -> {
            writeLength(fieldSize!!, value.size, packet)
            for (item in value) writePrimitive(item, packet)
        }
        is UShortArray -> {
            writeLength(fieldSize!!, value.size, packet)
            for (item in value) writePrimitive(item, packet)
        }
        is UIntArray -> {
            writeLength(fieldSize!!, value.size, packet)
            for (item in value) writePrimitive(item, packet)
        }
        is ULongArray -> {
            writeLength(fieldSize!!, value.size, packet)
            for (item in value) writePrimitive(item, packet)
        }
        is BooleanArray -> {
            writeLength(fieldSize!!, value.size, packet)
            for (item in value) writePrimitive(item, packet)
        }
        is ByteArray -> {
            writeLength(fieldSize!!, value.size, packet)
            packet.write(value)
        }

        is Enum<*> -> packet.writeUByte(value.ordinal.toUByte())

        else -> writePrimitive(value, packet)
    }
}

private fun <T : BuffaloPacket> writeProperties(data: T, packet: Buffer) {
    val header = data::class.findAnnotation<PacketHeader>()
    if (header != null)
        packet.write(header.bytes.asByteArray())

    for (field in data::class.declaredMemberProperties) {
        val value = field.getter.call(data)
        val dimensionsAttribute = field.findAnnotation<FieldDimensions>()
        val size = field.findAnnotation<FieldSize>()

        val dimensions = if (dimensionsAttribute != null)
            ReverseArrayIterator(dimensionsAttribute.dimensions)
        else
            EmptyIterator()

        writeField(value, size, dimensions, packet)
    }
}

fun <T : BuffaloPacket> serializeBuffalo(data: T): Buffer {
    val packet = Buffer()
    writeProperties(data, packet)
    return packet
}