# hero-board-server

멀티버스 닉네임판 서버. **Spring Boot 3.3 + JDK 21 + MyBatis + H2**(개발용)를 사용하며, 운영 DB는 Oracle로 교체할 수 있습니다.
화면(HTML/CSS/JS)은 `src/main/resources/static/` 안에 있어 서버 하나로 화면과 API를 함께 제공합니다.

## 실행

### Eclipse
1. `File > Import > Maven > Existing Maven Projects` → 이 폴더 선택
2. `kr.co.herob.board.HeroBoardApplication` 우클릭 → `Run As > Java Application` (Spring Tools가 있으면 `Spring Boot App`)
3. 브라우저에서 http://localhost:8080

### 명령줄
```
mvn spring-boot:run
mvn test            # API, 로그인/권한, 실시간 구독 테스트
```

사내망이라 Maven Central에 못 붙는 경우: 사내 Nexus/Artifactory 주소를 `~/.m2/settings.xml` 의 `<mirror>` 로 설정해야 합니다. (평소 쓰시는 프로젝트의 settings.xml 을 그대로 쓰면 됩니다.)

## 무료 배포(Render)

이 저장소에는 Render 무료 Web Service용 `Dockerfile`과 `render.yaml`이 포함되어 있습니다.

1. GitHub 저장소를 Render에 연결하고 `Blueprint`로 이 저장소를 선택합니다.
2. `render.yaml`의 서비스가 생성되면 무료 플랜으로 배포합니다.
3. 배포가 끝나면 Render가 제공하는 `onrender.com` 주소로 접속합니다.

무료 플랜은 사용하지 않을 때 절전 상태가 되어 첫 접속이 느릴 수 있습니다. 배포 시에는 컨테이너 내부 H2를 사용하지 말고 Supabase·Neon 등 외부 PostgreSQL을 연결하세요. 외부 PostgreSQL을 사용하면 Render 재배포와 무관하게 계정·캐릭터·문서가 유지됩니다.

### PostgreSQL 연결

배포 서비스의 Environment Variables에 다음 값을 설정합니다.

```
SPRING_DATASOURCE_URL=jdbc:postgresql://호스트:5432/데이터베이스명?sslmode=require
SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver
SPRING_DATASOURCE_USERNAME=사용자명
SPRING_DATASOURCE_PASSWORD=비밀번호
SPRING_H2_CONSOLE_ENABLED=false
SPRING_SQL_INIT_MODE=always
```

Supabase 또는 Neon에서 PostgreSQL 데이터베이스를 만든 뒤 제공되는 호스트·포트·데이터베이스명·사용자명·비밀번호로 위 값을 채우세요. 비밀번호는 GitHub나 코드에 저장하지 말고 Render 환경변수에만 입력합니다. 서버가 처음 시작할 때 `schema.sql`이 `HERO_DOC`, `HERO_ACCOUNT`, `HERO_CHARACTER` 테이블을 생성합니다.

## 폴더

```
pom.xml
src/main/java/kr/co/herob/board/
  HeroBoardApplication.java
  config/SecurityConfig.java        세션 인증과 요청 권한 설정
  controller/DocController.java     REST API
  service/AccountService.java       계정 및 캐릭터 관리
  service/AuthService.java          현재 사용자와 문서 권한 확인
  service/DocEventService.java      SSE 실시간 변경 이벤트
  service/DocRow.java               DB 한 행
  service/DocService.java           문서 검증 + 저장
  service/HeroCharacter.java        캐릭터 모델
  mapper/DocMapper.java             MyBatis 인터페이스
src/main/resources/
  mapper/DocMapper.xml              SQL (MyBatis)
  schema.sql                        H2용 테이블 생성 (시작 시 자동 실행)
  application.properties            포트와 DB 설정
  static/                           화면 (index.html, css/, js/app.js, js/auth.js, js/db-adapter.js)
docs/oracle-ddl.sql                 Oracle용 HERO_DOC DDL (계정·캐릭터 DDL은 아직 없음)
src/test/.../DocApiTest.java        API 테스트
```

## API

