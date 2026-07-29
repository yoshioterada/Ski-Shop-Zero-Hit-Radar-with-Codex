# Java Standards Remediation Plan

作成日: 2026-06-04

対象レポート: `review-reports/manual-backend-java-standards/backend/check-report-1.md`

## 1. 目的

この計画は、Java standards review で指摘された backend の課題を、実装時に迷わず修正できる粒度まで具体化するためのものである。

対象範囲は主に `backend/` だが、seed data の image URL と frontend API contract に影響する項目があるため、必要に応じて `frontend/`、root documentation、設計書も同時に更新する。

## 2. 修正方針サマリ

| # | 指摘 | 推奨対応 | API 破壊リスク |
|---:|---|---|---|
| 1 | placeholder/sample artifacts | DTO コメントを実契約表現へ修正し、seed image path を OSS-safe な実アセットへ差し替える | 低 |
| 2 | Spring Boot 3.5.8 が 3.2.x baseline と不一致 | まず 3.2.x へ align 可能か検証。不可なら標準例外を明文化 | 中 |
| 3 | package が `com.codexskishop` | `com.skishop` へ package / groupId を rename | 低 |
| 4 | DI service interface 不足 | Controller/filter boundary に use-case interface を導入 | 低 |
| 5 | nullable contract annotation 不足 | nullable request/helper parameters に `@Nullable`、必要箇所に non-null 方針を追加 | 低 |
| 6 | boolean DTO component naming | Java component は prefix 付きに変更し、`@JsonProperty` で既存 JSON field を維持 | 中 |

## 3. 前提と判断ゲート

### 3.1 Spring Boot version

レビュー基準は Spring Boot 3.2.x である。一方、現在の backend は Spring Boot `3.5.8` と Spring AI `1.1.7` を利用しているため、単純な downgrade で Spring AI / Spring Framework / test dependency の互換性問題が出る可能性がある。

実装時の判断手順:

1. `backend/pom.xml` の parent version を Spring Boot 3.2.x 系へ変更する候補を作る。
   - 例: `3.2.12` など、3.2 系の利用可能な最終 patch version。
2. `./mvnw -U -DskipTests compile` を実行する。
3. compile が通る場合は `./mvnw verify` まで進める。
4. Spring AI などの依存互換性で失敗する場合は、次のどちらかを選ぶ。
   - Spring AI BOM / starter も 3.2.x と互換のある版へ下げる。
   - Spring Boot 3.5.8 を意図的採用として、標準例外を文書化し、review baseline を更新する。

この計画の主案は「3.2.x へ align して review baseline を満たす」だが、互換性検証で破綻する場合は、例外文書化を正式な修正として扱う。

### 3.2 Package namespace

レビュー基準は `com.skishop` である。backend-design では `com.codexskishop` が例として使われているが、今回の Java standards review を通す目的では `com.skishop` へ rename する。

この変更は Java package / Maven groupId の変更であり、HTTP API path や JSON contract には影響させない。

## 4. Finding 1: Placeholder / Sample Artifacts

### 4.1 対象

- `backend/src/main/java/com/codexskishop/dto/ProductDto.java`
- `backend/src/main/resources/db/migration/V2__seed_products.sql`
- 必要に応じて `frontend/public/images/products/`
- 必要に応じて README / design docs

### 4.2 問題

`ProductDto` の Javadoc に `sample price`、`placeholder image URL` という production API として未完成に見える表現が残っている。

また seed data の `image_url` が `*-placeholder.png` を繰り返し参照しており、review では production source の placeholder artifact と判定されている。

### 4.3 修正内容

1. `ProductDto` の Javadoc を実契約として書き換える。
   - `JPY sample price` -> `price in JPY`
   - `optional placeholder image URL` -> `optional product image URL`
2. seed data の image URL を placeholder 名から OSS-safe な実アセット名へ変更する。
   - 例:
     - `/images/products/skis-placeholder.png` -> `/images/products/skis.png`
     - `/images/products/ski-boots-placeholder.png` -> `/images/products/ski-boots.png`
     - `/images/products/bindings-placeholder.png` -> `/images/products/bindings.png`
3. frontend の `public/images/products/` に、seed category と一致する OSS-safe な画像アセットを置く。
   - 対象 category:
     - `skis`
     - `ski-boots`
     - `bindings`
     - `goggles`
     - `helmets`
     - `wear`
     - `gloves`
     - `poles`
     - `wax`
     - `tuning-goods`
   - 外部ライセンス不明画像は使わない。
   - 自作 SVG / 生成 bitmap / OSS ライセンスが明確な画像のみ使う。
4. frontend 側で画像 path fallback が placeholder 前提になっている場合は、実アセット名に合わせて更新する。
5. seed data が demo catalog であることは README に説明してよいが、placeholder を残す理由として使わない。

