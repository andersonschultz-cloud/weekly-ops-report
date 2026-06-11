import { useState, useEffect } from "react";

const COMPONENT = "infraestrutura - aplicações core e crédito";

const DEFAULT_JQL_WEEK = `component = "${COMPONENT}" AND created >= -7d ORDER BY priority ASC, created DESC`;
const DEFAULT_JQL_OPEN  = `component = "${COMPONENT}" AND statusCategory != Done ORDER BY priority ASC, created DESC`;

const PRIORITY_META = {
  Highest: { color: "#FF4444", label: "P1", bg: "#FF444415" },
  High:    { color: "#FF8800", label: "P2", bg: "#FF880015" },
  Medium:  { color: "#F5A623", label: "P3", bg: "#F5A62315" },
  Low:     { color: "#4A90E2", label: "P4", bg: "#4A90E215" },
  Lowest:  { color: "#9B9B9B", label: "P5", bg: "#9B9B9B15" },
};

const STATUS_COLOR = {
  "To Do":        { bg: "#E8ECF0", text: "#44546F" },
  "In Progress":  { bg: "#E6F0FF", text: "#0052CC" },
  "Done":         { bg: "#E3FCEF", text: "#006644" },
  "Closed":       { bg: "#E3FCEF", text: "#006644" },
  "Resolved":     { bg: "#E3FCEF", text: "#006644" },
  "Open":         { bg: "#FFF0E6", text: "#C25100" },
  "Reopened":     { bg: "#FFEBE6", text: "#BF2600" },
};

function getStatusStyle(status) {
  return STATUS_COLOR[status] || { bg: "#F0F0F0", text: "#555" };
}

