package gr.elaevents.buffela.examples.simple

import kotlinx.io.Buffer
import kotlinx.io.readByteArray

fun main() {
    val token = AuthToken(
        issuedAt = System.currentTimeMillis().toDouble(),
        signature = ByteArray(32),
        user = User.RegisteredWithPhone(
            userId = "d6c47b4b-6983-48eb-a957-a954798f6e57",
            gender = Gender.FEMALE,
            hobbies = arrayOf("coffee", "reading", "going out"),
            countryCode = 30u,
            phone = "691 234 5678",
        )
    )

    val bytes = token.serialize().readByteArray()
    println("Serialized ${bytes.size} bytes")
    println(bytes.joinToString(" ") { "%02X".format(it) })

    val buffer = Buffer().apply { write(bytes) }
    val deserialized = AuthToken.deserialize(buffer)
    println(deserialized)
}