### 4.4 確認方法

- `rg -n "sample|placeholder" backend/src/main backend/src/main/resources`
- `./mvnw verify`
- `docker compose --env-file .env.example up --build -d`
- `GET /api/products?limit=3` の `imageUrl` が `placeholder` を含まないこと。
- frontend の商品カード画像または category visual が壊れていないこと。

## 5. Finding 2: Spring Boot 3.2.x Baseline

### 5.1 対象

- `backend/pom.xml`
- 必要に応じて Spring AI BOM version
- `backend/README.md`
- root `README.md`
- 必要に応じて standards exception document

### 5.2 問題

現在の parent は Spring Boot `3.5.8` だが、Java standards review baseline は Spring Boot `3.2.x` である。

### 5.3 主案: 3.2.x へ align

1. `backend/pom.xml` の parent version を 3.2.x 系へ変更する。
2. Spring AI BOM `1.1.7` の互換性を確認する。
3. 依存解決、compile、test が失敗する場合は Spring AI BOM / starter の互換 version を調査し、同時に調整する。
4. `./mvnw dependency:tree` を確認し、Spring Framework / Spring Security / Spring Data の version が意図せず混線していないことを確認する。
5. `./mvnw verify` を通す。
6. Docker build を確認する。

### 5.4 代替案: 3.5.8 を標準例外として承認

3.2.x への align が Spring AI や現行 Next.js/backend contract に対して過剰な downgrade risk を持つ場合は、次を作成する。

- `docs/standards-exceptions/java-standard-exceptions.md`

記載内容:

- Spring Boot 3.5.8 を採用する理由
- Java 21 / Spring Security / Spring AI との互換性
- review baseline 3.2.x からの差分
- 実行済み検証:
  - `./mvnw verify`
  - Docker compose smoke
  - full-stack browser journey

この代替案を採る場合、check-report の Escalation Item に対する maintainer decision として扱う。

### 5.5 確認方法

- `./mvnw -U -DskipTests compile`
- `./mvnw verify`
- `docker compose --env-file .env.example up --build -d`
- `/actuator/health`
- AI fallback endpoint

## 6. Finding 3: Package Namespace

### 6.1 対象

- `backend/pom.xml`
- `backend/src/main/java/com/codexskishop/**`
- `backend/src/test/java/com/codexskishop/**`
- Java imports in all backend tests
- README / design references where implementation package is named

### 6.2 問題

レビュー基準は `com.skishop` だが、現在の base package は `com.codexskishop` である。

### 6.3 修正内容

1. Maven groupId を変更する。
   - `com.codexskishop` -> `com.skishop`
2. main package directory を変更する。
   - `backend/src/main/java/com/codexskishop` -> `backend/src/main/java/com/skishop`
3. test package directory を変更する。
   - `backend/src/test/java/com/codexskishop` -> `backend/src/test/java/com/skishop`
4. 全 Java ファイルの package declaration を置換する。
   - `package com.codexskishop...` -> `package com.skishop...`
5. 全 import を置換する。
   - `import com.codexskishop...` -> `import com.skishop...`
6. Spring Boot main class は新 package で起動できるようにする。
7. `@SpringBootTest` の component scan が壊れていないことを確認する。
8. README や phase acceptance docs で package 名に言及している箇所があれば更新する。

### 6.4 実装時の注意

- HTTP endpoint は変更しない。
- JSON field 名は変更しない。
- DB schema / migration file 名は変更しない。
- package rename は機械的変更量が大きいため、他の refactor と混ぜない。

### 6.5 確認方法

- `rg -n "com\\.codexskishop" backend`
- `./mvnw verify`
- `docker compose --env-file .env.example up --build -d`

## 7. Finding 4: DI-managed Service Interfaces

### 7.1 対象

Controller/filter boundary で注入される service:

- `ProductQueryService`
- `ProductSearchService`
- `AdminAuthService`
- `ZeroHitQueryService`
- `AiConsultationService`

既存 interface:

- `AiProviderClient` は既に存在するため維持する。

### 7.2 問題

Controller や security filter が concrete service class に依存している。レビュー基準では DI-managed service に対応する interface を持ち、境界では interface に依存することが求められている。

### 7.3 修正内容

次の use-case interface を追加する。

1. `ProductQueryUseCase`
   - method:
     - `ProductListResponse listProducts(@Nullable Integer limit, @Nullable String category, @Nullable String sort);`
   - implemented by `ProductQueryService`
   - injected into `ProductController`
2. `ProductSearchUseCase`
   - method:
     - `ProductSearchResponse search(@Nullable String q, @Nullable Integer limit, @Nullable String category, @Nullable String sort);`
   - implemented by `ProductSearchService`
   - injected into `ProductController`
