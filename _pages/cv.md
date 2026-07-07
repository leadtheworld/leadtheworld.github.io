---
layout: page
permalink: /cv/
title: CV
nav: true
nav_order: 1
hide_title: true
cv_pdf: # Google Drive PDF embed ID (get from: https://drive.google.com/file/d/{FILE_ID}/view)
description: # This is a description of the page. You can modify it in '_pages/cv.md'. You can also change or remove the top pdf download button.
---

{% if page.cv_pdf %}
<div style="margin: 0 auto 1.5rem auto; width: 100%; overflow: hidden; display: flex; justify-content: center;">
  <iframe
    src="https://drive.google.com/file/d/{{ page.cv_pdf }}/preview"
    title="CV PDF"
    style="width: 100%; height: 100vh; border: none;"
    allow="autoplay"
  ></iframe>
</div>
{% else %}
<p style="text-align: center; color: var(--global-text-color-light); padding: 2rem;">
  CV PDF is not yet configured. Please add your Google Drive file ID to the <code>cv_pdf</code> field in this page's front matter.
</p>
{% endif %}
