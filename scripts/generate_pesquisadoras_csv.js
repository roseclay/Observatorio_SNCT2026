const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "data", "dados_simcc_completo.json");
const targetPath = path.join(root, "data", "pesquisadoras.csv");

const fields = [
  "id",
  "nome",
  "sexo",
  "lattes_id",
  "lattes_10_id",
  "orcid",
  "graduacao",
  "area",
  "area_ia",
  "tematica_ia",
  "tema_ia",
  "cidade",
  "instituicao",
  "sigla",
  "biografia",
  "abstract_ai",
  "artigos",
  "livros",
  "capitulos",
  "patentes",
  "softwares",
  "marcas",
  "indice_h",
  "citacoes",
  "indice_i10",
  "trabalhos",
  "openalex",
  "classificacao",
  "imagem"
];

function validText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function numberText(value) {
  const number = Number(value);
  return Number.isFinite(number) ? String(number) : "";
}

function csvEscape(value) {
  const text = validText(value).replace(/\r?\n|\r/g, " ");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const payload = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const records = Array.isArray(payload) ? payload : payload.data || [];

const rows = records
  .filter((record) => validText(record.Sexo).toUpperCase() === "F")
  .map((record) => ({
    id: validText(record.id),
    nome: validText(record.name),
    sexo: validText(record.Sexo),
    lattes_id: validText(record.lattes_id),
    lattes_10_id: validText(record.lattes_10_id),
    orcid: validText(record.orcid),
    graduacao: validText(record.graduation),
    area: validText(record.area),
    area_ia: validText(record["ÁREA IA"]),
    tematica_ia: validText(record["TEMÁTICA IA"]),
    tema_ia: validText(record["TEMA IA"]),
    cidade: validText(record.city),
    instituicao: validText(record.university) || validText(record.institution?.name),
    sigla: validText(record["SIGLA IA"]) || validText(record.institution?.acronym),
    biografia: validText(record.abstract),
    abstract_ai: validText(record.abstract_ai),
    artigos: numberText(record.articles),
    livros: numberText(record.book),
    capitulos: numberText(record.book_chapters),
    patentes: numberText(record.patent),
    softwares: numberText(record.software),
    marcas: numberText(record.brand),
    indice_h: numberText(record.h_index),
    citacoes: numberText(record.cited_by_count),
    indice_i10: numberText(record.i10_index),
    trabalhos: numberText(record.works_count),
    openalex: validText(record.openalex),
    classificacao: validText(record.classification),
    imagem: ""
  }))
  .filter((record) => record.id && record.nome);

const csv = `${fields.join(",")}\r\n${rows
  .map((row) => fields.map((field) => csvEscape(row[field])).join(","))
  .join("\r\n")}\r\n`;

fs.writeFileSync(targetPath, csv, "utf8");
console.log(`CSV gerado em ${path.relative(root, targetPath)} com ${rows.length} pesquisadoras.`);
