// CV completo a partir de data/cv.json (esquema JSON Resume, ADR-009).
// O HTML tem um bloco base estático para quem não corre JavaScript; aqui é substituído.
// O PDF sai da folha de impressão em cv.css (ADR-008): botão "Download PDF" = window.print().

(async function () {
  const { el, icone, carregarJSON, revelar, escalonar } = window.PS;
  const main = document.querySelector("#conteudo");

  let cv;
  try {
    cv = await carregarJSON("data/cv.json");
  } catch (erro) {
    console.error(erro);
    main.prepend(el("div", { class: "aviso", text: "The full CV could not be loaded. The summary below is still up to date." }));
    return;
  }

  // ---------- Datas ----------

  const MES = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" });

  function data(aaaaMm) {
    if (!aaaaMm) return "Present";
    const [a, m] = aaaaMm.split("-").map(Number);
    return m ? MES.format(new Date(a, m - 1)) : String(a);
  }

  function periodo(inicio, fim) {
    return `${data(inicio)} – ${data(fim)}`;
  }

  // Duração como no LinkedIn: "3 yrs 11 mos"
  function duracao(inicio, fim) {
    const [a0, m0] = inicio.split("-").map(Number);
    if (!m0) return "";
    const hoje = new Date();
    const [a1, m1] = fim ? fim.split("-").map(Number) : [hoje.getFullYear(), hoje.getMonth() + 1];
    const meses = (a1 - a0) * 12 + (m1 - m0) + 1;
    const anos = Math.floor(meses / 12);
    const resto = meses % 12;
    return [anos && `${anos} yr${anos > 1 ? "s" : ""}`, resto && `${resto} mo${resto > 1 ? "s" : ""}`].filter(Boolean).join(" ");
  }

  const juntar = (...partes) => partes.filter(Boolean).join(" · ");

  // ---------- Blocos ----------

  function topo(b) {
    const site = b.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const perfil = (rede) => b.profiles.find((p) => p.network === rede);
    const semProtocolo = (url) => url.replace(/^https?:\/\/(www\.)?/, "");
    const pais = new Intl.DisplayNames(["en"], { type: "region" }).of(b.location.countryCode);

    const filhos = [
      el("p", { class: "rotulo", text: "// curriculum vitae" }),
      el("h1", { text: b.name }),
      el("p", { class: "cv__titulo", text: b.label }),
      el("p", { class: "cv__resumo", text: b.summary }),
      el("ul", { class: "cv__contactos" },
        el("li", { text: `${b.location.city}, ${pais}` }),
        el("li", {}, el("a", { href: `mailto:${b.email}`, text: b.email })),
        el("li", {}, el("a", { href: perfil("LinkedIn").url, rel: "noopener", text: semProtocolo(perfil("LinkedIn").url) })),
        el("li", {}, el("a", { href: perfil("GitHub").url, rel: "noopener", text: semProtocolo(perfil("GitHub").url) })),
        el("li", { class: "so-impressao" }, el("a", { href: b.url, text: site }))
      ),
      el("p", { class: "cv__acoes" },
        el("button", { class: "botao", type: "button", onclick: () => print() }, icone("descarregar"), "Download PDF"),
        el("span", { class: "cv__dica", text: "Opens the print dialog: choose “Save as PDF”." })
      ),
    ];
    escalonar(filhos, 80);
    return el("header", { class: "cv__topo" }, filhos);
  }

  function seccao(titulo, ...conteudo) {
    const s = el("section", { class: "cv__seccao", "data-revelar": "" }, el("h2", { text: titulo }), conteudo);
    return s;
  }

  // Funções seguidas na mesma empresa ficam juntas (ADR-009)
  function experiencia(trabalhos) {
    const grupos = [];
    for (const t of trabalhos) {
      const ultimo = grupos.at(-1);
      if (ultimo && ultimo.nome === t.name) ultimo.funcoes.push(t);
      else grupos.push({ nome: t.name, local: t.location, funcoes: [t] });
    }

    const empresas = grupos.map((g) => {
      const inicio = g.funcoes.at(-1).startDate;
      const fim = g.funcoes[0].endDate;
      const varias = g.funcoes.length > 1;
      return el("article", { class: "empresa", "data-revelar": "" },
        el("header", { class: "empresa__topo" },
          el("h3", { text: g.nome }),
          el("p", { class: "empresa__meta", text: juntar(g.local, varias && periodo(inicio, fim), varias && duracao(inicio, fim)) })
        ),
        el("ol", { class: "funcoes" }, g.funcoes.map((f) =>
          el("li", { class: "funcao" },
            el("h4", { text: f.position }),
            el("p", { class: "funcao__datas" }, el("time", { text: periodo(f.startDate, f.endDate) }), duracao(f.startDate, f.endDate) && ` · ${duracao(f.startDate, f.endDate)}`),
            f.summary && el("p", { text: f.summary }),
            f.highlights?.length > 0 && el("ul", { class: "destaques" }, f.highlights.map((h) => el("li", { text: h })))
          )
        ))
      );
    });
    escalonar(empresas, 60);
    return seccao("Experience", empresas);
  }

  function formacao(cursos) {
    return seccao("Education", cursos.map((e) =>
      el("article", { class: "entrada" },
        el("h3", { text: e.institution }),
        el("p", { class: "entrada__meta", text: juntar(e.studyType, e.area) }),
        el("p", { class: "entrada__datas", text: e.endDate ? `${data(e.startDate)} – ${data(e.endDate)}` : `${data(e.startDate)} – in progress` }),
        e.courses?.length > 0 && el("ul", { class: "destaques" }, e.courses.map((c) => el("li", { text: c })))
      )
    ));
  }

  function projetos(lista) {
    return seccao("Projects", lista.map((p) =>
      el("article", { class: "entrada projeto" },
        el("h3", {}, el("a", { href: p.url, rel: "noopener", text: p.name })),
        el("p", { text: p.description }),
        el("p", { class: "palavras", text: p.keywords.join(" · ") })
      )
    ));
  }

  function competencias(grupos) {
    return seccao("Skills", grupos.map((g) =>
      el("div", { class: "competencia" },
        el("h3", { text: g.name }),
        el("ul", { class: "etiquetas" }, g.keywords.map((k) => el("li", { class: "etiqueta", text: k })))
      )
    ));
  }

  // emLinha: no PDF os itens ficam numa só linha, para poupar espaço
  function lista(titulo, itens, linha, emLinha = false) {
    const classe = emLinha ? "lista-simples lista-simples--linha" : "lista-simples";
    return seccao(titulo, el("ul", { class: classe }, itens.map((i) => el("li", {}, ...linha(i)))));
  }

  // ---------- Montagem ----------

  const principal = el("div", { class: "cv__principal" },
    experiencia(cv.work),
    projetos(cv.projects),
    formacao(cv.education)
  );
  const lateral = el("aside", { class: "cv__lateral", "aria-label": "Skills and more" },
    competencias(cv.skills),
    lista("Languages", cv.languages, (l) => [el("strong", { text: l.language }), ` · ${l.fluency}`], true),
    lista("Certifications", cv.certificates, (c) => [el("strong", { text: c.name }), el("span", { class: "texto-suave", text: ` · ${c.issuer}, ${data(c.date)}` })]),
    lista("Volunteering", cv.volunteer, (v) => [el("strong", { text: v.organization }), ` · ${v.position}, since ${data(v.startDate)}`])
  );

  main.replaceChildren(topo(cv.basics), el("div", { class: "cv__grelha" }, principal, lateral));

  // O Chrome sugere o nome do PDF a partir do título da página
  const tituloPagina = document.title;
  addEventListener("beforeprint", () => { document.title = "Pedro Serrano - CV"; });
  addEventListener("afterprint", () => { document.title = tituloPagina; });
  revelar(main.querySelectorAll("[data-revelar]"));
})();
