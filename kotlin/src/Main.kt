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


    val time = measureTime {
        serializeBuffalo(token)
    }

    val start = System.nanoTime()
    val snapshot = serializeBuffalo(token).readByteArray()
    val end = System.nanoTime()
    println(snapshot.joinToString(" ") { "%02X".format(it) })

    println("Serialized ${snapshot.size} bytes in $time")
}