function getPriority(p) {
  return PRIORITY_META[p] || { color: "#9B9B9B", label: p || "—", bg: "#9B9B9B15" };
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function weekRange() {
  const now = new Date();
  const day = now.getDay();
  const diffMon = (day === 0 ? -6 : 1 - day);
  const mon = new Date(now); mon.setDate(now.getDate() + diffMon);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const fmt = d => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return `${fmt(mon)} – ${fmt(sun)}`;
}

// ── Mock data fallback ──────────────────────────────────────────────────────
const MOCK_ISSUES = [
  { key:"INC-1042", summary:"Indisponibilidade no serviço de crédito consignado – integração INSS timeout", priority:"Highest", status:"Done", created:"2025-06-03T08:14:00", updated:"2025-06-03T11:42:00", issueType:"Incident", assignee:"Carlos M." },
  { key:"INC-1038", summary:"Lentidão no processamento de propostas – pool de conexões Oracle esgotado", priority:"High", status:"Done", created:"2025-06-02T14:20:00", updated:"2025-06-04T09:10:00", issueType:"Incident", assignee:"Ana P." },
  { key:"EVT-0892", summary:"Deploy emergencial OSB – patch CVE-2025-1234 aplicado em produção", priority:"High", status:"Done", created:"2025-06-04T22:00:00", updated:"2025-06-04T23:45:00", issueType:"Change", assignee:"Schultz" },
  { key:"INC-1051", summary:"Falha intermitente no HAProxy – health check da aplicação de crédito falhando", priority:"High", status:"In Progress", created:"2025-06-05T10:30:00", updated:"2025-06-09T17:00:00", issueType:"Incident", assignee:"Schultz" },
  { key:"EVT-0897", summary:"Janela de manutenção banco Oracle – upgrade 19.22 RU aplicado", priority:"Medium", status:"Done", created:"2025-06-01T00:00:00", updated:"2025-06-01T04:30:00", issueType:"Change", assignee:"DBA Team" },
  { key:"INC-1055", summary:"Alertas Dynatrace – memória JVM acima de 85% no cluster Wildfly produção", priority:"Medium", status:"Open", created:"2025-06-06T09:00:00", updated:"2025-06-09T08:15:00", issueType:"Problem", assignee:"Lucas F." },
  { key:"INC-1058", summary:"Reprocessamento de lote de crédito rural – falha no job agendado sexta-feira", priority:"Medium", status:"Open", created:"2025-06-07T06:45:00", updated:"2025-06-09T12:00:00", issueType:"Incident", assignee:"Ana P." },
  { key:"EVT-0901", summary:"Atualização de certificado SSL expirado – ambiente de homologação core banking", priority:"Low", status:"Done", created:"2025-06-03T15:00:00", updated:"2025-06-03T16:30:00", issueType:"Task", assignee:"Schultz" },
];

// ── Components ──────────────────────────────────────────────────────────────
function Badge({ text, bg, color }) {
  return (
    <span style={{ display:"inline-block", padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:600, background:bg, color, letterSpacing:"0.3px" }}>
      {text}
    </span>
  );
}

function IssueRow({ issue, jiraBase }) {
  const pri = getPriority(issue.priority);
  const st  = getStatusStyle(issue.status);
  const url = jiraBase ? `${jiraBase}/browse/${issue.key}` : "#";
  return (
    <tr style={{ borderBottom:"1px solid #F0F2F5" }}>
      <td style={{ padding:"10px 12px", whiteSpace:"nowrap" }}>
        <a href={url} target="_blank" rel="noreferrer"
           style={{ fontFamily:"'Roboto Mono',monospace", fontSize:12, color:"#0052CC", fontWeight:600, textDecoration:"none" }}>
          {issue.key}
        </a>
      </td>
      <td style={{ padding:"10px 12px", fontSize:13, color:"#172B4D", lineHeight:1.4, maxWidth:340 }}>
        {issue.summary}
      </td>
      <td style={{ padding:"10px 12px", textAlign:"center" }}>
        <span title={issue.priority} style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 8px", borderRadius:4, background:pri.bg, color:pri.color, fontSize:11, fontWeight:700 }}>
          {pri.label}
        </span>
      </td>
      <td style={{ padding:"10px 12px", textAlign:"center" }}>
        <Badge text={issue.status} bg={st.bg} color={st.text} />
      </td>
      <td style={{ padding:"10px 12px", fontSize:12, color:"#6B778C", whiteSpace:"nowrap" }}>
        {issue.issueType || "—"}
      </td>
      <td style={{ padding:"10px 12px", fontSize:12, color:"#6B778C", whiteSpace:"nowrap" }}>
        {issue.assignee || "—"}
      </td>
      <td style={{ padding:"10px 12px", fontSize:11, color:"#6B778C", whiteSpace:"nowrap" }}>
        {formatDate(issue.created)}
      </td>
      <td style={{ padding:"10px 12px", fontSize:11, color:"#6B778C", whiteSpace:"nowrap" }}>
        {formatDate(issue.updated)}
      </td>
    </tr>
  );
}

function SummaryCard({ label, value, color, sub }) {
  return (
    <div style={{ background:"#FFF", border:`2px solid ${color}20`, borderTop:`3px solid ${color}`, borderRadius:8, padding:"14px 20px", minWidth:120, flex:1 }}>
      <div style={{ fontSize:28, fontWeight:800, color, fontFamily:"'Inter','Segoe UI',sans-serif", lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:12, color:"#44546F", fontWeight:600, marginTop:4 }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:"#8993A4", marginTop:2 }}>{sub}</div>}
    </div>
  );
}

