import { useState, useEffect, useRef } from "react";

// ─── Data ───
const FRIENDS = [
  { id: 1, name: "민수", addr: "0x1a2b...3c4d", emoji: "😎" },
  { id: 2, name: "지은", addr: "0x5e6f...7g8h", emoji: "💜" },
  { id: 3, name: "현우", addr: "0x9i0j...k1l2", emoji: "🔥" },
  { id: 4, name: "소연", addr: "0x3m4n...o5p6", emoji: "✨" },
  { id: 5, name: "준혁", addr: "0x7q8r...s9t0", emoji: "🎯" },
];

const HISTORY = [
  { id: 1, title: "강남 스시오마카세", total: 320000, members: 4, myShare: 80000, payer: "나", time: "오늘", status: "pending", pending: 2, emoji: "🍣" },
  { id: 2, title: "카페 라떼 4잔", total: 24000, members: 4, myShare: 6000, payer: "민수", time: "어제", status: "paid", pending: 0, emoji: "☕" },
  { id: 3, title: "택시비 홍대→강남", total: 18500, members: 3, myShare: 6167, payer: "나", time: "3일 전", status: "settled", pending: 0, emoji: "🚕" },
  { id: 4, title: "BBQ 치킨 2마리", total: 42000, members: 3, myShare: 14000, payer: "지은", time: "지난주", status: "paid", pending: 0, emoji: "🍗" },
  { id: 5, title: "코엑스 영화 + 팝콘", total: 68000, members: 4, myShare: 17000, payer: "나", time: "지난주", status: "settled", pending: 0, emoji: "🎬" },
];

const krw = (n) => n.toLocaleString("ko-KR");
const usdcRate = 1380;
const toUSDC = (krwAmt) => (krwAmt / usdcRate).toFixed(2);

// ─── Components ───
function AnimNum({ value, decimals = 0, duration = 600 }) {
  const [d, setD] = useState(0);
  const r = useRef();
  useEffect(() => {
    const s = performance.now();
    const run = (t) => {
      const p = Math.min((t - s) / duration, 1);
      setD(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) r.current = requestAnimationFrame(run);
    };
    r.current = requestAnimationFrame(run);
    return () => cancelAnimationFrame(r.current);
  }, [value]);
  return <>{decimals ? d.toFixed(decimals) : krw(Math.round(d))}</>;
}

