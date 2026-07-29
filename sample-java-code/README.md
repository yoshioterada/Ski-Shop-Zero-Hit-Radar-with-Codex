# Sample Java Code

Small Java 21 / Spring Boot project for code review command checks.

## Requirements

- Java 21 or newer
- Maven 3.9 or newer, or the included Maven Wrapper

## Commands

```bash
./mvnw test
./mvnw verify
./mvnw spring-boot:run
```

The app starts on port `8081`.

## API

```bash
curl http://localhost:8081/api/health
curl 'http://localhost:8081/api/greetings?name=Radar'
curl -X POST http://localhost:8081/api/greetings \
  -H 'Content-Type: application/json' \
  -d '{"name":"Radar"}'
```
