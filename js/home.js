// Página inicial: cartão de perfil, números, destaques, como trabalho e contacto.
// O herói é HTML estático; o resto vem de data/home.json, data/cv.json e da curadoria de projetos.

(async function () {
  const { el, icone, carregarJSON, revelar, escalonar, contar, semMovimento, CONTACTOS } = window.PS;
  const main = document.querySelector("#conteudo");
  const heroi = document.querySelector(".heroi");

  // Entrada do herói, linha a linha
  escalonar(heroi.querySelectorAll(".heroi__texto > *"), 90);

  const [cv, home] = await Promise.all([carregarJSON("data/cv.json"), carregarJSON("data/home.json")]).catch((erro) => {
    console.error(erro);
    return [];
  });
  if (!cv || !home) return; // o herói estático chega sozinho

  heroi.append(cartaoPerfil(cv, home.perfil));
  main.append(
    seccaoNumeros(home.numeros),
    el("div", { id: "destaques" }),
    seccaoPrincipios(home.principios),
    seccaoContacto(home.fecho)
  );
  destaques(document.querySelector("#destaques"));

  // ---------- Cartão de perfil, em JSON com cores de editor ----------

  function cartaoPerfil(cv, perfil) {
    const atual = cv.work[0];
    const pais = new Intl.DisplayNames(["en"], { type: "region" }).of(cv.basics.location.countryCode);
    const dados = {
      role: atual.position,
      company: atual.name,
      basedIn: `${cv.basics.location.city}, ${pais}`,
      ...perfil,
    };

    const valor = (v) =>
      Array.isArray(v)
        ? ["[", v.flatMap((x, i) => [i ? ", " : "", el("span", { class: "c-texto", text: `"${x}"` })]), "]"]
        : typeof v === "number"
          ? el("span", { class: "c-numero", text: v })
          : el("span", { class: "c-texto", text: `"${v}"` });

    const chaves = Object.entries(dados);
    const linhas = [
      el("span", { class: "codigo__linha" }, "{"),
      ...chaves.map(([k, v], i) =>
        el("span", { class: "codigo__linha" }, "  ", el("span", { class: "c-chave", text: `"${k}"` }), ": ", valor(v), i < chaves.length - 1 ? "," : "")
      ),
      el("span", { class: "codigo__linha" }, "}", el("span", { class: "codigo__cursor", "aria-hidden": "true" })),
    ];

    const figura = el("figure", { class: "codigo", "data-revelar": "", style: "--atraso: 250ms" },
      el("div", { class: "codigo__barra", "aria-hidden": "true" },
        el("span", { class: "codigo__pontos" }, el("i"), el("i"), el("i")),
        el("span", { text: "pedro.json" })
      ),
      el("pre", { class: "codigo__corpo" }, el("code", {}, linhas)),
      el("figcaption", { class: "visualmente-oculto", text: "Profile summary, written as JSON" })
    );

    // As linhas aparecem uma a uma, como se fossem escritas
    linhas.forEach((linha, i) => {
      if (semMovimento) linha.classList.add("escrita");
      else setTimeout(() => linha.classList.add("escrita"), 600 + i * 110);
    });
    // Chega depois do arranque do layout.js: tem de ser revelado aqui
    revelar([figura]);
    return figura;
  }

  // ---------- Números ----------

  function anosDesde(aaaaMm) {
    const [a, m] = aaaaMm.split("-").map(Number);
    const hoje = new Date();
    return hoje.getFullYear() - a - (hoje.getMonth() + 1 < m ? 1 : 0);
  }

  function seccaoNumeros(numeros) {
    const itens = numeros.map((n) => {
      const final = n.anosDesde ? anosDesde(n.anosDesde) : n.valor;
      const textoFinal = n.texto ?? `${n.prefixo ?? ""}${final}${n.sufixo ?? ""}`;
      const contador = el("span", { text: n.texto ?? final });
      if (!n.texto) contar(contador, final);
      return el("li", { class: "numero" },
        el("p", { class: "numero__valor" },
          el("span", { "aria-hidden": "true" }, n.texto ? null : n.prefixo, contador, n.texto ? null : n.sufixo),
          el("span", { class: "visualmente-oculto", text: textoFinal })
        ),
        el("p", { class: "numero__rotulo", text: n.rotulo })
      );
    });
    const lista = el("ul", { class: "numeros" }, itens);
    revelar(escalonar(itens, 90));
    return el("section", { class: "seccao", "aria-label": "By the numbers" }, lista);
  }

  // ---------- Destaques (mesmo motor e cache da página de projetos) ----------

  async function destaques(alvo) {
    const { obterRepos, lerMeta, organizar, criarCartao } = window.PS.projetos;
    try {
      const [{ repos }, meta] = await Promise.all([obterRepos(), lerMeta()]);
      const { emDestaque } = organizar(repos, meta);
      if (!emDestaque.length) return;

      const cartoes = emDestaque.map((r) => criarCartao(r, meta, true));
      alvo.replaceWith(
        el("section", { class: "seccao", "aria-labelledby": "titulo-trabalho" },
          topo("Selected work", "titulo-trabalho", el("a", { class: "ligacao-seta", href: "projects.html" }, "All projects ", el("span", { "aria-hidden": "true", text: "→" }))),
          el("ul", { class: "grelha grelha--destaque" }, cartoes)
        )
      );
      revelar(escalonar(cartoes, 80));
    } catch (erro) {
      // Sem destaques a página continua inteira; o link para os projetos está no menu
      console.error(erro);
      alvo.remove();
    }
  }

  // ---------- Como trabalho ----------

  function seccaoPrincipios(principios) {
    const itens = principios.map((p, i) =>
      el("li", { class: "principio" },
        el("span", { class: "principio__numero", "aria-hidden": "true", text: String(i + 1).padStart(2, "0") }),
        el("h3", { text: p.titulo }),
        el("p", { class: "texto-suave", text: p.texto }),
        p.ligacao && el("a", { class: "ligacao-seta", href: p.ligacao.href }, `${p.ligacao.texto} `, el("span", { "aria-hidden": "true", text: "→" }))
      )
    );
    revelar(escalonar(itens, 100));
    return el("section", { class: "seccao", "aria-labelledby": "titulo-principios" },
      topo("How I work", "titulo-principios"),
      el("ol", { class: "principios" }, itens)
    );
  }

  // ---------- Contacto ----------

  function seccaoContacto(fecho) {
    const caixa = el("div", { class: "contacto", "data-revelar": "" },
      el("h2", { id: "titulo-contacto", text: fecho.titulo }),
      el("p", { class: "texto-suave", text: fecho.texto }),
      el("p", { class: "contacto__acoes" },
        el("a", { class: "botao", href: `mailto:${CONTACTOS.email}` }, icone("email"), "Email me"),
        el("a", { class: "botao botao--secundario", href: CONTACTOS.linkedin, rel: "noopener" }, "LinkedIn", icone("externo")),
        el("a", { class: "botao botao--secundario", href: CONTACTOS.github, rel: "noopener" }, "GitHub", icone("externo"))
      )
    );
    revelar([caixa]);
    return el("section", { class: "seccao", "aria-labelledby": "titulo-contacto" }, caixa);
  }

  function topo(titulo, id, extra) {
    const cabeca = el("div", { class: "seccao__topo", "data-revelar": "" }, el("h2", { id, text: titulo }), extra);
    revelar([cabeca]);
    return cabeca;
  }
})();
