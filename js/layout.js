// Cabeçalho, rodapé e animações partilhadas por todas as páginas.
// Carrega-se logo no início do <body>: o cabeçalho entra antes de a página pintar.
// Expõe window.PS com os ajudantes que home.js, cv.js e projects.js usam.

(function () {
  const raiz = document.documentElement;
  raiz.classList.add("js");

  const semMovimento = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const PAGINAS = [
    { href: "index.html", texto: "Home" },
    { href: "projects.html", texto: "Projects" },
    { href: "resume.html", texto: "CV" },
  ];

  const CONTACTOS = {
    email: "pedrofcserrano@gmail.com",
    linkedin: "https://www.linkedin.com/in/pedrofcserrano",
    github: "https://github.com/PedroSerrano29",
    sponsor: "https://github.com/sponsors/PedroSerrano29",
    codigo: "https://github.com/PedroSerrano29/personal-site",
  };

  // Ícones nossos, em SVG - nunca dados de fora
  const ICONES = {
    email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    externo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7"/><path d="M9 7h8v8"/></svg>',
    descarregar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11"/><path d="m7 10 5 5 5-5"/><path d="M5 20h14"/></svg>',
    coracao: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 20.3S3.5 15.4 3.5 9.3A4.5 4.5 0 0 1 12 7.2a4.5 4.5 0 0 1 8.5 2.1c0 6.1-8.5 11-8.5 11z"/></svg>',
    cadeado: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  };

  // ---------- Ajudantes ----------

  // Cria um elemento: el("a", { href, class, text }, ...filhos)
  function el(tag, props = {}, ...filhos) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? "" : v);
    }
    n.append(...filhos.flat(Infinity).filter((f) => f != null && f !== false));
    return n;
  }

  function icone(nome) {
    const t = document.createElement("template");
    t.innerHTML = ICONES[nome];
    return t.content.firstElementChild;
  }

  async function carregarJSON(url) {
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error(`${url}: HTTP ${resposta.status}`);
    return resposta.json();
  }

  // ---------- Animações ----------

  // Mostra os elementos [data-revelar] quando entram no ecrã
  let observador = null;
  function revelar(nos) {
    const lista = [...nos].filter(Boolean);
    if (semMovimento || !("IntersectionObserver" in window)) {
      lista.forEach((n) => n.classList.add("visivel"));
      return;
    }
    observador ??= new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("visivel");
          observador.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.06 }
    );
    lista.forEach((n) => observador.observe(n));
  }

  // Atraso crescente: os filhos entram um a seguir ao outro
  function escalonar(nos, passo = 70, inicio = 0) {
    [...nos].forEach((n, i) => {
      n.setAttribute("data-revelar", "");
      n.style.setProperty("--atraso", `${inicio + i * passo}ms`);
    });
    return nos;
  }

  // Número a contar de 0 até ao valor final, quando aparece
  function contar(alvo, final, duracao = 1400) {
    alvo.textContent = final;
    if (semMovimento || !("IntersectionObserver" in window)) return;
    alvo.textContent = 0;
    const obs = new IntersectionObserver((entradas) => {
      if (!entradas[0].isIntersecting) return;
      obs.disconnect();
      const t0 = performance.now();
      const passo = (agora) => {
        const p = Math.min(1, (agora - t0) / duracao);
        const suave = 1 - Math.pow(1 - p, 3);
        alvo.textContent = Math.round(final * suave);
        if (p < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    }, { threshold: 0.6 });
    obs.observe(alvo);
  }

  // ---------- Cabeçalho ----------

  const atual = location.pathname.split("/").pop() || "index.html";

  const cabecalho = el("header", { class: "cabecalho" },
    el("div", { class: "container cabecalho__interior" },
      el("a", { class: "marca", href: "index.html", "aria-label": "Pedro Serrano, home" },
        el("span", { class: "marca__sinal", "aria-hidden": "true", text: ">" }),
        "pedro serrano",
        el("span", { class: "marca__cursor", "aria-hidden": "true", text: "_" })
      ),
      el("nav", { "aria-label": "Main" },
        el("ul", {}, PAGINAS.map((p) =>
          el("li", {}, el("a", { href: p.href, "aria-current": p.href === atual ? "page" : null, text: p.texto }))
        ))
      )
    )
  );

  document.currentScript.after(
    el("a", { class: "skip-link", href: "#conteudo", text: "Skip to content" }),
    cabecalho
  );

  // Fundo no cabeçalho só depois de rolar
  const marcarRolagem = () => cabecalho.classList.toggle("cabecalho--rolado", scrollY > 8);
  addEventListener("scroll", marcarRolagem, { passive: true });
  marcarRolagem();

  // ---------- Rodapé e arranque ----------

  function rodape() {
    const ligacao = (href, texto, nomeIcone, extra = {}) =>
      el("li", {}, el("a", { href, ...extra }, nomeIcone && icone(nomeIcone), texto));

    return el("footer", { class: "rodape" },
      el("div", { class: "container rodape__interior" },
        el("p", {},
          `© ${new Date().getFullYear()} Pedro Serrano · Hand-built in HTML, CSS and vanilla JavaScript · `,
          el("a", { href: CONTACTOS.codigo, text: "Source" })
        ),
        el("ul", { class: "rodape__links" },
          ligacao(`mailto:${CONTACTOS.email}`, "Email", "email"),
          ligacao(CONTACTOS.linkedin, "LinkedIn", null, { rel: "noopener" }),
          ligacao(CONTACTOS.github, "GitHub", null, { rel: "noopener" }),
          ligacao(CONTACTOS.sponsor, "Sponsor", "coracao", { class: "sponsor", rel: "noopener" })
        )
      )
    );
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.body.append(rodape());
    revelar(document.querySelectorAll("[data-revelar]"));
  });

  // Brilho dos cartões a seguir o rato (só com rato, não em toque)
  if (matchMedia("(hover: hover)").matches) {
    document.addEventListener("pointermove", (e) => {
      const cartao = e.target.closest?.(".cartao");
      if (!cartao) return;
      const r = cartao.getBoundingClientRect();
      cartao.style.setProperty("--mx", `${e.clientX - r.left}px`);
      cartao.style.setProperty("--my", `${e.clientY - r.top}px`);
    }, { passive: true });
  }

  window.PS = { el, icone, carregarJSON, revelar, escalonar, contar, semMovimento, CONTACTOS };
})();
