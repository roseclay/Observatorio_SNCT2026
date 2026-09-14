(() => {
  "use strict";

  const CSV_URL = "data/pesquisadoras.csv";
  const JSON_URL = "data/dados_simcc_completo.json";
  const PAULO_TEMPLATE_IMAGE = "assets/descubra-cientista-paulo-mobile.png";
  const INACTIVITY_DELAY = 60_000;
  const LAST_DISCOVERY_KEY = "cienciaDelasLastResearcherId";

  const page = document.body.dataset.page;
  const params = new URLSearchParams(window.location.search);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let researchers = [];
  let dataSourceLabel = "";
  let currentProfileId = null;
  let inactivityTimer;

  const escapeHTML = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[char]);

  function validText(value) {
    if (value === null || value === undefined) return null;
    const text = String(value).trim();
    return text && !["null", "undefined", "nan"].includes(text.toLowerCase()) ? text : null;
  }

  function firstText(...values) {
    for (const value of values) {
      const text = validText(value);
      if (text) return text;
    }
    return null;
  }

  function toNumber(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    const text = validText(value);
    if (!text) return null;
    const normalized = text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text;
    const number = Number(normalized);
    return Number.isFinite(number) ? number : null;
  }

  const numberFormatter = new Intl.NumberFormat("pt-BR");
  const formatNumber = (value) => Number.isFinite(Number(value)) ? numberFormatter.format(Number(value)) : "0";
  const displayOrFallback = (value) => validText(value) || "Não informado";

  function normalizeKey(value) {
    return String(value || "")
      .replace(/^\uFEFF/, "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  }

  const areaLabels = {
    CIENCIAS_AGRARIAS: "Ciências Agrárias",
    CIENCIAS_BIOLOGICAS: "Ciências Biológicas",
    CIENCIAS_DA_SAUDE: "Ciências da Saúde",
    CIENCIAS_EXATAS_E_DA_TERRA: "Ciências Exatas e da Terra",
    CIENCIAS_HUMANAS: "Ciências Humanas",
    CIENCIAS_SOCIAIS_APLICADAS: "Ciências Sociais Aplicadas",
    ENGENHARIAS: "Engenharias",
    LINGUISTICA_LETRAS_E_ARTES: "Linguística, Letras e Artes"
  };

  function areaKey(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .toUpperCase();
  }

  function displayArea(value) {
    const text = validText(value);
    if (!text) return null;
    const key = areaKey(text);
    if (areaLabels[key]) return areaLabels[key];
    return text.toLocaleLowerCase("pt-BR").replace(/(^|\s)\S/g, (letter) => letter.toLocaleUpperCase("pt-BR"));
  }

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

  function csvValue(record, ...keys) {
    return firstText(...keys.map((key) => record[normalizeKey(key)]));
  }

  function jsonValue(record, ...keys) {
    for (const key of keys) {
      if (key.includes(".")) {
        const value = key.split(".").reduce((source, part) => source?.[part], record);
        const text = validText(value);
        if (text) return text;
      } else {
        const text = validText(record[key]);
        if (text) return text;
      }
    }
    return null;
  }

  function normalizeImagePath(value) {
    const text = validText(value);
    if (!text) return null;
    if (/^(https?:|data:)/i.test(text)) return text;
    if (/^[a-z]:\\/i.test(text) || /^file:/i.test(text)) return null;

    const normalized = text.replace(/\\/g, "/").replace(/^\.?\//, "");
    if (!normalized) return null;
    if (normalized.includes("/")) return normalized.replace(/^\/+/, "");
    return `assets/pesquisadoras/${normalized}`;
  }

  function makeAreas(rawArea, rawAreaIA) {
    const source = firstText(rawArea, rawAreaIA);
    if (!source) return [];
    return [...new Set(source.split(";").map((item) => displayArea(item)).filter(Boolean))];
  }

  function normalizeResearcher(record, source) {
    const pick = source === "csv" ? csvValue : jsonValue;
    const sex = pick(record, "sexo", "Sexo");
    if (sex && sex.toUpperCase() !== "F") return null;

    const nome = pick(record, "nome", "name");
    const id = pick(record, "id", "lattes_id", "lattes_10_id") || nome;
    if (!id || !nome) return null;

    const rawArea = pick(record, "area");
    const rawAreaIA = pick(record, "area_ia", "ÁREA IA");
    const areas = makeAreas(rawArea, rawAreaIA);
    const institution = source === "csv"
      ? pick(record, "instituicao", "university")
      : pick(record, "university", "institution.name");
    const sigla = source === "csv"
      ? pick(record, "sigla", "SIGLA IA")
      : pick(record, "SIGLA IA", "institution.acronym");

    return {
      id,
      nome,
      lattesId: pick(record, "lattes_id"),
      lattes10Id: pick(record, "lattes_10_id"),
      orcid: pick(record, "orcid"),
      graduacao: pick(record, "graduacao", "graduation"),
      area: areas[0] || displayArea(rawAreaIA) || displayArea(rawArea) || "Área não informada",
      areas,
      tematica: pick(record, "tematica_ia", "TEMÁTICA IA") || "Temática não informada",
      tema: pick(record, "tema_ia", "TEMA IA"),
      cidade: pick(record, "cidade", "city") || "Cidade não informada",
      instituicao: institution || "Instituição não informada",
      sigla: sigla || institution || "Instituição",
      resumo: pick(record, "biografia", "abstract", "abstract_ai") || "Informação biográfica não disponível na base.",
      abstractAI: pick(record, "abstract_ai"),
      artigos: toNumber(pick(record, "artigos", "articles")),
      livros: toNumber(pick(record, "livros", "book")),
      capitulos: toNumber(pick(record, "capitulos", "book_chapters")),
      patentes: toNumber(pick(record, "patentes", "patent")),
      softwares: toNumber(pick(record, "softwares", "software")),
      marcas: toNumber(pick(record, "marcas", "brand")),
      indiceH: toNumber(pick(record, "indice_h", "h_index")),
      citacoes: toNumber(pick(record, "citacoes", "cited_by_count")),
      indiceI10: toNumber(pick(record, "indice_i10", "i10_index")),
      trabalhos: toNumber(pick(record, "trabalhos", "works_count")),
      openalex: pick(record, "openalex"),
      classificacao: pick(record, "classificacao", "classification"),
      imagem: normalizeImagePath(pick(record, "imagem", "image", "foto", "photo", "image_url", "url_image"))
    };
  }

  function dedupeResearcherList(items) {
    const unique = new Map();
    items.forEach((item) => {
      if (!item) return;
      const key = String(item.id || item.nome).toLocaleLowerCase("pt-BR");
      if (!unique.has(key)) unique.set(key, item);
    });
    return [...unique.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }

  async function loadCSVResearchers() {
    const response = await fetch(CSV_URL, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Falha ao carregar CSV (${response.status})`);
    const records = parseCSV(await response.text());
    const normalized = dedupeResearcherList(records.map((record) => normalizeResearcher(record, "csv")));
    if (!normalized.length) throw new Error("CSV sem pesquisadoras válidas");
    return normalized;
  }

  async function loadJSONResearchers() {
    const response = await fetch(JSON_URL, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Falha ao carregar JSON (${response.status})`);
    const payload = await response.json();
    const records = Array.isArray(payload) ? payload : payload.data || [];
    const normalized = dedupeResearcherList(records.map((record) => normalizeResearcher(record, "json")));
    if (!normalized.length) throw new Error("JSON sem pesquisadoras válidas");
    return normalized;
  }

  async function loadResearchers() {
    const errors = [];

    try {
      const csvResearchers = await loadCSVResearchers();
      dataSourceLabel = "Base carregada do CSV do Observatório";
      return csvResearchers;
    } catch (error) {
      errors.push(error.message);
    }

    try {
      const jsonResearchers = await loadJSONResearchers();
      dataSourceLabel = "Base carregada do JSON do Observatório";
      return jsonResearchers;
    } catch (error) {
      errors.push(error.message);
    }

    if (Array.isArray(window.PESQUISADORAS) && window.PESQUISADORAS.length) {
      dataSourceLabel = "Base demonstrativa local";
      return dedupeResearcherList(window.PESQUISADORAS.map((record) => normalizeResearcher(record, "json")));
    }

    throw new Error(errors.join(" | ") || "Nenhuma base de pesquisadoras disponível");
  }

  function initials(name = "") {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toLocaleUpperCase("pt-BR");
  }

  function unique(key) {
    return [...new Set(researchers.map((item) => item[key]).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
  }

  function uniqueAreas() {
    return [...new Set(researchers.flatMap((item) => item.areas?.length ? item.areas : [item.area]).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
  }

  function navigate(path) {
    window.location.href = path;
  }

  function openProfile(id) {
    navigate(`perfil.html?id=${encodeURIComponent(id)}`);
  }

  function goHome() {
    navigate("index.html");
  }

  function goBack() {
    if (window.history.length > 1) window.history.back();
    else goHome();
  }

  function iconSVG(name) {
    const paths = {
      person: '<circle cx="16" cy="10" r="5"/><path d="M7 28c1-7 4-10 9-10s8 3 9 10"/>',
      flask: '<path d="M12 3h8M14 3v7L7 24a4 4 0 0 0 3.5 6h11a4 4 0 0 0 3.5-6l-7-14V3"/><path d="M10 23h12"/>',
      degree: '<path d="m3 11 13-7 13 7-13 7-13-7Z"/><path d="M8 14v7c2 3 14 3 16 0v-7"/>',
      document: '<path d="M8 3h12l5 5v21H8V3Z"/><path d="M20 3v6h6M12 15h9m-9 5h9m-9 5h6"/>',
      institution: '<path d="M4 12h24L16 4 4 12Zm3 3v10m6-10v10m6-10v10m6-10v10M4 28h24"/>',
      location: '<path d="M16 29S7 21 7 13a9 9 0 1 1 18 0c0 8-9 16-9 16Z"/><circle cx="16" cy="13" r="3"/>',
      quote: '<path d="M12 10H7v6h4v2c0 2-1 3-4 4M25 10h-5v6h4v2c0 2-1 3-4 4"/>',
      chart: '<path d="M5 27V17h6v10m5 0V6h6v21m5 0V12h-5"/><path d="M3 27h26"/>',
      bookmark: '<path d="M9 4h14v25l-7-4-7 4V4Z"/>',
      spark: '<path d="M16 2v6m0 16v6M2 16h6m16 0h6M6 6l4 4m12 12 4 4M26 6l-4 4M10 22l-4 4"/><circle cx="16" cy="16" r="5"/>',
      megaphone: '<path d="M4 18v-5h5l12-6v17L9 18H4Zm5 0l2 8h4l-2-7"/>'
    };
    return `<svg viewBox="0 0 32 32" aria-hidden="true">${paths[name] || paths.spark}</svg>`;
  }

  function setSourceNotes() {
    document.querySelectorAll("[data-source-note]").forEach((note) => {
      note.textContent = dataSourceLabel;
    });
  }

  function setLoadingState() {
    if (page === "perfil") {
      const status = document.querySelector("#profile-status");
      if (status) {
        status.classList.remove("is-complete");
        status.textContent = "Carregando dados da pesquisadora...";
      }
    }

    if (page === "cientistas") {
      const grid = document.querySelector("#researcher-grid");
      const count = document.querySelector("#result-count");
      if (count) count.textContent = "Carregando base...";
      if (grid) grid.innerHTML = '<div class="empty-state"><h3>Carregando pesquisadoras</h3></div>';
    }
  }

  function renderDataError(error) {
    console.error("Não foi possível carregar a base de pesquisadoras:", error);
    const markup = `<div class="empty-state" role="alert">
      <h3>Não foi possível carregar os dados</h3>
      <p>Execute o projeto por um servidor HTTP local para permitir a leitura dos arquivos em data/.</p>
    </div>`;
    document.querySelector("#profile-content")?.insertAdjacentHTML("afterbegin", markup);
    const grid = document.querySelector("#researcher-grid") || document.querySelector("#theme-grid") || document.querySelector("#territory-grid");
    if (grid) grid.innerHTML = markup;
    const status = document.querySelector("#profile-status") || document.querySelector("#result-count");
    if (status) {
      status.classList.remove("is-complete");
      status.textContent = "Falha ao carregar a base de pesquisadoras.";
    }
  }

  function renderResearcherCard(researcher) {
    return `
      <button class="researcher-card" type="button" data-researcher-id="${escapeHTML(researcher.id)}" aria-label="Conheça a trajetória de ${escapeHTML(researcher.nome)}">
        <span class="avatar" aria-hidden="true">${escapeHTML(initials(researcher.nome))}</span>
        <span class="researcher-card__info">
          <span class="researcher-card__institution">${escapeHTML(displayOrFallback(researcher.sigla))}</span>
          <h3>${escapeHTML(researcher.nome)}</h3>
          <span class="researcher-card__meta">
            <span>${escapeHTML(researcher.area)}</span><span>${escapeHTML(researcher.cidade)}</span>
          </span>
          <p class="researcher-card__theme">${escapeHTML(researcher.tematica)}</p>
          <span class="researcher-card__action">Conheça a trajetória →</span>
        </span>
      </button>`;
  }

  function bindResearcherCards(container = document) {
    container.querySelectorAll("[data-researcher-id]").forEach((card) => {
      card.addEventListener("click", () => openProfile(card.dataset.researcherId));
    });
  }

  function fillSelect(id, values) {
    const select = document.querySelector(`#${id}`);
    if (!select) return;
    select.querySelectorAll("option:not(:first-child)").forEach((option) => option.remove());
    values.forEach((value) => {
      select.insertAdjacentHTML("beforeend", `<option value="${escapeHTML(value)}">${escapeHTML(value)}</option>`);
    });
  }

  function matchesSelectedFilter(item, key, value) {
    if (!value) return true;
    if (key === "area") return (item.areas?.length ? item.areas : [item.area]).includes(value);
    return item[key] === value;
  }

  function renderCientistas() {
    const grid = document.querySelector("#researcher-grid");
    const count = document.querySelector("#result-count");
    const search = document.querySelector("#search");
    const listingTitle = document.querySelector("#listing-title");
    const filters = ["instituicao", "area", "tematica", "cidade"];

    filters.forEach((key) => fillSelect(key, key === "area" ? uniqueAreas() : unique(key)));
    const preset = filters.find((key) => params.has(key));
    if (preset) document.querySelector(`#${preset}`).value = params.get(preset);

    if (params.has("tematica")) listingTitle.textContent = `Mulheres que pesquisam ${params.get("tematica")}`;
    if (params.has("instituicao")) listingTitle.textContent = `Mulheres cientistas da ${params.get("instituicao")}`;
    if (params.has("cidade")) listingTitle.textContent = `Mulheres cientistas em ${params.get("cidade")}`;
    if (params.get("ordem") === "destaques") listingTitle.textContent = "Destaques da ciência";

    const applyFilters = () => {
      const term = search.value.trim().toLocaleLowerCase("pt-BR");
      const selected = Object.fromEntries(filters.map((key) => [key, document.querySelector(`#${key}`).value]));
      let filtered = researchers.filter((item) => {
        const searchable = [item.nome, item.instituicao, item.sigla, item.area, item.tematica, item.cidade, item.tema]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("pt-BR");
        const filtersMatch = filters.every((key) => matchesSelectedFilter(item, key, selected[key]));
        return searchable.includes(term) && filtersMatch;
      });

      if (params.get("ordem") === "destaques") {
        filtered = filtered.sort((a, b) => (b.artigos || 0) - (a.artigos || 0));
      }

      count.textContent = `${filtered.length} ${filtered.length === 1 ? "pesquisadora encontrada" : "pesquisadoras encontradas"}`;
      grid.innerHTML = filtered.length
        ? filtered.map(renderResearcherCard).join("")
        : '<div class="empty-state"><h3>Nenhum resultado encontrado</h3><p>Tente ajustar ou limpar os filtros.</p></div>';
      bindResearcherCards(grid);
    };

    search.addEventListener("input", applyFilters);
    filters.forEach((key) => document.querySelector(`#${key}`).addEventListener("change", applyFilters));
    document.querySelector("#clear-filters").addEventListener("click", () => {
      search.value = "";
      filters.forEach((key) => { document.querySelector(`#${key}`).value = ""; });
      window.history.replaceState({}, "", "cientistas.html");
      applyFilters();
    });
    applyFilters();
  }

  const themeDescriptions = {
    "Biodiversidade, ecologia e conservação": "Vida, ecossistemas e conservação dos territórios.",
    "Saúde coletiva e epidemiologia": "Saúde, população e qualidade de vida.",
    "Computação e inteligência artificial": "Dados, sistemas inteligentes e novas tecnologias.",
    "Educação, ensino e formação docente": "Aprendizagem, práticas educativas e formação.",
    "Energia e tecnologias sustentáveis": "Inovação para uma transição mais sustentável.",
    "Produção animal e pastagens": "Conhecimento aplicado aos sistemas produtivos.",
    "Biotecnologia": "Processos biológicos transformados em soluções.",
    "Comunicação, mídia e cultura digital": "Informação, sociedade e ambientes digitais."
  };

  function renderThemeCard(theme, count) {
    return `<button class="explore-card" type="button" data-theme="${escapeHTML(theme)}">
      <span class="explore-card__icon" aria-hidden="true">✦</span>
      <h3>${escapeHTML(theme)}</h3>
      <p>${escapeHTML(themeDescriptions[theme] || "Uma rede de pesquisas e conexões científicas.")}</p>
      <span class="explore-card__footer"><span>${count} ${count === 1 ? "pesquisadora" : "pesquisadoras"}</span><span>Explorar →</span></span>
    </button>`;
  }

  function renderTematicas() {
    const chipRow = document.querySelector("#area-chips");
    const grid = document.querySelector("#theme-grid");
    const areas = ["Todas as áreas", ...uniqueAreas()];
    let activeArea = "Todas as áreas";

    chipRow.innerHTML = areas.map((area, index) => `<button class="chip${index === 0 ? " is-active" : ""}" type="button" data-area="${escapeHTML(area)}">${escapeHTML(area)}</button>`).join("");
    const draw = () => {
      const subset = activeArea === "Todas as áreas"
        ? researchers
        : researchers.filter((item) => (item.areas?.length ? item.areas : [item.area]).includes(activeArea));
      const totals = subset.reduce((map, item) => map.set(item.tematica, (map.get(item.tematica) || 0) + 1), new Map());
      grid.innerHTML = [...totals]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"))
        .map(([theme, total]) => renderThemeCard(theme, total))
        .join("") || '<div class="empty-state"><h3>Nenhuma temática nesta área</h3></div>';
      grid.querySelectorAll("[data-theme]").forEach((card) => {
        card.addEventListener("click", () => navigate(`cientistas.html?tematica=${encodeURIComponent(card.dataset.theme)}`));
      });
    };
    chipRow.addEventListener("click", (event) => {
      const chip = event.target.closest("[data-area]");
      if (!chip) return;
      activeArea = chip.dataset.area;
      chipRow.querySelectorAll(".chip").forEach((item) => item.classList.toggle("is-active", item === chip));
      draw();
    });
    draw();
  }

  function renderTerritorio() {
    const grid = document.querySelector("#territory-grid");
    const buttons = document.querySelectorAll("[data-mode]");
    const draw = (mode) => {
      const key = mode === "instituicao" ? "instituicao" : "cidade";
      const groups = researchers.reduce((map, item) => {
        const label = item[key];
        const group = map.get(label) || { count: 0, cities: new Set(), sigla: item.sigla };
        group.count += 1;
        group.cities.add(item.cidade);
        map.set(label, group);
        return map;
      }, new Map());

      grid.innerHTML = [...groups].sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0], "pt-BR")).map(([label, info]) => `<button class="explore-card" type="button" data-filter-key="${key}" data-filter-value="${escapeHTML(label)}">
        <span class="explore-card__icon" aria-hidden="true">${mode === "instituicao" ? escapeHTML(initials(info.sigla || label)) : "⌖"}</span>
        <h3>${escapeHTML(label)}</h3>
        <p>${mode === "instituicao" ? escapeHTML([...info.cities].join(" • ")) : "Bahia"}</p>
        <span class="explore-card__footer"><span>${info.count} ${info.count === 1 ? "pesquisadora" : "pesquisadoras"}</span><span>Conhecer →</span></span>
      </button>`).join("");
      grid.querySelectorAll("[data-filter-key]").forEach((card) => {
        card.addEventListener("click", () => navigate(`cientistas.html?${card.dataset.filterKey}=${encodeURIComponent(card.dataset.filterValue)}`));
      });
    };
    buttons.forEach((button) => button.addEventListener("click", () => {
      buttons.forEach((item) => item.classList.toggle("is-active", item === button));
      draw(button.dataset.mode);
    }));
    draw("instituicao");
  }

  function chooseRandomResearcher(excludedId = null) {
    const lastId = excludedId || sessionStorage.getItem(LAST_DISCOVERY_KEY);
    const options = researchers.filter((item) => String(item.id) !== String(lastId));
    const pool = options.length ? options : researchers;
    const selected = pool[Math.floor(Math.random() * pool.length)];
    if (selected) sessionStorage.setItem(LAST_DISCOVERY_KEY, selected.id);
    return selected;
  }

  function shortText(value, maxLength = 520) {
    const text = displayOrFallback(value);
    if (text.length <= maxLength) return text;
    const sliced = text.slice(0, maxLength);
    const cutAt = Math.max(sliced.lastIndexOf("."), sliced.lastIndexOf(";"), sliced.lastIndexOf(","));
    return `${sliced.slice(0, cutAt > 180 ? cutAt + 1 : maxLength).trim()}...`;
  }

  function buildImpactPhrase(researcher) {
    if (researcher.tema) {
      return `${researcher.nome} atua em ${researcher.tema}, conectando conhecimento científico a ${researcher.area}.`;
    }
    if (researcher.tematica && researcher.tematica !== "Temática não informada") {
      return `${researcher.nome} fortalece pesquisas em ${researcher.tematica}.`;
    }
    return shortText(researcher.resumo, 180);
  }

  function lattesURL(researcher) {
    if (!researcher.lattesId) return null;
    return `https://lattes.cnpq.br/${encodeURIComponent(researcher.lattesId)}`;
  }

  function lattesPhotoURL(researcher) {
    if (researcher.imagem) return researcher.imagem;
    if (!researcher.lattes10Id) return null;
    return `https://servicosweb.cnpq.br/wspessoa/servletrecuperafoto?tipo=1&id=${encodeURIComponent(researcher.lattes10Id)}`;
  }

  function textFitClass(value, mediumAt = 40, longAt = 90) {
    const length = displayOrFallback(value).length;
    if (length >= longAt) return " is-long";
    if (length >= mediumAt) return " is-medium";
    return "";
  }

  function pauloTextField(name, value, label, options = {}) {
    const tag = options.tag || "p";
    const classes = `paulo-template__field paulo-template__${name}${textFitClass(value, options.mediumAt, options.longAt)}`;
    return `<${tag} class="${classes}" aria-label="${escapeHTML(label)}">${escapeHTML(displayOrFallback(value))}</${tag}>`;
  }

  function renderProfile(targetResearcher = null, updateHistory = false) {
    const root = document.querySelector("#profile-content");
    const status = document.querySelector("#profile-status");
    const selected = targetResearcher
      || (params.get("descubra") ? chooseRandomResearcher() : researchers.find((item) => String(item.id) === params.get("id")))
      || chooseRandomResearcher();

    if (!selected) {
      root.innerHTML = '<div class="empty-state"><h2>Perfil não encontrado</h2></div>';
      if (status) status.textContent = "Perfil não encontrado.";
      return;
    }

    currentProfileId = selected.id;
    document.title = `${selected.nome} • Ciência Delas`;
    if (status) {
      status.textContent = `${selected.nome} carregada.`;
      status.classList.add("is-complete");
    }
    if (updateHistory || params.get("descubra") || !params.get("id")) {
      window.history.replaceState({}, "", `perfil.html?id=${encodeURIComponent(selected.id)}`);
    }

    const bio = shortText(firstText(selected.resumo, selected.abstractAI), 300);
    const impact = shortText(buildImpactPhrase(selected), 170);
    const lattes = lattesURL(selected);
    const photo = lattesPhotoURL(selected);
    const institution = `${selected.instituicao}${selected.sigla && selected.sigla !== selected.instituicao ? ` • ${selected.sigla}` : ""}`;
    const profileMeta = [selected.sigla, selected.cidade].filter(Boolean).join(" • ");
    const publications = selected.artigos ?? selected.trabalhos;
    const themeAction = selected.tematica && selected.tematica !== "Temática não informada"
      ? `<button class="touch-button" type="button" data-link-theme>${iconSVG("flask")} <span>Mesma temática</span></button>`
      : "";
    const photoMarkup = photo
      ? `<img src="${escapeHTML(photo)}" alt="Foto de ${escapeHTML(selected.nome)}" loading="eager" decoding="async" />`
      : `<span class="sr-only">Foto não disponível no Lattes.</span>`;

    root.innerHTML = `<article class="paulo-profile" aria-labelledby="profile-title">
      <section class="paulo-template" aria-label="Infográfico Descubra uma cientista">
        <img class="paulo-template__base" src="${PAULO_TEMPLATE_IMAGE}" alt="" aria-hidden="true" decoding="async" />
        <div class="paulo-template__photo" data-photo>${photoMarkup}</div>
        <div class="paulo-template__name${textFitClass(selected.nome, 28, 46)}" id="profile-title" tabindex="-1">
          <strong>${escapeHTML(selected.nome)}</strong>
          ${profileMeta ? `<span>${escapeHTML(profileMeta)}</span>` : ""}
        </div>
        ${pauloTextField("area", selected.area, "Área de atuação", { mediumAt: 22, longAt: 40 })}
        ${pauloTextField("degree", selected.graduacao, "Grau de formação", { mediumAt: 20, longAt: 34 })}
        ${pauloTextField("bio", bio, "Sobre a pesquisadora", { mediumAt: 160, longAt: 250 })}
        ${pauloTextField("institution", institution, "Instituição", { mediumAt: 42, longAt: 78 })}
        ${pauloTextField("city", selected.cidade, "Cidade de atuação", { mediumAt: 24, longAt: 42 })}
        ${pauloTextField("publications", publications === null || publications === undefined ? "0" : formatNumber(publications), "Publicações", { tag: "strong", mediumAt: 6, longAt: 10 })}
        ${pauloTextField("citations", selected.citacoes === null || selected.citacoes === undefined ? "0" : formatNumber(selected.citacoes), "Citações", { tag: "strong", mediumAt: 6, longAt: 10 })}
        ${pauloTextField("hindex", selected.indiceH === null || selected.indiceH === undefined ? "0" : formatNumber(selected.indiceH), "Índice h", { tag: "strong", mediumAt: 4, longAt: 7 })}
        ${pauloTextField("post", impact, "Post fixado", { mediumAt: 92, longAt: 135 })}
        <dl class="sr-only">
          <dt>Nome</dt><dd>${escapeHTML(selected.nome)}</dd>
          <dt>Área de atuação</dt><dd>${escapeHTML(displayOrFallback(selected.area))}</dd>
          <dt>Grau de formação</dt><dd>${escapeHTML(displayOrFallback(selected.graduacao))}</dd>
          <dt>Sobre a pesquisadora</dt><dd>${escapeHTML(bio)}</dd>
          <dt>Instituição</dt><dd>${escapeHTML(displayOrFallback(institution))}</dd>
          <dt>Cidade de atuação</dt><dd>${escapeHTML(displayOrFallback(selected.cidade))}</dd>
          <dt>Publicações</dt><dd>${escapeHTML(publications === null || publications === undefined ? "0" : formatNumber(publications))}</dd>
          <dt>Citações</dt><dd>${escapeHTML(selected.citacoes === null || selected.citacoes === undefined ? "0" : formatNumber(selected.citacoes))}</dd>
          <dt>Índice h</dt><dd>${escapeHTML(selected.indiceH === null || selected.indiceH === undefined ? "0" : formatNumber(selected.indiceH))}</dd>
        </dl>
      </section>

      <div class="paulo-profile__controls">
        <button class="touch-button touch-button--primary" type="button" data-discover>
          ${iconSVG("spark")} <span>Conheça outra pesquisadora</span>
        </button>
        ${themeAction}
        ${lattes ? `<a class="touch-button" href="${escapeHTML(lattes)}" target="_blank" rel="noopener">${iconSVG("bookmark")} <span>Currículo Lattes</span></a>` : ""}
      </div>
    </article>`;

    root.querySelector("[data-discover]").addEventListener("click", () => discoverResearcher(currentProfileId));
    root.querySelector("[data-link-theme]")?.addEventListener("click", () => navigate(`cientistas.html?tematica=${encodeURIComponent(selected.tematica)}`));
    root.querySelectorAll(".paulo-template__photo img").forEach((image) => {
      image.addEventListener("error", () => {
        const photo = image.closest("[data-photo]");
        photo.classList.add("is-empty");
        photo.innerHTML = '<span class="sr-only">Foto não disponível no Lattes.</span>';
      }, { once: true });
    });

  }

  function discoverResearcher(currentId = null) {
    const selected = chooseRandomResearcher(currentId);
    if (!selected) return;
    const overlay = document.querySelector("#randomizing");
    overlay?.classList.add("is-visible");
    overlay?.setAttribute("aria-hidden", "false");

    window.setTimeout(() => {
      overlay?.classList.remove("is-visible");
      overlay?.setAttribute("aria-hidden", "true");
      renderProfile(selected, true);
      document.querySelector("#profile-title")?.focus?.({ preventScroll: true });
    }, reducedMotion ? 80 : 520);
  }

  function initializeNavigation() {
    document.querySelectorAll("[data-home]").forEach((button) => button.addEventListener("click", goHome));
    document.querySelectorAll("[data-back]").forEach((button) => button.addEventListener("click", goBack));
  }

  function startInactivityTimer() {
    const restart = () => {
      window.clearTimeout(inactivityTimer);
      inactivityTimer = window.setTimeout(goHome, INACTIVITY_DELAY);
    };
    ["pointerdown", "keydown", "wheel", "touchstart"].forEach((eventName) => {
      document.addEventListener(eventName, restart, { passive: true });
    });
    restart();
  }

  async function initializeDataPage(renderer) {
    setLoadingState();
    try {
      researchers = await loadResearchers();
      setSourceNotes();
      renderer();
    } catch (error) {
      renderDataError(error);
    }
  }

  initializeNavigation();

  if (page === "cientistas") initializeDataPage(renderCientistas);
  if (page === "tematicas") initializeDataPage(renderTematicas);
  if (page === "territorio") initializeDataPage(renderTerritorio);
  if (page === "perfil") initializeDataPage(() => renderProfile());

  startInactivityTimer();
})();
