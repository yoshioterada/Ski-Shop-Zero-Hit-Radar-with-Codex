# Java / Spring Boot AGENTS.md

このファイルは、Java 21 / Spring Boot バックエンドを実装・修正する AI エージェント向けの指示である。

## 基本方針

- Java 21 と Spring Boot のエコシステムを前提に実装する。
- Spring Boot、Spring Web、Spring Data JPA、Spring Validation、Spring Security、Spring AI など、Spring 公式・準公式の機能を優先する。
- 3rd Party ライブラリは、Spring 標準機能で明確に代替できない場合のみ採用する。
- Lombok などのコード生成ライブラリは、既にプロジェクトで採用済みの場合のみ使う。新規採用する場合は、可読性、保守性、ビルド影響を説明する。
- 既存コードや設計書の責務分離を尊重し、Controller、Application Service、Domain Service、Repository、Infrastructure を混在させない。
- 実装は MVP であっても完成して見える状態にする。仮実装、未接続 API、固定レスポンス、TODO を残さない。
- Java、Spring Boot、Spring Security、Spring AI は、プロジェクト作成時点で利用可能な安定版を使い、古い API を新規採用しない。

## コーディング規約

- パッケージ名は小文字で統一する。
- クラス名は PascalCase、メソッド名・変数名は camelCase、定数は UPPER_SNAKE_CASE にする。
- DTO は可能な限り Java `record` を使い、API 契約を明確にする。
- 状態や種別の分岐には `enum` と switch expression を優先する。
- `instanceof` 後の明示キャストではなく、pattern matching を使う。
- 複数行 SQL、JSON、プロンプトには text block を使う。
- コレクションを返すメソッドは `null` を返さず、空コレクションを返す。
- 返り値が存在しない可能性を表す場合は `Optional<T>` を使う。ただしフィールド、引数、コレクション要素に `Optional` を使わない。
- 時刻は `Instant`、`LocalDateTime`、`Clock` を使い、`Date` や `Calendar` を避ける。
- 金額計算には `BigDecimal` を使い、`double` や `float` で価格・機会損失を扱わない。

## Spring 実装ルール

- DI は constructor injection を使い、依存フィールドは `private final` にする。
- field injection の `@Autowired` は使わない。
- Controller は HTTP 入出力、Validation、ステータスコード、DTO 変換に集中させる。
- Service はユースケースの orchestration を担当し、Controller にビジネスロジックを書かない。
- 変更系ユースケースには適切な `@Transactional` 境界を設定し、読み取り専用処理には `readOnly = true` を使う。
- Repository は Spring Data JPA を優先し、手書き SQL は必要な場合に限定する。
- DB schema と seed data は Flyway などの migration で再現可能に管理する。
- 入力検証には Bean Validation を使う。
- 認証・認可は Spring Security を使う。独自フィルタや独自トークン処理は最小限にする。
- パスワード検証には Spring Security の `PasswordEncoder` を使い、平文比較を避ける。
- admin API は認証だけでなく認可も明示し、public API と admin API の境界を曖昧にしない。
- AI 連携は Spring AI を優先し、API キー未設定でも基本デモが壊れないようにする。
- AI prompt にはユーザー入力を無制限に混ぜず、長さ制限、目的の明確化、失敗時応答を設計する。
- HTTP client は `RestClient`、`WebClient`、Spring AI の client など現行の Spring API を優先する。
- 外部設定は `application.yml` と環境変数に集約し、秘密情報をコードに直書きしない。

## API とエラー設計

- API response は frontend DTO と一致させ、破壊的変更を行う場合は frontend とテストも更新する。
- Validation error、authentication error、authorization error、not found、server error は一貫した error response にする。
- 例外処理は `@RestControllerAdvice` などに集約し、Controller ごとに重複させない。
- HTTP status code は意味に合わせる。認証失敗は `401`、権限不足は `403`、入力不正は `400` を基本にする。
- CORS は必要な origin のみに限定し、開発用と本番用の設定を分ける。

## コメントとドキュメント

- public class、public method、ドメイン上重要な method には Javadoc を書く。
- Javadoc は「何をするか」「重要な制約」「例外や副作用」を簡潔に説明する。
- 自明な getter、setter、record accessor に冗長なコメントを書かない。
- 複雑な分岐、正規化、集計、認可判定、AI prompt 作成には、読み手を助ける短いコメントを置く。

## 禁止事項

- `System.out.println`、`System.err.println`、`printStackTrace()` を使わない。ログは SLF4J を使う。
- `catch (Exception e) {}` のような握りつぶしをしない。
- `Thread.sleep()` を使わない。
- `CompletableFuture.get()` や `.join()` でリクエストスレッドを不用意にブロックしない。
- `new RestTemplate()` を直接生成しない。必要な場合は bean として設定する。
- JPA entity を API response として直接返さない。DTO に変換する。
- Spring 管理対象の Service や Repository を `new` で直接生成しない。
- production code に Mock、Stub、Fake、Dummy を置かない。
- `UnsupportedOperationException` や `"Not implemented"` 例外で未完成状態を隠さない。
- ハードコードされたパスワード、API キー、Bearer token、個人情報を含めない。

## テスト

- JUnit 5 と Spring Boot Test を使う。
- カバレッジ 80% 以上を目標にする。
- Controller は HTTP status、validation、error response を検証する。
- Service は zero-hit 記録、keyword normalization、機会損失計算、認証、AI fallback を検証する。
- Repository は必要に応じて `@DataJpaTest`、PostgreSQL 依存が強い場合は Testcontainers を使う。
- テスト名は振る舞いが分かる名前にする。
- 正常系だけでなく、空検索、0 件検索、認証失敗、権限なし、AI キー未設定、DB 制約違反を検証する。
- JaCoCo などで line coverage と branch coverage を測定し、80% 以上を目標にする。

## 完了前チェック

- `./mvnw test` または `./gradlew test` が成功する。
- static analysis、format、coverage task が存在する場合は成功する。
- API 契約が Next.js 側 DTO と一致している。
- Spring Security により admin endpoint が保護されている。
- 起動時に seed data と migration が再現可能である。
- Docker build または docker compose 起動が設計書どおりに再現できる。
