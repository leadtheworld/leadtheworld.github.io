---
layout: page
title: projects
permalink: /projects/
description: # A growing collection of your cool projects.
nav: true
nav_order: 2
display_categories: []
horizontal: true
---

<!-- pages/projects.md -->
<div class="projects">
  <div class="project-filters mb-4">
    <span class="filter-label">Filter by keyword:</span>
    <button class="btn btn-outline-secondary btn-sm filter-chip active" data-filter="all">All</button>
    {% capture all_keywords %}{% endcapture %}
    {% for project in site.projects %}
      {% if project.keywords %}
        {% for keyword in project.keywords %}
          {% assign all_keywords = all_keywords | append: keyword | append: '|' %}
        {% endfor %}
      {% endif %}
    {% endfor %}
    {% assign unique_keywords = all_keywords | split: '|' | uniq | sort %}
    {% for keyword in unique_keywords %}
      {% if keyword != '' %}
        <button class="btn btn-outline-secondary btn-sm filter-chip" data-filter="{{ keyword | downcase | strip }}">{{ keyword }}</button>
      {% endif %}
    {% endfor %}
  </div>
{% if site.enable_project_categories and page.display_categories and page.display_categories.size > 0 %}
  <!-- Display categorized projects -->
  {% for category in page.display_categories %}
  <a id="{{ category }}" href=".#{{ category }}">
    <h2 class="category">{{ category }}</h2>
  </a>
  {% assign categorized_projects = site.projects | where: "category", category %}
  {% assign sorted_projects = categorized_projects | sort: "importance" %}
  <!-- Generate cards for each project -->
  {% if page.horizontal %}
  <div class="container">
    <div class="row row-cols-1 row-cols-md-2">
    {% for project in sorted_projects %}
      {% include projects_horizontal.liquid %}
    {% endfor %}
    </div>
  </div>
  {% else %}
  <div class="row row-cols-1 row-cols-md-3">
    {% for project in sorted_projects %}
      {% include projects.liquid %}
    {% endfor %}
  </div>
  {% endif %}
  {% endfor %}

{% else %}

<!-- Display projects without categories -->

{% assign sorted_projects = site.projects | sort: "importance" %}

  <!-- Generate cards for each project -->

{% if page.horizontal %}

  <div class="container">
    <div class="row row-cols-1 row-cols-md-2 project-grid">
    {% for project in sorted_projects %}
      {% include projects_horizontal.liquid %}
    {% endfor %}
    </div>
  </div>
  {% else %}
  <div class="row row-cols-1 row-cols-md-3 project-grid">
    {% for project in sorted_projects %}
      {% include projects.liquid %}
    {% endfor %}
  </div>
  {% endif %}
{% endif %}
</div>

<script>
  document.addEventListener('DOMContentLoaded', function () {
    const filterButtons = document.querySelectorAll('.filter-chip');
    const projectCards = document.querySelectorAll('.project-card-item');

    const setActiveFilter = (filter) => {
      filterButtons.forEach((button) => {
        if (button.dataset.filter === filter) {
          button.classList.add('active');
        } else {
          button.classList.remove('active');
        }
      });

      projectCards.forEach((card) => {
        const keywords = card.dataset.keywords ? card.dataset.keywords.split('|') : [];
        if (filter === 'all' || keywords.includes(filter)) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    };

    filterButtons.forEach((button) => {
      button.addEventListener('click', function (event) {
        event.preventDefault();
        const filter = event.currentTarget.dataset.filter;
        setActiveFilter(filter);
      });
    });
  });
</script>
