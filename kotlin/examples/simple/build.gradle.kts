plugins {
    alias(libs.plugins.kotlinMultiplatform)
}

group = "gr.elaevents.buffela.demo"
version = "1.0.0"

kotlin {
    jvm()
    sourceSets {
        commonMain.dependencies {
            implementation("org.jetbrains.kotlinx:kotlinx-io-core:0.8.0")
            implementation("gr.elaevents.buffela.schema:utils")
        }

        commonTest.dependencies {
            implementation(libs.kotlin.test)
        }
    }
}
