(() => {
  const CSV_URL = "data/pesquisadoras.csv";
  const CAROUSEL_MIN_PHOTOS = 8;
  const CAROUSEL_PHOTO_TIMEOUT = 7_000;
  const CAROUSEL_APPROVED_PHOTO_IDS = new Set([
    "22fc7ca5-1f2f-4c66-9876-44659f00a80c",
    "5681bdab-2003-4190-b216-54d813dee72b",
    "aba7c23d-5a62-473b-9673-cde82b17dcf2",
    "73beb2e7-b3a3-4d2f-a20d-fecd4a5e8252",
    "e362adfc-fdea-4297-a780-28e1d6c5a31f",
    "d614db8d-2828-443b-bdce-f96ae381ecc2",
    "74f809eb-01b1-4a58-a4c6-4447a5e50f37",
    "5f5d05ce-77ce-4e93-a7be-00699f697f41",
    "6b62a28d-8f2c-4615-90af-ac1745e35368",
    "2954a2f0-0c28-4887-827f-2fdcccb87c6e",
    "e58250ca-1a3b-4f96-a035-0e1f94e7ff31",
    "c06d1fe4-042e-4943-af74-d5da9d2205b1",
    "e6200b31-fab3-4912-92cb-2d29be614f08",
    "13c5c075-a88e-45f6-904a-0ae5d0c3305e",
    "dd592947-b04d-4864-9b2e-e018ab0325ca",
    "2e15a8de-daec-4a37-880e-fffaa42fa9c0",
    "001d6a4c-6878-492a-b9de-79e2b5ed53d2",
    "c1047f05-0437-49a0-9374-3cb6690efd21",
    "acb48e02-1ce1-42a8-a7e8-2633fea8883a",
    "33e3839f-2930-4486-9956-77f771b1a8f8",
    "fbcff5d1-4ae1-4dbd-8752-c87028d335bb",
    "38e8af30-4b0e-4686-8e3f-52509d207c7a",
    "efcae4c0-4ef7-40ca-8384-5b7f4dcbba61",
    "487fe3e6-7918-40bc-a0ab-40799677688f",
    "d377a68b-b676-471b-9705-de01c7eaa706",
    "63324e5d-6fcb-4a6b-b1f9-65d04195fa33",
    "aa742cd0-0d92-43cb-b431-fd075b322137",
    "b6c98a73-d9cf-44dd-94e9-ec5a5c37acb4",
    "87a7bdf0-f5dd-4260-aa9f-009f8c5d5964",
    "79ce8067-ee0a-44a6-916f-b65fae586fba",
    "add72ac6-00d8-4867-ac9b-8101d17185cb",
    "152ae2d2-d3cc-4785-8bd7-a561d68da3d9",
    "46dff2f4-4bbc-4600-b281-5e9320594b73",
    "3bb02858-ab78-44de-8bdd-7635f3c62c98",
    "807025c9-4f97-4cfd-9d44-7c4d87da4af2",
    "3a2cc24a-dce5-4e79-aa3a-efe1db617e3a",
    "395e997c-f2d5-4c14-bd40-69e7965b14d8",
    "8f0fd4a9-10fa-43ae-a407-40b558787518",
    "2cf9cd11-82e0-4b62-a390-4c0839ff6af9",
    "efbfca84-cbd4-4a27-b50e-d7eaac598e92",
    "640f0060-56af-457c-b8a3-d4b7917a141a",
    "72490146-6c67-4b9f-ab53-4b6baffab9bb",
    "cc8f6d7c-ca23-49cf-b2cc-7d93cd2ba6b7",
    "7943e0ec-540c-4fb7-b423-3c5735b73862",
    "0ee947ca-9598-4fbc-a26c-f77a210c53be",
    "61d25fb9-88b9-4283-897c-2d3ee6a6f61d",
    "4750c099-b362-4df0-966e-51090dbad046",
    "160ac19a-9efc-4094-9a09-3ed083ea5b36",
    "2007249b-0086-4c0d-a59d-321e1ec1f3b7",
    "9ec2ca31-622d-4b14-b5f1-dcfefa933075",
    "138c0d38-1b35-4407-b172-88873dbdc8ed",
    "bf2f7d61-c9e9-4f9e-9bd0-d68363a84533",
    "789f403d-91df-4c1b-ae74-d20ccd45dc15",
    "b00067c2-5561-4957-b3a3-d088383f4d30",
    "aced3260-645c-47aa-a3a7-9d53f8fb439e",
    "a0b8eada-def9-4d74-a923-bec342ee4ba7",
    "21178126-d07f-46bb-88b6-7d0ab66ea622",
    "e140fe17-b818-45f1-b0ab-b952d17d51eb",
    "83fe0a3f-b7d0-4754-a4b2-c87c52f5e6c4",
    "e5050c2c-2cbe-4546-b9de-da416f932691",
    "01e60ff1-c566-401b-8630-d38f49cc6e15",
    "35a1f95f-25f3-4220-9430-a8792c3d5395",
    "b02db870-edaa-49a0-b88e-b2a336acbab2",
    "edca58b7-9954-4ffd-969a-bd37facd4f51",
    "fcf50f0e-670a-42cd-846b-4b03ad358dc8",
    "b15f78dd-a1df-4bf9-a628-237944a0f37f",
    "2a8954c7-5a78-436c-aea7-16cb51ae83b2",
    "65ae4c5f-7466-43b0-9422-49d3f5b8074b",
    "cbcb6f04-94f6-44f0-8836-fc36cfc1f682",
    "a3c52998-2fd4-4b87-8598-2eb03e8c2490",
    "9e217d92-658b-49e6-b123-e6417b7ef90e",
    "830e469e-9bb0-45ba-a5f7-a313e53ca2a1",
    "77e5357d-9764-486a-8dde-3a141b3dd70e",
    "0ce4aedb-95e3-4b4d-9fa0-69168d3b65ba",
    "a6102d3a-ece0-4cb2-a2a9-2a455df70e4d",
    "727fba54-9f28-4725-acb1-7e4632f8f36c",
    "9b684580-bc80-4c56-b576-131ca867ad00",
    "98de002d-1527-467b-88a5-995304bebc22",
    "e0ace6bb-9e54-4c03-b118-79f0cc71f5ca",
    "f735ecd5-eddb-4ab8-99d6-d25b7c6ffe3e",
    "f6a48114-f694-452d-9ba1-8cd21f7fa65a",
    "af025849-ae86-463e-9d7f-f54194006b70",
    "e041e4e7-e048-4979-8f7d-ae96314dbcdb",
    "97672cee-9c8d-43c9-b93d-49bbab560f77",
    "845630f9-93c1-4c43-8e2e-7d58f8557522",
    "b737440e-1e9c-4a05-85e8-4b6dd32fe770",
    "79e1cfc9-e774-49cc-86ea-e6dd73fbef1a",
    "efe38a95-d903-476c-97ed-2d0ac06b5f74",
    "98637077-c424-461c-8f18-2d55c14e35a2",
    "020b6f29-5ff6-45c7-9d0e-d2fa4ddb74ed",
    "9a5184f9-48bb-4c47-a345-41db22e55e69",
    "a8b176a0-3b1c-4212-a96c-b5fc89ff31e4",
    "f0d8f469-bd2e-4ca6-8647-15cd27bfad81",
    "17e89059-5c8b-483c-8747-5d5f324dae0f",
    "66554b16-a570-4aa2-9a88-97d79408fb99",
    "982baea9-2e1d-4cc8-bec1-2637a9867b37",
    "ed033206-60d6-4c8a-9e84-9633bd69b086",
    "a830f3b3-0255-46e9-814e-cc263e13124e",
    "880c5b92-15f2-4e70-adf1-24c688f18aea",
    "7b4e9238-1cbd-41d4-b0e7-d5dcdf88e329",
    "6b0bc3b0-dba4-4df5-825c-27671fe8bdd3",
    "9abb2380-7f74-48ba-a7e5-fee675883df4",
    "800ff726-203b-4a1c-b412-858e22c71dfd",
    "26e90ede-0983-425e-be76-b781b2720fe8",
    "3f20edbc-488d-4233-bc6e-e8e9b97ae906",
    "de9c271c-8f4b-4816-9e22-1984ccf22883",
    "b48bb849-ece5-46fa-a6b0-35457ac93900",
    "ce188f2d-8fab-4943-9d64-722c3ffb522c"
  ]);
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
    if (CAROUSEL_APPROVED_PHOTO_IDS.has(researcher.id)) return `assets/carousel/${researcher.id}.webp`;
    const image = validText(researcher.imagem);
    if (image && /^(https?:|data:|assets\/)/i.test(image)) return image;
    const lattes10Id = validText(researcher.lattes_10_id);
    return lattes10Id
      ? `https://servicosweb.cnpq.br/wspessoa/servletrecuperafoto?tipo=1&id=${encodeURIComponent(lattes10Id)}`
      : null;
  }

  function preloadCarouselPhoto(researcher) {
    const photo = photoURL(researcher);
    if (!photo) return Promise.resolve(null);

    return new Promise((resolve) => {
      const image = new Image();
      const timer = window.setTimeout(() => resolve(null), CAROUSEL_PHOTO_TIMEOUT);

      image.onload = () => {
        window.clearTimeout(timer);
        resolve(image.naturalWidth >= 40 && image.naturalHeight >= 40 ? { ...researcher, carouselPhoto: photo } : null);
      };

      image.onerror = () => {
        window.clearTimeout(timer);
        resolve(null);
      };

      image.decoding = "async";
      image.src = photo;
    });
  }

  function carouselCardMarkup(researcher) {
    const name = validText(researcher.nome) || "Pesquisadora";
    const institution = validText(researcher.sigla) || validText(researcher.instituicao) || "Bahia";

    return `<a class="scientist-carousel__card" href="perfil.html?id=${encodeURIComponent(researcher.id)}" aria-label="Ver perfil de ${escapeHTML(name)}">
      <img src="${escapeHTML(researcher.carouselPhoto)}" alt="" loading="eager" decoding="async" />
      <span class="scientist-carousel__caption">
        <strong>${escapeHTML(name)}</strong>
        <span>${escapeHTML(institution)}</span>
      </span>
    </a>`;
  }

  async function initializeScientistCarousel() {
    if (!carouselTrack) return;

    try {
      const response = await fetch(CSV_URL, { cache: "no-cache" });
      if (!response.ok) throw new Error(`Falha ao carregar CSV (${response.status})`);
      const researchers = parseCSV(await response.text())
        .filter((item) => validText(item.id)
          && validText(item.nome)
          && validText(item.lattes_10_id)
          && CAROUSEL_APPROVED_PHOTO_IDS.has(item.id)
          && (!item.sexo || item.sexo.toUpperCase() === "F"));
      const candidates = shuffle(researchers).slice(0, 48);
      const loaded = (await Promise.all(candidates.map(preloadCarouselPhoto))).filter(Boolean).slice(0, 18);
      if (loaded.length < CAROUSEL_MIN_PHOTOS) throw new Error("Poucas fotos carregadas para o carrossel");

      carouselTrack.innerHTML = [...loaded, ...loaded].map(carouselCardMarkup).join("");
      carouselTrack.classList.add("is-ready");
    } catch (error) {
      console.warn("Não foi possível montar o carrossel de pesquisadoras:", error);
      carouselTrack.remove();
    }
  }

  const hideAttraction = () => {
    attraction.classList.remove("is-visible");
    attraction.setAttribute("aria-hidden", "true");

    if (lastFocusedElement instanceof HTMLElement) {
      lastFocusedElement.focus({ preventScroll: true });
    }
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
  });

  attraction.addEventListener("click", (event) => {
    if (event.target === attraction) attractionButton.click();
  });

  document.addEventListener("pointerdown", animateTouch, { passive: true });

  window.addEventListener("load", () => {
    document.body.classList.add("is-ready");
    initializeScientistCarousel();
  });
})();
