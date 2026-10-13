/* Research Atlas. A dependency-free 3D spherical projection drawn on a 2D canvas. */
(() => {
  "use strict";
  const TAU = Math.PI * 2;
  const rad = (degrees) => (degrees * Math.PI) / 180;
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const vector = (lat, lon) => {
    const p = rad(lat),
      l = rad(lon);
    return { x: Math.cos(p) * Math.sin(l), y: Math.sin(p), z: Math.cos(p) * Math.cos(l) };
  };
  const rotate = (point, yaw, pitch) => {
    const x = point.x * Math.cos(yaw) + point.z * Math.sin(yaw);
    const z = -point.x * Math.sin(yaw) + point.z * Math.cos(yaw);
    return { x, y: point.y * Math.cos(pitch) - z * Math.sin(pitch), z: point.y * Math.sin(pitch) + z * Math.cos(pitch) };
  };
  const slerp = (a, b, t) => {
    const omega = Math.acos(clamp(a.x * b.x + a.y * b.y + a.z * b.z, -1, 1));
    if (omega < 1e-7) return { ...a };
    const s = Math.sin(omega);
    const wa = Math.sin((1 - t) * omega) / s,
      wb = Math.sin(t * omega) / s;
    return { x: a.x * wa + b.x * wb, y: a.y * wa + b.y * wb, z: a.z * wa + b.z * wb };
  };
  const angleDelta = (target, current) => Math.atan2(Math.sin(target - current), Math.cos(target - current));
  const neighbors = (id, edges) => new Set(edges.flatMap((edge) => (edge.source === id ? [edge.target] : edge.target === id ? [edge.source] : [])));
  const geometry = { rad, clamp, vector, rotate, slerp, angleDelta, neighbors };
  // Pure geometry can be tested in Node without a browser or a rendering engine.
  if (typeof module !== "undefined" && module.exports) module.exports = geometry;
  if (typeof document === "undefined") return;

  const canvas = document.getElementById("research-globe");
  const source = document.getElementById("atlas-data");
  if (!canvas || !source) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  let data;
  try {
    data = JSON.parse(source.textContent);
  } catch {
    return;
  }
  let blogPosts = [];
  try {
    blogPosts = JSON.parse(document.getElementById("atlas-blog-data")?.textContent || "[]");
  } catch {
    /* Research remains available if optional blog data is absent. */
  }
  const shell = document.getElementById("globe-shell");
  const panel = document.getElementById("project-preview");
  const closeButton = document.getElementById("close-preview");
  const rotationButton = document.getElementById("globe-rotation-toggle");
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobileQuery = window.matchMedia("(max-width: 800px)");
  const base = document.body.dataset.baseurl || "";
  const localURL = (path) => {
    const previewRoot = document.body.dataset.previewRoot;
    if (previewRoot === undefined) return base + path;
    const [pathname, fragment] = path.split("#");
    return previewRoot + pathname.replace(/^\//, "") + (pathname.endsWith("/") ? "index.html" : "") + (fragment ? "#" + fragment : "");
  };
  const clusters = new Map(data.clusters.map((cluster) => [cluster.id, cluster]));
  const nodes = data.projects.map((project) => ({
    ...project,
    blog: blogPosts.find((post) => post.project_id === project.id)?.url || project.blog,
    vector: vector(project.lat, project.lon),
    element: document.querySelector(`[data-project="${project.id}"]`),
    label: document.querySelector(`[data-project="${project.id}"] .node-label`),
  }));
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const edges = data.edges.map((edge) => ({ ...edge, a: nodeMap.get(edge.source), b: nodeMap.get(edge.target) })).filter((edge) => edge.a && edge.b);
  const allSelectButtons = Array.from(document.querySelectorAll("[data-select-project]"));
  let width = 0,
    height = 0,
    radius = 0,
    cx = 0,
    cy = 0;
  let yaw = -0.08,
    pitch = 0.1;
  let activeId = null,
    linked = new Set();
  // Rotation is the requested default; reduced motion uses a gentler speed.
  // Visitors can pause explicitly as well as by hovering or focusing a point.
  let userPaused = false,
    reduced = motionQuery.matches;
  let pinned = false,
    globeHovered = false,
    keyboardFocused = false,
    panelHovered = false,
    nodeHovered = false,
    dragging = false;
  let pointer = null,
    closeTimer = null,
    raf = null,
    previousTime = 0;
  let onScreen = true;
  const grid = [];
  for (let latitude = -60; latitude <= 60; latitude += 20) {
    const points = [];
    for (let longitude = 0; longitude <= 360; longitude += 5) points.push(vector(latitude, longitude));
    grid.push(points);
  }
  for (let longitude = 0; longitude < 180; longitude += 20) {
    const points = [];
    for (let angle = 0; angle <= 360; angle += 5) {
      const t = rad(angle),
        l = rad(longitude);
      points.push({ x: Math.sin(t) * Math.sin(l), y: Math.cos(t), z: Math.sin(t) * Math.cos(l) });
    }
    grid.push(points);
  }
  for (const node of nodes) node.element.style.setProperty("--node-color", clusters.get(node.cluster).color);

  const project = (point, lift = 1) => {
    const r = rotate(point, yaw, pitch);
    return { x: cx + r.x * radius * lift, y: cy - r.y * radius * lift, z: r.z };
  };
  const updateHighlights = () => {
    linked = activeId ? neighbors(activeId, edges) : new Set();
    for (const node of nodes) {
      node.element.classList.toggle("is-selected", node.id === activeId);
      node.element.classList.toggle("is-related", linked.has(node.id));
      node.element.classList.toggle("is-dim", !!activeId && node.id !== activeId && !linked.has(node.id));
      node.element.setAttribute("aria-expanded", String(node.id === activeId));
    }
    allSelectButtons.forEach((button) => button.setAttribute("aria-expanded", String(button.dataset.selectProject === activeId)));
  };
  const closePreview = (moveFocus = false) => {
    clearTimeout(closeTimer);
    activeId = null;
    pinned = false;
    panelHovered = false;
    nodeHovered = false;
    panel.hidden = true;
    updateHighlights();
    if (moveFocus) shell.focus({ preventScroll: true });
    start();
  };
  const scheduleClose = () => {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      if (!pinned && !panelHovered && !nodeHovered && !panel.contains(document.activeElement) && !document.activeElement?.matches(".globe-node"))
        closePreview();
    }, 330);
  };
  const openPreview = (id, pin = false) => {
    const node = nodeMap.get(id);
    if (!node) return;
    clearTimeout(closeTimer);
    activeId = id;
    pinned = pin;
    document.getElementById("preview-title").textContent = node.title;
    document.getElementById("preview-status").textContent = node.status;
    document.getElementById("preview-summary").textContent = node.summary;
    const methods = document.getElementById("preview-methods");
    methods.replaceChildren(
      ...node.methods.slice(0, 3).map((method) => {
        const tag = document.createElement("span");
        tag.textContent = method;
        return tag;
      })
    );
    const links = document.getElementById("preview-links");
    links.replaceChildren();
    if (node.publications.length) {
      const link = document.createElement("a");
      link.href = localURL(node.detail_url);
      link.textContent = "Publication ↗";
      links.append(link);
    } else {
      const link = document.createElement("a");
      link.href = localURL(node.detail_url);
      link.textContent = "Research project ↗";
      links.append(link);
    }
    if (node.blog) {
      const note = document.createElement("a");
      note.href = localURL(node.blog);
      note.textContent = "Blog ↗";
      links.append(note);
    }
    document.getElementById("preview-connection").textContent = node.connection || "";
    const position = project(node.vector);
    panel.style.left = position.x < width * 0.48 && !mobileQuery.matches ? "auto" : "";
    panel.style.right = position.x < width * 0.48 && !mobileQuery.matches ? "20px" : "";
    panel.hidden = false;
    updateHighlights();
    start();
  };
  for (const node of nodes) {
    node.element.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "touch" || dragging) return;
      // A clicked card stays pinned until explicitly closed or another point is clicked.
      if (pinned && activeId !== node.id) return;
      nodeHovered = true;
      openPreview(node.id, pinned);
    });
    node.element.addEventListener("pointerleave", () => {
      nodeHovered = false;
      scheduleClose();
    });
    node.element.addEventListener("focus", () => {
      nodeHovered = true;
      openPreview(node.id, pinned);
    });
    node.element.addEventListener("blur", () => {
      nodeHovered = false;
      scheduleClose();
      start();
    });
    node.element.addEventListener("click", (event) => {
      openPreview(node.id, true);
      if (event.detail === 0) closeButton.focus();
    });
  }
  panel.addEventListener("pointerenter", () => {
    panelHovered = true;
    clearTimeout(closeTimer);
  });
  panel.addEventListener("pointerleave", () => {
    panelHovered = false;
    scheduleClose();
    start();
  });
  panel.addEventListener("focusout", scheduleClose);
  closeButton.addEventListener("click", () => closePreview(true));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeId) closePreview(true);
  });
  allSelectButtons.forEach((button) => {
    button.setAttribute("aria-controls", "project-preview");
    button.setAttribute("aria-expanded", "false");
    button.addEventListener("click", (event) => {
      openPreview(button.dataset.selectProject, true);
      if (event.detail === 0) closeButton.focus();
      if (mobileQuery.matches || shell.getBoundingClientRect().bottom < 100)
        shell.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    });
  });
  // Hover anywhere on the globe to read; leaving it always resumes the orbit.
  // A pinned preview stays readable without freezing the globe indefinitely.
  shell.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "touch") return;
    globeHovered = true;
    start();
  });
  shell.addEventListener("pointerleave", () => {
    globeHovered = false;
    nodeHovered = false;
    panelHovered = false;
    scheduleClose();
    start();
  });
  shell.addEventListener("focusin", (event) => {
    keyboardFocused = event.target !== shell && event.target.matches(":focus-visible");
    start();
  });
  shell.addEventListener("focusout", (event) => {
    if (!shell.contains(event.relatedTarget)) keyboardFocused = false;
    start();
  });
  const toggleRotation = () => {
    userPaused = !userPaused;
    if (rotationButton) rotationButton.textContent = userPaused ? "Resume rotation" : "Pause rotation";
    previousTime = 0;
    start();
  };
  if (rotationButton) {
    rotationButton.hidden = false;
    rotationButton.addEventListener("click", toggleRotation);
  }
  shell.addEventListener("keydown", (event) => {
    if (event.target !== shell) return;
    if (event.key === " ") {
      event.preventDefault();
      toggleRotation();
    }
  });
  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    closePreview();
    dragging = true;
    pointer = { x: event.clientX, y: event.clientY, id: event.pointerId };
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add("is-dragging");
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!dragging || !pointer || pointer.id !== event.pointerId) return;
    yaw += (event.clientX - pointer.x) * 0.007;
    pitch = clamp(pitch + (event.clientY - pointer.y) * 0.006, -1.2, 1.2);
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    start();
  });
  const stopDrag = () => {
    dragging = false;
    pointer = null;
    canvas.classList.remove("is-dragging");
    start();
  };
  canvas.addEventListener("pointerup", stopDrag);
  canvas.addEventListener("pointercancel", stopDrag);
  canvas.addEventListener("lostpointercapture", stopDrag);
  motionQuery.addEventListener("change", (event) => {
    reduced = event.matches;
    start();
  });

  const segment = (a, b, color, alpha, lineWidth = 0.7) => {
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  };
  const curve = (a, b, color, alpha, selected = false, dashed = false) => {
    const count = 45;
    for (let i = 1; i <= count; i++) {
      if (dashed && Math.floor(i / 3) % 2) continue;
      const p = project(slerp(a, b, (i - 1) / count), 1.045);
      const q = project(slerp(a, b, i / count), 1.045);
      const z = (p.z + q.z) / 2;
      segment(p, q, color, alpha * (z > 0 ? 0.48 + z * 0.52 : 0.1), selected ? 1.5 : 0.7);
    }
  };
  const measureLabels = () => {
    for (const node of nodes) {
      const wasVisible = node.element.classList.contains("is-projected");
      node.element.classList.add("is-projected");
      node.labelWidth = node.label.offsetWidth || Math.min(148, node.label.textContent.trim().length * 7 + 12);
      node.labelHeight = node.label.offsetHeight || 27;
      node.element.classList.toggle("is-projected", wasVisible);
    }
  };
  const placeLabels = (points) => {
    const occupied = [];
    const overlap = (a, b) =>
      Math.max(0, Math.min(a.x + a.w + 4, b.x + b.w) - Math.max(a.x - 4, b.x)) *
      Math.max(0, Math.min(a.y + a.h + 4, b.y + b.h) - Math.max(a.y - 4, b.y));
    const markers = points.map(({ p }) => ({ x: p.x - 10, y: p.y - 10, w: 20, h: 20 }));
    // Keep every visible project name, moving labels around crowded points.
    for (const { node, p } of points) {
      const w = node.labelWidth,
        h = node.labelHeight;
      const preferredLeft = p.x > width / 2;
      let best = null;
      const verticalPositions = [
        p.y - h / 2,
        8,
        height - h - 8,
        ...occupied.flatMap((box) => [box.y - h - 8, box.y + box.h + 8]),
        ...markers.flatMap((box) => [box.y - h - 8, box.y + box.h + 8]),
      ];
      for (const left of [preferredLeft, !preferredLeft]) {
        const near = clamp(left ? p.x - w - 15 : p.x + 15, 8, Math.max(8, width - w - 8));
        for (const x of [near, left ? 8 : Math.max(8, width - w - 8)]) {
          for (const preferredY of verticalPositions) {
            const y = clamp(preferredY, 8, Math.max(8, height - h - 8));
            const box = { x, y, w, h };
            const anchorX = clamp(p.x, x, x + w),
              anchorY = clamp(p.y, y, y + h);
            const labelCollision = occupied.reduce((sum, rect) => sum + overlap(box, rect), 0);
            const markerCollision = markers.reduce((sum, rect) => sum + overlap(box, rect), 0);
            const score =
              labelCollision * 1000000 + markerCollision * 1000 + (anchorX - p.x) ** 2 + (anchorY - p.y) ** 2 + (left === preferredLeft ? 0 : 64);
            if (!best || score < best.score) best = { ...box, anchorX, anchorY, score, left };
          }
        }
      }
      occupied.push(best);
      node.label.style.left = `${best.x - p.x + 20}px`;
      node.label.style.top = `${best.y - p.y + 20}px`;
      node.label.style.textAlign = best.left ? "right" : "left";
      if (Math.hypot(best.anchorX - p.x, best.anchorY - p.y) > 22) segment(p, { x: best.anchorX, y: best.anchorY }, "#5d6a45", 0.26, 0.65);
    }
    ctx.globalAlpha = 1;
  };
  const draw = () => {
    if (!width || !height) return;
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, width, height);
    const haze = ctx.createRadialGradient(cx, cy, radius * 0.72, cx, cy, radius * 1.2);
    haze.addColorStop(0, "#8fa68408");
    haze.addColorStop(0.64, "#8fa68410");
    haze.addColorStop(1, "#8fa68400");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, width, height);
    const surface = ctx.createRadialGradient(cx - radius * 0.4, cy - radius * 0.45, radius * 0.08, cx, cy, radius * 1.18);
    surface.addColorStop(0, "#fffdf57d");
    surface.addColorStop(0.5, "#e6eadc0a");
    surface.addColorStop(0.83, "#96a58214");
    surface.addColorStop(1, "#5d6a4526");
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, TAU);
    ctx.fillStyle = surface;
    ctx.fill();
    ctx.strokeStyle = "#5d6a453d";
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 1, 0, TAU);
    ctx.clip();
    for (const cluster of data.clusters) {
      const p = project(vector(cluster.lat, cluster.lon));
      if (p.z < -0.2) continue;
      const fog = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 0.53);
      fog.addColorStop(0, cluster.color + "16");
      fog.addColorStop(1, cluster.color + "00");
      ctx.globalAlpha = 0.5 + Math.max(0, p.z) * 0.5;
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();
    for (const path of grid) {
      for (let i = 1; i < path.length; i++) {
        const a = project(path[i - 1]),
          b = project(path[i]);
        const z = (a.z + b.z) / 2;
        segment(a, b, "#68815d", z > 0 ? 0.07 + z * 0.14 : 0.028, 0.65);
      }
    }
    for (const edge of edges) {
      const highlighted = activeId && (edge.source === activeId || edge.target === activeId);
      curve(edge.a.vector, edge.b.vector, highlighted ? "#4d705f" : "#869484", highlighted ? 0.85 : activeId ? 0.07 : 0.32, highlighted);
    }
    ctx.globalAlpha = 1;
    const visiblePoints = [];
    for (const node of nodes) {
      const p = project(node.vector);
      const visible = p.z > 0.035;
      const selected = node.id === activeId,
        related = linked.has(node.id);
      node.element.classList.toggle("is-projected", visible);
      node.element.style.left = `${p.x}px`;
      node.element.style.top = `${p.y}px`;
      node.element.style.zIndex = String(selected ? 11 : Math.round(5 + p.z * 4));
      node.element.style.setProperty("--node-opacity", String((activeId && !selected && !related ? 0.3 : 1) * (0.76 + Math.max(0, p.z) * 0.24)));
      node.element.classList.toggle("is-labelled", visible);
      if (visible) visiblePoints.push({ node, p });
      node.element.tabIndex = visible ? 0 : -1;
      node.element.setAttribute("aria-hidden", String(!visible));
      if (!visible) {
        if (related) {
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 12);
          glow.addColorStop(0, clusters.get(node.cluster).color + "88");
          glow.addColorStop(1, clusters.get(node.cluster).color + "00");
          ctx.globalAlpha = 0.5;
          ctx.fillStyle = glow;
          ctx.fillRect(p.x - 12, p.y - 12, 24, 24);
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.8, 0, TAU);
        ctx.fillStyle = clusters.get(node.cluster).color;
        ctx.globalAlpha = 0.16;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    placeLabels(visiblePoints);
  };
  const tick = (time) => {
    raf = null;
    const dt = Math.min((time - (previousTime || time)) / 1000, 0.05);
    previousTime = time;
    const paused = userPaused || globeHovered || keyboardFocused || dragging;
    if (!paused) yaw = (yaw + dt * (reduced ? 0.025 : 0.04)) % TAU;
    draw();
    if (!raf && onScreen && !document.hidden && (!paused || dragging)) raf = requestAnimationFrame(tick);
  };
  function start() {
    if (!raf && !document.hidden && onScreen) raf = requestAnimationFrame(tick);
  }
  const resize = () => {
    const box = shell.getBoundingClientRect();
    width = box.width;
    height = box.height;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    cx = width * 0.5;
    cy = height * 0.5;
    radius = Math.min(width * 0.42, height * 0.42);
    measureLabels();
    draw();
    start();
  };
  if (typeof ResizeObserver !== "undefined") new ResizeObserver(resize).observe(shell);
  else window.addEventListener("resize", resize);
  if (typeof IntersectionObserver !== "undefined") {
    new IntersectionObserver(
      (entries) => {
        onScreen = entries[0].isIntersecting;
        if (onScreen) {
          previousTime = 0;
          start();
        } else if (raf) {
          cancelAnimationFrame(raf);
          raf = null;
        }
      },
      { rootMargin: "120px" }
    ).observe(shell);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && raf) {
      cancelAnimationFrame(raf);
      raf = null;
    } else {
      previousTime = 0;
      start();
    }
  });
  resize();
  if (document.fonts) document.fonts.ready.then(resize);
  start();
})();