| 메서드 | 주소 | 설명 |
|---|---|---|
| GET | `/api/me` | 로그인 사용자, 역할, 캐릭터 정보와 `canWrite` 반환 (인증 불필요) |
| GET | `/api/register/username-available?username=...` | 가입 아이디 사용 가능 여부 확인 (인증 불필요) |
| POST | `/api/register` | `{ "username": "...", "password": "..." }` 가입 후 로그인 세션 생성 |
| POST | `/api/login` | 같은 형식의 로그인 요청, 세션 생성 |
| POST | `/api/logout` | 로그아웃, 성공 시 204 |
| GET | `/api/characters` | 캐릭터 목록 조회 (로그인 필요) |
| POST | `/api/characters` | 현재 계정의 캐릭터 생성 (계정당 1개) |
| PUT | `/api/characters/{id}` | 본인 캐릭터 또는 관리자 수정 |
| DELETE | `/api/characters/{id}` | 본인 캐릭터 또는 관리자 삭제 |
| GET | `/api/docs` | 모든 문서 `{ 컬렉션: { 문서id: {…} } }` (로그인 필요) |
| GET | `/api/events` | SSE 변경 구독 (`connected`, `refresh` 이벤트, 로그인 필요) |
| GET | `/api/chats/private/contacts` | 개인·그룹 대화 상대 목록 (로그인 필요) |
| GET | `/api/chats/private` | 현재 계정이 참여한 개인·그룹 메시지만 조회 (로그인 필요) |
| POST | `/api/chats/private` | `{ "recipients": ["계정"], "text": "..." }` 개인·그룹 메시지 전송 |
| PUT | `/api/doc/{컬렉션}/{id}` | JSON 객체 저장. 권한 없으면 403 |
| DELETE | `/api/doc/{컬렉션}/{id}` | 문서 삭제. 권한 없으면 403 |

- `/api/me`, 회원가입, 로그인, 로그아웃 외 API는 로그인 세션이 필요합니다.
- 컬렉션 이름은 `DocService.COLLECTIONS` 목록만 허용 (그 외 400). id 는 영문/숫자/`_`/`-` 1~60자입니다. 본문은 JSON 객체여야 하며 직렬화 후 100,000자 이하여야 합니다.
- 비밀번호는 빈 값만 거부하며 길이 제한은 두지 않습니다.
- `ADMIN`은 모든 문서 컬렉션을 수정할 수 있습니다. 로그인한 일반 계정도 회의(`meetings`), 간식 당번(`snacks`), 프로젝트 팀(`projects`) 문서는 만들고 수정·삭제할 수 있습니다. 본인 캐릭터가 소유자인 경우 `nicks`, `titles`, `skills`, `stats`, `health`, `tasks`, `pres`, `ot`, `seats`, `status`, `jobs`, `moves` 컬렉션의 해당 캐릭터 문서도 수정할 수 있습니다. 공지(`chat`)는 관리자 또는 본인 캐릭터 직급이 `팀장`·`상무`인 사용자만 작성할 수 있으며, 나머지는 관리자만 수정할 수 있습니다.
- 개인·그룹 채팅은 별도 API를 사용하며 참여 계정에게만 메시지를 반환합니다. 전체 문서 조회 API에는 개인·그룹 메시지가 포함되지 않습니다.
- `/api/me`의 `canWrite`는 관리자 여부를 나타냅니다. 일반 계정의 본인 캐릭터 문서 쓰기 권한과는 별개입니다.
- 문서 저장/삭제 시 서버가 `refresh` SSE 이벤트를 전송하고, 화면은 이벤트를 받으면 `/api/docs` 를 다시 읽습니다.
- SSE 연결이 불가능하거나 실패하면 화면은 5초 폴링으로 전환합니다 (`static/js/db-adapter.js` 의 `POLL_MS`).

## 화면과 서버가 연결되는 방식

화면에는 로그인·회원가입·캐릭터 등록 폼이 있으며, `static/js/auth.js`가 세션 API와 연결합니다.
`app.js` 는 `window.claude.use("db")` 인터페이스를 사용하고, `static/js/db-adapter.js`가 이를 Spring API에 연결합니다.
서버 연결에 실패하면 어댑터는 `null`을 반환하고 `app.js`는 브라우저 `localStorage` 모드로 동작합니다. 이 모드는 서버와 데이터를 공유하지 않습니다.
채팅 화면은 팀장·상무급 또는 관리자가 작성하는 공지와 참여자만 볼 수 있는 개인·그룹 대화로 나뉩니다. 개인·그룹 채팅의 새 메시지는 채팅 탭에 읽지 않은 개수로 표시됩니다. 채팅 메시지는 캐릭터 머리 위에 표시하지 않고, 지도에는 캐릭터별 체력을 배터리 UI로 표시하며 본인 캐릭터 시트에서 0~100으로 조정할 수 있습니다. 배터리는 설정된 퇴근 시간에 가까워질수록 감소합니다.
캐릭터 레벨은 저장된 5개 스탯의 합계를 기준으로 자동 계산됩니다.
근무 상태는 별도 상태가 저장되지 않은 캐릭터도 기본 `업무중`으로 취급합니다. `점심`은 60분, `휴식`은 30분 뒤 업무중으로 돌아오며, `자리비움`은 사용자가 업무중 등 다른 상태를 선택할 때까지 유지됩니다.

## 로그인과 편집 권한

