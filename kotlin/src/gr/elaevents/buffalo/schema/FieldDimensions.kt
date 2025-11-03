package gr.elaevents.buffalo.schema

@Target(AnnotationTarget.PROPERTY)
annotation class FieldDimensions(vararg val dimensions: FieldSize)
