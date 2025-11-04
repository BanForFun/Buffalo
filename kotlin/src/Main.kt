import gr.elaevents.buffalo.serializeBuffalo
import kotlinx.io.Buffer
import kotlinx.io.readByteArray
import kotlin.system.measureTimeMillis
import kotlin.time.measureTime

fun main() {
    val token = Token(
        expiration = 1000.0,
        signature = ByteArray(32),
        payload = TokenPayload.Registered.Phone(
            phone = "This is my phone",
            gender = Gender.FEMALE,
            hobbies = arrayOf("coffee", "going out"),
            userId = ByteArray(16)
        )
    )

    repeat(10_000) { serializeBuffalo(token) }

    val time = measureTime {
        repeat(1_000) { serializeBuffalo(token) }
    }

    println("Took ${time / 1_000}")

    val bytes = serializeBuffalo(token).readByteArray()
    println(bytes.joinToString(" ") { "%02X".format(it) })
    println("Serialized ${bytes.size} bytes")
}