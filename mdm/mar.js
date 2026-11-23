// MdM: uptime ao segundo, próxima versão (aniversário), percentis da OMS e changelog.
// Dados em dados.json; curvas da OMS em oms-raparigas-0-5.json. Horas sempre no relógio de Lisboa.

(async function () {
  const { el, carregarJSON, revelar, escalonar } = window.PS;
  const FUSO = "Europe/Lisbon";
  const main = document.querySelector("#conteudo");

  let dados;
  try {
    dados = await carregarJSON("dados.json");
  } catch (erro) {
    console.error(erro);
    main.append(el("div", { class: "aviso", text: "The live data could not be loaded. Try again in a moment." }));
    return;
  }

  // ---------- Relógio de Lisboa ----------

  const PARTES = new Intl.DateTimeFormat("en-GB", {
    timeZone: FUSO, hourCycle: "h23",
    year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric",
  });

  // Data e hora de parede em Lisboa: { a, m, d, h, mi, s }
  function relogio(instante) {
    const p = {};
    for (const { type, value } of PARTES.formatToParts(instante)) if (type !== "literal") p[type] = Number(value);
    return { a: p.year, m: p.month, d: p.day, h: p.hour, mi: p.minute, s: p.second };
  }

  // Hora de parede em Lisboa -> instante. Duas voltas acertam o desvio de verão ou de inverno.
  function emLisboa(a, m, d, h = 0, mi = 0, s = 0) {
    const pretendido = Date.UTC(a, m - 1, d, h, mi, s);
    let t = pretendido;
    for (let i = 0; i < 2; i++) {
      const r = relogio(new Date(t));
      t = pretendido - (Date.UTC(r.a, r.m - 1, r.d, r.h, r.mi, r.s) - t);
    }
    return new Date(t);
  }

  const diasNoMes = (a, m) => new Date(Date.UTC(a, m, 0)).getUTCDate();
  const diasEntre = (x, y) => Math.round((Date.UTC(y.a, y.m - 1, y.d) - Date.UTC(x.a, x.m - 1, x.d)) / 864e5);
  const segundosDoDia = (r) => (r.h || 0) * 3600 + (r.mi || 0) * 60 + (r.s || 0);

  // Diferença de calendário entre duas horas de parede: como se lê num calendário, não em blocos de 24 h
  function diferenca(de, ate) {
    let a = ate.a - de.a, m = ate.m - de.m, d = ate.d - de.d;
    let h = (ate.h || 0) - (de.h || 0), mi = (ate.mi || 0) - (de.mi || 0), s = (ate.s || 0) - (de.s || 0);
    if (s < 0) { s += 60; mi--; }
    if (mi < 0) { mi += 60; h--; }
    if (h < 0) { h += 24; d--; }
    while (d < 0) { m--; d += ate.m === 1 ? 31 : diasNoMes(ate.a, ate.m - 1); }
    if (m < 0) { m += 12; a--; }
    return { a, m, d, h, mi, s };
  }

  // Chama fn agora e depois no início de cada segundo
  function cadaSegundo(fn) {
    fn();
    setTimeout(() => cadaSegundo(fn), 1000 - (Date.now() % 1000) + 5);
  }

  // ---------- Idades, versões e datas ----------

  const nasc = relogio(new Date(dados.deployment));
  const diaNasc = { a: nasc.a, m: nasc.m, d: nasc.d };
  const dataISO = (texto) => { const [a, m, d] = texto.split("-").map(Number); return { a, m, d }; };
  const iso = (x) => `${x.a}-${String(x.m).padStart(2, "0")}-${String(x.d).padStart(2, "0")}`;
  const idadeEm = (data) => diferenca(diaNasc, data);
  const versao = (i) => `v${i.a}.${i.m}`;
  const plural = (n, um, varios = `${um}s`) => `${n} ${n === 1 ? um : varios}`;

  function idadeTexto(i) {
    if (i.a === 0 && i.m === 0) return i.d === 0 ? "day one" : i.d < 7 ? plural(i.d, "day") : plural(Math.floor(i.d / 7), "week");
    return [i.a && plural(i.a, "year"), i.m && plural(i.m, "month")].filter(Boolean).join(" ");
  }

  const DATA = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const DATA_LONGA = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const fmtData = (x, f = DATA) => f.format(new Date(Date.UTC(x.a, x.m - 1, x.d)));

  function seccao(id, rotulo, titulo, ...conteudo) {
    return el("section", { class: "seccao mar-seccao", id, "aria-labelledby": `t-${id}` },
      el("p", { class: "rotulo", "data-revelar": "", text: `// ${rotulo}` }),
      el("h2", { id: `t-${id}`, "data-revelar": "", text: titulo }),
      ...conteudo
    );
  }

  // Mostradores: [chave, nome] -> { lista de <li>, pôr(valores) }
  function mostradores(unidades, classe) {
    const partes = unidades.map(([k, nome]) => ({
      k, nome,
      valor: el("span", { class: "tempo__valor", text: "0" }),
      rotulo: el("span", { class: "tempo__rotulo", text: `${nome}s` }),
    }));
    const itens = partes.map((p) => el("li", { class: "tempo" }, p.valor, p.rotulo));
    escalonar(itens, 60, 150);
    return {
      lista: el("ol", { class: `relogio ${classe || ""}` }, itens),
      por(valores) {
        for (const p of partes) {
          const n = valores[p.k];
          p.valor.textContent = ["h", "mi", "s"].includes(p.k) ? String(n).padStart(2, "0") : n.toLocaleString("en-GB");
          p.rotulo.textContent = n === 1 ? p.nome : `${p.nome}s`;
        }
      },
    };
  }

  // ---------- Uptime ----------

  function uptime() {
    const m = mostradores([["a", "year"], ["m", "month"], ["d", "day"], ["h", "hour"], ["mi", "minute"], ["s", "second"]]);
    const totais = el("p", { class: "mar-totais", "data-revelar": "" });
    cadaSegundo(() => {
      const agora = relogio(new Date());
      const dif = diferenca(nasc, agora);
      m.por(dif);
      let dias = diasEntre(nasc, agora);
      if (segundosDoDia(agora) < segundosDoDia(nasc)) dias--;
      totais.textContent = `${dias.toLocaleString("en-GB")} days · ${Math.floor(dias / 7).toLocaleString("en-GB")} weeks · ${dif.a * 12 + dif.m} months in production`;
    });
    return seccao("uptime", "uptime", "Uptime", m.lista, totais);
  }

  // ---------- Próxima versão (aniversário) ----------

  const CHAVE = "mdm.proxima-versao";
  const lerData = () => { try { return localStorage.getItem(CHAVE); } catch { return null; } };
  const guardarData = (v) => { try { if (v) localStorage.setItem(CHAVE, v); else localStorage.removeItem(CHAVE); } catch { /* sem armazenamento: só não fica lembrado */ } };

  function proximoAniversario(hoje) {
    const passou = hoje.m > nasc.m || (hoje.m === nasc.m && hoje.d > nasc.d);
    return { a: hoje.a + (passou ? 1 : 0), m: nasc.m, d: nasc.d };
  }

  function proximaVersao() {
    const hoje = relogio(new Date());
    const aniversario = proximoAniversario(hoje);
    const nova = `v${aniversario.a - nasc.a}.0`;

    // Uma data guardada que já passou deixa de contar
    let escolhida = lerData();
    if (escolhida && diasEntre(hoje, dataISO(escolhida)) < 0) { guardarData(null); escolhida = null; }

    const campo = el("input", { type: "date", id: "data-versao", class: "campo", min: iso(hoje), value: escolhida || iso(aniversario) });
    const repor = el("button", { type: "button", class: "botao botao--secundario botao--pequeno", text: "Back to the birthday" });
    const titulo = el("p", { class: "mar-versao__titulo" });
    const estado = el("p", { class: "mar-versao__estado", role: "status" });
    const m = mostradores([["d", "day"], ["h", "hour"], ["mi", "minute"], ["s", "second"]], "relogio--curto");

    let alvo = aniversario;
    function definir() {
      alvo = campo.value ? dataISO(campo.value) : aniversario;
      const eAniversario = iso(alvo) === iso(aniversario);
      repor.hidden = eAniversario;
      titulo.textContent = eAniversario ? `${nova} ships on ${fmtData(alvo, DATA_LONGA)}` : `Countdown to ${fmtData(alvo, DATA_LONGA)}`;
    }
    function atualizar() {
      // Também no relógio de Lisboa: a contagem chega a zero à meia-noite do dia escolhido
      const agora = relogio(new Date());
      let dias = diasEntre(agora, alvo);
      let seg = -segundosDoDia(agora);
      if (seg < 0) { seg += 86400; dias--; }
      const chegou = dias < 0;
      m.lista.hidden = chegou;
      estado.textContent = chegou && iso(alvo) === iso({ a: agora.a, m: agora.m, d: agora.d }) ? "Today is release day." : "";
      if (chegou) return;
      m.por({ d: dias, h: Math.floor(seg / 3600), mi: Math.floor((seg % 3600) / 60), s: seg % 60 });
    }

    campo.addEventListener("change", () => {
      guardarData(campo.value && campo.value !== iso(aniversario) ? campo.value : null);
      definir();
      atualizar();
    });
    repor.addEventListener("click", () => {
      campo.value = iso(aniversario);
      guardarData(null);
      definir();
      atualizar();
    });
    definir();
    cadaSegundo(atualizar);

    return seccao("proxima", "next-release", "Next release",
      el("div", { class: "mar-versao", "data-revelar": "" },
        titulo,
        m.lista,
        estado,
        el("div", { class: "mar-versao__escolha" },
          el("label", { for: "data-versao", text: "Release date" }),
          campo,
          repor
        )
      )
    );
  }

  // ---------- Crescimento: percentis da OMS ----------

  const Z = [["P3", -1.8807936], ["P15", -1.0364334], ["P50", 0], ["P85", 1.0364334], ["P97", 1.8807936]];
  const DIAS_MES = 30.4375;
  const INDICADORES = [
    { id: "peso", tabela: "wfa", titulo: "Weight-for-age", medida: "Weight", unidade: "kg", restrito: true, valor: (x) => x.peso },
    { id: "altura", tabela: "lhfa", titulo: "Length/height-for-age", medida: "Length/height", unidade: "cm", restrito: false, valor: (x) => x.altura },
    { id: "imc", tabela: "bfa", titulo: "BMI-for-age", medida: "BMI", unidade: "kg/m²", restrito: true, valor: (x) => (x.peso && x.altura ? x.peso / (x.altura / 100) ** 2 : undefined) },
  ];

  let oms = null;
  const lms = (tabela, dia) => {
    const t = oms[tabela];
    const i = Math.round(dia);
    return i >= 0 && i < t.M.length ? { L: t.L[i], M: t.M[i], S: t.S[i] } : null;
  };
  const valorZ = ({ L, M, S }, z) => (Math.abs(L) < 1e-9 ? M * Math.exp(S * z) : M * (1 + L * S * z) ** (1 / L));

  // Escore z pelo método LMS. Nos indicadores de peso, para lá de ±3, a OMS manda medir em passos de 1 DP
  function escoreZ(x, p, restrito) {
    let z = Math.abs(p.L) < 1e-9 ? Math.log(x / p.M) / p.S : ((x / p.M) ** p.L - 1) / (p.L * p.S);
    if (restrito && z > 3) { const sd3 = valorZ(p, 3); z = 3 + (x - sd3) / (sd3 - valorZ(p, 2)); }
    if (restrito && z < -3) { const sd3 = valorZ(p, -3); z = -3 + (x - sd3) / (valorZ(p, -2) - sd3); }
    return z;
  }

  // Distribuição normal acumulada (Abramowitz e Stegun 7.1.26, erro < 2e-7)
  function normal(z) {
    const t = 1 / (1 + (0.3275911 * Math.abs(z)) / Math.SQRT2);
    const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp((-z * z) / 2);
    return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
  }

  function percentil(ind, dia, x) {
    const p = lms(ind.tabela, dia);
    if (!p || !(x > 0)) return null;
    const pc = normal(escoreZ(x, p, ind.restrito)) * 100;
    return pc < 1 ? "<P1" : pc > 99 ? ">P99" : `P${Math.round(pc)}`;
  }

  const fmtValor = (v) => v.toLocaleString("en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  const medicoes = [...dados.medicoes]
    .sort((x, y) => x.data.localeCompare(y.data))
    .map((x) => {
      const data = dataISO(x.data);
      return { ...x, dataObj: data, dia: diasEntre(diaNasc, data), idade: idadeEm(data) };
    });

  // ---------- Gráfico (SVG à mão, redesenhado quando muda a largura) ----------

  const SVG = "http://www.w3.org/2000/svg";
  function s(tag, attrs = {}, ...filhos) {
    const n = document.createElementNS(SVG, tag);
    for (const [k, v] of Object.entries(attrs)) if (v != null) n.setAttribute(k, v);
    n.append(...filhos);
    return n;
  }

  // Passo "redondo" para os valores do eixo: 1, 2, 2.5 ou 5 vezes uma potência de 10
  function passoBonito(bruto) {
    const p = 10 ** Math.floor(Math.log10(bruto));
    return [1, 2, 2.5, 5, 10].map((k) => k * p).find((v) => v >= bruto);
  }

  function marcasX(maxDia) {
    const meses = Math.round(maxDia / DIAS_MES);
    const passo = meses <= 24 ? 3 : 6;
    const marcas = [];
    for (let mes = 0; mes <= meses; mes += passo) {
      marcas.push([mes * DIAS_MES, mes === 0 ? "0" : mes % 12 === 0 ? `${mes / 12}y` : `${mes}m`]);
    }
    return marcas;
  }

  function grafico(ind, maxDia) {
    const pontos = medicoes
      .map((x) => ({ x, v: ind.valor(x) }))
      .filter((p) => p.v > 0 && p.x.dia >= 0 && p.x.dia <= maxDia);
    // Curvas com um ponto por semana; o último cai exatamente no fim do eixo
    const curvas = Z.map(([nome, z]) => {
      const pts = [];
      for (let dia = 0; dia < maxDia; dia += 7) pts.push([dia, valorZ(lms(ind.tabela, dia), z)]);
      pts.push([maxDia, valorZ(lms(ind.tabela, maxDia), z)]);
      return { nome, pts };
    });

    const area = el("div", { class: "grafico__area" });
    const dica = el("div", { class: "grafico__dica", hidden: true });

    let larguraAnterior = 0;
    function desenhar() {
      const W = Math.round(area.clientWidth);
      if (!W || W === larguraAnterior) return;
      larguraAnterior = W;
      const H = Math.round(Math.min(380, Math.max(240, W * 0.58)));
      const mg = { t: 14, r: 40, b: 28, l: 40 };

      const valores = [...curvas[0].pts, ...curvas[4].pts].map((p) => p[1]).concat(pontos.map((p) => p.v));
      const passo = passoBonito((Math.max(...valores) - Math.min(...valores)) / 5);
      const y0 = Math.floor(Math.min(...valores) / passo) * passo;
      const y1 = Math.ceil(Math.max(...valores) / passo) * passo;
      const X = (dia) => mg.l + (dia / maxDia) * (W - mg.l - mg.r);
      const Y = (v) => mg.t + (1 - (v - y0) / (y1 - y0)) * (H - mg.t - mg.b);
      const linha = (pts) => pts.map(([d, v], i) => `${i ? "L" : "M"}${X(d).toFixed(1)},${Y(v).toFixed(1)}`).join("");
      const casas = passo < 1 ? 1 : 0;

      const svg = s("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: "group", "aria-label": `${ind.titulo}: WHO percentile curves and ${pontos.length} measurements` });
      for (let v = y0; v <= y1 + passo / 1000; v += passo) {
        svg.append(
          s("line", { x1: mg.l, x2: W - mg.r, y1: Y(v), y2: Y(v), class: "grafico__grelha" }),
          s("text", { x: mg.l - 8, y: Y(v), class: "grafico__eixo", "text-anchor": "end", "dominant-baseline": "middle" }, v.toFixed(casas))
        );
      }
      for (const [dia, texto] of marcasX(maxDia)) {
        svg.append(s("text", { x: X(dia), y: H - 8, class: "grafico__eixo", "text-anchor": "middle" }, texto));
      }

      // Faixas: P3–P97 muito leve, P15–P85 um pouco mais
      const faixa = (de, ate, classe) => s("path", { d: `${linha(de.pts)}L${linha([...ate.pts].reverse()).slice(1)}Z`, class: classe });
      svg.append(faixa(curvas[0], curvas[4], "grafico__faixa"), faixa(curvas[1], curvas[3], "grafico__faixa grafico__faixa--meio"));
      for (const c of curvas) {
        const [ud, uv] = c.pts.at(-1);
        svg.append(
          s("path", { d: linha(c.pts), class: `grafico__curva grafico__curva--${c.nome.toLowerCase()}` }),
          s("text", { x: X(ud) + 6, y: Y(uv), class: "grafico__etiqueta", "dominant-baseline": "middle" }, c.nome)
        );
      }

      // Os pontos dela, com o último identificado
      if (pontos.length > 1) svg.append(s("path", { d: linha(pontos.map((p) => [p.x.dia, p.v])), class: "grafico__trajeto" }));
      pontos.forEach((p, i) => {
        const cx = X(p.x.dia), cy = Y(p.v);
        const pc = percentil(ind, p.x.dia, p.v);
        const g = s("g", { class: "grafico__ponto", tabindex: 0, role: "img", "aria-label": `${fmtData(p.x.dataObj)}: ${fmtValor(p.v)} ${ind.unidade}${pc ? `, ${pc}` : ""}` },
          s("circle", { cx, cy, r: 14, class: "grafico__alvo" }),
          s("circle", { cx, cy, r: 5, class: "grafico__marca" })
        );
        const mostrar = () => {
          dica.replaceChildren(
            el("strong", { text: `${fmtValor(p.v)} ${ind.unidade}` }),
            el("span", { text: [pc, idadeTexto(p.x.idade)].filter(Boolean).join(" · ") }),
            el("span", { text: fmtData(p.x.dataObj) })
          );
          dica.style.left = `${Math.min(Math.max(cx, 70), W - 70)}px`;
          dica.style.top = `${cy}px`;
          dica.hidden = false;
        };
        const esconder = () => { dica.hidden = true; };
        g.addEventListener("pointerenter", mostrar);
        g.addEventListener("pointerleave", esconder);
        g.addEventListener("focus", mostrar);
        g.addEventListener("blur", esconder);
        svg.append(g);
        if (i === pontos.length - 1) {
          const aDireita = cx < W * 0.7;
          svg.append(s("text", { x: cx + (aDireita ? 10 : -10), y: cy - 12, class: "grafico__ultimo", "text-anchor": aDireita ? "start" : "end" },
            `${fmtValor(p.v)} ${ind.unidade}${pc ? ` · ${pc}` : ""}`));
        }
      });

      area.replaceChildren(svg, dica);
    }
    new ResizeObserver(desenhar).observe(area);

    return el("figure", { class: "grafico", "data-revelar": "" },
      el("figcaption", {},
        el("h3", { text: ind.titulo }),
        el("p", { class: "grafico__sub", text: `${ind.unidade} · WHO Child Growth Standards, girls` })
      ),
      el("ul", { class: "legenda" },
        el("li", {}, el("span", { class: "legenda__linha" }), "WHO percentiles P3–P97"),
        el("li", {}, el("span", { class: "legenda__ponto" }), dados.nome)
      ),
      area,
      pontos.length === 0 && el("p", { class: "grafico__vazio", text: "No measurements logged yet." })
    );
  }

  // Últimas medidas, em destaque
  function ultimas() {
    const itens = INDICADORES.map((ind) => {
      const x = [...medicoes].reverse().find((m) => ind.valor(m) > 0);
      if (!x) return el("li", { class: "medida" }, el("span", { class: "medida__nome", text: ind.medida }), el("span", { class: "medida__valor", text: "—" }));
      const v = ind.valor(x);
      return el("li", { class: "medida" },
        el("span", { class: "medida__nome", text: ind.medida }),
        el("span", { class: "medida__valor" }, fmtValor(v), el("small", { text: ` ${ind.unidade}` })),
        el("span", { class: "medida__pc", text: percentil(ind, x.dia, v) || "outside 0–5 years" }),
        el("span", { class: "medida__data", text: `${fmtData(x.dataObj)} · ${idadeTexto(x.idade)}` })
      );
    });
    escalonar(itens, 60);
    return el("ul", { class: "medidas" }, itens);
  }

  // A tabela: os mesmos valores dos gráficos, sem depender do rato
  function tabela() {
    const cab = ["Date", "Age", "Weight (kg)", "", "Length/height (cm)", "", "BMI", ""];
    const linhas = [...medicoes].reverse().map((x) =>
      el("tr", {},
        el("td", { text: fmtData(x.dataObj) }),
        el("td", { text: idadeTexto(x.idade) }),
        ...INDICADORES.flatMap((ind) => {
          const v = ind.valor(x);
          return [el("td", { text: v > 0 ? fmtValor(v) : "—" }), el("td", { class: "tabela__pc", text: v > 0 ? percentil(ind, x.dia, v) || "—" : "" })];
        })
      )
    );
    return el("details", { class: "mar-tabela", "data-revelar": "" },
      el("summary", { text: `All measurements (${medicoes.length})` }),
      el("div", { class: "mar-tabela__rolo" },
        el("table", {},
          el("thead", {}, el("tr", {}, cab.map((t) => el("th", { scope: "col", text: t })))),
          el("tbody", {}, linhas)
        )
      )
    );
  }

  function crescimento() {
    const corpo = el("div", { class: "mar-crescimento" }, el("p", { class: "texto-suave", text: "Loading the WHO reference curves…" }));
    const sec = seccao("crescimento", "growth-metrics", "Growth metrics",
      el("p", { class: "texto-suave mar-intro", "data-revelar": "", text: "Weight, length/height and BMI against the WHO Child Growth Standards for girls, 0 to 5 years." }),
      corpo
    );
    carregarJSON("oms-raparigas-0-5.json").then((tabelas) => {
      oms = tabelas;
      // Eixo dos 0 meses até meio ano depois de hoje, arredondado ao semestre; no máximo 5 anos
      const hoje = relogio(new Date());
      const mesesHoje = diasEntre(diaNasc, hoje) / DIAS_MES;
      const meses = Math.min(60, Math.max(12, Math.ceil((mesesHoje + 3) / 6) * 6));
      const maxDia = Math.min(oms.wfa.M.length - 1, Math.round(meses * DIAS_MES));
      corpo.replaceChildren(
        ultimas(),
        el("div", { class: "graficos" }, INDICADORES.map((ind) => grafico(ind, maxDia))),
        ...(medicoes.length > 0 ? [tabela()] : [])
      );
      revelar(corpo.querySelectorAll("[data-revelar]"));
    }).catch((erro) => {
      console.error(erro);
      corpo.replaceChildren(el("div", { class: "aviso", text: "The WHO reference curves could not be loaded. Try again in a moment." }));
    });
    return sec;
  }

  // ---------- Changelog: conquistas ----------

  function changelog() {
    const itens = [...dados.conquistas]
      .sort((x, y) => y.data.localeCompare(x.data))
      .map((c) => {
        const data = dataISO(c.data);
        const i = idadeEm(data);
        return el("li", { class: "registo", "data-revelar": "" },
          el("p", { class: "registo__meta" },
            el("span", { class: "registo__versao", text: versao(i) }),
            el("time", { datetime: c.data, text: fmtData(data) }),
            ` · ${idadeTexto(i)}`
          ),
          el("h3", { class: "registo__titulo", text: c.titulo }),
          c.texto && el("p", { class: "registo__texto", text: c.texto })
        );
      });
    return seccao("changelog", "changelog", "Changelog",
      el("p", { class: "texto-suave mar-intro", "data-revelar": "", text: "Milestones, newest first. The version is her age: years.months." }),
      itens.length ? el("ol", { class: "changelog" }, itens) : el("p", { class: "grafico__vazio", "data-revelar": "", text: "No releases logged yet." })
    );
  }

  // ---------- Montagem ----------

  const hoje = relogio(new Date());
  document.querySelector(".mar-topo")?.append(
    el("p", { class: "mar-pill", "data-revelar": "", style: "--atraso: 240ms" }, el("span", { class: "mar-pill__ponto", "aria-hidden": "true" }), `running ${versao(idadeEm(hoje))}`)
  );
  main.append(uptime(), proximaVersao(), crescimento(), changelog());
  revelar(main.querySelectorAll("[data-revelar]"));
})();
