pipeline {
    agent any

    environment {
        JAVA_HOME = '/opt/java/openjdk'
        PATH = "/opt/java/openjdk/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
    }

    options {
        timestamps()
    }

    stages {
        stage('FE Install') {
            steps {
                dir('FE') {
                    sh 'pnpm install --frozen-lockfile'
                }
            }
        }

        stage('FE Build') {
            steps {
                dir('FE') {
                    sh 'pnpm build'
                }
            }
        }

        stage('BE Test') {
            steps {
                dir('BE') {
                    sh 'chmod +x gradlew'
                    sh './gradlew test'
                }
            }
        }
    }
}
