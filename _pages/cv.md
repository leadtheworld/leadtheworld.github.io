---
layout: page
permalink: /cv/
title: # CV
nav: true
nav_order: 1
cv_pdf: /assets/pdf/NahyunLee_CV.pdf # you can also use external links here
description: # This is a description of the page. You can modify it in '_pages/cv.md'. You can also change or remove the top pdf download button.
toc:
  sidebar: left
---

{% if page.cv_pdf %}
{% assign cv_pdf_url = page.cv_pdf %}
{% if page.cv_pdf contains '://' %}
{% assign cv_pdf_url = page.cv_pdf %}
{% else %}
{% assign cv_pdf_url = page.cv_pdf | relative_url %}
{% endif %}

<div style="margin: 0 0 1.5rem 0; width: 100%; overflow: hidden;">
  <iframe
    src="{{ cv_pdf_url }}"
    title="CV PDF"
    style="display: block; width: 100%; min-height: 900px; height: min(85vh, 1200px); border: 0;"
  ></iframe>
</div>
{% endif %}
