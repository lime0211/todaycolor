# 오늘컬러 웹앱 (PWA)

앱스토어 없이 링크 하나로 쓰는 버전입니다. 광고와 결제는 없습니다.
추천 결과는 iOS 앱과 똑같습니다 (`../web-test/verify.html`로 2,200건 일치 확인).

## 이 폴더만 올리면 됩니다
```
web/
├── index.html            화면 뼈대
├── styles.css            디자인 (라이트/다크 모드)
├── app.js                화면 동작, 저장
├── logic.js              추천 로직 (iOS DailyStyleKit과 동일)
├── data/StyleData.json   색·옷·문구 데이터
├── manifest.webmanifest  홈 화면 앱 설정
├── sw.js                 오프라인 실행
└── icons/                앱 아이콘
```

## 1. 인터넷에 올리기 (무료, 하나만 고르세요)

### A. Netlify Drop — 가장 쉬움 (가입 후 5분)
1. https://app.netlify.com/drop 에 접속해서 로그인합니다.
2. Finder에서 **`web` 폴더를 통째로** 브라우저 창에 끌어다 놓습니다.
3. `https://무작위이름.netlify.app` 주소가 바로 나옵니다. 사이트 설정에서 이름을 바꿀 수 있습니다.

### B. GitHub Pages — 수정 이력 관리까지
1. GitHub에서 새 저장소(예: `todaycolor`)를 만듭니다.
2. `web` 폴더 **안의 파일들**을 저장소 최상단에 올립니다 ("Add file → Upload files").
3. 저장소 Settings → Pages → Branch를 `main`, 폴더를 `/ (root)`로 지정하고 저장합니다.
4. 1~2분 뒤 `https://아이디.github.io/todaycolor/` 주소로 열립니다.

### C. Cloudflare Pages
1. https://dash.cloudflare.com → Workers & Pages → Create → Pages → "Upload assets"를 누릅니다.
2. `web` 폴더를 끌어다 놓으면 `https://이름.pages.dev` 주소가 나옵니다.

> ⚠️ 반드시 **https** 주소여야 합니다. 위 세 곳은 모두 자동으로 https입니다.
> 그냥 파일(`index.html`)을 더블클릭해서 열면 데이터를 못 불러와 동작하지 않습니다.

## 2. 휴대폰에 설치하기
- **아이폰:** **Safari**로 주소를 엽니다 (카카오톡 인앱 브라우저 말고 Safari).
  주소창 옆 **☰ 메뉴**(또는 공유 ⬆︎) → **공유** → **더 보기** → **홈 화면에 추가** → **추가**.
- **안드로이드:** **Chrome**으로 주소를 엽니다. 메뉴(⋮) → **앱 설치** (또는 홈 화면에 추가).
- 지인에게는 주소 링크만 보내면 됩니다.

> 아이폰은 꼭 **홈 화면에 추가해서** 쓰세요. Safari 탭으로만 쓰면 오래 안 열었을 때
> 저장한 생년월일 같은 설정이 지워질 수 있습니다.

## 3. 아침마다 자동으로 열기 (선택, 아이폰)
**단축어 앱** → 자동화 → 새로운 자동화 → **특정 시간**(예: 오전 7시, 매일) →
**"즉시 실행"** 선택 → 동작 **"URL 열기"**에 웹앱 주소를 입력합니다.

## 4. 수정하고 다시 올리기
1. 파일을 고칩니다.
2. **`sw.js`의 `VERSION`을 올립니다** (`"v3"` → `"v4"`). 이걸 안 하면 이미 설치한 사람에게 예전 파일이 계속 보일 수 있습니다.
3. 1번과 같은 방법으로 다시 올립니다. 사용자가 앱을 열거나 다시 화면으로 돌아오면
   새 버전을 감지해 **자동으로 한 번 새로고침**됩니다.

### 데이터(색·옷·문구)를 고쳤다면
iOS 앱과 웹이 같은 데이터를 쓰도록 원본에서 복사합니다.
```bash
cp DailyStyleKit/Sources/DailyStyleKit/Resources/StyleData.json web/data/StyleData.json
```

## 내 컴퓨터에서 미리 보기
```bash
python3 -m http.server 8765
```
위 명령을 `TodayColor` 폴더에서 실행한 뒤 http://localhost:8765/web/ 을 엽니다.
iOS 앱과 결과가 같은지는 http://localhost:8765/web-test/verify.html 에서 확인합니다.
