(() => {
  const CSV_URL = "data/pesquisadoras.csv";
  const ATTRACTION_DELAY = 40_000;
  const cards = [...document.querySelectorAll(".nav-card")];
  const attraction = document.querySelector("#attraction");
  const attractionButton = attraction.querySelector(".attraction__button");
  const touchFeedback = document.querySelector(".touch-feedback");
  const discoveryTransition = document.querySelector("#discovery-transition");
  const carouselTrack = document.querySelector("[data-scientist-carousel]");
  const routes = {
    cientistas: "cientistas.html",
    tematicas: "tematicas.html",
    numeros: "numeros.html"
  };
  let attractionTimer;
  let lastFocusedElement = null;

  const escapeHTML = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[char]);

  const validText = (value) => {
    if (value === null || value === undefined) return null;
    const text = String(value).trim();
    return text && !["null", "undefined", "nan"].includes(text.toLowerCase()) ? text : null;
  };

  const normalizeKey = (value) => String(value || "")
    .replace(/^\uFEFF/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

  const initials = (name = "") => name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("pt-BR");

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let value = "";
    let quoted = false;

    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      const next = text[index + 1];

      if (character === '"') {
        if (quoted && next === '"') {
          value += '"';
          index += 1;
        } else {
          quoted = !quoted;
        }
        continue;
      }

      if (character === "," && !quoted) {
        row.push(value);
        value = "";
        continue;
      }

      if ((character === "\n" || character === "\r") && !quoted) {
        if (character === "\r" && next === "\n") index += 1;
        row.push(value);
        if (row.some((cell) => validText(cell))) rows.push(row);
        row = [];
        value = "";
        continue;
      }

      value += character;
    }

    if (value || row.length) {
      row.push(value);
      if (row.some((cell) => validText(cell))) rows.push(row);
    }

    if (!rows.length) return [];
    const headers = rows.shift().map(normalizeKey);
    return rows.map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])));
  }

  function shuffle(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const next = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[next]] = [copy[next], copy[index]];
    }
    return copy;
  }

  function photoURL(researcher) {
    const image = validText(researcher.imagem);
    if (image && /^(https?:|data:|assets\/)/i.test(image)) return image;
    const lattes10Id = validText(researcher.lattes_10_id);
    return lattes10Id
      ? `https://servicosweb.cnpq.br/wspessoa/servletrecuperafoto?tipo=1&id=${encodeURIComponent(lattes10Id)}`
      : null;
  }

  function carouselCardMarkup(researcher) {
    const name = validText(researcher.nome) || "Pesquisadora";
    const institution = validText(researcher.sigla) || validText(researcher.instituicao) || "Bahia";
    const photo = photoURL(researcher);
    const fallback = escapeHTML(initials(name) || "CD");

    return `<a class="scientist-carousel__card" href="perfil.html?id=${encodeURIComponent(researcher.id)}" aria-label="Ver perfil de ${escapeHTML(name)}">
      ${photo ? `<img src="${escapeHTML(photo)}" alt="" loading="lazy" decoding="async" />` : `<span class="scientist-carousel__initials">${fallback}</span>`}
      <span class="scientist-carousel__caption">
        <strong>${escapeHTML(name)}</strong>
        <span>${escapeHTML(institution)}</span>
      </span>
    </a>`;
  }

  function replaceCarouselImage(image) {
    if (!image?.isConnected) return;
    const card = image.closest(".scientist-carousel__card");
    const caption = card?.querySelector("strong")?.textContent || "";
    image.replaceWith(Object.assign(document.createElement("span"), {
      className: "scientist-carousel__initials",
      textContent: initials(caption) || "CD"
    }));
  }

  async function initializeScientistCarousel() {
    if (!carouselTrack) return;

    try {
      const response = await fetch(CSV_URL, { cache: "no-cache" });
      if (!response.ok) throw new Error(`Falha ao carregar CSV (${response.status})`);
      const researchers = parseCSV(await response.text())
        .filter((item) => validText(item.id) && validText(item.nome) && (!item.sexo || item.sexo.toUpperCase() === "F"));
      const selected = shuffle(researchers).slice(0, 18);
      if (!selected.length) throw new Error("Sem pesquisadoras para o carrossel");

      carouselTrack.innerHTML = [...selected, ...selected].map(carouselCardMarkup).join("");
      carouselTrack.classList.add("is-ready");
      carouselTrack.querySelectorAll("img").forEach((image) => {
        image.addEventListener("error", () => replaceCarouselImage(image), { once: true });
        window.setTimeout(() => {
          if (!image.complete || image.naturalWidth < 20) replaceCarouselImage(image);
        }, 3_800);
      });
    } catch (error) {
      console.warn("Não foi possível montar o carrossel de pesquisadoras:", error);
      carouselTrack.remove();
    }
  }

  const showAttraction = () => {
    lastFocusedElement = document.activeElement;
    attraction.classList.add("is-visible");
    attraction.setAttribute("aria-hidden", "false");
    attractionButton.focus({ preventScroll: true });
  };

  const hideAttraction = () => {
    attraction.classList.remove("is-visible");
    attraction.setAttribute("aria-hidden", "true");

    if (lastFocusedElement instanceof HTMLElement) {
      lastFocusedElement.focus({ preventScroll: true });
    }
  };

  const restartAttractionTimer = () => {
    window.clearTimeout(attractionTimer);
    attractionTimer = window.setTimeout(showAttraction, ATTRACTION_DELAY);
  };

  const registerActivity = () => {
    if (attraction.classList.contains("is-visible")) return;
    restartAttractionTimer();
  };

  const animateTouch = (event) => {
    const point = event.touches?.[0] ?? event;
    if (typeof point.clientX !== "number") return;

    touchFeedback.style.left = `${point.clientX}px`;
    touchFeedback.style.top = `${point.clientY}px`;
    touchFeedback.classList.remove("is-active");
    void touchFeedback.offsetWidth;
    touchFeedback.classList.add("is-active");
  };

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const { section } = card.dataset;
      card.classList.add("is-pressed");
      window.setTimeout(() => card.classList.remove("is-pressed"), 280);
      console.log("Abrir seção:", section);

      if (section === "descubra") {
        discoveryTransition.classList.add("is-visible");
        window.setTimeout(() => { window.location.href = "perfil.html?descubra=1"; }, 720);
        return;
      }

      if (routes[section]) window.location.href = routes[section];
    });
  });

  attractionButton.addEventListener("click", () => {
    hideAttraction();
    restartAttractionTimer();
  });

  attraction.addEventListener("click", (event) => {
    if (event.target === attraction) attractionButton.click();
  });

  ["pointerdown", "keydown", "wheel"].forEach((eventName) => {
    document.addEventListener(eventName, registerActivity, { passive: true });
  });

  document.addEventListener("pointerdown", animateTouch, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) window.clearTimeout(attractionTimer);
    else restartAttractionTimer();
  });

  window.addEventListener("load", () => {
    document.body.classList.add("is-ready");
    restartAttractionTimer();
    initializeScientistCarousel();
  });
})();
