import { useState, useEffect, useRef } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { formatUnits } from "viem";
import { detectLanguage, getTranslations } from "./i18n";
import { walletOptions } from "./wagmi";
import { useExchangeRate } from "./useExchangeRate";
import { useUSDCBalance, useCreateSplit, usePayShare, isContractDeployed } from "./contracts";

const HISTORY_KO = [
  { id: 1, title: "강남 스시오마카세", total: 320000, members: 4, myShare: 80000, payer: "나", time: "오늘", status: "pending", pending: 2, emoji: "🍣" },
  { id: 2, title: "카페 라떼 4잔", total: 24000, members: 4, myShare: 6000, payer: "민수", time: "어제", status: "paid", pending: 0, emoji: "☕" },
  { id: 3, title: "택시비 홍대→강남", total: 18500, members: 3, myShare: 6167, payer: "나", time: "3일 전", status: "settled", pending: 0, emoji: "🚕" },
  { id: 4, title: "BBQ 치킨 2마리", total: 42000, members: 3, myShare: 14000, payer: "지은", time: "지난주", status: "paid", pending: 0, emoji: "🍗" },
];

const HISTORY_EN = [
  { id: 1, title: "Sushi Omakase", total: 232, members: 4, myShare: 58, payer: "me", time: "Today", status: "pending", pending: 2, emoji: "🍣" },
  { id: 2, title: "Cafe Lattes x4", total: 18, members: 4, myShare: 4.5, payer: "Minsu", time: "Yesterday", status: "paid", pending: 0, emoji: "☕" },
  { id: 3, title: "Taxi Ride", total: 13.5, members: 3, myShare: 4.5, payer: "me", time: "3d ago", status: "settled", pending: 0, emoji: "🚕" },
  { id: 4, title: "BBQ Chicken x2", total: 30, members: 3, myShare: 10, payer: "Jieun", time: "Last week", status: "paid", pending: 0, emoji: "🍗" },
];

const fmt = (n, lang) => lang === "ko" ? n.toLocaleString("ko-KR") : n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });

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
  return <>{decimals ? d.toFixed(decimals) : Math.round(d).toLocaleString()}</>;
}

