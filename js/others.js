// Página "Others": cada secção de data/others.json é uma pasta da árvore.
// Para acrescentar uma página ou um jogo basta um item novo no JSON.

(async function () {
  const { el, carregarJSON, revelar, escalonar, semMovimento } = window.PS;
  const alvo = document.querySelector("#outros");

  let dados;
  try {
    dados = await carregarJSON("data/others.json");
  } catch (erro) {
    console.error(erro);
    alvo.replaceChildren(el("div", { class: "aviso", text: "This page could not be loaded. Try again in a moment." }));
    return;
  }
  const seccoes = dados.seccoes;

  // ---------- Árvore, como num explorador de ficheiros ----------

  function arvore() {
    const linha = (...filhos) => el("span", { class: "codigo__linha" }, ...filhos);
    const linhas = [linha(el("span", { class: "c-chave", text: "others/" }))];
    seccoes.forEach((s, i) => {
      const ultimaPasta = i === seccoes.length - 1;
      linhas.push(linha(ultimaPasta ? "└── " : "├── ", el("a", { class: "c-chave", href: `#${s.pasta}`, text: `${s.pasta}/` })));
      s.itens.forEach((item, j) => {
        const ramo = (ultimaPasta ? "    " : "│   ") + (j === s.itens.length - 1 ? "└── " : "├── ");
        linhas.push(linha(ramo, el("a", { class: "c-texto", href: item.href, text: item.titulo })));
      });
    });
    linhas.at(-1).append(el("span", { class: "codigo__cursor", "aria-hidden": "true" }));

    const figura = el("figure", { class: "codigo", "data-revelar": "", style: "--atraso: 250ms" },
      el("div", { class: "codigo__barra", "aria-hidden": "true" },
        el("span", { class: "codigo__pontos" }, el("i"), el("i"), el("i")),
        el("span", { text: "tree others/" })
      ),
      el("pre", { class: "codigo__corpo" }, el("code", {}, linhas)),
      el("figcaption", { class: "visualmente-oculto", text: "Contents of this page, as a folder tree" })
    );

    // As linhas aparecem uma a uma, como no cartão da página inicial
    linhas.forEach((l, i) => {
      if (semMovimento) l.classList.add("escrita");
      else setTimeout(() => l.classList.add("escrita"), 500 + i * 110);
    });
    return figura;
  }

  // ---------- Secções e cartões ----------

  function cartao(item) {
    return el("li", { class: "cartao" },
      el("h3", { class: "cartao__titulo" }, el("a", { href: item.href, text: item.titulo })),
      el("p", { class: "cartao__texto", text: item.texto }),
      item.etiquetas?.length > 0 && el("ul", { class: "etiquetas" }, item.etiquetas.map((t) => el("li", { class: "etiqueta", text: t }))),
      item.nota && el("div", { class: "cartao__rodape" }, el("span", { text: item.nota }))
    );
  }

  function seccao(s) {
    const [um, varios] = s.unidade || [];
    const n = s.itens.length;
    const cartoes = s.itens.map(cartao);
    escalonar(cartoes, 70);
    return el("section", { class: "seccao", id: s.pasta, "aria-labelledby": `titulo-${s.pasta}` },
      el("p", { class: "rotulo", "data-revelar": "", text: `// others/${s.pasta}/` }),
      el("div", { class: "seccao__titulo", "data-revelar": "" },
        el("h2", { id: `titulo-${s.pasta}`, text: s.titulo }),
        um && el("span", { class: "seccao__contagem", text: `${n} ${n === 1 ? um : varios}` })
      ),
      s.texto && el("p", { class: "texto-suave", "data-revelar": "", text: s.texto }),
      el("ul", { class: "grelha" }, cartoes)
    );
  }

  const figura = arvore();
  document.querySelector(".outros-topo").append(figura);
  alvo.replaceChildren(...seccoes.map(seccao));
  revelar([figura, ...alvo.querySelectorAll("[data-revelar]")]);
})();
