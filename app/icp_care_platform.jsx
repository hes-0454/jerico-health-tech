import React, { useState, useMemo, useEffect } from "react";
import {
  Activity, HeartPulse, Brain, Stethoscope, Home, Building2, Bus,
  AlertTriangle, CheckCircle2, Phone, MapPin, User,
  Sparkles, ArrowRight, ClipboardList, ShieldAlert, CalendarClock, Loader2,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────────────
   인천 동북권 통합돌봄 — AI 기반 통합 케어 경로(ICP) 표준화 플랫폼
   지역 연계형 ICP(Integrated Critical Path) 방법론 프로토타입
   · 입원환자 모니터링 앱  · 퇴원환자 관리 앱
   ──────────────────────────────────────────────────────────────────────── */

const FONT = `'IBM Plex Sans KR', system-ui, sans-serif`;

// 질환별 설정 (3개 질환 + 임상 경로)
const DISEASES = {
  angina:  { key: "angina",  label: "협심증",        path: "cardiac", Icon: HeartPulse, tone: "rose" },
  ami:     { key: "ami",     label: "급성 심근경색", path: "cardiac", Icon: HeartPulse, tone: "rose" },
  stroke:  { key: "stroke",  label: "뇌경색",        path: "cerebro", Icon: Brain,      tone: "violet" },
};

// 표준화된 ICP 5단계 (심장경로·뇌혈관경로 공통 골격)
const ICP_PHASES = [
  { id: 1, label: "급성기",        sub: { cardiac: "PCI·중환자",   cerebro: "재관류·SU" } },
  { id: 2, label: "안정기",        sub: { cardiac: "일반병동",     cerebro: "신경학적 안정" } },
  { id: 3, label: "퇴원·전원 계획", sub: { cardiac: "ADL·가족평가", cerebro: "재활·기능평가" } },
  { id: 4, label: "경로 분기",     sub: { cardiac: "자택/재가/시설", cerebro: "재활/요양/재택" } },
  { id: 5, label: "지역 연계",     sub: { cardiac: "외래·방문연계", cerebro: "회복기 전원" } },
];

// ── 입원환자 (모니터링 대상) ───────────────────────────────────────────────
const INPATIENTS = [
  { id: "in1", name: "김O수", age: 68, sex: "남", region: "계양구 작전동", dx: "ami",
    los: 5, phase: 3, adl: 72, cog: 27, family: "충분", acuity: "중", living: "배우자",
    variance: null, vitals: [120,118,124,121,119,122], hr: 78, spo2: 97 },
  { id: "in2", name: "이O자", age: 79, sex: "여", region: "부평구 산곡동", dx: "stroke",
    los: 9, phase: 3, adl: 38, cog: 19, family: "제한적", acuity: "중", living: "자녀 인근",
    variance: "재활 평가 지연 (+2일)", vitals: [138,142,135,140,144,139], hr: 84, spo2: 96 },
  { id: "in3", name: "박O근", age: 73, sex: "남", region: "계양구 계산동", dx: "angina",
    los: 2, phase: 2, adl: 85, cog: 28, family: "충분", acuity: "낮", living: "배우자",
    variance: null, vitals: [128,126,124,122,121,120], hr: 72, spo2: 98 },
  { id: "in4", name: "정O옥", age: 84, sex: "여", region: "부평구 부개동", dx: "stroke",
    los: 14, phase: 4, adl: 25, cog: 14, family: "없음(독거)", acuity: "높", living: "독거",
    variance: "퇴원 지연 — 시설 입소 대기", vitals: [150,148,152,149,151,147], hr: 90, spo2: 95 },
  { id: "in5", name: "최O호", age: 61, sex: "남", region: "계양구 효성동", dx: "ami",
    los: 3, phase: 2, adl: 80, cog: 29, family: "충분", acuity: "중", living: "배우자·자녀",
    variance: "혈압 변동 관찰", vitals: [134,128,141,130,137,132], hr: 80, spo2: 97 },
];

// ── 퇴원환자 (지역연계·관리 대상) ──────────────────────────────────────────
const DISCHARGED = [
  { id: "dc1", name: "한O례", age: 70, sex: "여", region: "계양구", dx: "stroke",
    days: 12, resource: "홍시요양원 (입소)", rIcon: Building2, coordinator: "연구진 직접 · 홍시",
    adherence: "양호", solo: false, opd: "예정 (D+18)", visit: "주1회 방문간호",
    flags: [] },
  { id: "dc2", name: "오O철", age: 66, sex: "남", region: "부평구", dx: "ami",
    days: 5, resource: "세종병원 외래 + 방문간호", rIcon: Stethoscope, coordinator: "세종병원 사회사업팀",
    adherence: "보통", solo: false, opd: "예정 (D+10)", visit: "주2회 방문간호",
    flags: ["경미한 흉통 호소 1회 (D+3)"] },
  { id: "dc3", name: "윤O순", age: 81, sex: "여", region: "계양구", dx: "stroke",
    days: 25, resource: "SM주간보호센터", rIcon: Bus, coordinator: "연구진 직접 · SM",
    adherence: "양호", solo: false, opd: "완료 (D+21)", visit: "주5회 주간보호",
    flags: [] },
  { id: "dc4", name: "강O배", age: 77, sex: "남", region: "부평구", dx: "angina",
    days: 8, resource: "부평 재가센터 방문요양", rIcon: Home, coordinator: "세종병원 + 연구진",
    adherence: "불량", solo: true, opd: "미정", visit: "주2회 방문요양",
    flags: ["항혈소판제 미수령 (D+6)", "독거 — 응급연락망 불완전"] },
  { id: "dc5", name: "서O경", age: 72, sex: "여", region: "계양구", dx: "ami",
    days: 40, resource: "세종병원 외래 추적", rIcon: Stethoscope, coordinator: "세종병원",
    adherence: "양호", solo: false, opd: "완료 (D+30)", visit: "—",
    flags: [] },
];

/* ── AI 추론 엔진 (IF-THEN → 규칙기반 케어 로직, PDF 3단계 구조) ────────────── */
function recommendPathway(p) {
  const reasons = [];
  let target, ResIcon, tone, confidence;
  const isStroke = DISEASES[p.dx].path === "cerebro";

  if (p.adl >= 78 && p.cog >= 24 && p.family === "충분" && p.acuity !== "높") {
    target = "자택 복귀 + 외래 추적"; ResIcon = Home; tone = "emerald"; confidence = 0.9;
    reasons.push("ADL 자립 수준 양호 (≥78)");
    reasons.push("인지기능 정상 범위 (≥24)");
    reasons.push("가족 지원 충분 — 재택 돌봄 가능");
  } else if (isStroke && p.adl < 55 && p.acuity !== "높" && p.cog >= 15) {
    target = "회복기 재활병원 전원"; ResIcon = Activity; tone = "violet"; confidence = 0.86;
    reasons.push("뇌경색 회복기 — 집중 재활 필요");
    reasons.push(`ADL ${p.adl}점 — 기능 회복 잠재력 존재`);
    reasons.push("급성기 의료필요도 안정화 단계");
  } else if (p.adl < 45 || p.cog < 16 || p.acuity === "높" || p.family === "없음(독거)") {
    target = "요양병원 / 시설 입소"; ResIcon = Building2; tone = "rose"; confidence = 0.83;
    if (p.adl < 45) reasons.push(`ADL ${p.adl}점 — 일상생활 전적 의존`);
    if (p.cog < 16) reasons.push(`인지 ${p.cog}점 — 상시 관찰 필요`);
    if (p.acuity === "높") reasons.push("의료 필요도 높음 — 의료적 관리 지속");
    if (p.family.includes("없음")) reasons.push("주돌봄자 부재 — 재택 돌봄 불가");
  } else {
    target = "방문간호·재가서비스 / 주간보호"; ResIcon = Bus; tone = "amber"; confidence = 0.78;
    reasons.push(`ADL ${p.adl}점 — 부분 지원 필요`);
    reasons.push(p.family === "제한적" ? "가족 지원 제한적 — 재가 보완" : "경증 기능저하 — 통원형 돌봄 적합");
  }
  return { target, ResIcon, tone, confidence, reasons };
}

function readmissionRisk(p) {
  let s = 8; const f = [];
  if (p.adherence === "불량") { s += 32; f.push("약물 순응도 불량"); }
  else if (p.adherence === "보통") { s += 14; f.push("약물 순응도 보통"); }
  if (p.days <= 7) { s += 18; f.push("퇴원 7일 이내 — 조기 고위험 구간"); }
  else if (p.days <= 14) { s += 8; f.push("퇴원 2주 이내"); }
  if (p.dx === "ami") { s += 12; f.push("급성 심근경색 — 재발·합병증 위험군"); }
  if (p.dx === "stroke") { s += 6; f.push("뇌경색 — 기능 악화 모니터링 대상"); }
  if (p.solo) { s += 16; f.push("독거 — 응급 대응 취약"); }
  s += (p.flags?.length || 0) * 10;
  (p.flags || []).forEach((x) => f.push(x));
  s = Math.min(96, s);
  const level = s >= 55 ? "높음" : s >= 30 ? "중간" : "낮음";
  const tone = s >= 55 ? "rose" : s >= 30 ? "amber" : "emerald";
  return { score: Math.round(s), level, tone, factors: f };
}

/* ── 톤 → tailwind 색 매핑 ─────────────────────────────────────────────── */
const TONE = {
  emerald: { text: "text-emerald-700", bg: "bg-emerald-50", ring: "ring-emerald-200", dot: "bg-emerald-500", bar: "bg-emerald-500", soft: "bg-emerald-100" },
  amber:   { text: "text-amber-700",   bg: "bg-amber-50",   ring: "ring-amber-200",   dot: "bg-amber-500",   bar: "bg-amber-500",   soft: "bg-amber-100" },
  rose:    { text: "text-rose-700",    bg: "bg-rose-50",    ring: "ring-rose-200",    dot: "bg-rose-500",    bar: "bg-rose-500",    soft: "bg-rose-100" },
  violet:  { text: "text-violet-700",  bg: "bg-violet-50",  ring: "ring-violet-200",  dot: "bg-violet-500",  bar: "bg-violet-500",  soft: "bg-violet-100" },
  teal:    { text: "text-teal-700",    bg: "bg-teal-50",    ring: "ring-teal-200",    dot: "bg-teal-500",    bar: "bg-teal-500",    soft: "bg-teal-100" },
};

/* ── 작은 UI 원자들 ───────────────────────────────────────────────────── */
function Pill({ tone = "teal", children, icon: Ico }) {
  const t = TONE[tone];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${t.bg} ${t.text}`}>
      {Ico && <Ico className="h-3.5 w-3.5" />}{children}
    </span>
  );
}

function Sparkline({ data, tone = "teal" }) {
  const min = Math.min(...data), max = Math.max(...data), w = 120, h = 34;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const stroke = { teal: "#0d9488", rose: "#e11d48", amber: "#d97706", violet: "#7c3aed", emerald: "#059669" }[tone];
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RiskGauge({ score, tone }) {
  const t = TONE[tone];
  const stroke = { emerald: "#059669", amber: "#d97706", rose: "#e11d48" }[tone];
  const r = 44, c = Math.PI * r, off = c - (score / 100) * c;
  return (
    <div className="relative flex flex-col items-center">
      <svg width="120" height="74" viewBox="0 0 120 74">
        <path d="M14 64 A46 46 0 0 1 106 64" fill="none" stroke="#e7e5e4" strokeWidth="10" strokeLinecap="round" />
        <path d="M14 64 A46 46 0 0 1 106 64" fill="none" stroke={stroke} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} style={{ transition: "stroke-dashoffset .6s ease" }} />
      </svg>
      <div className="-mt-9 text-center">
        <div className={`text-2xl font-bold ${t.text}`}>{score}</div>
        <div className="text-[11px] text-stone-400">/100</div>
      </div>
    </div>
  );
}

/* ── ICP 단계 레일 ────────────────────────────────────────────────────── */
function IcpRail({ phase, path, variance }) {
  return (
    <div className="flex items-stretch gap-1">
      {ICP_PHASES.map((ph, i) => {
        const done = ph.id < phase, cur = ph.id === phase;
        return (
          <div key={ph.id} className="flex-1 min-w-0">
            <div className={`h-1.5 rounded-full ${done ? "bg-teal-500" : cur ? "bg-teal-400" : "bg-stone-200"}`} />
            <div className="mt-1.5 flex items-center gap-1">
              <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold
                ${done ? "bg-teal-500 text-white" : cur ? "bg-teal-100 text-teal-700 ring-2 ring-teal-400" : "bg-stone-100 text-stone-400"}`}>
                {done ? "✓" : ph.id}
              </span>
              <span className={`truncate text-[11px] font-medium ${cur ? "text-teal-700" : done ? "text-stone-600" : "text-stone-400"}`}>{ph.label}</span>
            </div>
            <div className="truncate pl-5 text-[10px] text-stone-400">{ph.sub[path]}</div>
            {cur && variance && (
              <div className="mt-1 ml-5 inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                <AlertTriangle className="h-3 w-3" /> 경로 이탈
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── 측정·평가 막대 ───────────────────────────────────────────────────── */
function Metric({ label, value, max, suffix, tone }) {
  const pct = Math.min(100, (value / max) * 100);
  const t = TONE[tone];
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-stone-500">{label}</span>
        <span className="text-sm font-semibold text-stone-700">{value}<span className="text-[11px] font-normal text-stone-400">{suffix}</span></span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
        <div className={`h-full rounded-full ${t.bar}`} style={{ width: `${pct}%`, transition: "width .5s" }} />
      </div>
    </div>
  );
}

/* ─────────────────────────  입원 모니터링 앱  ───────────────────────────── */
function InpatientApp() {
  const [sel, setSel] = useState(INPATIENTS[1].id);
  const p = INPATIENTS.find((x) => x.id === sel);
  const D = DISEASES[p.dx];
  const rec = recommendPathway(p);
  const recT = TONE[rec.tone];

  const [ai, setAi] = useState({ loading: false, text: "", err: "" });
  async function genPlan() {
    setAi({ loading: true, text: "", err: "" });
    const prompt =
`당신은 인천 동북권 지역 통합돌봄 ICP(통합 케어 경로) 코디네이터입니다. 아래 입원환자의 퇴원·지역연계 케어플랜을 한국어로 작성하세요.
- 환자: ${p.name}, ${p.age}세 ${p.sex}, ${p.region} 거주, 진단 ${D.label}, 재원 ${p.los}일차
- ADL ${p.adl}/100, 인지 ${p.cog}/30, 가족지원 ${p.family}, 의료필요도 ${p.acuity}, 거주형태 ${p.living}
- 시스템 권장 경로: ${rec.target}
형식: ①퇴원 목표, ②권장 연계 자원(부평·계양 지역), ③퇴원 후 4주 모니터링 포인트, ④가족 안내. 각 항목 1~2문장, 굵은 글씨/마크다운 없이 평문으로 간결하게.`;
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await r.json();
      const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
      setAi({ loading: false, text: text || "응답을 받지 못했습니다.", err: "" });
    } catch (e) {
      setAi({ loading: false, text: "", err: "AI 연결에 실패했습니다. 규칙기반 권장 경로를 참고하세요." });
    }
  }
  useEffect(() => { setAi({ loading: false, text: "", err: "" }); }, [sel]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
      {/* 환자 목록 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">재원 환자 {INPATIENTS.length}명</span>
          <Pill tone="teal" icon={Activity}>실시간</Pill>
        </div>
        {INPATIENTS.map((x) => {
          const xd = DISEASES[x.dx], active = x.id === sel;
          return (
            <button key={x.id} onClick={() => setSel(x.id)}
              className={`w-full rounded-xl border p-3 text-left transition ${active ? "border-teal-300 bg-white shadow-sm" : "border-stone-200 bg-white/60 hover:border-stone-300"}`}>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold text-stone-800">
                  <xd.Icon className={`h-4 w-4 ${TONE[xd.tone].text}`} />{x.name}
                </span>
                {x.variance
                  ? <AlertTriangle className="h-4 w-4 text-amber-500" />
                  : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              </div>
              <div className="mt-0.5 text-xs text-stone-500">{x.age}세 {x.sex} · {x.region}</div>
              <div className="mt-1.5 flex items-center gap-2 text-[11px] text-stone-400">
                <span>{xd.label}</span><span>·</span><span>재원 {x.los}일</span><span>·</span><span>ICP {x.phase}단계</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 상세 모니터링 */}
      <div className="space-y-4">
        {/* 헤더 + 바이탈 */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <D.Icon className={`h-5 w-5 ${TONE[D.tone].text}`} />
                <h3 className="text-lg font-bold text-stone-800">{p.name}</h3>
                <Pill tone={D.tone}>{D.label}</Pill>
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-stone-500">
                <span>{p.age}세 {p.sex}</span><span className="text-stone-300">|</span>
                <MapPin className="h-3.5 w-3.5" /><span>{p.region}</span><span className="text-stone-300">|</span>
                <span>거주: {p.living}</span>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-[11px] text-stone-400">수축기 혈압</div>
                <Sparkline data={p.vitals} tone={D.tone} />
                <div className="text-sm font-semibold text-stone-700">{p.vitals.at(-1)} mmHg</div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 self-center text-sm">
                <span className="text-stone-400">심박</span><span className="font-semibold text-stone-700">{p.hr} bpm</span>
                <span className="text-stone-400">SpO₂</span><span className="font-semibold text-stone-700">{p.spo2}%</span>
              </div>
            </div>
          </div>

          {/* ICP 레일 */}
          <div className="mt-5 border-t border-stone-100 pt-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-stone-500">
              <ClipboardList className="h-4 w-4" /> 통합 케어 경로(ICP) — {D.path === "cardiac" ? "심장경로" : "뇌혈관경로"}
            </div>
            <IcpRail phase={p.phase} path={D.path} variance={p.variance} />
            {p.variance && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0" /> <span className="font-medium">경로 변이(Variance):</span> {p.variance}
              </div>
            )}
          </div>
        </div>

        {/* 퇴원준비 평가 + AI 권장 경로 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-stone-700">
              <Stethoscope className="h-4 w-4 text-teal-600" /> 퇴원 준비도 평가
            </div>
            <div className="space-y-3.5">
              <Metric label="ADL (일상생활 수행)" value={p.adl} max={100} suffix="/100" tone={p.adl >= 70 ? "emerald" : p.adl >= 45 ? "amber" : "rose"} />
              <Metric label="인지기능 (MMSE)" value={p.cog} max={30} suffix="/30" tone={p.cog >= 24 ? "emerald" : p.cog >= 16 ? "amber" : "rose"} />
              <div className="flex items-center justify-between border-t border-stone-100 pt-3 text-sm">
                <span className="text-stone-500">가족 지원</span>
                <Pill tone={p.family === "충분" ? "emerald" : p.family === "제한적" ? "amber" : "rose"}>{p.family}</Pill>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500">의료 필요도</span>
                <Pill tone={p.acuity === "낮" ? "emerald" : p.acuity === "중" ? "amber" : "rose"}>{p.acuity}</Pill>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl border p-5 ${recT.ring} ring-1 ${recT.bg}`}>
            <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-stone-700">
              <Sparkles className="h-4 w-4 text-teal-600" /> AI 권장 퇴원 경로
            </div>
            <div className="mb-3 text-[11px] text-stone-400">규칙기반 추론 · 신뢰도 {(rec.confidence * 100).toFixed(0)}%</div>
            <div className={`flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2.5`}>
              <rec.ResIcon className={`h-5 w-5 ${recT.text}`} />
              <span className={`font-bold ${recT.text}`}>{rec.target}</span>
            </div>
            <ul className="mt-3 space-y-1.5">
              {rec.reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-stone-600">
                  <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-stone-400" />{r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* AI 케어플랜 생성 */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-stone-700">
              <Sparkles className="h-4 w-4 text-teal-600" /> AI 케어플랜 생성
            </div>
            <button onClick={genPlan} disabled={ai.loading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-teal-700 disabled:opacity-60">
              {ai.loading ? <><Loader2 className="h-4 w-4 animate-spin" /> 생성 중…</> : <>퇴원 케어플랜 생성</>}
            </button>
          </div>
          {ai.err && <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{ai.err}</div>}
          {ai.text && (
            <div className="mt-3 whitespace-pre-wrap rounded-xl bg-stone-50 p-4 text-sm leading-relaxed text-stone-700">{ai.text}</div>
          )}
          {!ai.text && !ai.err && !ai.loading && (
            <p className="mt-3 text-xs text-stone-400">환자 상태·평가·권장 경로를 바탕으로 4주 모니터링 계획과 가족 안내문을 생성합니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────  퇴원 관리 앱  ──────────────────────────────── */
function DischargeApp() {
  const [sel, setSel] = useState(DISCHARGED[3].id);
  const p = DISCHARGED.find((x) => x.id === sel);
  const D = DISEASES[p.dx];
  const risk = readmissionRisk(p);
  const rT = TONE[risk.tone];
  const Res = p.rIcon;

  // 코호트 요약
  const cohort = useMemo(() => {
    const all = DISCHARGED.map(readmissionRisk);
    return {
      high: all.filter((r) => r.level === "높음").length,
      mid: all.filter((r) => r.level === "중간").length,
      low: all.filter((r) => r.level === "낮음").length,
    };
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
      {/* 목록 */}
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          {[["높음", cohort.high, "rose"], ["중간", cohort.mid, "amber"], ["낮음", cohort.low, "emerald"]].map(([l, n, t]) => (
            <div key={l} className={`rounded-xl ${TONE[t].bg} px-2 py-2 text-center`}>
              <div className={`text-lg font-bold ${TONE[t].text}`}>{n}</div>
              <div className="text-[10px] text-stone-500">위험 {l}</div>
            </div>
          ))}
        </div>
        {DISCHARGED.map((x) => {
          const xr = readmissionRisk(x), xd = DISEASES[x.dx], active = x.id === sel;
          return (
            <button key={x.id} onClick={() => setSel(x.id)}
              className={`w-full rounded-xl border p-3 text-left transition ${active ? "border-teal-300 bg-white shadow-sm" : "border-stone-200 bg-white/60 hover:border-stone-300"}`}>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold text-stone-800">
                  <xd.Icon className={`h-4 w-4 ${TONE[xd.tone].text}`} />{x.name}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${TONE[xr.tone].bg} ${TONE[xr.tone].text}`}>{xr.level} {xr.score}</span>
              </div>
              <div className="mt-0.5 text-xs text-stone-500">{xd.label} · 퇴원 D+{x.days}</div>
              <div className="mt-1 truncate text-[11px] text-stone-400">{x.resource}</div>
            </button>
          );
        })}
      </div>

      {/* 상세 */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <D.Icon className={`h-5 w-5 ${TONE[D.tone].text}`} />
                <h3 className="text-lg font-bold text-stone-800">{p.name}</h3>
                <Pill tone={D.tone}>{D.label}</Pill>
                {p.solo && <Pill tone="amber" icon={User}>독거</Pill>}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-stone-500">
                <span>{p.age}세 {p.sex}</span><span className="text-stone-300">|</span>
                <MapPin className="h-3.5 w-3.5" /><span>{p.region}</span><span className="text-stone-300">|</span>
                <CalendarClock className="h-3.5 w-3.5" /><span>퇴원 후 {p.days}일 경과</span>
              </div>
            </div>
            {/* 재입원 위험 게이지 */}
            <div className="text-center">
              <div className="mb-0.5 text-[11px] font-medium text-stone-400">재입원 위험도</div>
              <RiskGauge score={risk.score} tone={risk.tone} />
              <span className={`mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${rT.bg} ${rT.text}`}>{risk.level}</span>
            </div>
          </div>

          {/* 연계 자원 */}
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-teal-50 px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
              <Res className="h-5 w-5 text-teal-600" />
            </span>
            <div>
              <div className="text-[11px] text-stone-500">지역 연계 자원</div>
              <div className="font-semibold text-stone-800">{p.resource}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-[11px] text-stone-500">코디네이션</div>
              <div className="text-sm font-medium text-stone-600">{p.coordinator}</div>
            </div>
          </div>
        </div>

        {/* 팔로업 현황 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-stone-700">
              <ClipboardList className="h-4 w-4 text-teal-600" /> 사후 관리 현황
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-stone-500">복약 순응도</span>
                <Pill tone={p.adherence === "양호" ? "emerald" : p.adherence === "보통" ? "amber" : "rose"}>{p.adherence}</Pill>
              </div>
              <div className="flex items-center justify-between border-t border-stone-100 pt-3">
                <span className="flex items-center gap-1.5 text-stone-500"><Stethoscope className="h-4 w-4" /> 외래 추적</span>
                <span className="font-medium text-stone-700">{p.opd}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-stone-500"><Home className="h-4 w-4" /> 방문/통원 서비스</span>
                <span className="font-medium text-stone-700">{p.visit}</span>
              </div>
            </div>
          </div>

          {/* 위험 요인 / 이상징후 */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-stone-700">
              <ShieldAlert className="h-4 w-4 text-teal-600" /> AI 위험요인 분석
            </div>
            {risk.factors.length === 0
              ? <div className="flex items-center gap-2 text-sm text-emerald-600"><CheckCircle2 className="h-4 w-4" /> 특이 위험요인 없음 — 안정 추적</div>
              : <ul className="space-y-2">
                  {risk.factors.map((f, i) => {
                    const danger = p.flags.includes(f);
                    return (
                      <li key={i} className={`flex items-start gap-2 rounded-lg px-2.5 py-1.5 text-xs ${danger ? "bg-rose-50 text-rose-700" : "bg-stone-50 text-stone-600"}`}>
                        {danger ? <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-stone-300" />}
                        {f}
                      </li>
                    );
                  })}
                </ul>}
          </div>
        </div>

        {/* 권장 조치 */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-stone-700">
            <Phone className="h-4 w-4 text-teal-600" /> 권장 조치
          </div>
          <div className="flex flex-wrap gap-2">
            {risk.level === "높음" && <>
              <Pill tone="rose" icon={Phone}>48시간 내 사례관리사 직접 연락</Pill>
              <Pill tone="rose" icon={Home}>방문간호 빈도 상향 검토</Pill>
            </>}
            {risk.level === "중간" && <>
              <Pill tone="amber" icon={Phone}>주간 전화 모니터링</Pill>
              <Pill tone="amber" icon={Stethoscope}>예정 외래 일정 확인</Pill>
            </>}
            {risk.level === "낮음" && <Pill tone="emerald" icon={CheckCircle2}>정규 일정 유지 — 월 1회 점검</Pill>}
            {p.solo && <Pill tone="amber" icon={ShieldAlert}>응급연락망·돌봄공백 보완</Pill>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────  루트  ──────────────────────────────────────── */
export default function App() {
  const [tab, setTab] = useState("in");

  useEffect(() => {
    const id = "ibm-plex-kr";
    if (!document.getElementById(id)) {
      const l = document.createElement("link");
      l.id = id; l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@300;400;500;600;700&display=swap";
      document.head.appendChild(l);
    }
  }, []);

  return (
    <div style={{ fontFamily: FONT }} className="min-h-screen bg-stone-100 p-4 text-stone-900 sm:p-6">
      <div className="mx-auto max-w-6xl">
        {/* 헤더 */}
        <header className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white">
                  <Activity className="h-5 w-5" />
                </span>
                <h1 className="text-xl font-bold tracking-tight text-stone-800">인천 동북권 통합돌봄 ICP 플랫폼</h1>
              </div>
              <p className="mt-1 text-sm text-stone-500">지역 연계형 ICP(Integrated Critical Path) 기반 · 부평구·계양구 심뇌혈관 통합 케어 경로</p>
            </div>
            <Pill tone="teal" icon={Sparkles}>AI 기반 표준화 모델 · 프로토타입</Pill>
          </div>

          {/* 앱 전환 탭 */}
          <div className="mt-4 inline-flex rounded-xl border border-stone-200 bg-white p-1">
            <button onClick={() => setTab("in")}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${tab === "in" ? "bg-teal-600 text-white" : "text-stone-500 hover:text-stone-800"}`}>
              <HeartPulse className="h-4 w-4" /> 입원환자 모니터링
            </button>
            <button onClick={() => setTab("dc")}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${tab === "dc" ? "bg-teal-600 text-white" : "text-stone-500 hover:text-stone-800"}`}>
              <Home className="h-4 w-4" /> 퇴원환자 관리
            </button>
          </div>
        </header>

        {tab === "in" ? <InpatientApp /> : <DischargeApp />}

        <footer className="mt-6 border-t border-stone-200 pt-4 text-center text-xs text-stone-400">
          본 화면은 연구용 프로토타입입니다. 환자 정보는 가상 데이터이며, AI 권장 경로는 임상적 의사결정을 대체하지 않습니다.
        </footer>
      </div>
    </div>
  );
}
