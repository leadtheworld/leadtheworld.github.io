---
layout: page
permalink: /cv/
title: CV
nav: true
nav_order: 1
cv_pdf: /assets/pdf/NahyunLee_CV.pdf # you can also use external links here
description: # This is a description of the page. You can modify it in '_pages/cv.md'. You can also change or remove the top pdf download button.
---

{% if page.cv_pdf %}
{% assign cv_pdf_url = page.cv_pdf %}
{% if page.cv_pdf contains '://' %}
{% assign cv_pdf_url = page.cv_pdf %}
{% else %}
{% assign cv_pdf_url = page.cv_pdf | relative_url %}
{% endif %}

<div style="margin: 0 auto 1.5rem auto; max-width: 1170px; width: 100%; overflow: hidden; display: flex; justify-content: center;">
  <iframe
    src="{{ cv_pdf_url }}"
    title="CV PDF"
    style="width: 100%; min-height: 900px; height: min(85vh, 1200px); border: 0;"
  ></iframe>
</div>
{% endif %}
