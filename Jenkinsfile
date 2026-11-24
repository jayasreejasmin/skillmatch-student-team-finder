pipeline {
    agent any

    environment {
        IMAGE_NAME = "skillmatch-app"
        IMAGE_TAG  = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install & Test') {
            steps {
                bat 'npm ci'
                bat 'npm test'
            }
        }

        stage('Build Docker Image') {
            steps {
                bat """
                    set "PATH=%PATH%;C:\\Program Files\\Docker\\Docker\\resources\\bin"
                    docker build -t ${IMAGE_NAME}:${IMAGE_TAG} -t ${IMAGE_NAME}:latest .
                """
            }
        }       
    }
              
}