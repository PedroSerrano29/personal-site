// Lista os repositórios do GitHub, sozinha.
// A API sem autenticação dá 60 pedidos por hora por IP — por isso há cache no
// browser e um snapshot no repositório. A página nunca pode ficar vazia.
// Repositórios privados nunca são lidos: só aparecem os que estão escritos à mão
// em projects-meta.json, na chave "private". Nada privado entra por automatismo.
// A página inicial usa as mesmas funções (window.PS.projetos) para os destaques.

const UTILIZADOR = "PedroSerrano29";
const API = `https://api.github.com/users/${UTILIZADOR}/repos?per_page=100&sort=updated`;
const PERFIL = `https://github.com/${UTILIZADOR}`;
const RESERVA = "data/projects-fallback.json";
const META = "data/projects-meta.json";

const CHAVE_CACHE = "ps.projetos.v1";
const VALIDADE_MS = 6 * 60 * 60 * 1000; // 6 horas

// Campos que guardamos — o resto da resposta da API não interessa e só ocupa espaço
const CAMPOS = ["name", "description", "html_url", "homepage", "language", "topics", "updated_at", "fork", "archived", "stargazers_count"];

// Cores das linguagens, para o ponto ao lado do nome
const CORES = {
  Python: "#3572a5",
  "Jupyter Notebook": "#da5b0b",
  HTML: "#e34c26",
  CSS: "#563d7c",
  JavaScript: "#f1e05a",
};

const alvo = document.querySelector("#projetos");
const avisos = document.querySelector("#avisos");
const estado = document.querySelector("#estado");

// ---------- Cache no browser ----------

function lerCache() {
  try {
    const bruto = localStorage.getItem(CHAVE_CACHE);
    if (!bruto) return null;
    const dados = JSON.parse(bruto);
    if (!Array.isArray(dados.repos)) return null;
    dados.idadeMs = Date.now() - new Date(dados.guardadoEm).getTime();
    return dados;
  } catch {
    // Modo privado ou dados corrompidos: seguimos como se não houvesse cache
    return null;
  }
}

function guardarCache(repos) {
  try {
    localStorage.setItem(CHAVE_CACHE, JSON.stringify({ guardadoEm: new Date().toISOString(), repos }));
  } catch {
    // Sem espaço ou sem permissão — não é motivo para falhar a página
  }
}

// ---------- Ir buscar dados ----------

function limpar(repo) {
  const limpo = {};
  for (const campo of CAMPOS) limpo[campo] = repo[campo] ?? null;
  return limpo;
}

async function buscarDaApi() {
  const resposta = await fetch(API, { headers: { Accept: "application/vnd.github+json" } });

  // Limite de pedidos: 403 com o contador a zero, ou 429
  const semPedidos =
    resposta.status === 429 ||
    (resposta.status === 403 && resposta.headers.get("x-ratelimit-remaining") === "0");
  if (semPedidos) throw new Error("limite");
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);

  const repos = await resposta.json();
  return repos.map(limpar);
}

async function buscarDaReserva() {
  const resposta = await fetch(RESERVA);
  if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
  const dados = await resposta.json();
  return dados.repos;
}

// A curadoria é editada à mão: uma vírgula a mais não pode deitar a página abaixo.
// Sem ela a lista aparece na mesma, só sem títulos e textos próprios.
async function lerMeta() {
  try {
    const resposta = await fetch(META);
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    return await resposta.json();
  } catch (erro) {
    console.warn("projects-meta.json ignorado:", erro);
    return {};
  }
}

// Decide de onde vêm os dados. Devolve sempre {repos, origem}.
async function obterRepos() {
  const cache = lerCache();

  // Cache ainda válida: nem se toca na rede
  if (cache && cache.idadeMs < VALIDADE_MS) {
    return { repos: cache.repos, origem: "cache" };
  }

  try {
    const repos = await buscarDaApi();
    guardarCache(repos);
    return { repos, origem: "api" };
  } catch (erro) {
    // A API falhou. Cache velha ainda vale mais do que nada.
    if (cache) return { repos: cache.repos, origem: "cache-velha", motivo: erro.message, idadeMs: cache.idadeMs };
    const repos = await buscarDaReserva();
    return { repos, origem: "reserva", motivo: erro.message };
  }
}