3. `AdminAuthUseCase`
   - methods:
     - `LoginResponse login(String username, String password);`
     - `Optional<AdminUserDto> validateToken(@Nullable String token);`
   - implemented by `AdminAuthService`
   - injected into `AuthController` and `BearerTokenAuthenticationFilter`
4. `ZeroHitQueryUseCase`
   - method:
     - `ZeroHitListResponse listZeroHits(@Nullable Integer days, @Nullable String sort, @Nullable Integer limit);`
   - implemented by `ZeroHitQueryService`
   - injected into `AdminZeroHitController`
5. `AiConsultUseCase`
   - method:
     - `AiConsultResponse consult(AiConsultRequest request);`
   - implemented by `AiConsultationService`
   - injected into `AiConsultController`

### 7.4 実装例

```java
public interface ProductQueryUseCase {
	ProductListResponse listProducts(@Nullable Integer limit, @Nullable String category, @Nullable String sort);
}

@Service
public class ProductQueryService implements ProductQueryUseCase {
	@Override
	@Transactional(readOnly = true)
	public ProductListResponse listProducts(@Nullable Integer limit, @Nullable String category, @Nullable String sort) {
		...
	}
}
```

### 7.5 実装時の注意

- interface は use-case contract を表す。Repository-like な細かい操作を並べない。
- Service implementation の class name は維持してよい。
- Internal collaborator まで無理に interface 化しない。
  - 例: `ProductMapper`, `ZeroHitMapper`, `AiPromptBuilder`, `OpportunityLossCalculator`
- `AiProviderClient` は external provider boundary として既に適切な interface なので追加不要。

### 7.6 確認方法

- Controller / filter が concrete service ではなく interface を constructor injection していること。
- `./mvnw verify`
- Spring context load test

## 8. Finding 5: Null Safety Annotation

### 8.1 対象

Nullable request parameters and helper methods:

- `ProductRequestOptions.toPageable(Integer limit, String sort)`
- `ProductRequestOptions.toSort(String sort)`
- `ProductRequestOptions.normalizeCategories(String category)`
- `ProductQueryService.listProducts(...)`
- `ProductSearchService.search(...)`
- `ZeroHitQueryService.listZeroHits(...)`
- Controller `@RequestParam(required = false)` parameters
- `AdminAuthService.validateToken(String token)`
- `BearerTokenAuthenticationFilter` token extraction path
- AI request optional fields are DTO-level nullable by design

### 8.2 問題

Nullable values are accepted implicitly. Public contracts and helper methods do not communicate which arguments may be null.

### 8.3 修正内容

1. Spring の nullability annotation を利用する。
   - `org.springframework.lang.Nullable`
   - 必要に応じて `org.springframework.lang.NonNullApi` を package-level に追加する。
2. `@RequestParam(required = false)` の Java parameters に `@Nullable` を付ける。
3. nullable helper parameters に `@Nullable` を付ける。
4. interface method と implementation method の nullability annotation を一致させる。
5. return value が null にならない method は annotation を省略するか、package-level `@NonNullApi` を使う。
6. DTO record component で optional な値は、Javadoc と validation annotation で明確化する。

### 8.4 package-level annotation の案

必要に応じて package ごとに `package-info.java` を作成する。

```java
@NonNullApi
package com.skishop.service;

import org.springframework.lang.NonNullApi;
```

ただし package rename と同時に行うため、`com.skishop` namespace への移行後に追加する。

### 8.5 確認方法

- `rg -n "required = false" backend/src/main/java`
- nullable request params が `@Nullable` を持つこと。
- `./mvnw verify`
- IDE / static analysis で nullability warning が増えないこと。

## 9. Finding 6: Boolean DTO Naming

### 9.1 対象

- `LoginResponse`
- `AuthMeResponse`
- `ProductSearchResponse`
- Backend tests that call record accessors
- Frontend contract tests
- frontend `src/types/api.ts`
- frontend API validators and tests if JSON names change

### 9.2 問題

Java record component が boolean prefix を持たない。

Current:

- `LoginResponse.success`
- `AuthMeResponse.authenticated`
- `ProductSearchResponse.zeroHitRecorded`

Recommended Java names:

- `isSuccess`
- `isAuthenticated`
- `hasZeroHitRecorded`

ただし frontend contract は `success`, `authenticated`, `zeroHitRecorded` を期待している。JSON field を変更すると frontend-design と Phase 9 contract tests を壊すため、Java component name だけを変更し、JSON field は `@JsonProperty` で維持する。

### 9.3 修正内容

1. `LoginResponse` を変更する。

```java
public record LoginResponse(
		@JsonProperty("success") boolean isSuccess,
		String token,
		AdminUserDto user
) {
}
```

2. `AuthMeResponse` を変更する。

```java
public record AuthMeResponse(
		@JsonProperty("authenticated") boolean isAuthenticated,
		AdminUserDto user
) {
}
```

