import com.android.build.api.dsl.androidLibrary
import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    alias(libs.plugins.kotlinMultiplatform)
    alias(libs.plugins.android.kotlin.multiplatform.library)
    alias(libs.plugins.vanniktech.mavenPublish)
}

group = "gr.elaevents.buffela.schema"
version = "2.0.0"

kotlin {
    jvm()
    androidLibrary {
        namespace = "gr.elaevents.buffela.schema"
        compileSdk = libs.versions.android.compileSdk.get().toInt()
        minSdk = libs.versions.android.minSdk.get().toInt()

        withJava() // enable java compilation support
        withHostTestBuilder {}.configure {}
        withDeviceTestBuilder {
            sourceSetTreeName = "test"
        }

        compilations.configureEach {
            compilerOptions.configure {
                jvmTarget.set(
                    JvmTarget.JVM_11
                )
            }
        }
    }
    iosX64()
    iosArm64()
    iosSimulatorArm64()
    linuxX64()

    sourceSets {
        commonMain.dependencies {
            implementation(libs.kotlinx.io)
        }

        commonTest.dependencies {
            implementation(libs.kotlin.test)
        }
    }
}

mavenPublishing {
    publishToMavenCentral()

    signAllPublications()

    coordinates(group.toString(), "utils", version.toString())

    pom {
        name = "Buffela utilities"
        description = "Utilities required by the classes generated from a buffela schema"
        inceptionYear = "2025"
        url = "https://github.com/BanForFun/Buffela/tree/master"
        licenses {
            license {
                name = "MIT License"
                url = "https://opensource.org/license/mit"
                distribution = "https://opensource.org/license/mit"
            }
        }
        developers {
            developer {
                id = "banforfun"
                name = "BanForFun"
                url = "https://github.com/BanForFun"
            }
        }
        scm {
            url = "https://github.com/BanForFun/Buffela"
            connection = "scm:git:git://github.com:BanForFun/Buffela.git"
            developerConnection = "scm:git:ssh://git@github.com:BanForFun/Buffela.git"
        }
    }
}