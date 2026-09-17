(() => {
  "use strict";

  const title = document.querySelector("[data-gallery-title]");
  const description = document.querySelector("[data-gallery-description]");
  const image = document.querySelector("[data-gallery-image]");
  const buttons = [...document.querySelectorAll("[data-infographic-src]")];

  if (!title || !description || !image || !buttons.length) return;

  function activate(button) {
    const nextSource = button.dataset.infographicSrc;
    if (!nextSource || image.getAttribute("src") === nextSource) return;

    buttons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      if (active) item.setAttribute("aria-current", "true");
      else item.removeAttribute("aria-current");
    });

    title.textContent = button.dataset.infographicTitle || "Ciência em números";
    description.textContent = button.dataset.infographicDescription || "";
    image.classList.add("is-switching");
    image.src = nextSource;
    image.alt = button.dataset.infographicAlt || "";
  }

  image.addEventListener("load", () => {
    image.classList.remove("is-switching");
  });

  buttons.forEach((button) => {
    button.addEventListener("click", () => activate(button));
  });
})();
