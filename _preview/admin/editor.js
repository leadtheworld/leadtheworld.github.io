(() => {
  "use strict";
  const settings = window.NAHYUN_CMS_SETTINGS || {};
  const status = document.getElementById("editor-status");
  const origin = settings.oauth_origin;
  if (!origin) return;
  try {
    if (new URL(origin).origin !== origin || !origin.startsWith("https://")) throw new Error("origin");
  } catch {
    status.textContent = "로그인 서버 주소를 확인해 주세요. https://로 시작하는 주소이며 마지막 /는 없어야 합니다.";
    return;
  }
  if (!window.CMS) {
    status.textContent = "편집기를 불러오지 못했습니다. 인터넷 연결을 확인하고 새로고침해 주세요.";
    return;
  }
  const field = (label, name, widget = "string", extra = {}) => ({ label, name, widget, ...extra });
  const optional = { required: false };
  const dateField = field("날짜 · YYYY-MM 또는 YYYY-MM-DD", "datetime", "string", {
    pattern: ["^\\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12][0-9]|3[01]))?$", "예: 2026-10 또는 2026-10-12"],
  });
  const urlField = field("기본 링크 · 사이트 경로 또는 https:// 주소", "url", "string", {
    pattern: ["^(https://[^\\s]+|/(?!/)[^\\s]*)$", "예: /cv/#awards 또는 https://…"],
  });
  const config = {
    load_config_file: false,
    backend: { name: "github", repo: settings.repository, branch: settings.branch, base_url: origin, auth_endpoint: "auth" },
    site_url: "https://nahyunlee.com",
    display_url: "https://nahyunlee.com",
    logo_url: "https://nahyunlee.com/assets/img/atlas-mark.svg",
    media_folder: "assets/img/uploads",
    public_folder: "/assets/img/uploads",
    slug: { encoding: "unicode", clean_accents: true },
    collections: [
      {
        name: "updates",
        label: "뉴스 · 공지사항",
        editor: { preview: false },
        files: [
          {
            name: "news",
            label: "News",
            file: "_data/atlas_news.yml",
            fields: [
              field("소식", "items", "list", {
                summary: "{{fields.datetime}} · {{fields.title}}",
                fields: [
                  field("공개", "published", "boolean", { default: true }),
                  dateField,
                  field("제목", "title"),
                  field("홈페이지용 짧은 제목", "short_title", "string", optional),
                  field("설명", "description", "text"),
                  urlField,
                  field("LinkedIn 게시물 주소 · 입력하면 기본 링크보다 우선", "linkedin_url", "string", {
                    required: false,
                    pattern: ["^https://(www\\.)?linkedin\\.com/[^\\s]+$", "LinkedIn 게시물의 https:// 주소를 입력하세요."],
                  }),
                  field("날짜 표시", "date", "hidden", { default: "" }),
                ],
              }),
            ],
          },
          {
            name: "announcements",
            label: "Announcements",
            file: "_data/atlas_announcements.yml",
            fields: [
              field("공지 · 첫 번째 활성 항목을 홈페이지에 표시", "items", "list", {
                summary: "{{fields.body}}",
                fields: [
                  field("표시", "enabled", "boolean", { default: true }),
                  field("공지 문구 · 굵게 표시할 부분은 **문구**", "body", "markdown", {
                    minimal: true,
                    buttons: ["bold", "italic", "link"],
                    editor_components: [],
                  }),
                  { ...urlField, required: false },
                  field("링크 문구", "link_label", "string", optional),
                ],
              }),
            ],
          },
        ],
      },
      {
        name: "blog",
        label: "Blog · 외전",
        label_singular: "글",
        folder: "_posts",
        create: true,
        slug: "{{year}}-{{month}}-{{day}}-{{slug}}",
        extension: "md",
        format: "frontmatter",
        fields: [
          field("레이아웃", "layout", "hidden", { default: "atlas-post" }),
          field("섹션", "section", "hidden", { default: "blog" }),
          field("공개 · 끄면 초안으로 저장", "published", "boolean", { default: false }),
          field("제목", "title"),
          field("소개", "description", "text"),
          field("작성일", "date", "datetime", { format: "YYYY-MM-DD", date_format: "YYYY-MM-DD", time_format: false }),
          field("주제", "topic", "string", optional),
          field("대표 이미지", "image", "image", optional),
          field("이미지 설명", "image_alt", "string", optional),
          field("연결할 연구", "project_id", "select", {
            required: false,
            options: [
              { label: "Mars thermal haptics", value: "mars" },
              { label: "Feeling the Heat", value: "firefighter" },
              { label: "FDS thermal feedback", value: "fire-dynamics" },
              { label: "FeelSound", value: "feelsound" },
              { label: "VR tactile illusion", value: "audiovisual-touch" },
              { label: "Beamforming", value: "beamforming" },
              { label: "Accessible muscle sensing", value: "muscle" },
              { label: "IMU evaluation", value: "imu" },
              { label: "Missing evidence", value: "evidence" },
              { label: "FacingLoss", value: "facingloss" },
              { label: "VR digital twin", value: "digital-twin" },
              { label: "Workplace AI", value: "workplace-ai" },
            ],
          }),
          field("관련 글 자동 생성", "related_posts", "hidden", { default: false }),
          field("본문", "body", "markdown"),
        ],
      },
    ],
  };
  window.CMS.registerEventListener({
    name: "preSave",
    handler: ({ entry }) => {
      if (entry.get("collection") !== "updates" || entry.get("slug") !== "news") return entry.get("data");
      return entry.get("data").update("items", (items) =>
        items.map((item) => {
          const iso = item.get("datetime");
          const value = new Date(iso.length === 7 ? iso + "-01T00:00:00Z" : iso + "T00:00:00Z");
          const options = { month: "short", year: "numeric", timeZone: "UTC" };
          if (iso.length > 7) options.day = "numeric";
          return item.set("date", value.toLocaleDateString("en-US", options));
        })
      );
    },
  });
  document.getElementById("editor-setup").hidden = true;
  window.CMS.init({ config });
})();