// ---------- Apresentação ----------

function dataRelativa(iso) {
  const dias = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
  const fmt = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (dias < 30) return fmt.format(-dias, "day");
  // Arredondar dava "12 months ago" aos 350 dias
  if (dias < 365) return fmt.format(-Math.min(11, Math.floor(dias / 30)), "month");
  return fmt.format(-Math.floor(dias / 365), "year");
}

function criarCartao(repo, meta, destaque) {
  // Um privado que entretanto ficou público continua a usar o texto que tinha
  const extra = meta.overrides?.[repo.name] ?? meta.private?.[repo.name] ?? {};
  const titulo = extra.title || repo.name;
  const texto = extra.blurb || repo.description || "";
  // As da curadoria primeiro: com o limite de 5, são as que não podem ficar de fora
  const etiquetas = [...(extra.tags || []), ...(repo.topics || [])];
  const demo = extra.demo || repo.homepage;

  const li = document.createElement("li");
  li.className = ["cartao", destaque && "cartao--destaque", repo.privado && "cartao--privado"].filter(Boolean).join(" ");

  const h3 = document.createElement("h3");
  h3.className = "cartao__titulo";
  if (repo.privado) {
    // Não há nada para abrir: o título fica texto, sem link
    h3.textContent = titulo;
  } else {
    const link = document.createElement("a");
    link.href = repo.html_url;
    link.textContent = titulo;
    h3.append(link);
  }
  li.append(h3);

  if (texto) {
    const p = document.createElement("p");
    p.className = "cartao__texto";
    p.textContent = texto;
    li.append(p);
  }

  if (etiquetas.length) {
    const ul = document.createElement("ul");
    ul.className = "etiquetas";
    // Máximo de 5 etiquetas: mais do que isso vira ruído visual
    for (const nome of [...new Set(etiquetas)].slice(0, 5)) {
      const item = document.createElement("li");
      item.className = "etiqueta";
      item.textContent = nome;
      ul.append(item);
    }
    li.append(ul);
  }

  const rodape = document.createElement("div");
  rodape.className = "cartao__rodape";

  if (repo.privado) {
    const selo = document.createElement("span");
    selo.className = "selo";
    selo.textContent = "Private";
    rodape.append(selo);
    if (extra.status) rodape.append(document.createTextNode(extra.status));
  }

  if (repo.language) {
    const ling = document.createElement("span");
    ling.className = "ling";
    const ponto = document.createElement("span");
    ponto.className = "ling__ponto";
    if (CORES[repo.language]) ponto.style.background = CORES[repo.language];
    ling.append(ponto, document.createTextNode(repo.language));
    rodape.append(ling);
  }

  if (repo.updated_at) {
    const quando = document.createElement("span");
    quando.textContent = `Updated ${dataRelativa(repo.updated_at)}`;
    rodape.append(quando);
  }

  if (demo) {
    const links = document.createElement("span");
    links.className = "cartao__links";
    const a = document.createElement("a");
    a.href = demo;
    a.textContent = "Live demo";
    a.rel = "noopener";
    links.append(a);
    rodape.append(links);
  }

  li.append(rodape);
  return li;
}

function criarSeccao(titulo, repos, meta, destaque) {
  const seccao = document.createElement("section");
  seccao.className = "seccao";

  const cabecalho = document.createElement("div");
  cabecalho.className = "seccao__titulo";
  const h2 = document.createElement("h2");
  h2.textContent = titulo;
  const contagem = document.createElement("span");
  contagem.className = "seccao__contagem";
  contagem.textContent = `${repos.length} ${repos.length === 1 ? "project" : "projects"}`;
  cabecalho.append(h2, contagem);
  seccao.append(cabecalho);

  const ul = document.createElement("ul");
  ul.className = destaque ? "grelha grelha--destaque" : "grelha";
  for (const repo of repos) ul.append(criarCartao(repo, meta, destaque));
  seccao.append(ul);

  return seccao;
}

