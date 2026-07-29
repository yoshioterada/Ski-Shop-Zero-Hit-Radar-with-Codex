# Zero Hit Radar Backend

Spring Boot backend for Codex Ski Shop Zero Hit Radar.

## Local Docker Smoke Test

From this directory:

```bash
docker compose -f compose.smoke.yml up --build -d
curl http://localhost:8080/actuator/health
curl http://localhost:8080/api/products?limit=3
docker compose -f compose.smoke.yml down -v
```

The smoke compose file starts PostgreSQL as service `db`, builds the backend image, publishes backend port `8080`, runs Flyway migrations and seed data at startup, and leaves `AI_API_KEY` empty so the AI consultation endpoint uses the fallback path.

Runtime configuration is supplied through environment variables:

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_TOKEN_TTL`
- `AI_API_KEY`
- `AI_MODEL`
- `CORS_ALLOWED_ORIGINS`