3. `ProductSearchResponse` を変更する。

```java
public record ProductSearchResponse(
		List<ProductDto> items,
		long totalCount,
		@JsonProperty("zeroHitRecorded") boolean hasZeroHitRecorded
) {
}
```

4. Java tests の accessor 呼び出しを更新する。
   - `success()` -> `isSuccess()`
   - `authenticated()` -> `isAuthenticated()`
   - `zeroHitRecorded()` -> `hasZeroHitRecorded()`
5. JSON contract tests は既存 field 名を維持していることを確認する。
   - `$.success`
   - `$.authenticated`
   - `$.zeroHitRecorded`
6. frontend TypeScript DTO は変更しない。

### 9.4 確認方法

- `./mvnw verify`
- `FrontendContractIntegrationTests` が成功すること。
- `npm run typecheck`
- `npm test`

## 10. 実装順序

### Step 1: Placeholder / seed image 修正

理由: Critical finding であり、API contract への影響が小さい。

作業:

- `ProductDto` Javadoc 修正
- seed `image_url` 修正
- frontend public image assets 追加または既存 asset 名更新
- product component tests の必要箇所更新

確認:

- `rg -n "sample|placeholder" backend/src/main backend/src/main/resources`
- backend verify
- frontend build

### Step 2: Boolean DTO naming 修正

理由: JSON contract を壊さないように慎重に進める必要がある。

作業:

- `@JsonProperty` を使って Java component name と JSON field name を分離
- tests accessor 更新
- frontend contract unchanged を確認

確認:

- `./mvnw verify`
- `npm run typecheck`
- `npm test`

### Step 3: Nullability annotation 追加

理由: interface 導入時に method signature へ同時反映しやすい。

作業:

- nullable parameters に `@Nullable`
- 必要なら package-level `@NonNullApi`

確認:

- compile
- verify

### Step 4: Service use-case interfaces 導入

理由: Nullability annotation と method contract を揃えて境界を整理する。

作業:

- use-case interfaces 追加
- services implement interfaces
- controllers/filter inject interfaces

確認:

- Spring context load
- all controller integration tests

### Step 5: Package rename

理由: 変更量が大きく、他修正と混ざると原因特定が難しいため後半で単独実施する。

作業:

- groupId and package declarations
- directory move
- imports
- docs references

確認:

- `rg -n "com\\.codexskishop" backend`
- `./mvnw verify`
- Docker build

### Step 6: Spring Boot baseline alignment

理由: 互換性リスクが最も大きい。先にコード品質の明確な修正を終えてから、dependency 変更を単独で検証する。

作業:

- parent version 3.2.x へ変更
- dependency compatibility check
- 必要なら Spring AI version 調整
- 失敗時は standards exception 文書を作成

確認:

- dependency resolution
- compile
- verify
- Docker compose smoke

## 11. テスト計画

Backend:

```bash
cd backend
./mvnw verify
```

Frontend:

```bash
cd frontend
npm run lint
npm run typecheck
npm test
npm run build
npm run e2e
```

Full stack:

```bash
docker compose --env-file .env.example up --build -d
curl http://localhost:8080/actuator/health
curl "http://localhost:8080/api/products?limit=3"
docker compose --env-file .env.example down -v
```

Manual/browser:

- `http://localhost:3000`
- existing product search
- zero-result search
- admin login
- Zero Hit Radar dashboard
- AI fallback consultation
- browser console / network CORS error check

## 12. 完了判定

修正完了条件:

- check-report の Critical / High / Medium finding がすべて解消されている。
- `rg -n "sample|placeholder" backend/src/main backend/src/main/resources` で未完成 artifact が検出されない。
- `rg -n "com\\.codexskishop" backend` が 0 件、または承認済み例外文書が存在する。
- Controller / filter が service interface に依存している。
- nullable public/helper contract に annotation が付いている。
- boolean DTO の Java component が prefix 付きで、JSON field は frontend contract を維持している。
- backend `./mvnw verify` が成功する。
- frontend lint/typecheck/test/build/e2e が成功する。
- full-stack Docker Compose が起動し、主要 journey が通る。
- Spring Boot 3.2.x alignment が成功するか、3.5.8 採用の標準例外が承認・文書化されている。

## 13. リスクと注意点

- Spring Boot 3.2.x への downgrade は依存互換性リスクがあるため、最後に単独で行う。
- Boolean record component rename は Java accessor 名を変えるため、Java tests と service code の参照漏れに注意する。
- JSON field 名は変更しない。frontend contract を破壊しないため、`@JsonProperty` を必ず付ける。
- Package rename は機械的変更量が大きい。途中で他の refactor を混ぜない。
- Seed image path の変更は frontend static asset と同時に確認する。
- 実秘密情報は追加しない。demo credential は `.env.example` と README に sample として明記する。
