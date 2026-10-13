# 홈페이지에서 글 수정하기

관리 화면과 GitHub 인증 서버 코드를 추가했습니다. **아직 인증 서버를 배포하거나 실제 GitHub 로그인을 연결하지 않았습니다.** 현재 `/admin/`은 연결 대기 화면입니다. 사이트는 기존 GitHub Pages/Jekyll 구성을 사용합니다.

## 한 번만 연결하기

1. Cloudflare 계정에서 Workers를 사용할 수 있도록 설정합니다. 프로젝트의 `tools/cms-auth`에서 Wrangler로 인증 서버를 배포합니다.

   ```bash
   npx wrangler login
   npx wrangler deploy
   ```

   반환되는 `https://nahyun-cms-auth.…workers.dev` 주소를 보관합니다. 이 단계의 서버는 아직 로그인을 받지 않습니다.

2. GitHub **Settings → Developer settings → OAuth Apps → New OAuth App**에서 앱을 만듭니다.
   - Application name: `Nahyun Lee website editor`
   - Homepage URL: `https://nahyunlee.com`
   - Authorization callback URL: `1단계의 주소/callback`

3. GitHub에서 받은 Client ID와 Client Secret을 서버의 secret으로 각각 입력합니다. 값을 소스 파일, ZIP, 채팅에 넣지 마세요.

   ```bash
   npx wrangler secret put CLIENT_ID
   npx wrangler secret put CLIENT_SECRET
   ```

4. `admin/settings.js`의 빈 `oauth_origin`에 1단계의 주소를 넣습니다. 마지막 `/`는 제외합니다. 공개 설정에는 이 서버 주소만 들어가고 비밀키는 들어가지 않습니다.

5. 이 수정본을 `leadtheworld/leadtheworld.github.io`의 `main` 브랜치에 반영해 기존 배포를 실행합니다. 배포 후 `https://nahyunlee.com/admin/`에서 GitHub로 로그인하세요. 기본 설정은 `leadtheworld` 계정이면서 이 저장소에 쓰기 권한이 있는 경우에만 인증을 완료합니다.

6. 연결 후 임시 뉴스 한 개를 만들고 홈페이지/뉴스 목록을 확인한 다음 삭제하세요. 블로그 초안 저장 → 공개 → 본문/이미지 확인과 로그아웃도 한 번 확인하세요. 실제 OAuth 로그인과 원격 저장은 계정 연결 후 검증해야 합니다.

인증 서버를 먼저 배포해도 홈페이지는 자동 변경되지 않습니다. 위 5단계에서 소스를 배포해야 디자인과 관리 화면이 실제 홈페이지에 반영됩니다. OAuth 앱을 통해 발급받는 토큰은 GitHub의 `public_repo` 범위를 사용합니다. 별도 비밀번호를 홈페이지에 저장하지 않습니다.

## 평소 글 수정하기

- `https://nahyunlee.com/admin/`에 직접 접속 → GitHub 로그인 → **뉴스 · 공지사항** 또는 **Blog · 외전**을 선택합니다.
- **News:** 제목, 홈페이지용 짧은 제목, 설명과 날짜를 입력합니다. `LinkedIn 게시물 주소`를 채우면 홈페이지와 뉴스 목록 모두 해당 게시물로 연결됩니다. 비워두면 `기본 링크`를 사용합니다. 공개한 항목 중 날짜가 가장 최신인 한 개를 홈페이지에 표시합니다. 같은 날짜이면 목록에서 뒤에 있는 항목이 우선합니다.
- **Announcements:** 표시 스위치를 켠 첫 번째 공지를 홈페이지 상단에 표시합니다. `**문구**`로 굵게 표시합니다. 모두 끄면 공지 박스를 숨깁니다.
- **Blog:** 이미지와 Markdown 본문을 편집합니다. 새 글은 기본적으로 비공개 초안입니다. `공개`를 켜고 **Publish**를 누르면 블로그에 표시됩니다. 연구를 연결하면 글에서 연구 페이지로, 지구본에서는 최신 연결 글로 이동할 수 있습니다.
- **Publish**는 저장소에 변경사항을 저장합니다. 기존 GitHub Actions 빌드/배포가 끝나면 홈페이지가 바뀝니다. 즉시 새로고침에 반영되지 않을 수 있습니다. 초안도 저장소에는 저장되므로 비공개 메모나 개인정보를 넣지 마세요.
- 수정 전 버전은 GitHub 파일 기록에서 확인하거나 되돌릴 수 있습니다. 블로그는 Publication 목록과 별도로 관리됩니다.

## 파일 위치

| 내용          | 저장 파일                                     |
| ------------- | --------------------------------------------- |
| 뉴스          | `_data/atlas_news.yml`                        |
| 공지          | `_data/atlas_announcements.yml`               |
| 블로그        | `_posts/YYYY-MM-DD-title.md`                  |
| 업로드 이미지 | `assets/img/uploads/`                         |
| 관리 화면     | `admin/`                                      |
| 인증 서버     | `tools/cms-auth/` (Jekyll 공개 빌드에서 제외) |

`OPEN_PREVIEW.html`은 로컬 디자인 검토용입니다. 로컬 파일이나 대화 미리보기에서는 실제 홈페이지 글을 저장할 수 없습니다. 로그인은 배포된 사이트의 `/admin/`에서 사용합니다.

공식 문서: [Decap GitHub backend](https://decapcms.org/docs/github-backend/), [GitHub OAuth](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps), [Cloudflare Wrangler](https://developers.cloudflare.com/workers/wrangler/commands/).