export default function ArcSplit() {
  const [lang, setLang] = useState(detectLanguage);
  const t = getTranslations(lang);
  const HISTORY = lang === "ko" ? HISTORY_KO : HISTORY_EN;
  const { rates } = useExchangeRate();
  const rate = lang === "ko" ? rates.krw : rates.usd;

  const toUSDC = (amt) => (amt / rate).toFixed(2);
  const fmtCurrency = (n) => `${t.currencySymbol}${fmt(n, lang)}`;

  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: usdcRaw } = useUSDCBalance(address);
  const usdcBalance = usdcRaw ? parseFloat(formatUnits(usdcRaw, 6)) : null;
  const contractReady = isConnected && isContractDeployed();

  const { createSplit: createSplitOnChain, isPending: isCreating, isSuccess: createSuccess, hash: createHash } = useCreateSplit();
  const { payShare: payShareOnChain, approveAndPay, isPending: isPaying, isSuccess: paySuccess, hash: payHash } = usePayShare();

  const [showWalletModal, setShowWalletModal] = useState(false);

  const [screen, setScreen] = useState("home");
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [memberCount, setMemberCount] = useState(4);
  const [settling, setSettling] = useState(false);
  const [settled, setSettled] = useState(false);
  const [settleStep, setSettleStep] = useState(0);
  const [viewItem, setViewItem] = useState(null);
  const [payStep, setPayStep] = useState(0);
  const [paying, setPaying] = useState(false);
  const [payDone, setPayDone] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  const perPerson = amount && memberCount > 1 ? Math.ceil(parseFloat(amount) / memberCount) : 0;

  const toggleLang = () => {
    const next = lang === "ko" ? "en" : "ko";
    setLang(next);
    localStorage.setItem("arcsplit-lang", next);
  };

  const goHome = () => {
    setScreen("home");
    setViewItem(null);
    setSettled(false);
    setSettling(false);
    setPayDone(false);
    setPaying(false);
    setLinkCopied(false);
  };

  const handleCreate = () => {
    if (contractReady) {
      const usdcAmount = toUSDC(parseFloat(amount));
      createSplitOnChain(title, usdcAmount, memberCount);
    }
    setSettling(true);
    setSettleStep(0);
    setTimeout(() => setSettleStep(1), 500);
    setTimeout(() => setSettleStep(2), 1000);
    setTimeout(() => { setSettling(false); setSettled(true); }, 1600);
  };

  const handlePay = (splitId, usdcAmount) => {
    if (contractReady && splitId !== undefined) {
      approveAndPay(splitId, usdcAmount);
    }
    setPaying(true);
    setPayStep(0);
    setTimeout(() => setPayStep(1), 400);
    setTimeout(() => setPayStep(2), 800);
    setTimeout(() => { setPaying(false); setPayDone(true); }, 1300);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://arcsplit.xyz/s/a7f3d2e8");
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const font = "'Outfit', 'Pretendard', -apple-system, sans-serif";
  const mono = "'IBM Plex Mono', 'SF Mono', monospace";
  const isMePayer = (h) => h.payer === "나" || h.payer === "me";

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(165deg, #F0F4FF 0%, #FAFBFF 30%, #FFF8F0 70%, #F5F0FF 100%)",
      color: "#1a1a2e", fontFamily: font, position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @keyframes popIn { from { opacity:0; transform:scale(.92); } to { opacity:1; transform:scale(1); } }
        @keyframes float { 0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)} }
        @keyframes checkDraw { from{stroke-dashoffset:24}to{stroke-dashoffset:0} }
        @keyframes confetti1 { 0%{transform:translate(0,0) rotate(0deg);opacity:1}100%{transform:translate(40px,-80px) rotate(200deg);opacity:0} }
        @keyframes confetti2 { 0%{transform:translate(0,0) rotate(0deg);opacity:1}100%{transform:translate(-30px,-90px) rotate(-180deg);opacity:0} }
        @keyframes confetti3 { 0%{transform:translate(0,0) rotate(0deg);opacity:1}100%{transform:translate(50px,-60px) rotate(150deg);opacity:0} }
        * { box-sizing:border-box; margin:0; padding:0; }
        input:focus { outline:none; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
        input[type=number] { -moz-appearance:textfield; }
      `}</style>

      <div style={{ position:"fixed", top:-120, right:-80, width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle, rgba(99,102,241,.08), transparent 70%)", pointerEvents:"none", filter:"blur(40px)" }} />
      <div style={{ position:"fixed", bottom:-100, left:-60, width:250, height:250, borderRadius:"50%", background:"radial-gradient(circle, rgba(251,146,60,.06), transparent 70%)", pointerEvents:"none", filter:"blur(40px)" }} />

      <div style={{ maxWidth: 440, margin: "0 auto", padding: "0 20px", position: "relative", zIndex: 1 }}>

        {/* HEADER */}
        <header style={{ padding: "20px 0 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={goHome}>
            <div style={{
              width: 36, height: 36, borderRadius: 12,
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 14px rgba(99,102,241,.3)",
            }}>
              <span style={{ fontSize: 16, color: "#fff", fontWeight: 800 }}>A</span>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-.03em", color: "#1a1a2e" }}>{t.appName}</div>
              <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 600, letterSpacing: ".14em" }}>{t.tagline}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={toggleLang} style={{
              padding: "6px 10px", borderRadius: 20, border: "1px solid rgba(0,0,0,.06)",
              background: "rgba(255,255,255,.7)", cursor: "pointer", fontSize: 12, fontWeight: 600,
              color: "#64748b", fontFamily: font,
            }}>
              {lang === "ko" ? "EN" : "KR"}
            </button>
            {isConnected ? (
              <button onClick={() => setShowWalletModal(true)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                borderRadius: 20, background: "rgba(34,197,94,.08)", border: "1px solid rgba(34,197,94,.15)",
                cursor: "pointer", fontFamily: font,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "#22c55e", fontFamily: mono }}>{shortAddr}</span>
              </button>
            ) : (
              <button onClick={() => setShowWalletModal(true)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                borderRadius: 20, background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                border: "none", cursor: "pointer", fontFamily: font,
                boxShadow: "0 2px 8px rgba(99,102,241,.25)",
              }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>{t.connectWallet}</span>
              </button>
            )}
          </div>
        </header>

        {/* HOME */}
        {screen === "home" && (
          <div style={{ animation: "fadeUp .45s ease", paddingBottom: 100 }}>
            <div style={{
              marginTop: 8, padding: "28px 24px", borderRadius: 24,
              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A78BFA 100%)",
              color: "#fff", position: "relative", overflow: "hidden",
              boxShadow: "0 12px 40px rgba(99,102,241,.25)",
            }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />
              <div style={{ position: "absolute", bottom: -20, left: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,.05)" }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, opacity: .8, marginBottom: 6 }}>{t.myBalance}</div>
                <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-.03em", marginBottom: 2 }}>
                  $<AnimNum value={usdcBalance ?? 1247.50} decimals={2} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, opacity: .6, fontFamily: mono }}>{t.usdcOnArc}</div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  marginTop: 16, padding: "8px 14px", borderRadius: 12,
                  background: "rgba(255,255,255,.15)", backdropFilter: "blur(10px)",
                }}>
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{t.gasNote}</span>
                  <span style={{ fontSize: 10, opacity: .7 }}>{t.gasUSDC}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              {[
                { label: t.toReceive, val: fmtCurrency(lang === "ko" ? 160000 : 116), color: "#6366F1", bg: "rgba(99,102,241,.06)" },
                { label: t.toSend, val: fmtCurrency(0), color: "#f97316", bg: "rgba(249,115,22,.06)" },
              ].map((s, i) => (
                <div key={i} style={{
                  flex: 1, padding: "16px", borderRadius: 18,
                  background: s.bg, border: `1px solid ${s.color}15`,
                  animation: `fadeUp .4s ease ${.08 * (i + 1)}s both`,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: s.color, fontFamily: mono, letterSpacing: "-.02em" }}>{s.val}</div>
                </div>
              ))}
            </div>

            <button onClick={() => { setScreen("create"); setAmount(""); setTitle(""); setMemberCount(4); setSettled(false); }}
              style={{
                width: "100%", marginTop: 18, padding: "18px", borderRadius: 18,
                border: "none", cursor: "pointer",
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                color: "#fff", fontSize: 16, fontWeight: 700, fontFamily: font,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 6px 24px rgba(99,102,241,.3)",
                transition: "all .2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 32px rgba(99,102,241,.35)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 6px 24px rgba(99,102,241,.3)"; }}
            >
              <span style={{ fontSize: 20 }}>＋</span> {t.newSplit}
            </button>

            <div style={{ marginTop: 28 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", letterSpacing: ".04em", marginBottom: 14 }}>{t.recentSplits}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {HISTORY.map((h, i) => (
                  <div key={h.id}
                    onClick={() => { if (h.status === "pending") { setViewItem(h); setScreen("view"); } }}
                    style={{
                      padding: "16px 18px", borderRadius: 18,
                      background: "rgba(255,255,255,.7)", backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255,255,255,.8)",
                      boxShadow: "0 2px 12px rgba(0,0,0,.03)",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      cursor: h.status === "pending" ? "pointer" : "default",
                      animation: `fadeUp .35s ease ${.04 * i}s both`,
                      transition: "all .2s",
                    }}
                    onMouseEnter={e => { if (h.status === "pending") e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,.06)"; }}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,.03)"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 14,
                        background: h.status === "pending" ? "rgba(99,102,241,.08)" : "rgba(0,0,0,.03)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 22,
                      }}>{h.emoji}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e" }}>{h.title}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                          {isMePayer(h) ? t.iPaid : t.paidBy(h.payer)} · {t.people(h.members)} · {h.time}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 15, fontWeight: 700, fontFamily: mono, color: "#1a1a2e" }}>
                        {fmtCurrency(h.myShare)}
                      </div>
                      <div style={{
                        fontSize: 10, fontWeight: 600, marginTop: 2,
                        color: h.status === "pending" ? "#f97316" : h.status === "paid" ? "#6366F1" : "#22c55e",
                      }}>
                        {h.status === "pending" ? t.pendingCount(h.pending) : h.status === "paid" ? t.payDone : t.splitDone}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Exchange Rate Badge */}
            <div style={{
              marginTop: 24, padding: "14px 18px", borderRadius: 14,
              background: "rgba(255,255,255,.6)", border: "1px solid rgba(0,0,0,.04)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 18 }}>💱</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: mono, color: "#1a1a2e" }}>
                    {t.rateLabel(lang === "ko" ? fmt(rate, lang) : rate.toFixed(4))}
                  </div>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{t.rateUpdated}</div>
                </div>
              </div>
              <div style={{
                padding: "4px 8px", borderRadius: 6,
                background: "rgba(34,197,94,.08)", fontSize: 10, fontWeight: 600, color: "#22c55e",
              }}>LIVE</div>
            </div>

            <div style={{
              marginTop: 10, padding: "16px 20px", borderRadius: 16,
              background: "rgba(255,255,255,.5)", border: "1px solid rgba(99,102,241,.08)",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{ fontSize: 24 }}>⚡</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6366F1" }}>{t.whyArcSplit}</div>
                <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5, marginTop: 2 }}>{t.whyArcDesc}</div>
              </div>
            </div>
          </div>
        )}

        {/* CREATE */}
        {screen === "create" && !settled && (
          <div style={{ animation: "fadeUp .4s ease", paddingBottom: 40 }}>
            <button onClick={goHome} style={{ marginTop: 16, background: "none", border: "none", color: "#94a3b8", fontSize: 14, cursor: "pointer", fontFamily: font, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
              {t.back}
            </button>

            <h2 style={{ fontSize: 24, fontWeight: 800, marginTop: 14, letterSpacing: "-.03em" }}>{t.createTitle}</h2>
            <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>{t.createDesc}</p>

            <div style={{ marginTop: 24 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: ".06em", marginBottom: 8, display: "block" }}>{t.whereLabel}</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder={t.wherePlaceholder}
                style={{
                  width: "100%", padding: "16px 18px", borderRadius: 16,
                  background: "rgba(255,255,255,.8)", border: "1.5px solid rgba(0,0,0,.06)",
                  color: "#1a1a2e", fontSize: 15, fontWeight: 500, fontFamily: font,
                  boxShadow: "0 2px 8px rgba(0,0,0,.02)",
                  transition: "border-color .2s, box-shadow .2s",
                }}
                onFocus={e => { e.target.style.borderColor = "rgba(99,102,241,.4)"; e.target.style.boxShadow = "0 4px 16px rgba(99,102,241,.08)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(0,0,0,.06)"; e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,.02)"; }}
              />
            </div>

            <div style={{ marginTop: 18 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: ".06em", marginBottom: 8, display: "block" }}>{t.totalAmount}</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", fontSize: 20, fontWeight: 800, color: "#6366F1" }}>{t.currencySymbol}</span>
                <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="0"
                  style={{
                    width: "100%", padding: "20px 18px 20px 44px", borderRadius: 18,
                    background: "rgba(255,255,255,.8)", border: "1.5px solid rgba(0,0,0,.06)",
                    color: "#1a1a2e", fontSize: 28, fontWeight: 800, fontFamily: mono,
                    boxShadow: "0 2px 8px rgba(0,0,0,.02)",
                    transition: "border-color .2s, box-shadow .2s",
                  }}
                  onFocus={e => { e.target.style.borderColor = "rgba(99,102,241,.4)"; e.target.style.boxShadow = "0 4px 16px rgba(99,102,241,.08)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(0,0,0,.06)"; e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,.02)"; }}
                />
              </div>
              {amount && (
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6, fontFamily: mono, animation: "fadeUp .3s ease" }}>
                  ≈ ${toUSDC(parseFloat(amount))} USDC
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              {t.quickAmounts.map(v => {
                const vs = String(v);
                return (
                  <button key={v} onClick={() => setAmount(vs)} style={{
                    flex: 1, padding: "10px 0", borderRadius: 12, border: "none", cursor: "pointer",
                    background: amount === vs ? "rgba(99,102,241,.1)" : "rgba(0,0,0,.02)",
                    color: amount === vs ? "#6366F1" : "#94a3b8",
                    fontSize: 12, fontWeight: 600, fontFamily: mono, transition: "all .15s",
                  }}>{t.currencySymbol}{fmt(v, lang)}</button>
                );
              })}
            </div>

            {/* Member Count Picker */}
            <div style={{ marginTop: 24 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: ".06em", marginBottom: 10, display: "block" }}>
                {t.howMany}
              </label>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 20,
                padding: "20px", borderRadius: 20,
                background: "rgba(255,255,255,.8)", border: "1.5px solid rgba(0,0,0,.06)",
              }}>
                <button onClick={() => setMemberCount(Math.max(2, memberCount - 1))}
                  style={{
                    width: 48, height: 48, borderRadius: 16, border: "none", cursor: "pointer",
                    background: memberCount <= 2 ? "rgba(0,0,0,.03)" : "rgba(99,102,241,.08)",
                    color: memberCount <= 2 ? "#d1d5db" : "#6366F1",
                    fontSize: 24, fontWeight: 700, transition: "all .15s",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>−</button>
                <div style={{ textAlign: "center", minWidth: 80 }}>
                  <div style={{ fontSize: 42, fontWeight: 800, color: "#1a1a2e", fontFamily: mono, letterSpacing: "-.03em" }}>
                    {memberCount}
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginTop: 2 }}>
                    {t.people(memberCount)}
                  </div>
                </div>
                <button onClick={() => setMemberCount(Math.min(20, memberCount + 1))}
                  style={{
                    width: 48, height: 48, borderRadius: 16, border: "none", cursor: "pointer",
                    background: "rgba(99,102,241,.08)",
                    color: "#6366F1",
                    fontSize: 24, fontWeight: 700, transition: "all .15s",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>+</button>
              </div>
            </div>

            {/* Split Preview */}
            {amount && memberCount > 1 && (
              <div style={{
                marginTop: 20, padding: "20px", borderRadius: 20,
                background: "rgba(255,255,255,.85)", backdropFilter: "blur(12px)",
                border: "1px solid rgba(99,102,241,.1)",
                boxShadow: "0 4px 20px rgba(99,102,241,.06)",
                animation: "popIn .3s ease",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>{t.perPerson}</div>
                    <div style={{ fontSize: 30, fontWeight: 800, color: "#6366F1", letterSpacing: "-.03em", marginTop: 2 }}>
                      {t.currencySymbol}<AnimNum value={perPerson} decimals={lang === "en" ? 2 : 0} />
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8", fontFamily: mono, marginTop: 2 }}>
                      ≈ ${toUSDC(perPerson)} USDC
                    </div>
                  </div>
                  <div style={{
                    padding: "10px 14px", borderRadius: 12,
                    background: "rgba(34,197,94,.06)", border: "1px solid rgba(34,197,94,.1)",
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#22c55e" }}>{t.estGas}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#22c55e", fontFamily: mono }}>$0.001</div>
                    <div style={{ fontSize: 9, color: "#22c55e", opacity: .7 }}>{t.gasUSDC}</div>
                  </div>
                </div>
              </div>
            )}

            <button onClick={handleCreate}
              disabled={!amount || !title || memberCount < 2 || settling}
              style={{
                width: "100%", marginTop: 20, marginBottom: 20, padding: "18px", borderRadius: 18,
                border: "none", cursor: settling ? "wait" : "pointer",
                background: (!amount || !title || memberCount < 2)
                  ? "rgba(0,0,0,.06)" : settling ? "rgba(99,102,241,.4)"
                  : "linear-gradient(135deg, #6366F1, #8B5CF6)",
                color: (!amount || !title || memberCount < 2) ? "#94a3b8" : "#fff",
                fontSize: 16, fontWeight: 700, fontFamily: font,
                boxShadow: (amount && title && memberCount >= 2 && !settling) ? "0 6px 24px rgba(99,102,241,.3)" : "none",
                transition: "all .3s",
              }}>
              {settling ? (
                <div style={{ display: "flex", justifyContent: "center", gap: 16, fontSize: 12, fontFamily: mono }}>
                  {[t.creating, t.issuingLink, t.done].map((s, i) => (
                    <span key={i} style={{ opacity: settleStep > i ? 1 : settleStep === i ? .6 : .25, fontWeight: settleStep >= i ? 700 : 400, transition: "all .3s" }}>
                      {settleStep > i ? "✓ " : ""}{s}
                    </span>
                  ))}
                </div>
              ) : t.sendRequest}
            </button>
          </div>
        )}

        {/* CREATED SUCCESS */}
        {screen === "create" && settled && (
          <div style={{ animation: "popIn .4s ease", textAlign: "center", paddingTop: 50, paddingBottom: 40 }}>
            <div style={{ position: "relative", display: "inline-block" }}>
              {["🎉", "✨", "💜"].map((e, i) => (
                <span key={i} style={{
                  position: "absolute", fontSize: 16,
                  top: -10, left: i * 30 - 15,
                  animation: `confetti${i + 1} .8s ease ${.1 * i}s both`,
                }}>{e}</span>
              ))}
              <div style={{
                width: 72, height: 72, borderRadius: 22,
                background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 12px 40px rgba(99,102,241,.3)",
                animation: "float 3s ease-in-out infinite",
              }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" style={{ strokeDasharray: 24, animation: "checkDraw .5s ease .3s both" }} />
                </svg>
              </div>
            </div>

            <h2 style={{ fontSize: 24, fontWeight: 800, marginTop: 24, letterSpacing: "-.02em" }}>{t.successTitle}</h2>
            <p style={{ fontSize: 14, color: "#64748b", marginTop: 6 }}>
              {t.successDesc(memberCount - 1)}
            </p>

            <div style={{
              marginTop: 28, padding: "22px", borderRadius: 20, textAlign: "left",
              background: "rgba(255,255,255,.85)", backdropFilter: "blur(12px)",
              border: "1px solid rgba(0,0,0,.04)",
              boxShadow: "0 4px 20px rgba(0,0,0,.04)",
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>{title}</div>

              {[
                { l: t.totalAmountLabel, v: fmtCurrency(parseFloat(amount)) },
                { l: t.peopleLabel, v: t.people(memberCount) },
                { l: t.perPersonLabel, v: fmtCurrency(perPerson), color: "#6366F1" },
                { l: t.usdcLabel, v: `$${toUSDC(perPerson)}`, noBorder: true },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: row.noBorder ? "none" : "1px dashed rgba(0,0,0,.06)" }}>
                  <span style={{ fontSize: 13, color: "#64748b" }}>{row.l}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, fontFamily: mono, color: row.color || "#1a1a2e" }}>{row.v}</span>
                </div>
              ))}

              <div style={{
                marginTop: 16, padding: "14px 16px", borderRadius: 14,
                background: "rgba(99,102,241,.04)", border: "1px solid rgba(99,102,241,.08)",
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#6366F1", marginBottom: 6 }}>{t.shareLink}</div>
                <div style={{
                  padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,.8)",
                  fontFamily: mono, fontSize: 12, color: "#64748b",
                  wordBreak: "break-all",
                }}>
                  https://arcsplit.xyz/s/a7f3d2e8
                </div>
                <button onClick={handleCopyLink} style={{
                  width: "100%", marginTop: 10, padding: "10px", borderRadius: 10,
                  border: "1.5px solid rgba(99,102,241,.15)", background: linkCopied ? "rgba(34,197,94,.06)" : "rgba(99,102,241,.04)",
                  color: linkCopied ? "#22c55e" : "#6366F1",
                  fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: font,
                  transition: "all .2s",
                }}>
                  {linkCopied ? `✓ ${t.copied}` : `📋 ${t.copyLink}`}
                </button>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 8, lineHeight: 1.5 }}>
                  {t.shareLinkDesc}
                </div>
              </div>

              <div style={{
                marginTop: 14, padding: "12px 14px", borderRadius: 12,
                background: "rgba(0,0,0,.02)", fontFamily: mono, fontSize: 11,
              }}>
                {[
                  { l: "Network", v: "Arc Testnet", c: "#6366F1" },
                  { l: "Tx", v: createHash ? `${createHash.slice(0,6)}...${createHash.slice(-4)}` : "—", c: "#6366F1" },
                  { l: "Finality", v: "~0.3s", c: "#64748b" },
                  { l: "Gas", v: "~$0.001 USDC", c: "#22c55e" },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", color: "#94a3b8" }}>
                    <span>{r.l}</span><span style={{ color: r.c, fontWeight: 600 }}>{r.v}</span>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={goHome} style={{
              width: "100%", marginTop: 20, padding: "16px", borderRadius: 16,
              border: "1.5px solid rgba(99,102,241,.15)", background: "transparent",
              color: "#6366F1", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: font,
              transition: "background .2s",
            }}
              onMouseEnter={e => e.target.style.background = "rgba(99,102,241,.04)"}
              onMouseLeave={e => e.target.style.background = "transparent"}
            >{t.goHome}</button>
          </div>
        )}

        {/* VIEW PENDING */}
        {screen === "view" && viewItem && (
          <div style={{ animation: "fadeUp .4s ease", paddingBottom: 40 }}>
            <button onClick={goHome} style={{ marginTop: 16, background: "none", border: "none", color: "#94a3b8", fontSize: 14, cursor: "pointer", fontFamily: font, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
              {t.back}
            </button>

            <div style={{
              marginTop: 14, padding: "24px", borderRadius: 22,
              background: "rgba(255,255,255,.85)", backdropFilter: "blur(12px)",
              border: "1px solid rgba(0,0,0,.04)",
              boxShadow: "0 6px 24px rgba(0,0,0,.04)",
            }}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>{viewItem.emoji}</div>
                <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em" }}>{viewItem.title}</h2>
                <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
                  {isMePayer(viewItem) ? t.iPaid : t.paidBy(viewItem.payer)} · {t.people(viewItem.members)}
                </p>
              </div>

              <div style={{
                padding: "20px", borderRadius: 16,
                background: "linear-gradient(135deg, rgba(99,102,241,.04), rgba(139,92,246,.04))",
                border: "1px solid rgba(99,102,241,.08)",
                textAlign: "center", marginBottom: 20,
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 4 }}>{t.myShare}</div>
                <div style={{ fontSize: 34, fontWeight: 800, color: "#6366F1", fontFamily: mono, letterSpacing: "-.03em" }}>
                  {fmtCurrency(viewItem.myShare)}
                </div>
                <div style={{ fontSize: 13, color: "#94a3b8", fontFamily: mono, marginTop: 4 }}>
                  ≈ ${toUSDC(viewItem.myShare)} USDC
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>{t.splitStatus}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#6366F1" }}>{t.paidOf(viewItem.members - viewItem.pending, viewItem.members)}</div>
                </div>
                {[
                  { name: lang === "ko" ? "민수" : "Minsu", status: "paid", emoji: "😎" },
                  { name: lang === "ko" ? "지은" : "Jieun", status: "pending", emoji: "💜" },
                  { name: lang === "ko" ? "현우" : "Hyunwoo", status: "pending", emoji: "🔥" },
                ].map((m, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 0", borderBottom: i < 2 ? "1px solid rgba(0,0,0,.04)" : "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{m.emoji}</span>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{m.name}</span>
                    </div>
                    <div style={{
                      padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                      background: m.status === "paid" ? "rgba(34,197,94,.08)" : "rgba(249,115,22,.08)",
                      color: m.status === "paid" ? "#22c55e" : "#f97316",
                    }}>
                      {m.status === "paid" ? t.paid : t.waiting}
                    </div>
                  </div>
                ))}
              </div>

              {!payDone && !isMePayer(viewItem) && (
                <button onClick={handlePay} disabled={paying}
                  style={{
                    width: "100%", padding: "18px", borderRadius: 18,
                    border: "none", cursor: paying ? "wait" : "pointer",
                    background: paying ? "rgba(99,102,241,.4)" : "linear-gradient(135deg, #6366F1, #8B5CF6)",
                    color: "#fff", fontSize: 16, fontWeight: 700, fontFamily: font,
                    boxShadow: paying ? "none" : "0 6px 24px rgba(99,102,241,.3)",
                    transition: "all .3s",
                  }}>
                  {paying ? (
                    <div style={{ display: "flex", justifyContent: "center", gap: 14, fontSize: 12, fontFamily: mono }}>
                      {[t.approving, t.sending, t.done].map((s, i) => (
                        <span key={i} style={{ opacity: payStep > i ? 1 : payStep === i ? .6 : .25, fontWeight: payStep >= i ? 700 : 400, transition: "all .3s" }}>
                          {payStep > i ? "✓ " : ""}{s}
                        </span>
                      ))}
                    </div>
                  ) : t.sendUSDC(toUSDC(viewItem.myShare))}
                </button>
              )}

              {payDone && (
                <div style={{ textAlign: "center", padding: "20px", borderRadius: 16, background: "rgba(34,197,94,.04)", border: "1px solid rgba(34,197,94,.1)", animation: "popIn .4s ease" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#22c55e" }}>{t.payComplete}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{t.payTime("0.31")}</div>
                  <div style={{ marginTop: 12, padding: "10px", borderRadius: 10, background: "rgba(0,0,0,.02)", fontFamily: mono, fontSize: 11, color: "#94a3b8", textAlign: "left" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span>Tx</span><span style={{ color: "#6366F1" }}>{payHash ? `${payHash.slice(0,6)}...${payHash.slice(-4)}` : "0xb8c4...f1a2"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span>Gas</span><span style={{ color: "#22c55e" }}>$0.0004 USDC</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* WALLET MODAL */}
      {showWalletModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,.4)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }} onClick={() => setShowWalletModal(false)}>
          <div style={{
            width: "100%", maxWidth: 440, padding: "24px 20px 32px",
            borderRadius: "24px 24px 0 0",
            background: "#fff",
            boxShadow: "0 -8px 40px rgba(0,0,0,.1)",
            animation: "slideUp .3s ease",
          }} onClick={e => e.stopPropagation()}>
            <style>{`@keyframes slideUp { from { transform:translateY(100%); } to { transform:translateY(0); } }`}</style>

            <div style={{ width: 36, height: 4, borderRadius: 2, background: "#e2e8f0", margin: "0 auto 20px" }} />
            <h3 style={{ fontSize: 18, fontWeight: 800, textAlign: "center", marginBottom: 4 }}>{t.chooseWallet}</h3>
            <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", marginBottom: 20 }}>Arc Testnet</p>

            {isConnected && (
              <div style={{
                padding: "14px 16px", borderRadius: 14, marginBottom: 12,
                background: "rgba(34,197,94,.04)", border: "1px solid rgba(34,197,94,.1)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#22c55e", marginBottom: 2 }}>{t.walletConnected}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: mono, color: "#1a1a2e" }}>{shortAddr}</div>
                </div>
                <button onClick={() => { disconnect(); setShowWalletModal(false); }} style={{
                  padding: "8px 14px", borderRadius: 10,
                  border: "1px solid rgba(239,68,68,.15)", background: "rgba(239,68,68,.04)",
                  color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: font,
                }}>
                  {t.disconnect}
                </button>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {walletOptions.map(w => {
                const connector = connectors.find(c =>
                  w.id === "metaMask" ? c.id === "metaMask" || c.id === "io.metamask"
                  : w.id === "rabby" ? c.id === "rabby"
                  : c.id === "okx"
                );
                return (
                  <button key={w.id}
                    onClick={() => {
                      if (connector) {
                        connect({ connector });
                        setShowWalletModal(false);
                      }
                    }}
                    style={{
                      padding: "16px 18px", borderRadius: 16,
                      border: "1.5px solid rgba(0,0,0,.06)", background: "rgba(0,0,0,.01)",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      cursor: "pointer", transition: "all .15s", fontFamily: font,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,.2)"; e.currentTarget.style.background = "rgba(99,102,241,.03)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,.06)"; e.currentTarget.style.background = "rgba(0,0,0,.01)"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: "rgba(99,102,241,.06)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 20,
                      }}>{w.icon}</div>
                      <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1a2e" }}>{w.name}</span>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
