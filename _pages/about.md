---
layout: about
title: about
permalink: /
subtitle: <span style="font-size:2em; font-weight:800; color:#5a6b40; font-style:italic;">Augmenting how we perceive the world</span>

profile:
  align: right
  image: nahyunlee.jpg
  image_circular: false # crops the image to make it circular
  more_info: >
    <p>Now I'm at KAIST in Korea!</p>

selected_papers: false # includes a list of papers marked as "selected={true}"
social: false # includes social icons at the bottom of the page

announcements:
  enabled: true # includes a list of news items
  scrollable: true # adds a vertical scroll bar if there are more than 3 news items
  limit: 5 # leave blank to include all the news in the `_news` folder

latest_posts:
  enabled: false
  scrollable: true # adds a vertical scroll bar if there are more than 3 new posts items
  limit: 3 # leave blank to include all the blog posts
---

<style>
  .name-icon-links {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    margin-left: 0.9rem;
    vertical-align: middle;
    transform: translateY(-0.15rem);
  }

  .name-icon-links a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--global-text-color);
    background: transparent;
    text-decoration: none;
    font-size: 1.05rem;
    line-height: 1;
    opacity: 0.9;
    transition: color 0.2s ease, opacity 0.2s ease, transform 0.2s ease;
  }

  .name-icon-links a:hover {
    color: #5a6b40;
    opacity: 1;
    text-decoration: none;
    transform: translateY(-1px);
  }

  .name-icon-links a:visited {
    color: var(--global-text-color);
  }

  .name-icon-links a:visited:hover {
    color: #5a6b40;
  }

  .name-icon-links i {
    display: inline-block;
  }

  @media (max-width: 768px) {
    .name-icon-links {
      display: flex;
      margin-left: 0;
      margin-top: 0.75rem;
      transform: none;
    }
  }
</style>

<script>
  document.addEventListener("DOMContentLoaded", function () {
    const title = document.querySelector(".post-title");

    if (!title || title.querySelector(".name-icon-links")) return;

    const iconLinks = document.createElement("span");
    iconLinks.className = "name-icon-links";
    iconLinks.innerHTML = `
      <a
        href="mailto:leadtheworld@g.skku.edu?subject=Research%20or%20Collaboration%20Inquiry"
        aria-label="Email"
        title="Email"
      >
        <i class="fa-solid fa-envelope"></i>
      </a>

      <a
        href="/assets/pdf/NahyunLee_CV.pdf"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="CV"
        title="CV"
      >
        <i class="ai ai-cv"></i>
      </a>

      <a
        href="https://www.linkedin.com/in/leadtheworld/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="LinkedIn"
        title="LinkedIn"
      >
        <i class="fa-brands fa-linkedin"></i>
      </a>

      <a
        href="https://scholar.google.com/citations?hl=ko&view_op=list_works&gmla=AEk_c1speIk_T40O7IRLEmzPbVhstG8zGZGCmWbNTfKX0NfZ4SMB3PYag4NV_dwxSh5wUbX1r2msdUGS_KJ23pyA633F9tq3aKj7B5W4fkZ7mYR4uA&user=11pN9C4AAAAJ"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Google Scholar"
        title="Google Scholar"
      >
        <i class="ai ai-google-scholar"></i>
      </a>
    `;

    title.appendChild(iconLinks);
  });
</script>

I am a fourth-year undergraduate researcher at `Sungkyunkwan University`, pursuing a triple major in Mechanical Engineering, Software Engineering, and a self-designed major in Human–Computer Interaction (HCI). My research explores the intersection of `Cognitive Augmentation`, `VR/AR`, `Haptics`, and `HCI`. I aim to augment human perception to make the world more interpretable and intuitive in increasingly information-rich environments.

Currently a research intern at KAIST, I am advised by [Ian Oakley](https://scholar.google.com/citations?user=eth0NcUAAAAJ&hl=ko&oi=ao) in [the Wearable Interaction Technology Lab](https://wit.kaist.ac.kr/). Previously, I conducted research with the Interaction Independence Study Group at the Stanford Center at the Incheon Global Campus under the supervision of Hoseok Jung (2024–2025). I am a recipient of the Presidential Science Scholarship since 2025.