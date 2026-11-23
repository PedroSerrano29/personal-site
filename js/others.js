// Página "Others" e as suas pastas (legacy.html, games.html), a partir de data/others.json.
// others.html mostra só as pastas, sem nomes lá dentro; cada pasta lista as páginas com uma pré-visualização viva.
// Para acrescentar uma página ou um jogo basta um item novo no JSON.

(async function () {
  const { el, carregarJSON, revelar, escalonar } = window.PS;
  const alvo = document.querySelector("#outros");
  const pasta = alvo.dataset.pasta;

  let dados;
  try {
    dados = await carregarJSON("data/others.json");
  } catch (erro) {
    console.error(erro);
    alvo.replaceChildren(el("div", { class: "aviso", text: "This page could not be loaded. Try again in a moment." }));
    return;
  }

  const contagem = (s) => {
    const [um, varios] = s.unidade;
    return `${s.itens.length} ${s.itens.length === 1 ? um : varios}`;
  };

  // ---------- others.html: uma entrada por pasta ----------

  function pastas() {
    const cartoes = dados.seccoes.map((s) =>
      el("li", { class: "cartao cartao--pasta" },
        el("p", { class: "cartao__caminho", text: `others/${s.pasta}/` }),
        el("h2", { class: "cartao__titulo" }, el("a", { href: s.pagina, text: s.titulo })),
        el("p", { class: "cartao__texto", text: s.resumo }),
        el("div", { class: "cartao__rodape" }, el("span", { text: contagem(s) }))
      )
    );
    escalonar(cartoes, 80, 200);
    return el("ul", { class: "grelha grelha--pastas" }, cartoes);
  }

  // ---------- Cada pasta: lista com pré-visualização ----------

  // A página abre num iframe do tamanho de um ecrã de computador e encolhe até à largura do cartão
  const LARGURA = 1280;
  const ALTURA = 800;
  const escalar = new ResizeObserver((entradas) => {
    for (const e of entradas) e.target.style.setProperty("--escala", e.contentRect.width / LARGURA);
  });

  function previsualizacao(href) {
    const caixa = el("div", { class: "preview", "aria-hidden": "true" },
      el("iframe", { src: href, loading: "lazy", tabindex: "-1", title: "", width: LARGURA, height: ALTURA })
    );
    escalar.observe(caixa);
    return caixa;
  }

  function item(it) {
    return el("li", { class: "cartao cartao--item" },
      previsualizacao(it.href),
      el("h2", { class: "cartao__titulo" }, el("a", { href: it.href, text: it.titulo })),
      el("p", { class: "cartao__texto", text: it.texto }),
      it.etiquetas?.length > 0 && el("ul", { class: "etiquetas" }, it.etiquetas.map((t) => el("li", { class: "etiqueta", text: t }))),
      it.nota && el("div", { class: "cartao__rodape" }, el("span", { text: it.nota }))
    );
  }

  function lista(s) {
    const cartoes = s.itens.map(item);
    escalonar(cartoes, 80, 200);
    return el("ul", { class: "grelha grelha--itens" }, cartoes);
  }

  // ---------- Montagem ----------

  if (pasta) {
    const s = dados.seccoes.find((x) => x.pasta === pasta);
    if (!s) return;
    alvo.replaceChildren(lista(s));
  } else {
    alvo.replaceChildren(pastas());
  }
  revelar(alvo.querySelectorAll(".cartao"));
})();