export default function ArcSplit() {
  const [screen, setScreen] = useState("home");
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [selected, setSelected] = useState([1, 2, 3]);
  const [settling, setSettling] = useState(false);
  const [settled, setSettled] = useState(false);
  const [settleStep, setSettleStep] = useState(0);
  const [viewItem, setViewItem] = useState(null);
  const [payStep, setPayStep] = useState(0);
  const [paying, setPaying] = useState(false);
  const [payDone, setPayDone] = useState(false);

  const perPerson = amount && selected.length > 0 ? Math.ceil(parseFloat(amount) / (selected.length + 1)) : 0;
  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const goHome = () => { setScreen("home"); setViewItem(null); setSettled(false); setSettling(false); setPayDone(false); setPaying(false); };

  const handleCreate = () => {
    setSettling(true); setSettleStep(0);
    setTimeout(() => setSettleStep(1), 500);
    setTimeout(() => setSettleStep(2), 1000);
    setTimeout(() => { setSettling(false); setSettled(true); }, 1600);
  };

  const handlePay = () => {
    setPaying(true); setPayStep(0);
    setTimeout(() => setPayStep(1), 400);
    setTimeout(() => setPayStep(2), 800);
    setTimeout(() => { setPaying(false); setPayDone(true); }, 1300);
  };

  const font = "'Outfit', 'Pretendard', -apple-system, sans-serif";
  const mono = "'IBM Plex Mono', 'SF Mono', monospace";

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(165deg, #F0F4FF 0%, #FAFBFF 30%, #FFF8F0 70%, #F5F0FF 100%)",
      color: "#1a1a2e", fontFamily: font, position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @keyframes popIn { from { opacity:0; transform:scale(.92); } to { opacity:1; transform:scale(1); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(36px); } to { opacity:1; transform:translateY(0); } }
        @keyframes float { 0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)} }
        @keyframes shimmer { 0%{background-position:-200% 0}100%{background-position:200% 0} }
        @keyframes checkDraw { from{stroke-dashoffset:24}to{stroke-dashoffset:0} }
        @keyframes confetti1 { 0%{transform:translate(0,0) rotate(0deg);opacity:1}100%{transform:translate(40px,-80px) rotate(200deg);opacity:0} }
        @keyframes confetti2 { 0%{transform:translate(0,0) rotate(0deg);opacity:1}100%{transform:translate(-30px,-90px) rotate(-180deg);opacity:0} }
        @keyframes confetti3 { 0%{transform:translate(0,0) rotate(0deg);opacity:1}100%{transform:translate(50px,-60px) rotate(150deg);opacity:0} }
        @keyframes pulse { 0%,100%{transform:scale(1)}50%{transform:scale(1.03)} }
        * { box-sizing:border-box; margin:0; padding:0; }
        input:focus { outline:none; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
        input[type=number] { -moz-appearance:textfield; }
      `}</style>

      {/* Decorative blobs */}
      <div style={{ position:"fixed", top:-120, right:-80, width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle, rgba(99,102,241,.08), transparent 70%)", pointerEvents:"none", filter:"blur(40px)" }} />
      <div style={{ position:"fixed", bottom:-100, left:-60, width:250, height:250, borderRadius:"50%", background:"radial-gradient(circle, rgba(251,146,60,.06), transparent 70%)", pointerEvents:"none", filter:"blur(40px)" }} />

      <div style={{ maxWidth:440, margin:"0 auto", padding:"0 20px", position:"relative", zIndex:1 }}>

        {/* ═══ HEADER ═══ */}
        <header style={{ padding:"20px 0 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }} onClick={goHome}>
            <div style={{
              width:36, height:36, borderRadius:12,
              background:"linear-gradient(135deg, #6366F1, #8B5CF6)",
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow:"0 4px 14px rgba(99,102,241,.3)",
            }}>
              <span style={{ fontSize:16, color:"#fff", fontWeight:800 }}>A</span>
            </div>
            <div>
              <div style={{ fontSize:18, fontWeight:800, letterSpacing:"-.03em", color:"#1a1a2e" }}>ArcSplit</div>
              <div style={{ fontSize:9, color:"#94a3b8", fontWeight:600, letterSpacing:".14em" }}>WEB3 BILL SPLITTING</div>
            </div>
          </div>
          <div style={{
            display:"flex", alignItems:"center", gap:6, padding:"6px 12px",
            borderRadius:20, background:"rgba(99,102,241,.08)",
          }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e" }} />
            <span style={{ fontSize:11, fontWeight:600, color:"#6366F1" }}>Arc Mainnet</span>
          </div>
        </header>

        {/* ═══ HOME ═══ */}
        {screen === "home" && (
          <div style={{ animation:"fadeUp .45s ease", paddingBottom:100 }}>

            {/* Balance Card */}
            <div style={{
              marginTop:8, padding:"28px 24px", borderRadius:24,
              background:"linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A78BFA 100%)",
              color:"#fff", position:"relative", overflow:"hidden",
              boxShadow:"0 12px 40px rgba(99,102,241,.25)",
            }}>
              <div style={{ position:"absolute", top:-30, right:-30, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,.08)" }} />
              <div style={{ position:"absolute", bottom:-20, left:-20, width:80, height:80, borderRadius:"50%", background:"rgba(255,255,255,.05)" }} />
              <div style={{ position:"relative", zIndex:1 }}>
                <div style={{ fontSize:12, fontWeight:500, opacity:.8, marginBottom:6 }}>내 잔액</div>
                <div style={{ fontSize:36, fontWeight:800, letterSpacing:"-.03em", marginBottom:2 }}>
                  $<AnimNum value={1247.50} decimals={2} />
                </div>
                <div style={{ fontSize:12, fontWeight:500, opacity:.6, fontFamily:mono }}>USDC on Arc</div>
                <div style={{
                  display:"inline-flex", alignItems:"center", gap:6,
                  marginTop:16, padding:"8px 14px", borderRadius:12,
                  background:"rgba(255,255,255,.15)", backdropFilter:"blur(10px)",
                }}>
                  <span style={{ fontSize:11, fontWeight:600 }}>가스비 ~$0.001</span>
                  <span style={{ fontSize:10, opacity:.7 }}>USDC로 결제</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{ display:"flex", gap:10, marginTop:18 }}>
              {[
                { label:"받을 돈", val:"₩160,000", color:"#6366F1", bg:"rgba(99,102,241,.06)" },
                { label:"보낼 돈", val:"₩0", color:"#f97316", bg:"rgba(249,115,22,.06)" },
              ].map((s,i) => (
                <div key={i} style={{
                  flex:1, padding:"16px", borderRadius:18,
                  background:s.bg, border:`1px solid ${s.color}15`,
                  animation:`fadeUp .4s ease ${.08*(i+1)}s both`,
                }}>
                  <div style={{ fontSize:11, fontWeight:600, color:"#94a3b8", marginBottom:4 }}>{s.label}</div>
                  <div style={{ fontSize:20, fontWeight:800, color:s.color, fontFamily:mono, letterSpacing:"-.02em" }}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* New Split Button */}
            <button onClick={() => { setScreen("create"); setAmount(""); setTitle(""); setSelected([1,2,3]); setSettled(false); }}
              style={{
                width:"100%", marginTop:18, padding:"18px", borderRadius:18,
                border:"none", cursor:"pointer",
                background:"linear-gradient(135deg, #6366F1, #8B5CF6)",
                color:"#fff", fontSize:16, fontWeight:700, fontFamily:font,
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                boxShadow:"0 6px 24px rgba(99,102,241,.3)",
                transition:"all .2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 10px 32px rgba(99,102,241,.35)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="0 6px 24px rgba(99,102,241,.3)"; }}
            >
              <span style={{ fontSize:20 }}>＋</span> 새 더치페이
            </button>

            {/* History */}
            <div style={{ marginTop:28 }}>
              <h3 style={{ fontSize:13, fontWeight:700, color:"#94a3b8", letterSpacing:".04em", marginBottom:14 }}>최근 정산</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {HISTORY.map((h, i) => (
                  <div key={h.id}
                    onClick={() => { if (h.status === "pending") { setViewItem(h); setScreen("view"); } }}
                    style={{
                      padding:"16px 18px", borderRadius:18,
                      background:"rgba(255,255,255,.7)", backdropFilter:"blur(10px)",
                      border:"1px solid rgba(255,255,255,.8)",
                      boxShadow:"0 2px 12px rgba(0,0,0,.03)",
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      cursor: h.status === "pending" ? "pointer" : "default",
                      animation:`fadeUp .35s ease ${.04*i}s both`,
                      transition:"all .2s",
                    }}
                    onMouseEnter={e => { if(h.status==="pending") e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,.06)"; }}
                    onMouseLeave={e => e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,.03)"}
                  >
                    <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                      <div style={{
                        width:44, height:44, borderRadius:14,
                        background: h.status === "pending" ? "rgba(99,102,241,.08)" : "rgba(0,0,0,.03)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:22,
                      }}>{h.emoji}</div>
                      <div>
                        <div style={{ fontSize:14, fontWeight:600, color:"#1a1a2e" }}>{h.title}</div>
                        <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>
                          {h.payer === "나" ? "내가 결제" : `${h.payer}님 결제`} · {h.members}명 · {h.time}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:15, fontWeight:700, fontFamily:mono, color:"#1a1a2e" }}>
                        ₩{krw(h.myShare)}
                      </div>
                      <div style={{
                        fontSize:10, fontWeight:600, marginTop:2,
                        color: h.status === "pending" ? "#f97316" : h.status === "paid" ? "#6366F1" : "#22c55e",
                      }}>
                        {h.status === "pending" ? `${h.pending}명 미정산` : h.status === "paid" ? "결제 완료" : "정산 완료"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Arc Badge */}
            <div style={{
              marginTop:24, padding:"16px 20px", borderRadius:16,
              background:"rgba(255,255,255,.5)", border:"1px solid rgba(99,102,241,.08)",
              display:"flex", alignItems:"center", gap:14,
            }}>
              <div style={{ fontSize:24 }}>⚡</div>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:"#6366F1" }}>왜 ArcSplit?</div>
                <div style={{ fontSize:11, color:"#64748b", lineHeight:1.5, marginTop:2 }}>
                  USDC만 있으면 가스비 걱정 없이 즉시 정산. 별도 ETH 불필요.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ CREATE ═══ */}
        {screen === "create" && !settled && (
          <div style={{ animation:"fadeUp .4s ease", paddingBottom:40 }}>
            <button onClick={goHome} style={{ marginTop:16, background:"none", border:"none", color:"#94a3b8", fontSize:14, cursor:"pointer", fontFamily:font, fontWeight:500, display:"flex", alignItems:"center", gap:4 }}>
              ← 뒤로
            </button>

            <h2 style={{ fontSize:24, fontWeight:800, marginTop:14, letterSpacing:"-.03em" }}>새 더치페이 🧾</h2>
            <p style={{ fontSize:13, color:"#94a3b8", marginTop:4 }}>결제 내역을 입력하고 친구들에게 요청하세요</p>

            {/* Title */}
            <div style={{ marginTop:24 }}>
              <label style={{ fontSize:11, fontWeight:700, color:"#94a3b8", letterSpacing:".06em", marginBottom:8, display:"block" }}>어디서 결제했나요?</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 강남 스시오마카세 🍣"
                style={{
                  width:"100%", padding:"16px 18px", borderRadius:16,
                  background:"rgba(255,255,255,.8)", border:"1.5px solid rgba(0,0,0,.06)",
                  color:"#1a1a2e", fontSize:15, fontWeight:500, fontFamily:font,
                  boxShadow:"0 2px 8px rgba(0,0,0,.02)",
                  transition:"border-color .2s, box-shadow .2s",
                }}
                onFocus={e => { e.target.style.borderColor="rgba(99,102,241,.4)"; e.target.style.boxShadow="0 4px 16px rgba(99,102,241,.08)"; }}
                onBlur={e => { e.target.style.borderColor="rgba(0,0,0,.06)"; e.target.style.boxShadow="0 2px 8px rgba(0,0,0,.02)"; }}
              />
            </div>

            {/* Amount */}
            <div style={{ marginTop:18 }}>
              <label style={{ fontSize:11, fontWeight:700, color:"#94a3b8", letterSpacing:".06em", marginBottom:8, display:"block" }}>총 결제 금액</label>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:18, top:"50%", transform:"translateY(-50%)", fontSize:20, fontWeight:800, color:"#6366F1" }}>₩</span>
                <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="0"
                  style={{
                    width:"100%", padding:"20px 18px 20px 44px", borderRadius:18,
                    background:"rgba(255,255,255,.8)", border:"1.5px solid rgba(0,0,0,.06)",
                    color:"#1a1a2e", fontSize:28, fontWeight:800, fontFamily:mono,
                    boxShadow:"0 2px 8px rgba(0,0,0,.02)",
                    transition:"border-color .2s, box-shadow .2s",
                  }}
                  onFocus={e => { e.target.style.borderColor="rgba(99,102,241,.4)"; e.target.style.boxShadow="0 4px 16px rgba(99,102,241,.08)"; }}
                  onBlur={e => { e.target.style.borderColor="rgba(0,0,0,.06)"; e.target.style.boxShadow="0 2px 8px rgba(0,0,0,.02)"; }}
                />
              </div>
              {amount && (
                <div style={{ fontSize:12, color:"#94a3b8", marginTop:6, fontFamily:mono, animation:"fadeUp .3s ease" }}>
                  ≈ ${toUSDC(parseFloat(amount))} USDC
                </div>
              )}
            </div>

            {/* Quick amounts */}
            <div style={{ display:"flex", gap:8, marginTop:10 }}>
              {["30000","50000","100000","200000"].map(v => (
                <button key={v} onClick={() => setAmount(v)} style={{
                  flex:1, padding:"10px 0", borderRadius:12, border:"none", cursor:"pointer",
                  background: amount === v ? "rgba(99,102,241,.1)" : "rgba(0,0,0,.02)",
                  color: amount === v ? "#6366F1" : "#94a3b8",
                  fontSize:12, fontWeight:600, fontFamily:mono, transition:"all .15s",
                }}>₩{krw(parseInt(v))}</button>
              ))}
            </div>

            {/* Members */}
            <div style={{ marginTop:24 }}>
              <label style={{ fontSize:11, fontWeight:700, color:"#94a3b8", letterSpacing:".06em", marginBottom:10, display:"block" }}>
                함께한 친구 (나 포함 {selected.length + 1}명)
              </label>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {/* Me (always selected) */}
                <div style={{
                  padding:"12px 16px", borderRadius:14,
                  background:"rgba(99,102,241,.06)", border:"1.5px solid rgba(99,102,241,.15)",
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{
                      width:36, height:36, borderRadius:12,
                      background:"linear-gradient(135deg, #6366F1, #8B5CF6)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:16,
                    }}>🙋</div>
                    <div>
                      <span style={{ fontSize:14, fontWeight:600 }}>나 (결제자)</span>
                      <div style={{ fontSize:10, color:"#94a3b8", fontFamily:mono }}>0xMyWa...llet</div>
                    </div>
                  </div>
                  <div style={{
                    padding:"4px 10px", borderRadius:8,
                    background:"rgba(99,102,241,.12)", color:"#6366F1",
                    fontSize:10, fontWeight:700,
                  }}>결제자</div>
                </div>

                {FRIENDS.map(f => {
                  const sel = selected.includes(f.id);
                  return (
                    <button key={f.id} onClick={() => toggle(f.id)} style={{
                      padding:"12px 16px", borderRadius:14,
                      background: sel ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.4)",
                      border: `1.5px solid ${sel ? "rgba(99,102,241,.2)" : "rgba(0,0,0,.04)"}`,
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      cursor:"pointer", transition:"all .2s", textAlign:"left",
                    }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{
                          width:36, height:36, borderRadius:12,
                          background: sel ? "rgba(99,102,241,.08)" : "rgba(0,0,0,.03)",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:16, transition:"all .2s",
                        }}>{f.emoji}</div>
                        <div>
                          <span style={{ fontSize:14, fontWeight:600, color: sel ? "#1a1a2e" : "#94a3b8" }}>{f.name}</span>
                          <div style={{ fontSize:10, color:"#94a3b8", fontFamily:mono }}>{f.addr}</div>
                        </div>
                      </div>
                      <div style={{
                        width:22, height:22, borderRadius:7,
                        border: `2px solid ${sel ? "#6366F1" : "#d1d5db"}`,
                        background: sel ? "#6366F1" : "transparent",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        transition:"all .2s",
                      }}>
                        {sel && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Split Preview */}
            {amount && selected.length > 0 && (
              <div style={{
                marginTop:20, padding:"20px", borderRadius:20,
                background:"rgba(255,255,255,.85)", backdropFilter:"blur(12px)",
                border:"1px solid rgba(99,102,241,.1)",
                boxShadow:"0 4px 20px rgba(99,102,241,.06)",
                animation:"popIn .3s ease",
              }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
                  <div>
                    <div style={{ fontSize:11, fontWeight:600, color:"#94a3b8" }}>1인당</div>
                    <div style={{ fontSize:30, fontWeight:800, color:"#6366F1", letterSpacing:"-.03em", marginTop:2 }}>
                      ₩<AnimNum value={perPerson} />
                    </div>
                    <div style={{ fontSize:12, color:"#94a3b8", fontFamily:mono, marginTop:2 }}>
                      ≈ ${toUSDC(perPerson)} USDC
                    </div>
                  </div>
                  <div style={{
                    padding:"10px 14px", borderRadius:12,
                    background:"rgba(34,197,94,.06)", border:"1px solid rgba(34,197,94,.1)",
                    textAlign:"center",
                  }}>
                    <div style={{ fontSize:10, fontWeight:600, color:"#22c55e" }}>예상 가스비</div>
                    <div style={{ fontSize:16, fontWeight:800, color:"#22c55e", fontFamily:mono }}>$0.001</div>
                    <div style={{ fontSize:9, color:"#22c55e", opacity:.7 }}>USDC 결제</div>
                  </div>
                </div>
              </div>
            )}

            {/* Create Button */}
            <button onClick={handleCreate}
              disabled={!amount || !title || selected.length === 0 || settling}
              style={{
                width:"100%", marginTop:20, marginBottom:20, padding:"18px", borderRadius:18,
                border:"none", cursor: settling ? "wait" : "pointer",
                background: (!amount || !title || selected.length === 0)
                  ? "rgba(0,0,0,.06)" : settling ? "rgba(99,102,241,.4)"
                  : "linear-gradient(135deg, #6366F1, #8B5CF6)",
                color: (!amount || !title || selected.length === 0) ? "#94a3b8" : "#fff",
                fontSize:16, fontWeight:700, fontFamily:font,
                boxShadow: (amount && title && selected.length > 0 && !settling) ? "0 6px 24px rgba(99,102,241,.3)" : "none",
                transition:"all .3s",
              }}>
              {settling ? (
                <div style={{ display:"flex", justifyContent:"center", gap:16, fontSize:12, fontFamily:mono }}>
                  {["생성 중","링크 발행","완료"].map((s,i) => (
                    <span key={i} style={{ opacity: settleStep > i ? 1 : settleStep === i ? .6 : .25, fontWeight: settleStep >= i ? 700 : 400, transition:"all .3s" }}>
                      {settleStep > i ? "✓ " : ""}{s}
                    </span>
                  ))}
                </div>
              ) : "정산 요청 보내기 →"}
            </button>
          </div>
        )}

        {/* ═══ CREATED SUCCESS ═══ */}
        {screen === "create" && settled && (
          <div style={{ animation:"popIn .4s ease", textAlign:"center", paddingTop:50, paddingBottom:40 }}>
            {/* Confetti */}
            <div style={{ position:"relative", display:"inline-block" }}>
              {["🎉","✨","💜"].map((e,i) => (
                <span key={i} style={{
                  position:"absolute", fontSize:16,
                  top: -10, left: i*30 - 15,
                  animation:`confetti${i+1} .8s ease ${.1*i}s both`,
                }}>{e}</span>
              ))}
              <div style={{
                width:72, height:72, borderRadius:22,
                background:"linear-gradient(135deg, #6366F1, #8B5CF6)",
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:"0 12px 40px rgba(99,102,241,.3)",
                animation:"float 3s ease-in-out infinite",
              }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" style={{ strokeDasharray:24, animation:"checkDraw .5s ease .3s both" }} />
                </svg>
              </div>
            </div>

            <h2 style={{ fontSize:24, fontWeight:800, marginTop:24, letterSpacing:"-.02em" }}>정산 요청 완료! 🎉</h2>
            <p style={{ fontSize:14, color:"#64748b", marginTop:6 }}>
              {selected.length}명에게 결제 요청 링크가 전송되었어요
            </p>

            {/* Receipt */}
            <div style={{
              marginTop:28, padding:"22px", borderRadius:20, textAlign:"left",
              background:"rgba(255,255,255,.85)", backdropFilter:"blur(12px)",
              border:"1px solid rgba(0,0,0,.04)",
              boxShadow:"0 4px 20px rgba(0,0,0,.04)",
            }}>
              <div style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>{title}</div>

              <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px dashed rgba(0,0,0,.06)" }}>
                <span style={{ fontSize:13, color:"#64748b" }}>총 금액</span>
                <span style={{ fontSize:14, fontWeight:700, fontFamily:mono }}>₩{krw(parseInt(amount))}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px dashed rgba(0,0,0,.06)" }}>
                <span style={{ fontSize:13, color:"#64748b" }}>인원</span>
                <span style={{ fontSize:14, fontWeight:600 }}>{selected.length + 1}명</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px dashed rgba(0,0,0,.06)" }}>
                <span style={{ fontSize:13, color:"#64748b" }}>1인당</span>
                <span style={{ fontSize:14, fontWeight:700, color:"#6366F1", fontFamily:mono }}>₩{krw(perPerson)}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 0" }}>
                <span style={{ fontSize:13, color:"#64748b" }}>USDC 환산</span>
                <span style={{ fontSize:14, fontWeight:600, fontFamily:mono }}>${toUSDC(perPerson)}</span>
              </div>

              {/* Shared Link */}
              <div style={{
                marginTop:16, padding:"14px 16px", borderRadius:14,
                background:"rgba(99,102,241,.04)", border:"1px solid rgba(99,102,241,.08)",
              }}>
                <div style={{ fontSize:10, fontWeight:700, color:"#6366F1", marginBottom:6 }}>공유 링크</div>
                <div style={{
                  padding:"10px 14px", borderRadius:10, background:"rgba(255,255,255,.8)",
                  fontFamily:mono, fontSize:12, color:"#64748b",
                  wordBreak:"break-all",
                }}>
                  https://arcsplit.xyz/s/a7f3d2e8
                </div>
                <div style={{ fontSize:11, color:"#94a3b8", marginTop:8, lineHeight:1.5 }}>
                  이 링크를 친구에게 공유하면, 지갑 연결 후 USDC로 바로 정산할 수 있어요.
                </div>
              </div>

              {/* Tx Info */}
              <div style={{
                marginTop:14, padding:"12px 14px", borderRadius:12,
                background:"rgba(0,0,0,.02)", fontFamily:mono, fontSize:11,
              }}>
                {[
                  { l:"Network", v:"Arc Mainnet", c:"#6366F1" },
                  { l:"Finality", v:"0.34s", c:"#64748b" },
                  { l:"Gas", v:"$0.0006 USDC", c:"#22c55e" },
                ].map((r,i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"3px 0", color:"#94a3b8" }}>
                    <span>{r.l}</span><span style={{ color:r.c, fontWeight:600 }}>{r.v}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={goHome} style={{
              width:"100%", marginTop:20, padding:"16px", borderRadius:16,
              border:"1.5px solid rgba(99,102,241,.15)", background:"transparent",
              color:"#6366F1", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:font,
              transition:"background .2s",
            }}
            onMouseEnter={e => e.target.style.background="rgba(99,102,241,.04)"}
            onMouseLeave={e => e.target.style.background="transparent"}
            >홈으로 돌아가기</button>
          </div>
        )}

        {/* ═══ VIEW PENDING (pay side) ═══ */}
        {screen === "view" && viewItem && (
          <div style={{ animation:"fadeUp .4s ease", paddingBottom:40 }}>
            <button onClick={goHome} style={{ marginTop:16, background:"none", border:"none", color:"#94a3b8", fontSize:14, cursor:"pointer", fontFamily:font, fontWeight:500, display:"flex", alignItems:"center", gap:4 }}>
              ← 뒤로
            </button>

            <div style={{
              marginTop:14, padding:"24px", borderRadius:22,
              background:"rgba(255,255,255,.85)", backdropFilter:"blur(12px)",
              border:"1px solid rgba(0,0,0,.04)",
              boxShadow:"0 6px 24px rgba(0,0,0,.04)",
            }}>
              <div style={{ textAlign:"center", marginBottom:20 }}>
                <div style={{ fontSize:48, marginBottom:8 }}>{viewItem.emoji}</div>
                <h2 style={{ fontSize:22, fontWeight:800, letterSpacing:"-.02em" }}>{viewItem.title}</h2>
                <p style={{ fontSize:13, color:"#94a3b8", marginTop:4 }}>{viewItem.payer === "나" ? "내가 결제" : `${viewItem.payer}님이 결제`} · {viewItem.members}명</p>
              </div>

              <div style={{
                padding:"20px", borderRadius:16,
                background:"linear-gradient(135deg, rgba(99,102,241,.04), rgba(139,92,246,.04))",
                border:"1px solid rgba(99,102,241,.08)",
                textAlign:"center", marginBottom:20,
              }}>
                <div style={{ fontSize:12, fontWeight:600, color:"#94a3b8", marginBottom:4 }}>내 몫</div>
                <div style={{ fontSize:34, fontWeight:800, color:"#6366F1", fontFamily:mono, letterSpacing:"-.03em" }}>
                  ₩{krw(viewItem.myShare)}
                </div>
                <div style={{ fontSize:13, color:"#94a3b8", fontFamily:mono, marginTop:4 }}>
                  ≈ ${toUSDC(viewItem.myShare)} USDC
                </div>
              </div>

              {/* Members Status */}
              <div style={{ marginBottom:18 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", marginBottom:10 }}>정산 현황</div>
                {[
                  { name: "민수", status: "paid", emoji: "😎" },
                  { name: "지은", status: "pending", emoji: "💜" },
                  { name: "현우", status: "pending", emoji: "🔥" },
                ].map((m,i) => (
                  <div key={i} style={{
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    padding:"10px 0", borderBottom: i < 2 ? "1px solid rgba(0,0,0,.04)" : "none",
                  }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:18 }}>{m.emoji}</span>
                      <span style={{ fontSize:14, fontWeight:500 }}>{m.name}</span>
                    </div>
                    <div style={{
                      padding:"4px 10px", borderRadius:8, fontSize:11, fontWeight:700,
                      background: m.status === "paid" ? "rgba(34,197,94,.08)" : "rgba(249,115,22,.08)",
                      color: m.status === "paid" ? "#22c55e" : "#f97316",
                    }}>
                      {m.status === "paid" ? "✓ 완료" : "대기 중"}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pay Button */}
              {!payDone && viewItem.payer !== "나" && (
                <button onClick={handlePay} disabled={paying}
                  style={{
                    width:"100%", padding:"18px", borderRadius:18,
                    border:"none", cursor: paying ? "wait" : "pointer",
                    background: paying ? "rgba(99,102,241,.4)" : "linear-gradient(135deg, #6366F1, #8B5CF6)",
                    color:"#fff", fontSize:16, fontWeight:700, fontFamily:font,
                    boxShadow: paying ? "none" : "0 6px 24px rgba(99,102,241,.3)",
                    transition:"all .3s",
                  }}>
                  {paying ? (
                    <div style={{ display:"flex", justifyContent:"center", gap:14, fontSize:12, fontFamily:mono }}>
                      {["승인","전송","완료"].map((s,i) => (
                        <span key={i} style={{ opacity: payStep > i ? 1 : payStep === i ? .6 : .25, fontWeight: payStep >= i ? 700 : 400, transition:"all .3s" }}>
                          {payStep > i ? "✓ " : ""}{s}
                        </span>
                      ))}
                    </div>
                  ) : `${toUSDC(viewItem.myShare)} USDC 보내기`}
                </button>
              )}

              {payDone && (
                <div style={{ textAlign:"center", padding:"20px", borderRadius:16, background:"rgba(34,197,94,.04)", border:"1px solid rgba(34,197,94,.1)", animation:"popIn .4s ease" }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>✅</div>
                  <div style={{ fontSize:16, fontWeight:700, color:"#22c55e" }}>정산 완료!</div>
                  <div style={{ fontSize:12, color:"#64748b", marginTop:4 }}>0.31초 만에 정산되었어요</div>
                  <div style={{ marginTop:12, padding:"10px", borderRadius:10, background:"rgba(0,0,0,.02)", fontFamily:mono, fontSize:11, color:"#94a3b8", textAlign:"left" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                      <span>Tx</span><span style={{ color:"#6366F1" }}>0xb8c4...f1a2</span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                      <span>Gas</span><span style={{ color:"#22c55e" }}>$0.0004 USDC</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
