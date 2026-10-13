// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-nahyun-lee",
    title: "Nahyun Lee",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-nahyun-lee",
          title: "Nahyun Lee",
          description: "Nahyun Lee — human perception and sensemaking through HCI, XR/haptics, and behavioral research.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/";
          },
        },{id: "nav-curriculum-vitae",
          title: "Curriculum vitae",
          description: "Nahyun Lee — human perception and sensemaking through HCI, XR/haptics, and behavioral research.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/cv/";
          },
        },{id: "nav-publications",
          title: "Publications",
          description: "Nahyun Lee — human perception and sensemaking through HCI, XR/haptics, and behavioral research.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/publications/";
          },
        },{id: "nav-blog",
          title: "Blog",
          description: "Notes on the process, unexpected detours, and life around research — Nahyun Lee.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/blog/";
          },
        },{id: "news-my-first-poster-is-this-enough-to-decide-facilitating-informed-investment-decisions-by-visualizing-missing-evidence-has-been-accepted-to-chi-2026-acceptance-rate-38-4-special-thanks-to-hyeon-jeon",
          title: 'My first poster, Is This Enough to Decide? Facilitating Informed Investment Decisions by...',
          description: "",
          section: "News",},{
        id: 'social-cv',
        title: 'CV',
        section: 'Socials',
        handler: () => {
          window.open("/assets/pdf/NahyunLee_CV.pdf", "_blank");
        },
      },{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%6C%65%61%64%74%68%65%77%6F%72%6C%64@%67.%73%6B%6B%75.%65%64%75", "_blank");
        },
      },{
        id: 'social-github',
        title: 'GitHub',
        section: 'Socials',
        handler: () => {
          window.open("https://github.com/leadtheworld", "_blank");
        },
      },{
        id: 'social-linkedin',
        title: 'LinkedIn',
        section: 'Socials',
        handler: () => {
          window.open("https://www.linkedin.com/in/leadtheworld", "_blank");
        },
      },{
        id: 'social-scholar',
        title: 'Google Scholar',
        section: 'Socials',
        handler: () => {
          window.open("https://scholar.google.com/citations?user=11pN9C4AAAAJ", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
