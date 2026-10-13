---
layout: page
title: projects
permalink: /projects/
description: # A growing collection of your cool projects.
nav: false
nav_order: 2
hide_title: true
display_categories: []
horizontal: true
---

<style>
  /* Hide keyword filter */
  .project-filters {
    display: none !important;
  }

  /* Add spacing between project cards */
  .projects .project-grid {
    row-gap: 1.6rem;
  }

  /* Make horizontal project cards taller */
  .projects .project-card-item .card {
    min-height: 190px;
  }

  /* Make the image column wider */
  .projects .project-card-item .row > div:first-child {
    flex: 0 0 28% !important;
    max-width: 28% !important;
  }

  /* Make the text column narrower accordingly */
  .projects .project-card-item .row > div:last-child {
    flex: 0 0 72% !important;
    max-width: 72% !important;
  }

  /* Make image fill its column */
  .projects .project-card-item img,
  .projects .project-card-item .card-img {
    width: 100% !important;
    height: 100% !important;
    min-height: 150px;
    object-fit: cover;
    object-position: center;
  }

  /* Prevent image overflow */
  .projects .project-card-item .row > div:first-child {
    overflow: hidden;
  }

  /* Mobile: stack image above text */
  @media (max-width: 768px) {
    .projects .project-card-item .row > div:first-child,
    .projects .project-card-item .row > div:last-child {
      flex: 0 0 100% !important;
      max-width: 100% !important;
    }

    .projects .project-card-item img,
    .projects .project-card-item .card-img {
      min-height: 220px;
    }
  }
</style>

<!-- pages/projects.md -->
<div class="projects">
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
          <div class="row row-cols-1 project-grid">
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
    {% endfor %}

{% else %}

    <!-- Display projects without categories -->
    {% assign sorted_projects = site.projects | sort: "importance" %}

    <!-- Generate cards for each project -->
    {% if page.horizontal %}
      <div class="container">
        <div class="row row-cols-1 project-grid">
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
