(() => {
  const isSpanish = document.documentElement.lang === "es";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  document.querySelectorAll("[data-video-sound-toggle]").forEach((toggle) => {
    const video = toggle.closest(".hero-demo")?.querySelector("video");
    const label = toggle.querySelector("[data-sound-label]");

    if (!video || !label) return;

    const updateSoundLabel = () => {
      const text = video.muted
        ? (isSpanish ? "Activar sonido" : "Turn sound on")
        : (isSpanish ? "Silenciar demostración" : "Mute demo sound");
      label.textContent = text;
      toggle.setAttribute("aria-label", text);
      toggle.setAttribute("aria-pressed", String(!video.muted));
    };

    toggle.addEventListener("click", () => {
      video.muted = !video.muted;
      if (!video.paused) return updateSoundLabel();
      const playback = video.play();
      if (playback && typeof playback.catch === "function") playback.catch(() => {});
      updateSoundLabel();
    });

    updateSoundLabel();

    const syncMotionPreference = () => {
      if (reduceMotion.matches) {
        video.pause();
        return;
      }

      const playback = video.play();
      if (playback && typeof playback.catch === "function") playback.catch(() => {});
    };

    if (typeof reduceMotion.addEventListener === "function") {
      reduceMotion.addEventListener("change", syncMotionPreference);
    }
    if (reduceMotion.matches) video.pause();
  });

  document.querySelectorAll("[data-feature-demo]").forEach((demo) => {
    const replay = demo.querySelector("[data-demo-replay]");
    const restart = () => {
      demo.classList.remove("is-playing");
      window.requestAnimationFrame(() => demo.classList.add("is-playing"));
    };

    restart();
    replay?.addEventListener("click", restart);
  });

  document.querySelectorAll("[data-tuning-demo]").forEach((demo) => {
    const options = Array.from(demo.querySelectorAll("[data-tuning-option]"));
    const title = demo.querySelector("[data-tuning-title]");
    const description = demo.querySelector("[data-tuning-description]");
    const status = demo.querySelector("[data-tuning-status]");
    const preview = demo.querySelector("[data-tuning-preview]");
    const previewTuning = demo.querySelector("[data-preview-tuning]");
    const previewFamily = demo.querySelector("[data-preview-family]");
    const previewNotes = Array.from(demo.querySelectorAll("[data-preview-note]"));

    if (!options.length || !title || !description || !status || !preview || !previewTuning || !previewFamily) return;

    const selectTuning = (option) => {
      options.forEach((candidate) => {
        const selected = candidate === option;
        candidate.classList.toggle("is-selected", selected);
        candidate.setAttribute("aria-selected", String(selected));
      });

      const tuning = option.dataset.title || "";
      const notes = (option.dataset.notes || "").split("|");
      title.textContent = tuning;
      description.textContent = option.dataset.description || "";
      preview.dataset.tuning = option.dataset.tuning || "";
      previewTuning.textContent = tuning;
      previewFamily.textContent = option.dataset.family || "";
      preview.setAttribute(
        "aria-label",
        isSpanish
          ? `Vista previa de la afinación ${tuning} en Arenetto`
          : `Arenetto tuning preview showing ${tuning}`,
      );
      previewNotes.forEach((note, index) => {
        note.textContent = notes[index] || "";
      });
      status.textContent = isSpanish
        ? `${tuning} seleccionada. La vista previa de notas cambia con tu elección.`
        : `${tuning} selected. The note preview updates with your choice.`;

      preview.classList.remove("is-changing");
      window.requestAnimationFrame(() => preview.classList.add("is-changing"));
    };

    options.forEach((option, index) => {
      option.addEventListener("click", () => selectTuning(option));
      option.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        event.preventDefault();
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const nextIndex = (index + direction + options.length) % options.length;
        options[nextIndex].focus();
        selectTuning(options[nextIndex]);
      });
    });
  });
})();
