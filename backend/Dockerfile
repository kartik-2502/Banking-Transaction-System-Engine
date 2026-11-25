# ==============================================================================
# Multi-Stage Dockerfile for Banking Transaction Processing System (Backend)
# Base Image: Eclipse Temurin Java 17 LTS
# ==============================================================================

# Stage 1: Build stage with Maven and Temurin JDK 17
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /app

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build production jar
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Minimal Production JRE Runtime
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Non-root service user for container security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser:appgroup

# Copy compiled artifact from build stage
COPY --from=builder /app/target/banking-transaction-system-*.jar app.jar

# Expose Spring Boot HTTP and STOMP WebSocket port
EXPOSE 8080

# Production-grade JVM ergonomics for containerized workloads
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+UseG1GC -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
