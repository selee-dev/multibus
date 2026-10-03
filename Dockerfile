FROM maven:3.9-eclipse-temurin-25 AS build

WORKDIR /app
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B clean package -DskipTests

FROM eclipse-temurin:25-jre

WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENV PORT=10000
EXPOSE 10000
ENTRYPOINT ["sh", "-c", "exec java -jar app.jar --server.address=0.0.0.0 --server.port=${PORT:-10000}"]