계정과 캐릭터는 H2의 `HERO_ACCOUNT`, `HERO_CHARACTER` 테이블에 저장되고, 비밀번호는 BCrypt 해시로 저장됩니다. 회원가입 계정은 `USER` 역할이며 가입 후 자동 로그인됩니다. 계정마다 캐릭터를 하나 만들 수 있고, 일반 계정은 본인 캐릭터 문서와 회의·간식 당번·프로젝트 팀 문서를 수정할 수 있습니다. 캐릭터 직급이 팀장 또는 상무이면 공지도 작성할 수 있습니다. `ADMIN`은 모든 문서를 수정할 수 있습니다.

DB에 `admin` 계정이 없으면 서버 시작 시 데모 관리자 `admin` / `admin`을 생성합니다. H2 파일 DB를 사용하므로 계정은 서버 재시작 후에도 유지되며, 이 계정도 자동 초기화되지 않습니다.

`application.properties`의 기본 설정은 개발용이며, 현재 화면/API에는 관리자 비밀번호 변경 기능이 없습니다. 운영 환경에 노출하기 전에 데모 관리자 자동 생성 로직과 계정 구성을 안전한 방식으로 교체하고, 세션 보안·HTTPS·CSRF 보호 정책을 별도로 구성하세요. 개발용 H2 콘솔도 운영에서는 비활성화해야 합니다.

## H2 → Oracle 로 바꾸기

1. `pom.xml` 의 `h2` 의존성을 지우고 추가
   ```xml
   <dependency>
     <groupId>com.oracle.database.jdbc</groupId>
     <artifactId>ojdbc11</artifactId>
     <scope>runtime</scope>
   </dependency>
   ```
2. `application.properties`
   ```
   spring.datasource.url=jdbc:oracle:thin:@//호스트:1521/서비스명
   spring.datasource.driver-class-name=oracle.jdbc.OracleDriver
   spring.datasource.username=...
   spring.datasource.password=...
   spring.sql.init.mode=never
   spring.h2.console.enabled=false
   ```
3. 현재 `docs/oracle-ddl.sql`은 `HERO_DOC`만 생성합니다. 애플리케이션은 `HERO_ACCOUNT`, `HERO_CHARACTER`도 사용하므로 이 두 테이블의 Oracle DDL을 추가로 작성·실행해야 합니다. 현재 상태 그대로는 Oracle에서 애플리케이션을 시작할 수 없습니다.
4. DDL과 드라이버 설정 후 Oracle을 대상으로 시작 및 API 테스트를 별도로 검증해야 합니다. 문서 SQL은 `UPDATE` 후 없으면 `INSERT`하며, Oracle/H2 호환 여부는 실제 Oracle 검증이 필요합니다.

## H2 사용 팁

- 데이터 파일: `./data/herodb.mv.db` (프로젝트 폴더 아래 `data/`)
- 웹 콘솔: http://localhost:8080/h2-console → JDBC URL `jdbc:h2:file:./data/herodb`, 사용자 `sa`, 비밀번호 없음
- `data/` 폴더를 삭제하면 문서·계정·캐릭터 DB가 초기화됩니다. 다음 시작 시 데모 관리자 계정이 다시 생성됩니다. 삭제 전 서버를 종료하세요.

## 문제가 생기면

| 증상 | 확인 |
|---|---|
| `mvn` 이 의존성을 못 받음 | 사내 Maven 미러 설정(settings.xml) |
| 화면은 뜨는데 저장이 안 됨 | 브라우저 개발자도구(F12) Network에서 `/api/…` 응답 코드 확인. 일반 계정은 본인 캐릭터 문서만 수정할 수 있고, 다른 컬렉션은 관리자 권한이 필요합니다. |
| `Invalid bean definition` / MyBatis 매핑 오류 | `DocMapper.xml` 의 namespace 와 `DocRow` 패키지 경로 |
| Oracle에서 시작 실패 | Oracle DDL에 `HERO_DOC`, `HERO_ACCOUNT`, `HERO_CHARACTER` 세 테이블이 모두 있는지 확인. 현재 제공 DDL에는 `HERO_DOC`만 포함되어 있습니다. |
| 한글이 깨짐 | 파일 인코딩 UTF-8 (Eclipse: Window > Preferences > General > Workspace > Text file encoding) |

## 앞으로 개선할 만한 것

- 채팅처럼 쌓이는 데이터는 별도 테이블로 분리 (지금은 한 테이블에 JSON)
- 서버에서 변경 이력(누가 언제 바꿨는지) 저장
- Oracle용 `HERO_ACCOUNT`, `HERO_CHARACTER` DDL 추가 및 Oracle 통합 검증
- 기본 관리자 계정의 안전한 초기 설정과 운영용 인증·CSRF 정책 구성
