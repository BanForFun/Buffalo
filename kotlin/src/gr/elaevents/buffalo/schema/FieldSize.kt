package gr.elaevents.buffalo.schema

import kotlin.reflect.KClass

@Target(AnnotationTarget.PROPERTY)
annotation class FieldSize(
    val type: KClass<*> = Nothing::class,
    val size: UInt = 0U
)