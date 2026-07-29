# Full Review Design Decisions

作成日: 2026-06-04

対象: `review-reports/manual-backend-full/backend/check-report-1.md`

この文書は `full-review-modify-plan.md` の Phase A に対する採用判断を記録する。Critical / High 指摘の修正は、ここで決めた標準に従って Phase B 以降で段階的に実装する。

## Phase A 採用判断

| 判断項目 | 採用判断 | 実装フェーズ |
| --- | --- | --- |
| `GET /api/products/search` の zero-hit 記録 | GET は read-only にし、zero-hit 記録は command endpoint に分離する。現行 API 互換と frontend 接続の影響が大きいため、Phase D で backend-design / front-design / frontend を同時更新する。 | Phase D |
| Error response shape | Spring `ProblemDetail` / RFC 9457 compatible shape に移行する。frontend は `message` / `detail` / `title` を吸収できるようにする。 | Phase F |
| entity / DTO package 構造 | `com.skishop.model` と `dto.request` / `dto.response` への整理を採用する。ただし correctness 修正後の構造整理として扱い、先行フェーズでは package churn を避ける。 | 後段の構造整理 |
| Primary key 型 | PostgreSQL / Hibernate の型安全性を優先し、`UUID` を維持する。String UUID への変更は標準が必須化された場合のみ別 migration として扱う。 | 現状維持 |
| AI retry | provider 境界に低回数 retry と circuit breaker を入れる。token cost を抑えるため transient error のみ対象にする。 | Phase E |
| TLS | Spring Boot 直 SSL ではなく reverse proxy / load balancer 終端を標準にする。`server.forward-headers-strategy=framework` と HSTS profile 条件を整理する。 | Phase G / Phase F |

## Phase B で即時実装する判断

- Controller query parameter は Bean Validation で境界を明示する。
- AI consultation request は DTO と prompt builder の両方で長さ・null contract を守る。
- Admin login は username と source IP の組み合わせで rate limit / lockout する。
- Admin token は logout で revoke でき、active token は admin あたり最大 3 件に制限する。
- Phase B では GET search の副作用分離は実装しない。API contract 変更を伴うため Phase D に集約する。