function IssueTable({ issues, jiraBase, emptyMsg }) {
  if (!issues.length) return <div style={{ textAlign:"center", color:"#8993A4", padding:"32px 0", fontSize:13 }}>{emptyMsg}</div>;
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
        <thead>
          <tr style={{ background:"#F4F5F7", color:"#44546F", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px" }}>
            {["Chamado","Descrição","Prior.","Status","Tipo","Responsável","Criado","Atualizado"].map(h => (
              <th key={h} style={{ padding:"8px 12px", textAlign:"left", whiteSpace:"nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {issues.map(i => <IssueRow key={i.key} issue={i} jiraBase={jiraBase} />)}
        </tbody>
      </table>
    </div>
  );
}

// ── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [jiraBase,   setJiraBase]   = useState("https://jira.sicredi.net");
  const [jiraToken,  setJiraToken]  = useState("");
  const [jqlWeek,    setJqlWeek]    = useState(DEFAULT_JQL_WEEK);
  const [jqlOpen,    setJqlOpen]    = useState(DEFAULT_JQL_OPEN);
  const [weekIssues, setWeekIssues] = useState([]);
  const [openIssues, setOpenIssues] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [useMock,    setUseMock]    = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [activeTab,  setActiveTab]  = useState("semana");
  const [notes,      setNotes]      = useState("");
  const [lastFetch,  setLastFetch]  = useState(null);

  function parseMock() {
    const week = MOCK_ISSUES;
    const open = MOCK_ISSUES.filter(i => !["Done","Closed","Resolved"].includes(i.status));
    setWeekIssues(week);
    setOpenIssues(open);
    setLastFetch(new Date().toLocaleTimeString("pt-BR"));
    setError(null);
  }

  async function fetchJira(jql) {
    const url = `${jiraBase}/rest/api/2/search?jql=${encodeURIComponent(jql)}&maxResults=50&fields=summary,priority,status,issuetype,assignee,created,updated`;
    const headers = { "Content-Type": "application/json" };
    if (jiraToken) headers["Authorization"] = `Bearer ${jiraToken}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`Jira respondeu ${res.status}: ${res.statusText}`);
    const data = await res.json();
    return (data.issues || []).map(i => ({
      key:       i.key,
      summary:   i.fields.summary,
      priority:  i.fields.priority?.name,
      status:    i.fields.status?.name,
      issueType: i.fields.issuetype?.name,
      assignee:  i.fields.assignee?.displayName,
      created:   i.fields.created,
      updated:   i.fields.updated,
    }));
  }

  async function loadData() {
    if (useMock) { parseMock(); return; }
    setLoading(true); setError(null);
    try {
      const [w, o] = await Promise.all([fetchJira(jqlWeek), fetchJira(jqlOpen)]);
      setWeekIssues(w); setOpenIssues(o);
      setLastFetch(new Date().toLocaleTimeString("pt-BR"));
    } catch(e) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  useEffect(() => { parseMock(); }, []);

  // ── derived stats ──
  const incidents = weekIssues.filter(i => i.issueType === "Incident");
  const p1p2      = weekIssues.filter(i => ["Highest","High"].includes(i.priority));
  const changes   = weekIssues.filter(i => ["Change","Task"].includes(i.issueType));

  const TAB = { semana:"Semana", abertos:"Abertos", notas:"Notas" };

  return (
    <div style={{ fontFamily:"'Inter','Segoe UI',Arial,sans-serif", background:"#F4F5F7", minHeight:"100vh", padding:0 }}>

      {/* ── Header ── */}
      <div style={{ background:"linear-gradient(135deg,#0052CC 0%,#0065FF 100%)", color:"#FFF", padding:"20px 32px 0", boxShadow:"0 2px 8px #0052CC40" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:600, letterSpacing:"1.5px", opacity:0.75, textTransform:"uppercase" }}>Sicredi · SRE & Platform Engineering</div>
            <h1 style={{ margin:"4px 0 2px", fontSize:22, fontWeight:800, letterSpacing:"-0.3px" }}>Weekly Ops Report</h1>
            <div style={{ fontSize:13, opacity:0.8 }}>Semana {weekRange()} · Infraestrutura – Aplicações Core &amp; Crédito</div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center", paddingBottom:4 }}>
            {useMock && <span style={{ fontSize:11, background:"#FF8800", borderRadius:4, padding:"3px 10px", fontWeight:700 }}>DEMO — dados simulados</span>}
            {lastFetch && <span style={{ fontSize:11, opacity:0.7 }}>Atualizado às {lastFetch}</span>}
            <button onClick={() => setShowConfig(!showConfig)}
              style={{ background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.3)", color:"#FFF", borderRadius:6, padding:"6px 14px", fontSize:12, cursor:"pointer", fontWeight:600 }}>
              ⚙ Configurar
            </button>
            <button onClick={loadData} disabled={loading}
              style={{ background:"#FFF", color:"#0052CC", border:"none", borderRadius:6, padding:"6px 16px", fontSize:12, cursor:"pointer", fontWeight:700 }}>
              {loading ? "Buscando…" : "↻ Atualizar"}
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display:"flex", gap:4, marginTop:16 }}>
          {Object.entries(TAB).map(([k,v]) => (
            <button key={k} onClick={() => setActiveTab(k)}
              style={{ padding:"8px 20px", borderRadius:"6px 6px 0 0", border:"none", cursor:"pointer", fontSize:13, fontWeight:600,
                background: activeTab===k ? "#F4F5F7" : "rgba(255,255,255,0.15)",
                color: activeTab===k ? "#0052CC" : "#FFF" }}>
              {v} {k==="semana" ? `(${weekIssues.length})` : k==="abertos" ? `(${openIssues.length})` : ""}
            </button>
          ))}
        </div>
      </div>

      {/* ── Config Panel ── */}
      {showConfig && (
        <div style={{ background:"#FFF", borderBottom:"1px solid #DFE1E6", padding:"16px 32px", display:"flex", flexWrap:"wrap", gap:16, alignItems:"flex-end" }}>
          <label style={{ fontSize:12, fontWeight:600, color:"#44546F" }}>
            Modo<br/>
            <select value={useMock?"mock":"live"} onChange={e => setUseMock(e.target.value==="mock")}
              style={{ marginTop:4, padding:"6px 10px", borderRadius:4, border:"1px solid #C0C7D0", fontSize:13 }}>
              <option value="mock">Demo (mock)</option>
              <option value="live">Jira real</option>
            </select>
          </label>
          <label style={{ fontSize:12, fontWeight:600, color:"#44546F", flex:1, minWidth:200 }}>
            URL Jira<br/>
            <input value={jiraBase} onChange={e=>setJiraBase(e.target.value)}
              style={{ marginTop:4, padding:"6px 10px", borderRadius:4, border:"1px solid #C0C7D0", fontSize:13, width:"100%" }} />
          </label>
          <label style={{ fontSize:12, fontWeight:600, color:"#44546F", flex:1, minWidth:200 }}>
            Token (PAT)<br/>
            <input type="password" value={jiraToken} onChange={e=>setJiraToken(e.target.value)} placeholder="Bearer token"
              style={{ marginTop:4, padding:"6px 10px", borderRadius:4, border:"1px solid #C0C7D0", fontSize:13, width:"100%" }} />
          </label>
          <label style={{ fontSize:12, fontWeight:600, color:"#44546F", flex:2, minWidth:300 }}>
            JQL — Semana<br/>
            <input value={jqlWeek} onChange={e=>setJqlWeek(e.target.value)}
              style={{ marginTop:4, padding:"6px 10px", borderRadius:4, border:"1px solid #C0C7D0", fontSize:12, width:"100%", fontFamily:"monospace" }} />
          </label>
          <label style={{ fontSize:12, fontWeight:600, color:"#44546F", flex:2, minWidth:300 }}>
            JQL — Em aberto<br/>
            <input value={jqlOpen} onChange={e=>setJqlOpen(e.target.value)}
              style={{ marginTop:4, padding:"6px 10px", borderRadius:4, border:"1px solid #C0C7D0", fontSize:12, width:"100%", fontFamily:"monospace" }} />
          </label>
        </div>
      )}

      {error && (
        <div style={{ background:"#FFEBE6", border:"1px solid #FF5630", color:"#BF2600", padding:"10px 32px", fontSize:13 }}>
          ⚠ Erro ao buscar Jira: {error}. Verifique URL, token e se o CORS está liberado.
        </div>
      )}

      <div style={{ padding:"24px 32px", maxWidth:1200 }}>

        {/* ── KPI Cards ── */}
        <div style={{ display:"flex", gap:12, marginBottom:24, flexWrap:"wrap" }}>
          <SummaryCard label="Eventos na semana"  value={weekIssues.length} color="#0052CC" sub="últimos 7 dias" />
          <SummaryCard label="Incidentes"          value={incidents.length}  color="#FF5630" sub={`${p1p2.length} P1/P2`} />
          <SummaryCard label="Mudanças / Tasks"    value={changes.length}    color="#6554C0" sub="deploys e janelas" />
          <SummaryCard label="Em aberto"           value={openIssues.length} color="#FF8B00" sub="necessitam ação" />
          <SummaryCard label="Resolvidos"          value={weekIssues.filter(i=>["Done","Closed","Resolved"].includes(i.status)).length} color="#00875A" sub="na semana" />
        </div>

        {/* ── Tab Content ── */}
        {activeTab === "semana" && (
          <div style={{ background:"#FFF", borderRadius:8, boxShadow:"0 1px 4px #0000000D", overflow:"hidden" }}>
            <div style={{ padding:"16px 20px", borderBottom:"1px solid #F0F2F5", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontWeight:700, fontSize:15, color:"#172B4D" }}>Eventos da Semana</div>
                <div style={{ fontSize:12, color:"#8993A4", marginTop:2, fontFamily:"monospace" }}>{jqlWeek}</div>
              </div>
            </div>
            <IssueTable issues={weekIssues} jiraBase={jiraBase} emptyMsg="Nenhum evento registrado na semana." />
          </div>
        )}

        {activeTab === "abertos" && (
          <div style={{ background:"#FFF", borderRadius:8, boxShadow:"0 1px 4px #0000000D", overflow:"hidden" }}>
            <div style={{ padding:"16px 20px", borderBottom:"1px solid #F0F2F5", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontWeight:700, fontSize:15, color:"#172B4D" }}>Itens em Aberto</div>
                <div style={{ fontSize:12, color:"#8993A4", marginTop:2, fontFamily:"monospace" }}>{jqlOpen}</div>
              </div>
              {openIssues.length > 0 && (
                <span style={{ background:"#FFEBE6", color:"#BF2600", borderRadius:12, padding:"3px 12px", fontSize:12, fontWeight:700 }}>
                  {openIssues.length} pendente{openIssues.length!==1?"s":""}
                </span>
              )}
            </div>
            <IssueTable issues={openIssues} jiraBase={jiraBase} emptyMsg="✅ Nenhum item pendente. Ótimo trabalho!" />
          </div>
        )}

        {activeTab === "notas" && (
          <div style={{ background:"#FFF", borderRadius:8, boxShadow:"0 1px 4px #0000000D", padding:24 }}>
            <div style={{ fontWeight:700, fontSize:15, color:"#172B4D", marginBottom:4 }}>Observações & Contexto para a Reunião</div>
            <div style={{ fontSize:12, color:"#8993A4", marginBottom:12 }}>Adicione aqui highlights, ações decididas ou pontos de atenção para apresentar ao Abe.</div>
            <textarea
              value={notes}
              onChange={e=>setNotes(e.target.value)}
              placeholder={"Ex:\n• Incidente INC-1051 ainda em investigação — possível problema no balanceamento HAProxy\n• Recomendação: revisar threshold de memória JVM no cluster Wildfly\n• Agenda: propor janela de manutenção para Oracle 19.23 na próxima sprint"}
              style={{ width:"100%", minHeight:220, padding:14, borderRadius:6, border:"1px solid #DFE1E6", fontSize:13, color:"#172B4D", lineHeight:1.6, fontFamily:"inherit", resize:"vertical", boxSizing:"border-box", outline:"none" }}
            />
            <div style={{ marginTop:12, display:"flex", gap:10 }}>
              <button
                onClick={() => {
                  const txt = `WEEKLY OPS REPORT — Semana ${weekRange()}\nTime: Infraestrutura – Core & Crédito\n\nRESUMO:\nEventos na semana: ${weekIssues.length} | Incidentes: ${incidents.length} (${p1p2.length} P1/P2) | Em aberto: ${openIssues.length}\n\nITENS EM ABERTO:\n${openIssues.map(i=>`• [${i.key}] ${i.summary} — ${i.status} — ${i.assignee||"N/A"}`).join("\n")}\n\nOBSERVAÇÕES:\n${notes}`;
                  navigator.clipboard.writeText(txt);
                }}
                style={{ background:"#0052CC", color:"#FFF", border:"none", borderRadius:6, padding:"8px 18px", fontSize:13, cursor:"pointer", fontWeight:600 }}>
                📋 Copiar resumo para clipboard
              </button>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{ marginTop:24, fontSize:11, color:"#8993A4", textAlign:"center" }}>
          Sicredi · SRE & Platform Engineering · Infraestrutura Aplicações Core &amp; Crédito · {new Date().toLocaleDateString("pt-BR")}
        </div>
      </div>
    </div>
  );
}