# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /app

# Copy Maven wrapper and pom first (layer cache — only re-downloads deps when pom changes)
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline -q

# Copy source and build the fat JAR (skip tests — CI runs them separately)
COPY src/ src/
RUN ./mvnw package -DskipTests -q

# ── Stage 2: run ──────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy only the fat JAR from the build stage
COPY --from=build /app/target/keeper-notes-backend-0.0.1-SNAPSHOT.jar app.jar

# Render sets PORT env var; fall back to 8081 for local Docker runs
ENV PORT=8081
EXPOSE $PORT

# JVM flags tuned for a low-memory free-tier container (512 MB on Render free)
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=70.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
