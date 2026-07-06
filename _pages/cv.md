---
layout: page
permalink: /cv/
title: CV
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

  <div style="margin-bottom: 1.5rem;">
    <p>
      아래에서 PDF CV를 직접 확인할 수 있습니다. 새 창으로 열려면
      <a href="{{ cv_pdf_url }}" target="_blank" rel="noopener noreferrer">여기</a>
      를 클릭하세요.
    </p>
  </div>

  <div style="margin-bottom: 2rem; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
    <iframe
      src="{{ cv_pdf_url }}"
      title="CV PDF"
      style="width: 100%; height: 900px; border: 0;"
    ></iframe>
  </div>
{% endif %}