function mostrarAviso(texto, link) {
  const div = document.createElement("div");
  div.className = "aviso";
  div.append(texto);
  if (link) {
    const a = document.createElement("a");
    a.href = link.href;
    a.textContent = link.texto;
    div.append(" ", a, ".");
  }
  avisos.append(div);
}

// Decide o que aparece e em que grupo. Partilhado com a página inicial.
function organizar(repos, meta) {
  const destaques = meta.featured || [];
  const escondidos = Object.entries(meta.overrides || {})
    .filter(([, v]) => v.hidden)
    .map(([k]) => k);

  const visiveis = repos.filter((r) => !r.fork && !r.archived && !escondidos.includes(r.name));

  // Privados escritos à mão. Se a API já o trouxer, ficou público: não se duplica.
  const privados = Object.keys(meta.private || {})
    .filter((nome) => !repos.some((r) => r.name === nome))
    .map((nome) => ({ name: nome, privado: true }));

  // Destaques pela ordem do ficheiro de curadoria; o resto por data, mais recente primeiro
  const procurar = (nome) => visiveis.find((r) => r.name === nome) || privados.find((p) => p.name === nome);
  const emDestaque = destaques.map(procurar).filter(Boolean);
  const restantes = visiveis
    .filter((r) => !destaques.includes(r.name))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  const outrosPrivados = privados.filter((p) => !destaques.includes(p.name));

  return { emDestaque, restantes, outrosPrivados };
}

function render(repos, meta) {
  const { emDestaque, restantes, outrosPrivados } = organizar(repos, meta);

  alvo.replaceChildren();
  if (emDestaque.length) alvo.append(criarSeccao("Featured", emDestaque, meta, true));
  if (restantes.length) alvo.append(criarSeccao(emDestaque.length ? "Everything else" : "Projects", restantes, meta, false));
  if (outrosPrivados.length) alvo.append(criarSeccao("Not public yet", outrosPrivados, meta, false));

  // Cartões entram um a seguir ao outro
  for (const grelha of alvo.querySelectorAll(".grelha")) {
    window.PS.revelar(window.PS.escalonar(grelha.children, 60));
  }

  return emDestaque.length + restantes.length + outrosPrivados.length;
}

// ---------- Arranque ----------

async function iniciar() {
  try {
    // A curadoria e os repositórios vêm ao mesmo tempo, não um atrás do outro
    const [meta, resultado] = await Promise.all([lerMeta(), obterRepos()]);

    const total = render(resultado.repos, meta);
    estado.textContent = `${total} ${total === 1 ? "project" : "projects"} loaded.`;

    if (resultado.origem === "cache-velha") {
      const horas = Math.round(resultado.idadeMs / 3600000);
      mostrarAviso(`GitHub could not be reached, so this list is from a copy saved in your browser about ${horas}h ago.`);
    } else if (resultado.origem === "reserva") {
      const texto =
        resultado.motivo === "limite"
          ? "GitHub's hourly request limit was reached, so this list comes from a snapshot saved in the repository."
          : "GitHub could not be reached, so this list comes from a snapshot saved in the repository.";
      mostrarAviso(texto);
    }
  } catch (erro) {
    alvo.replaceChildren();
    mostrarAviso("The project list could not be loaded. Everything is on", { href: PERFIL, texto: "GitHub" });
    estado.textContent = "The project list could not be loaded.";
    console.error(erro);
  }
}

window.PS.projetos = { obterRepos, lerMeta, organizar, criarCartao };

// Só arranca sozinho na página de projetos
if (alvo) iniciar();
