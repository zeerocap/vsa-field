import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { GoogleMap, useJsApiLoader, OverlayView, InfoWindow, Polyline } from "@react-google-maps/api";
const GMAP_KEY = import.meta.env.VITE_GMAP_KEY || "";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import {
  X, MapPin, Users, TrendingUp, Calendar, Clock,
  Award, Activity, ChevronRight, Filter,
  Navigation, Target, AlertTriangle, Phone, Check, Edit2,
  Wifi, Camera, Layers, Building2, GraduationCap, BookOpen, Store, User, Sun, Map, RefreshCw, Pin,
  ShieldCheck, ShieldAlert, ScanFace, CheckCircle, AlertCircle,
  Route, Footprints, LocateFixed, Timer, LayoutDashboard,
} from "lucide-react";
import C from "../../constants/theme.js";
import { call } from "../../utils/api.js";
import { getUser, getToken } from "../../utils/auth.js";

// ── Inline constants ──────────────────────────────────────────────────────────
const KERALA_DISTRICTS = [
  "Thiruvananthapuram","Kollam","Pathanamthitta","Alappuzha","Kottayam",
  "Idukki","Ernakulam","Thrissur","Palakkad","Malappuram",
  "Kozhikode","Wayanad","Kannur","Kasaragod",
];
const ACTIVITY_TYPES = [
  { value:"school_visit",    label:"School Visit"    },
  { value:"mall_activation", label:"Mall Activation" },
  { value:"event",           label:"Event"           },
  { value:"door_to_door",    label:"Door to Door"    },
  { value:"other",           label:"Other"           },
];

// ── API adapters — call() handles token internally ────────────────────────────
const _fa  = (action) => async (_t, params) => call(action, params || {});
const getFieldActivitiesApi = _fa("getFieldActivities");
const getFieldVenuesApi     = async (_t, params) => call("getFieldVenues", params || {});
const addFieldVenueApi      = _fa("addFieldVenue");
const getFieldLeadsApi      = _fa("getFieldLeads");
const getFieldTargetsApi    = async (_t, params) => call("getFieldTargets", params || {});
const setFieldTargetApi     = _fa("setFieldTarget");
const getLiveSessionsApi    = async () => call("getLiveSessions");
const getTerritoriesApi     = async () => call("getTerritories");
const setTerritoryApi       = _fa("setTerritory");
const getFieldPhotosApi     = _fa("getFieldPhotos");
const setVenueLocationApi   = _fa("setVenueLocation");
const getFieldSessionsApi   = _fa("getFieldSessions");
const getLoginSelfiesApi    = _fa("getLoginSelfies");
const getProTrailApi        = _fa("getProTrail");
const getTrailSummaryApi    = _fa("getTrailSummary");
const fetchUsersApi         = async () => call("getUsers");
const revokeFaceApi         = _fa("revokeFace");
const _enrollFaceApi        = _fa("enrollFace");

// ── Simplified EnrollFaceModal (camera photo capture, no face-api.js) ────────
function EnrollFaceModal({ authUser, target, onClose, onEnrolled }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [phase, setPhase] = useState("camera");
  const [photo, setPhoto] = useState(null);
  const [err,   setErr]   = useState("");

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video:{ facingMode:"user" }, audio:false })
      .then(s => { streamRef.current=s; if(videoRef.current){videoRef.current.srcObject=s;videoRef.current.play();} })
      .catch(() => { setPhase("error"); setErr("Camera not available."); });
    return () => streamRef.current?.getTracks().forEach(t=>t.stop());
  }, []);

  function capture() {
    const v=videoRef.current, c=canvasRef.current;
    c.width=320; c.height=240;
    c.getContext("2d").drawImage(v,0,0,320,240);
    setPhoto(c.toDataURL("image/jpeg",0.85));
    streamRef.current?.getTracks().forEach(t=>t.stop());
    setPhase("preview");
  }

  async function submit() {
    setPhase("submitting");
    try {
      const r = await _enrollFaceApi(null, { username:target.username, photoBase64:photo });
      if (r.ok!==false) { setPhase("done"); }
      else { setPhase("error"); setErr(r.error||"Enrollment failed"); }
    } catch(e) { setPhase("error"); setErr(e.message||"Failed"); }
  }

  function retake() {
    setPhoto(null); setPhase("camera");
    navigator.mediaDevices.getUserMedia({ video:{ facingMode:"user" }, audio:false })
      .then(s => { streamRef.current=s; if(videoRef.current){videoRef.current.srcObject=s;videoRef.current.play();} });
  }

  return (
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(2px)",zIndex:80}}/>
      <div onClick={e=>e.stopPropagation()} style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"#fff",borderRadius:16,zIndex:90,boxShadow:"0 8px 40px rgba(0,0,0,0.18)",width:"min(95vw,380px)",overflow:"hidden"}}>
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontWeight:700,fontSize:15,color:C.text}}>Enroll Face — {target.display_name||target.username}</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>Look straight at camera and capture</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><X size={18} color={C.muted}/></button>
        </div>
        <div style={{padding:20}}>
          {phase==="camera" && (
            <>
              <div style={{width:"100%",aspectRatio:"4/3",background:"#111",borderRadius:10,overflow:"hidden",marginBottom:14,position:"relative"}}>
                <video ref={videoRef} autoPlay playsInline muted style={{width:"100%",height:"100%",objectFit:"cover",transform:"scaleX(-1)",display:"block"}}/>
                <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
                  <div style={{width:"56%",aspectRatio:"3/4",border:"2px dashed rgba(255,255,255,0.4)",borderRadius:"50%"}}/>
                </div>
              </div>
              <button onClick={capture} style={{width:"100%",padding:13,borderRadius:10,border:"none",background:C.brand,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                <Camera size={16}/> Capture Photo
              </button>
            </>
          )}
          {phase==="preview" && (
            <>
              <div style={{width:"100%",aspectRatio:"4/3",background:"#111",borderRadius:10,overflow:"hidden",marginBottom:14}}>
                <img src={photo} alt="preview" style={{width:"100%",height:"100%",objectFit:"cover",transform:"scaleX(-1)",display:"block"}}/>
              </div>
              <div style={{display:"flex",gap:10}}>
                <button onClick={retake} style={{flex:1,padding:11,borderRadius:9,border:`1px solid ${C.border}`,background:"#fff",color:C.muted,fontSize:13,cursor:"pointer",fontWeight:600}}>Retake</button>
                <button onClick={submit} style={{flex:1,padding:11,borderRadius:9,border:"none",background:C.brand,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Enroll</button>
              </div>
            </>
          )}
          {phase==="submitting" && <div style={{textAlign:"center",padding:"20px 0",color:C.muted,fontSize:13}}>Enrolling…</div>}
          {phase==="done" && (
            <div style={{textAlign:"center",padding:"20px 0"}}>
              <CheckCircle size={40} color="#16A34A" style={{margin:"0 auto 12px"}}/>
              <div style={{fontWeight:700,fontSize:15,color:C.text,marginBottom:4}}>Face enrolled!</div>
              <button onClick={()=>{onEnrolled?.();onClose();}} style={{marginTop:10,padding:"9px 24px",borderRadius:9,border:"none",background:C.brand,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Done</button>
            </div>
          )}
          {phase==="error" && (
            <div style={{textAlign:"center",padding:"20px 0"}}>
              <div style={{fontWeight:700,fontSize:14,color:"#DC2626",marginBottom:6}}>Error</div>
              <div style={{fontSize:13,color:C.muted,marginBottom:14}}>{err}</div>
              <button onClick={onClose} style={{padding:"9px 24px",borderRadius:9,border:`1px solid ${C.border}`,background:"#fff",color:C.muted,fontSize:13,cursor:"pointer"}}>Close</button>
            </div>
          )}
        </div>
        <canvas ref={canvasRef} style={{display:"none"}}/>
      </div>
    </>
  );
}

// ── Simplified ActivityDetailDrawer ───────────────────────────────────────────
function ActivityDetailDrawer({ activity:act, onClose, isMobile }) {
  if (!act) return null;
  const fmt = d => d ? new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—";
  return (
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:999}}/>
      <div onClick={e=>e.stopPropagation()} style={{position:"fixed",right:0,top:0,bottom:0,width:isMobile?"100vw":440,background:"#fff",zIndex:1000,boxShadow:"-4px 0 24px rgba(0,0,0,0.12)",overflowY:"auto",padding:"20px 20px 40px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontWeight:700,fontSize:16,color:C.text}}>Activity Details</div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer"}}><X size={20} color={C.muted}/></button>
        </div>
        {[["PRO",act.pro_username||"—"],["Date",fmt(act.activity_date)],["Venue",act.venue_name||"—"],["District",act.district||"—"],["Type",(act.activity_type||"").replace(/_/g," ")||"—"],["Leads",act.leads_captured||0],["Notes",act.notes||"—"]].map(([l,v])=>(
          <div key={l} style={{display:"flex",borderBottom:`1px solid ${C.border}`,padding:"10px 0",gap:12}}>
            <div style={{width:90,fontSize:12,color:C.muted,flexShrink:0}}>{l}</div>
            <div style={{fontSize:13,color:C.text,fontWeight:500,flex:1,wordBreak:"break-word"}}>{String(v)}</div>
          </div>
        ))}
        {act.selfie_photo && (
          <div style={{marginTop:16}}>
            <div style={{fontSize:12,color:C.muted,marginBottom:8}}>Check-in Selfie</div>
            <img src={act.selfie_photo} alt="selfie" style={{width:"100%",borderRadius:10,display:"block"}}/>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Pure helpers (outside component for stable refs) ────────────────────────
const fmtDate = d =>
  d ? new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" }) : "—";

const daysSince = d => {
  if (!d) return null;
  const diff = Math.floor((Date.now() - new Date(d + "T00:00:00")) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff}d ago`;
};

const typeLabel = v =>
  ACTIVITY_TYPES?.find(t => t.value === v)?.label || (v ? v.replace(/_/g, " ") : "—");

const displayName = u => {
  if (!u) return "—";
  const n = u.replace(/\.pro$/i, "");
  return n.charAt(0).toUpperCase() + n.slice(1);
};

// Status colours for field leads (matches CRM)
const STATUS_COLOR = {
  "New":                "#2563EB",
  "Contacted":          "#0284C7",
  "Interested":         "#7e1749",
  "Converted":          "#16A34A",
  "Enrolled":           "#16A34A",
  "Not Interested":     "#6B7280",
  "Called — No Answer": "#6B7280",
  "Callback Requested": "#7C3AED",
  "Visited Center":     "#D97706",
  "Dead":               "#9CA3AF",
  "Invalid Number":     "#9CA3AF",
};

// ─── Shared micro-components ─────────────────────────────────────────────────
const Pill = ({ label, color = C.brand }) => (
  <span style={{
    display:"inline-flex", alignItems:"center",
    padding:"2px 9px", borderRadius:20,
    background:`${color}15`, color,
    fontSize:11, fontWeight:600, whiteSpace:"nowrap", lineHeight:"18px",
  }}>{label}</span>
);

const KPICard = ({ icon: Icon, label, value, color, sub }) => (
  <div style={{
    background:C.card, borderRadius:12, padding:"18px 20px",
    border:`1px solid ${C.border}`, boxShadow:"0 1px 3px rgba(0,0,0,.05)",
    display:"flex", flexDirection:"column", gap:5,
    position:"relative", overflow:"hidden",
  }}>
    <div style={{
      position:"absolute", top:14, right:14,
      width:36, height:36, borderRadius:10, background:`${color}12`,
      display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      <Icon size={18} color={color} strokeWidth={2}/>
    </div>
    <div style={{ fontSize:12, color:C.muted, fontWeight:500, textTransform:"uppercase", letterSpacing:".04em" }}>{label}</div>
    <div style={{ fontSize:30, fontWeight:800, color, lineHeight:1 }}>{value}</div>
    {sub && <div style={{ fontSize:11, color:C.faint }}>{sub}</div>}
  </div>
);

const SectionCard = ({ title, icon: Icon, right, children }) => (
  <div style={{ background:C.card, borderRadius:12, border:`1px solid ${C.border}`, overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,.05)", marginBottom:14 }}>
    <div style={{ padding:"13px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        {Icon && <Icon size={15} color={C.muted}/>}
        <span style={{ fontSize:14, fontWeight:700, color:C.text }}>{title}</span>
      </div>
      {right}
    </div>
    {children}
  </div>
);

// ─── Custom recharts tooltip ──────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 12px", fontSize:12, boxShadow:"0 2px 8px rgba(0,0,0,.1)" }}>
      <div style={{ color:C.muted, marginBottom:4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color:p.fill, fontWeight:700 }}>{p.value} {p.name}</div>
      ))}
    </div>
  );
};

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────
function OverviewTab({ activities, proMap, totalLeads, totalActs, activePros, venuesCovered, isMobile, onSelectActivity, onChangeTab }) {

  // 30-day daily trend
  const trendData = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key   = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-IN", { day:"numeric", month:"short" });
      days.push({ date:key, label, leads:0, acts:0 });
    }
    const map = {};
    days.forEach(d => { map[d.date] = d; });
    activities.forEach(a => {
      if (map[a.activity_date]) {
        map[a.activity_date].leads += a.leads_captured || 0;
        map[a.activity_date].acts++;
      }
    });
    return days;
  }, [activities]);

  // Activity type breakdown
  const typeData = useMemo(() => {
    const m = {};
    activities.forEach(a => {
      const t = typeLabel(a.activity_type);
      if (!m[t]) m[t] = { type:t, count:0, leads:0 };
      m[t].count++;
      m[t].leads += (a.leads_captured || 0);
    });
    return Object.values(m).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [activities]);

  const maxCount   = Math.max(1, ...typeData.map(t => t.count));
  const typeColors = [C.brand, C.info, C.purple, C.success, C.warning, "#F43F5E"];

  const avgLeads   = totalActs > 0 ? (totalLeads / totalActs).toFixed(1) : "0";
  const lateCount  = activities.filter(a => a.is_late_entry).length;

  // This-week slice
  const wk = new Date(); wk.setDate(wk.getDate() - 7);
  const wkStr   = wk.toISOString().slice(0, 10);
  const weekActs  = activities.filter(a => a.activity_date >= wkStr);
  const weekLeads = weekActs.reduce((s, a) => s + (a.leads_captured || 0), 0);

  const MEDAL_COLORS = ["#D97706","#6B7280","#B45309"];
  const MedalBadge = ({ rank }) => (
    <span style={{ fontSize:11, fontWeight:800, color: MEDAL_COLORS[rank] || "#9CA3AF" }}>{rank+1}</span>
  );

  return (
    <div>
      {/* ── KPI row ── */}
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)", gap:12, marginBottom:16 }}>
        <KPICard icon={Activity}   label="Total Activities"  value={totalActs}     color={C.brand}   sub={`${weekActs.length} this week`}/>
        <KPICard icon={Target}     label="Leads Captured"    value={totalLeads}    color={C.info}    sub={`${weekLeads} this week`}/>
        <KPICard icon={Users}      label="Active PROs"       value={activePros}    color={C.success} sub="All centres"/>
        <KPICard icon={MapPin}     label="Venues Covered"    value={venuesCovered} color={C.purple}  sub={`Avg ${avgLeads} leads/visit`}/>
      </div>

      {/* ── Charts row ── */}
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 320px", gap:12, marginBottom:14 }}>

        {/* 30-day bar chart */}
        <div style={{ background:C.card, borderRadius:12, border:`1px solid ${C.border}`, padding:"16px 20px", boxShadow:"0 1px 3px rgba(0,0,0,.05)" }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:C.text }}>Leads Trend</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>Last 30 days · daily breakdown</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:22, fontWeight:800, color:C.brand }}>{totalLeads}</div>
              <div style={{ fontSize:10, color:C.muted }}>total leads</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={trendData} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/>
              <XAxis dataKey="label" tick={{ fontSize:10, fill:C.muted }} tickLine={false} axisLine={false}
                interval={isMobile ? 7 : 4}/>
              <YAxis hide allowDecimals={false}/>
              <Tooltip content={<ChartTip/>} cursor={{ fill:`${C.brand}08` }}/>
              <Bar dataKey="leads" name="leads" fill={C.brand} radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Activity type breakdown */}
        <div style={{ background:C.card, borderRadius:12, border:`1px solid ${C.border}`, padding:"16px 20px", boxShadow:"0 1px 3px rgba(0,0,0,.05)" }}>
          <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:3 }}>By Activity Type</div>
          <div style={{ fontSize:11, color:C.muted, marginBottom:14 }}>All time · visits & leads</div>
          {typeData.length === 0 ? (
            <div style={{ textAlign:"center", padding:32, color:C.muted, fontSize:13 }}>No data yet</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
              {typeData.map((t, i) => {
                const col = typeColors[i];
                const pct = Math.round((t.count / maxCount) * 100);
                return (
                  <div key={t.type}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, alignItems:"center" }}>
                      <span style={{ fontSize:12, fontWeight:500, color:C.text }}>{t.type}</span>
                      <span style={{ fontSize:11, color:C.muted }}>
                        <strong style={{ color:col }}>{t.count}</strong> visits · <strong style={{ color:C.brand }}>{t.leads}</strong> leads
                      </span>
                    </div>
                    <div style={{ height:5, background:C.border, borderRadius:3 }}>
                      <div style={{ height:"100%", width:`${pct}%`, background:col, borderRadius:3, transition:"width .4s ease" }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {lateCount > 0 && (
            <div style={{ marginTop:14, paddingTop:12, borderTop:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:6 }}>
              <AlertTriangle size={13} color={C.warning}/>
              <span style={{ fontSize:11, color:C.warning, fontWeight:600 }}>{lateCount} late {lateCount === 1 ? "entry" : "entries"} recorded</span>
            </div>
          )}
        </div>
      </div>

      {/* ── PRO Leaderboard ── */}
      <SectionCard
        title="PRO Leaderboard"
        icon={Award}
        right={<span style={{ fontSize:11, color:C.muted }}>All time · ranked by leads</span>}
      >
        {proMap.length === 0 ? (
          <div style={{ textAlign:"center", padding:32, color:C.muted, fontSize:13 }}>No activities yet</div>
        ) : isMobile ? (
          <div style={{ padding:12, display:"flex", flexDirection:"column", gap:8 }}>
            {proMap.slice(0, 10).map((p, i) => {
              const pct = Math.round((p.leads / (proMap[0]?.leads || 1)) * 100);
              const rankBg = i === 0 ? "#FFFBF0" : C.bg;
              return (
                <div key={p.username} style={{ padding:"12px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:rankBg }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                    <div style={{ width:30, height:30, borderRadius:"50%", background:`${C.brand}10`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <MedalBadge rank={i}/>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:13, color:C.text }}>{displayName(p.username)}</div>
                      <div style={{ fontSize:11, color:C.muted }}>{p.centre}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:20, fontWeight:800, color:C.brand }}>{p.leads}</div>
                      <div style={{ fontSize:10, color:C.muted }}>leads</div>
                    </div>
                  </div>
                  <div style={{ height:4, background:C.border, borderRadius:2 }}>
                    <div style={{ height:"100%", width:`${pct}%`, background:C.brand, borderRadius:2 }}/>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:C.bg }}>
                {["","PRO","Centre","Activities","Leads","Avg/Visit","Last Active"].map(h => (
                  <th key={h} style={{ padding:"9px 16px", textAlign:"left", fontSize:11, fontWeight:600, color:C.muted, letterSpacing:.4, borderBottom:`1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {proMap.slice(0, 15).map((p, i) => {
                const pct = Math.round((p.leads / (proMap[0]?.leads || 1)) * 100);
                return (
                  <tr key={p.username}
                    style={{ borderBottom:`1px solid ${C.border}`, background: i === 0 ? "#FFFDF0" : "transparent" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#FFF8FB"}
                    onMouseLeave={e => e.currentTarget.style.background = i === 0 ? "#FFFDF0" : "transparent"}>
                    <td style={{ padding:"10px 16px", width:44 }}>
                      <div style={{ width:28, height:28, borderRadius:"50%", background:`${C.brand}0D`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <MedalBadge rank={i}/>
                      </div>
                    </td>
                    <td style={{ padding:"10px 16px" }}>
                      <div style={{ fontWeight:700, fontSize:13, color:C.text }}>{displayName(p.username)}</div>
                      <div style={{ fontSize:11, color:C.faint }}>{p.username}</div>
                    </td>
                    <td style={{ padding:"10px 16px" }}><Pill label={p.centre || "—"} color={C.info}/></td>
                    <td style={{ padding:"10px 16px", fontSize:14, fontWeight:700, color:C.text }}>{p.acts}</td>
                    <td style={{ padding:"10px 16px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:56, height:5, background:C.border, borderRadius:3, flexShrink:0 }}>
                          <div style={{ height:"100%", width:`${pct}%`, background:C.brand, borderRadius:3 }}/>
                        </div>
                        <span style={{ fontSize:15, fontWeight:800, color:C.brand }}>{p.leads}</span>
                      </div>
                    </td>
                    <td style={{ padding:"10px 16px", fontSize:13, color:C.text }}>{p.acts > 0 ? (p.leads/p.acts).toFixed(1) : "—"}</td>
                    <td style={{ padding:"10px 16px", fontSize:12, color:C.success, fontWeight:500 }}>{daysSince(p.lastDate) || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </SectionCard>

      {/* ── Recent Activities ── */}
      <SectionCard
        title="Recent Activities"
        icon={Clock}
        right={
          <button onClick={() => onChangeTab("activities")}
            style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color:C.brand, background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>
            View all <ChevronRight size={13}/>
          </button>
        }
      >
        {isMobile ? (
          <div style={{ padding:"10px 12px", display:"flex", flexDirection:"column", gap:8 }}>
            {activities.length === 0 && <div style={{ textAlign:"center", padding:24, color:C.muted, fontSize:13 }}>No activities logged yet</div>}
            {activities.slice(0, 6).map(a => (
              <div key={a.id} onClick={() => onSelectActivity(a)}
                style={{ padding:"11px 13px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bg, cursor:"pointer" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:13, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.venue_name || "Unknown"}</div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{displayName(a.pro_username)} · {fmtDate(a.activity_date)}</div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0, marginLeft:10 }}>
                    <div style={{ fontSize:20, fontWeight:900, color:(a.leads_captured||0)>0?C.brand:C.muted }}>{a.leads_captured||0}</div>
                    <div style={{ fontSize:9, color:C.muted }}>leads</div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  <Pill label={typeLabel(a.activity_type)} color={C.purple}/>
                  {a.is_late_entry && <Pill label="Late" color={C.warning}/>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:C.bg }}>
                  {["Date","PRO","Venue","Type","Leads",""].map(h => (
                    <th key={h} style={{ padding:"8px 16px", textAlign:"left", fontSize:11, fontWeight:600, color:C.muted, letterSpacing:.4, borderBottom:`1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activities.slice(0, 8).map(a => (
                  <tr key={a.id} onClick={() => onSelectActivity(a)}
                    style={{ borderBottom:`1px solid ${C.border}`, cursor:"pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#FFF8FB"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding:"9px 16px", fontSize:12, color:C.muted, whiteSpace:"nowrap" }}>{fmtDate(a.activity_date)}</td>
                    <td style={{ padding:"9px 16px", fontSize:12, fontWeight:600, color:C.text }}>{displayName(a.pro_username)}</td>
                    <td style={{ padding:"9px 16px", fontSize:12, color:C.text, maxWidth:170, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={a.venue_name}>{a.venue_name || "—"}</td>
                    <td style={{ padding:"9px 16px" }}><Pill label={typeLabel(a.activity_type)} color={C.purple}/></td>
                    <td style={{ padding:"9px 16px" }}>
                      <span style={{ fontSize:15, fontWeight:800, color:(a.leads_captured||0) > 0 ? C.brand : C.muted }}>{a.leads_captured || 0}</span>
                      {a.is_late_entry && <AlertTriangle size={11} color={C.warning} style={{ marginLeft:5 }} title="Late entry"/>}
                    </td>
                    <td style={{ padding:"9px 16px", fontSize:11, color:C.brand, fontWeight:600 }}>View</td>
                  </tr>
                ))}
                {activities.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign:"center", padding:36, color:C.muted, fontSize:13 }}>No activities logged yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── ACTIVITIES TAB ───────────────────────────────────────────────────────────
function ActivitiesTab({ activities, authUser, isMobile, onSelectActivity, loading }) {
  const [fPro,        setFPro]        = useState("");
  const [fType,       setFType]       = useState("");
  const [fCentre,     setFCentre]     = useState("");
  const [fDistrict,   setFDistrict]   = useState("");
  const [fVenue,      setFVenue]      = useState("");
  const [fFrom,       setFFrom]       = useState("");
  const [fTo,         setFTo]         = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const proOptions      = useMemo(() => [...new Set(activities.map(a => a.pro_username))].sort(), [activities]);
  const centreOptions   = useMemo(() => [...new Set(activities.map(a => a.centre).filter(Boolean))].sort(), [activities]);
  const districtOptions = useMemo(() => [...new Set(activities.map(a => a.district).filter(Boolean))].sort(), [activities]);

  const filtered = useMemo(() => activities.filter(a => {
    if (fPro      && a.pro_username !== fPro)                                              return false;
    if (fType     && a.activity_type !== fType)                                            return false;
    if (fCentre   && a.centre !== fCentre)                                                 return false;
    if (fDistrict && a.district !== fDistrict)                                             return false;
    if (fFrom     && a.activity_date < fFrom)                                              return false;
    if (fTo       && a.activity_date > fTo)                                                return false;
    if (fVenue    && !(a.venue_name || "").toLowerCase().includes(fVenue.toLowerCase()))   return false;
    return true;
  }), [activities, fPro, fType, fCentre, fDistrict, fVenue, fFrom, fTo]);

  const ss = { padding:"7px 10px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:12, color:C.text, background:C.card, fontFamily:"inherit", outline:"none", cursor:"pointer" };
  const hasFilter = fPro || fType || fCentre || fDistrict || fVenue || fFrom || fTo;

  const clearAll = () => { setFPro(""); setFType(""); setFCentre(""); setFDistrict(""); setFVenue(""); setFFrom(""); setFTo(""); };
  const advActive = !!(fPro || fType || fCentre || fDistrict || fFrom || fTo);

  return (
    <div>
      {/* ── Filter bar ── */}
      {isMobile ? (
        <div style={{ marginBottom:14 }}>
          {/* Mobile: search + toggle row */}
          <div style={{ display:"flex", gap:8, marginBottom: showFilters ? 8 : 0 }}>
            <input value={fVenue} onChange={e => setFVenue(e.target.value)} placeholder="Search venue…"
              style={{ ...ss, flex:1, cursor:"text" }}/>
            <button onClick={() => setShowFilters(s => !s)}
              style={{ ...ss, cursor:"pointer", display:"flex", alignItems:"center", gap:5, whiteSpace:"nowrap",
                background: advActive ? `${C.brand}10` : C.card,
                borderColor: advActive ? C.brand : C.border,
                color: advActive ? C.brand : C.muted, fontWeight: advActive ? 700 : 500 }}>
              <Filter size={13}/> Filters{advActive ? " ●" : ""}
            </button>
            {hasFilter && (
              <button onClick={clearAll}
                style={{ ...ss, cursor:"pointer", color:C.danger, borderColor:`${C.danger}30`, background:`${C.danger}08`, display:"flex", alignItems:"center", gap:3 }}>
                <X size={12}/>
              </button>
            )}
          </div>
          {/* Mobile: expanded filter panel */}
          {showFilters && (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px", display:"flex", flexDirection:"column", gap:8 }}>
              {authUser.role === "admin" && (
                <select value={fCentre} onChange={e => setFCentre(e.target.value)} style={{ ...ss, width:"100%" }}>
                  <option value="">All Centres</option>
                  {centreOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
              <select value={fPro} onChange={e => setFPro(e.target.value)} style={{ ...ss, width:"100%" }}>
                <option value="">All PROs</option>
                {proOptions.map(p => <option key={p} value={p}>{displayName(p)}</option>)}
              </select>
              <select value={fType} onChange={e => setFType(e.target.value)} style={{ ...ss, width:"100%" }}>
                <option value="">All Types</option>
                {(ACTIVITY_TYPES || []).map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              {districtOptions.length > 0 && (
                <select value={fDistrict} onChange={e => setFDistrict(e.target.value)} style={{ ...ss, width:"100%" }}>
                  <option value="">All Districts</option>
                  {districtOptions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              )}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <input type="date" value={fFrom} onChange={e => setFFrom(e.target.value)} style={{ ...ss, cursor:"text" }} title="From"/>
                <input type="date" value={fTo}   onChange={e => setFTo(e.target.value)}   style={{ ...ss, cursor:"text" }} title="To"/>
              </div>
            </div>
          )}
          <div style={{ marginTop:8, fontSize:12, color:C.muted }}>{filtered.length} records</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:14, padding:"11px 14px", background:C.card, borderRadius:10, border:`1px solid ${C.border}`, alignItems:"center" }}>
          <Filter size={14} color={C.muted}/>
          {authUser.role === "admin" && (
            <select value={fCentre} onChange={e => setFCentre(e.target.value)} style={ss}>
              <option value="">All Centres</option>
              {centreOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <select value={fPro} onChange={e => setFPro(e.target.value)} style={ss}>
            <option value="">All PROs</option>
            {proOptions.map(p => <option key={p} value={p}>{displayName(p)}</option>)}
          </select>
          <input value={fVenue} onChange={e => setFVenue(e.target.value)} placeholder="Search venue…"
            style={{ ...ss, cursor:"text", minWidth:140 }}/>
          <select value={fType} onChange={e => setFType(e.target.value)} style={ss}>
            <option value="">All Types</option>
            {(ACTIVITY_TYPES || []).map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          {districtOptions.length > 0 && (
            <select value={fDistrict} onChange={e => setFDistrict(e.target.value)} style={ss}>
              <option value="">All Districts</option>
              {districtOptions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
          <input type="date" value={fFrom} onChange={e => setFFrom(e.target.value)} style={{ ...ss, cursor:"text" }} title="From date"/>
          <input type="date" value={fTo}   onChange={e => setFTo(e.target.value)}   style={{ ...ss, cursor:"text" }} title="To date"/>
          {hasFilter && (
            <button onClick={clearAll}
              style={{ padding:"6px 10px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.muted, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
              <X size={11}/> Clear
            </button>
          )}
          <span style={{ marginLeft:"auto", fontSize:12, color:C.muted }}>{filtered.length} records</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:"center", padding:60, color:C.muted, fontSize:14 }}>Loading activities…</div>
      ) : (
        <div style={{ background:C.card, borderRadius:12, border:`1px solid ${C.border}`, overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,.05)" }}>
          {isMobile ? (
            <div style={{ padding:12, display:"flex", flexDirection:"column", gap:10 }}>
              {filtered.length === 0 && <div style={{ textAlign:"center", padding:32, color:C.muted, fontSize:13 }}>No activities match filters</div>}
              {filtered.map(a => (
                <div key={a.id} onClick={() => onSelectActivity(a)}
                  style={{ padding:"12px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.bg, cursor:"pointer", transition:"box-shadow .12s" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,.08)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:13, color:C.text }}>{a.venue_name || "Unknown Venue"}</div>
                      <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{fmtDate(a.activity_date)} · {displayName(a.pro_username)}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:22, fontWeight:800, color:C.brand }}>{a.leads_captured || 0}</div>
                      <div style={{ fontSize:10, color:C.muted }}>leads</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    <Pill label={typeLabel(a.activity_type)} color={C.purple}/>
                    {a.centre && <Pill label={a.centre} color={C.info}/>}
                    {a.is_late_entry && <Pill label="Late Entry" color={C.warning}/>}
                  </div>
                  {(a.notes || a.description) && (
                    <div style={{ fontSize:11, color:C.muted, marginTop:7, paddingTop:7, borderTop:`1px solid ${C.border}`, lineHeight:1.5 }}>
                      {(a.notes || a.description).slice(0, 100)}{(a.notes || a.description).length > 100 ? "…" : ""}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", minWidth:720 }}>
                <thead>
                  <tr style={{ background:C.bg }}>
                    {["Date","PRO","Centre","Venue","Type","Leads","Notes",""].map(h => (
                      <th key={h} style={{ padding:"9px 16px", textAlign:"left", fontSize:11, fontWeight:600, color:C.muted, letterSpacing:.4, borderBottom:`1px solid ${C.border}` }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign:"center", padding:40, color:C.muted, fontSize:13 }}>No activities match filters</td></tr>
                  )}
                  {filtered.map(a => (
                    <tr key={a.id} onClick={() => onSelectActivity(a)}
                      style={{ borderBottom:`1px solid ${C.border}`, cursor:"pointer" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#FFF8FB"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding:"10px 16px", fontSize:12, color:C.muted, whiteSpace:"nowrap" }}>{fmtDate(a.activity_date)}</td>
                      <td style={{ padding:"10px 16px", fontSize:12, fontWeight:600, color:C.text }}>{displayName(a.pro_username)}</td>
                      <td style={{ padding:"10px 16px" }}><Pill label={a.centre || "—"} color={C.info}/></td>
                      <td style={{ padding:"10px 16px", fontSize:12, color:C.text, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={a.venue_name}>{a.venue_name || "—"}</td>
                      <td style={{ padding:"10px 16px" }}><Pill label={typeLabel(a.activity_type)} color={C.purple}/></td>
                      <td style={{ padding:"10px 16px" }}>
                        <span style={{ fontSize:15, fontWeight:800, color:(a.leads_captured||0) > 0 ? C.brand : C.muted }}>{a.leads_captured || 0}</span>
                        {a.is_late_entry && <AlertTriangle size={11} color={C.warning} style={{ marginLeft:5 }} title="Late entry"/>}
                      </td>
                      <td style={{ padding:"10px 16px", fontSize:11, color:C.muted, maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={a.notes||a.description}>{a.notes||a.description||"—"}</td>
                      <td style={{ padding:"10px 16px", fontSize:11, color:C.brand, fontWeight:600, whiteSpace:"nowrap" }}>View</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── VENUES TAB ───────────────────────────────────────────────────────────────
// ─── Pin Location Modal — Google Maps picker ──────────────────────────────────
function PinLocationModal({ authUser, venue, onClose, onPinned }) {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: GMAP_KEY });
  const [pinLatLng,  setPinLatLng]  = useState(venue.lat ? { lat: venue.lat, lng: venue.lng } : null);
  const [geoRadius,  setGeoRadius]  = useState(venue.geo_radius || 300);
  const [saving,     setSaving]     = useState(false);
  const [err,        setErr]        = useState(null);

  const KERALA_CENTER = { lat: 10.25, lng: 76.5 };

  const handleMapClick = (e) => {
    setPinLatLng({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    setErr(null);
  };

  const handleSave = async () => {
    if (!pinLatLng) { setErr("Click on the map to drop a pin first."); return; }
    setSaving(true);
    const res = await setVenueLocationApi(authUser.token, {
      venueId:   venue.id,
      lat:       pinLatLng.lat,
      lng:       pinLatLng.lng,
      geoRadius,
    });
    setSaving(false);
    if (res.ok) onPinned(res.venue);
    else setErr(res.error || "Failed to save location");
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:9200, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:"#fff", borderRadius:16, width:"100%", maxWidth:600, maxHeight:"90vh", display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Header */}
        <div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontWeight:800, fontSize:16, color:C.text, display:"flex", alignItems:"center", gap:8 }}>
              <Pin size={16} color={C.brand}/> Pin Venue Location
            </div>
            <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{venue.name} · {venue.district}</div>
          </div>
          <button onClick={onClose} style={{ border:"none", background:C.bg, borderRadius:"50%", width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            <X size={15} color={C.muted}/>
          </button>
        </div>

        {/* Map */}
        <div style={{ flex:1, minHeight:320, position:"relative" }}>
          {!isLoaded ? (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:320, color:C.muted, fontSize:13 }}>Loading map…</div>
          ) : (
            <GoogleMap
              mapContainerStyle={{ width:"100%", height:"100%", minHeight:320 }}
              center={pinLatLng || KERALA_CENTER}
              zoom={pinLatLng ? 15 : 8}
              onClick={handleMapClick}
              options={{ disableDefaultUI:false, zoomControl:true, streetViewControl:false, fullscreenControl:false, mapTypeControl:false, clickableIcons:false }}>
              {pinLatLng && (
                <OverlayView position={pinLatLng} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                  <div style={{ transform:"translate(-50%,-100%)", display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                    <div style={{ background:C.brand, color:"#fff", borderRadius:8, padding:"4px 8px", fontSize:11, fontWeight:700, whiteSpace:"nowrap", boxShadow:"0 2px 8px rgba(0,0,0,0.25)" }}>
                      {venue.name}
                    </div>
                    <div style={{ width:0, height:0, borderLeft:"6px solid transparent", borderRight:"6px solid transparent", borderTop:`8px solid ${C.brand}` }}/>
                    {/* Geofence circle indicator */}
                    <div style={{ position:"absolute", top:"50%", left:"50%", transform:`translate(-50%,-50%)`, width:32, height:32, borderRadius:"50%", border:`2px solid ${C.brand}`, opacity:.35, pointerEvents:"none" }}/>
                  </div>
                </OverlayView>
              )}
            </GoogleMap>
          )}
          {!pinLatLng && isLoaded && (
            <div style={{ position:"absolute", top:12, left:"50%", transform:"translateX(-50%)", background:"rgba(0,0,0,0.65)", color:"#fff", padding:"6px 14px", borderRadius:20, fontSize:12, pointerEvents:"none", whiteSpace:"nowrap" }}>
              Click the map to drop a pin
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ padding:"14px 20px", borderTop:`1px solid ${C.border}`, display:"flex", flexDirection:"column", gap:10 }}>
          {pinLatLng && (
            <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:C.muted }}>
              <MapPin size={12} color={C.brand}/>
              <span style={{ fontFamily:"'SF Mono',monospace" }}>{pinLatLng.lat.toFixed(5)}, {pinLatLng.lng.toFixed(5)}</span>
              <button onClick={() => setPinLatLng(null)}
                style={{ marginLeft:"auto", fontSize:11, color:C.muted, background:"transparent", border:"none", cursor:"pointer", textDecoration:"underline", fontFamily:"inherit" }}>
                Clear pin
              </button>
            </div>
          )}

          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <label style={{ fontSize:12, fontWeight:700, color:C.text, whiteSpace:"nowrap" }}>Geofence radius (m):</label>
            <input type="number" value={geoRadius} onChange={e => setGeoRadius(Number(e.target.value))} min={50} max={2000}
              style={{ width:80, padding:"6px 10px", border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, fontFamily:"inherit", outline:"none" }}/>
            <span style={{ fontSize:11, color:C.muted }}>PROs must check in within this distance</span>
          </div>

          {err && (
            <div style={{ fontSize:12, color:"#B91C1C", background:"#FEF2F2", padding:"8px 12px", borderRadius:8, display:"flex", alignItems:"center", gap:6 }}>
              <AlertTriangle size={12} color="#B91C1C"/>{err}
            </div>
          )}

          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button onClick={onClose}
              style={{ padding:"9px 18px", borderRadius:10, border:`1px solid ${C.border}`, background:"transparent", color:C.muted, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || !pinLatLng}
              style={{ padding:"9px 20px", borderRadius:10, border:"none", background:pinLatLng ? C.brand : C.border, color:"#fff", fontSize:13, fontWeight:800, cursor:pinLatLng?"pointer":"not-allowed", fontFamily:"inherit", display:"flex", alignItems:"center", gap:6, opacity:saving?.6:1 }}>
              {saving ? "Saving…" : <><Pin size={13}/> Save Location</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function VenuesTab({ authUser, isMobile }) {
  const [venues,   setVenues]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [vSearch,  setVSearch]  = useState("");
  const [vDistrict,setVDistrict]= useState("");
  const [vType,    setVType]    = useState("");
  const [pinVenue, setPinVenue] = useState(null); // venue being pinned

  useEffect(() => {
    setLoading(true);
    getFieldVenuesApi(authUser.token, { limit:500 })
      .then(r => { if (r.ok) setVenues(r.venues || []); })
      .finally(() => setLoading(false));
  }, [authUser.token]);

  const typeOptions = useMemo(() => [...new Set(venues.map(v => v.venue_type).filter(Boolean))].sort(), [venues]);

  const filtered = useMemo(() => venues.filter(v => {
    if (vSearch   && !v.name?.toLowerCase().includes(vSearch.toLowerCase())) return false;
    if (vDistrict && v.district !== vDistrict)  return false;
    if (vType     && v.venue_type !== vType)    return false;
    return true;
  }), [venues, vSearch, vDistrict, vType]);

  const RELN_COLOR = { active:C.success, new:C.info, inactive:C.muted };
  const VenueTypeIcon = ({ type, size=18 }) => {
    if (!type) return <Building2 size={size} color={C.muted}/>;
    const l = type.toLowerCase();
    if (l.includes("school") || l.includes("college")) return <GraduationCap size={size} color={C.brand}/>;
    if (l.includes("coaching") || l.includes("institute")) return <BookOpen size={size} color={C.brand}/>;
    if (l.includes("mall") || l.includes("store") || l.includes("event")) return <Store size={size} color={C.brand}/>;
    return <Building2 size={size} color={C.muted}/>;
  };

  const ss = { padding:"7px 10px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:12, color:C.text, background:C.card, fontFamily:"inherit", outline:"none", cursor:"pointer" };

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:14, padding:"11px 14px", background:C.card, borderRadius:10, border:`1px solid ${C.border}`, alignItems:"center" }}>
        <Filter size={14} color={C.muted}/>
        <input value={vSearch} onChange={e => setVSearch(e.target.value)} placeholder="Search venues…"
          style={{ ...ss, cursor:"text", minWidth:160 }}/>
        <select value={vDistrict} onChange={e => setVDistrict(e.target.value)} style={ss}>
          <option value="">All Districts</option>
          {(KERALA_DISTRICTS || []).map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={vType} onChange={e => setVType(e.target.value)} style={ss}>
          <option value="">All Types</option>
          {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {(vSearch || vDistrict || vType) && (
          <button onClick={() => { setVSearch(""); setVDistrict(""); setVType(""); }}
            style={{ padding:"6px 10px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.muted, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
            <X size={11}/> Clear
          </button>
        )}
        <span style={{ marginLeft:"auto", fontSize:12, color:C.muted }}>{filtered.length} venues</span>
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:60, color:C.muted, fontSize:14 }}>Loading venues…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:48, color:C.muted, fontSize:13, background:C.card, borderRadius:12, border:`1px solid ${C.border}` }}>No venues found</div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
          {filtered.map(v => {
            const relnColor = RELN_COLOR[v.relationship_status] || C.muted;
            return (
              <div key={v.id}
                style={{ background:C.card, borderRadius:12, padding:"14px 16px", border:`1px solid ${C.border}`, boxShadow:"0 1px 3px rgba(0,0,0,.04)", transition:"box-shadow .15s, transform .15s" }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,.1)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,.04)"; e.currentTarget.style.transform = "none"; }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:13, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v.name}</div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:2, display:"flex", alignItems:"center", gap:4 }}>
                      <MapPin size={10} color={C.muted}/>
                      {[v.place, v.district, v.centre].filter(Boolean).join(" · ") || "—"}
                    </div>
                  </div>
                  <div style={{ marginLeft:8, flexShrink:0 }}><VenueTypeIcon type={v.venue_type} size={20}/></div>
                </div>

                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                  <Pill label={v.venue_type || "venue"} color={v.venue_type === "mall" ? C.purple : C.success}/>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 8px", borderRadius:20, background:`${relnColor}10`, color:relnColor, fontSize:11, fontWeight:600 }}>
                    <span style={{ width:5, height:5, borderRadius:"50%", background:relnColor, display:"inline-block" }}/>
                    {v.relationship_status || "new"}
                  </span>
                </div>

                {(v.contact_name || v.contact_phone) && (
                  <div style={{ fontSize:11, marginBottom:10, paddingBottom:10, borderBottom:`1px solid ${C.border}` }}>
                    {v.contact_name && (
                      <span style={{ fontWeight:600, color:C.text }}>
                        {v.contact_name}
                        {v.contact_position && <span style={{ color:C.muted, fontWeight:400 }}> · {v.contact_position}</span>}
                      </span>
                    )}
                    {v.contact_phone && (
                      <a href={`tel:${v.contact_phone}`}
                        style={{ display:"flex", alignItems:"center", gap:4, color:C.info, textDecoration:"none", marginTop:3 }}
                        onClick={e => e.stopPropagation()}>
                        <Phone size={10}/>{v.contact_phone}
                      </a>
                    )}
                  </div>
                )}

                <div style={{ display:"flex", gap:16, alignItems:"center" }}>
                  <div>
                    <span style={{ fontSize:17, fontWeight:800, color:C.brand }}>{v.total_visits || 0}</span>
                    <span style={{ fontSize:10, color:C.muted, marginLeft:4 }}>visits</span>
                  </div>
                  <div>
                    <span style={{ fontSize:17, fontWeight:800, color:C.info }}>{v.total_leads || 0}</span>
                    <span style={{ fontSize:10, color:C.muted, marginLeft:4 }}>leads</span>
                  </div>
                  {(v.total_visits || 0) > 0 && (
                    <div>
                      <span style={{ fontSize:14, fontWeight:700, color:C.success }}>{((v.total_leads||0)/v.total_visits).toFixed(1)}</span>
                      <span style={{ fontSize:10, color:C.muted, marginLeft:4 }}>avg</span>
                    </div>
                  )}
                  <span style={{ marginLeft:"auto", fontSize:10, color:C.faint }}>by {v.created_by || "—"}</span>
                </div>

                {/* Pin location row */}
                <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  {v.geo_confirmed ? (
                    <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:C.success, fontWeight:600 }}>
                      <Check size={11} color={C.success} strokeWidth={3}/>
                      Location pinned · {v.geo_radius || 300}m radius
                    </div>
                  ) : (
                    <div style={{ fontSize:11, color:C.muted }}>No location pinned</div>
                  )}
                  <button onClick={() => setPinVenue(v)}
                    style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:8, border:`1px solid ${v.geo_confirmed ? C.brand+"40" : C.border}`, background:v.geo_confirmed ? `${C.brand}08` : C.bg, color:v.geo_confirmed ? C.brand : C.muted, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                    <Pin size={11}/>{v.geo_confirmed ? "Re-pin" : "Pin Location"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pinVenue && (
        <PinLocationModal
          authUser={authUser}
          venue={pinVenue}
          onClose={() => setPinVenue(null)}
          onPinned={(updated) => {
            setVenues(prev => prev.map(v => v.id === updated.id ? { ...v, ...updated } : v));
            setPinVenue(null);
          }}
        />
      )}
    </div>
  );
}

// ─── FIELD LEADS TAB ─────────────────────────────────────────────────────────
function FieldLeadsTab({ authUser, isMobile }) {
  const [fieldLeads, setFieldLeads] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [lSearch,    setLSearch]    = useState("");
  const [lStatus,    setLStatus]    = useState("");
  const [lPro,       setLPro]       = useState("");
  const [lCentre,    setLCentre]    = useState("");

  useEffect(() => {
    setLoading(true);
    getFieldLeadsApi(authUser.token, { limit:500 })
      .then(r => { if (r.ok) setFieldLeads(r.leads || []); })
      .finally(() => setLoading(false));
  }, [authUser.token]);

  const proOptions    = useMemo(() => [...new Set(fieldLeads.map(l => l.pro_username).filter(Boolean))].sort(), [fieldLeads]);
  const centreOptions = useMemo(() => [...new Set(fieldLeads.map(l => l.centre).filter(Boolean))].sort(), [fieldLeads]);

  const filtered = useMemo(() => fieldLeads.filter(l => {
    const name  = l.full_name || l.name || "";
    const phone = l.phone_number || l.phone || "";
    if (lSearch  && !`${name} ${phone}`.toLowerCase().includes(lSearch.toLowerCase())) return false;
    if (lStatus  && l.crm_status !== lStatus)  return false;
    if (lPro     && l.pro_username !== lPro)   return false;
    if (lCentre  && l.centre !== lCentre)      return false;
    return true;
  }), [fieldLeads, lSearch, lStatus, lPro, lCentre]);

  const statusCounts = useMemo(() => {
    const m = {};
    fieldLeads.forEach(l => { const s = l.crm_status || "New"; m[s] = (m[s]||0)+1; });
    return m;
  }, [fieldLeads]);

  // Conversion funnel
  const total      = fieldLeads.length;
  const contacted  = fieldLeads.filter(l => l.crm_status && l.crm_status !== "New").length;
  const interested = fieldLeads.filter(l => ["Interested","Converted","Enrolled","Visited Center","Callback Requested"].includes(l.crm_status)).length;
  const converted  = fieldLeads.filter(l => ["Converted","Enrolled"].includes(l.crm_status)).length;

  const ss = { padding:"7px 10px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:12, color:C.text, background:C.card, fontFamily:"inherit", outline:"none", cursor:"pointer" };

  return (
    <div>
      {/* Conversion funnel (desktop only) */}
      {!isMobile && total > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
          {[
            { label:"Total Leads",  value:total,      color:C.info,    pct:100 },
            { label:"Contacted",    value:contacted,  color:C.purple,  pct:Math.round((contacted/total)*100) },
            { label:"Interested",   value:interested, color:C.brand,   pct:Math.round((interested/total)*100) },
            { label:"Converted",    value:converted,  color:C.success, pct:Math.round((converted/total)*100) },
          ].map(f => (
            <div key={f.label} style={{ background:C.card, borderRadius:12, padding:"14px 16px", border:`1px solid ${C.border}`, boxShadow:"0 1px 3px rgba(0,0,0,.04)" }}>
              <div style={{ fontSize:11, color:C.muted, fontWeight:500, textTransform:"uppercase", letterSpacing:".04em", marginBottom:4 }}>{f.label}</div>
              <div style={{ fontSize:26, fontWeight:800, color:f.color, lineHeight:1 }}>{f.value}</div>
              <div style={{ marginTop:8, height:3, background:C.border, borderRadius:3 }}>
                <div style={{ height:"100%", width:`${f.pct}%`, background:f.color, borderRadius:3 }}/>
              </div>
              <div style={{ fontSize:11, color:f.color, fontWeight:600, marginTop:4 }}>{f.pct}%</div>
            </div>
          ))}
        </div>
      )}

      {/* Status chips */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
        {Object.entries(statusCounts).sort((a,b) => b[1]-a[1]).map(([s,n]) => {
          const col    = STATUS_COLOR[s] || C.muted;
          const active = lStatus === s;
          return (
            <button key={s} onClick={() => setLStatus(active ? "" : s)}
              style={{ padding:"5px 12px", borderRadius:20, border:`1px solid ${active ? col+"55" : C.border}`, background:active ? `${col}14` : "transparent", color:active ? col : C.muted, fontSize:12, fontWeight:600, cursor:"pointer", transition:"all .12s" }}>
              {s} <strong>{n}</strong>
            </button>
          );
        })}
        {lStatus && (
          <button onClick={() => setLStatus("")}
            style={{ padding:"5px 10px", borderRadius:20, border:`1px solid ${C.border}`, background:"transparent", color:C.muted, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
            <X size={10}/> Clear
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:14, padding:"11px 14px", background:C.card, borderRadius:10, border:`1px solid ${C.border}`, alignItems:"center" }}>
        <Filter size={14} color={C.muted}/>
        <input value={lSearch} onChange={e => setLSearch(e.target.value)} placeholder="Search name or phone…"
          style={{ ...ss, cursor:"text", minWidth:160 }}/>
        {authUser.role === "admin" && (
          <select value={lCentre} onChange={e => setLCentre(e.target.value)} style={ss}>
            <option value="">All Centres</option>
            {centreOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <select value={lPro} onChange={e => setLPro(e.target.value)} style={ss}>
          <option value="">All PROs</option>
          {proOptions.map(p => <option key={p} value={p}>{displayName(p)}</option>)}
        </select>
        <span style={{ marginLeft:"auto", fontSize:12, color:C.muted }}>{filtered.length} leads</span>
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:60, color:C.muted, fontSize:14 }}>Loading field leads…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:48, color:C.muted, fontSize:13, background:C.card, borderRadius:12, border:`1px solid ${C.border}` }}>
          {fieldLeads.length === 0
            ? "No field leads yet — they appear here when PROs capture leads during field visits."
            : "No leads match the current filters"}
        </div>
      ) : isMobile ? (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map((l, i) => {
            const sc   = STATUS_COLOR[l.crm_status] || C.muted;
            const name = l.full_name || l.name || "Unknown";
            const ph   = l.phone_number || l.phone || "";
            return (
              <div key={l.id || i} style={{ padding:"12px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.card }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:6 }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13, color:C.text }}>{name}</div>
                    {ph && <div style={{ fontSize:12, color:C.info }}>{ph}</div>}
                  </div>
                  <span style={{ padding:"3px 10px", borderRadius:20, background:`${sc}15`, color:sc, fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>{l.crm_status || "New"}</span>
                </div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {(l.course_interested||l.course_interest) && <Pill label={l.course_interested||l.course_interest} color={C.purple}/>}
                  {l.centre && <Pill label={l.centre} color={C.info}/>}
                  <span style={{ fontSize:11, color:C.muted }}>by {displayName(l.pro_username)}</span>
                </div>
                {l.crm_counselor && <div style={{ fontSize:11, color:C.muted, marginTop:4, display:"flex", alignItems:"center", gap:3 }}><User size={11}/> {l.crm_counselor}</div>}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ background:C.card, borderRadius:12, border:`1px solid ${C.border}`, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:C.bg }}>
                {["Name","Phone","Course","PRO","Centre","CRM Status","Counselor","Date"].map(h => (
                  <th key={h} style={{ padding:"9px 16px", textAlign:"left", fontSize:11, fontWeight:600, color:C.muted, letterSpacing:.4, borderBottom:`1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => {
                const sc   = STATUS_COLOR[l.crm_status] || C.muted;
                const name = l.full_name || l.name || "—";
                const ph   = l.phone_number || l.phone || "";
                return (
                  <tr key={l.id || i}
                    style={{ borderBottom:`1px solid ${C.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = "#FAFAFA"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding:"10px 16px", fontWeight:600, fontSize:13, color:C.text }}>{name}</td>
                    <td style={{ padding:"10px 16px", fontSize:12 }}>
                      {ph ? <a href={`tel:${ph}`} style={{ color:C.info, textDecoration:"none" }}>{ph}</a> : "—"}
                    </td>
                    <td style={{ padding:"10px 16px" }}>
                      {(l.course_interested||l.course_interest)
                        ? <Pill label={l.course_interested||l.course_interest} color={C.purple}/>
                        : "—"}
                    </td>
                    <td style={{ padding:"10px 16px", fontSize:12, color:C.text }}>{displayName(l.pro_username)}</td>
                    <td style={{ padding:"10px 16px" }}>{l.centre ? <Pill label={l.centre} color={C.info}/> : "—"}</td>
                    <td style={{ padding:"10px 16px" }}>
                      <span style={{ padding:"3px 10px", borderRadius:20, background:`${sc}15`, color:sc, fontSize:11, fontWeight:700 }}>
                        {l.crm_status || "New"}
                      </span>
                    </td>
                    <td style={{ padding:"10px 16px", fontSize:12, color:C.muted }}>{l.crm_counselor || "—"}</td>
                    <td style={{ padding:"10px 16px", fontSize:11, color:C.faint, whiteSpace:"nowrap" }}>
                      {l.created_at ? new Date(l.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short"}) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
// ─── Targets Tab ─────────────────────────────────────────────────────────────
function TargetsTab({ authUser, proMap, activities, isMobile }) {
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}`;

  const [monthYear,  setMonthYear]  = useState(defaultMonth);
  const [targets,    setTargets]    = useState({});   // { pro_username: { target_visits, target_leads } }
  const [editing,    setEditing]    = useState({});   // { pro_username: { visits: N, leads: N } }
  const [saving,     setSaving]     = useState({});   // { pro_username: bool }
  const [saved,      setSaved]      = useState({});   // { pro_username: bool } — brief tick
  const [loadingT,   setLoadingT]   = useState(false);
  const [errMsg,     setErrMsg]     = useState(null);

  // Load targets whenever month changes
  useEffect(() => {
    setLoadingT(true);
    setErrMsg(null);
    getFieldTargetsApi(authUser.token, { monthYear })
      .then(r => {
        if (!r.ok) return setErrMsg(r.error || "Failed to load targets");
        const map = {};
        (r.targets || []).forEach(t => { map[t.pro_username] = t; });
        setTargets(map);
        setEditing({});
      })
      .finally(() => setLoadingT(false));
  }, [authUser.token, monthYear]);

  // Per-PRO actuals for selected month (from activities we already have)
  const monthActuals = useMemo(() => {
    const m = {};
    activities
      .filter(a => (a.activity_date || "").startsWith(monthYear))
      .forEach(a => {
        if (!m[a.pro_username]) m[a.pro_username] = { visits:0, leads:0, centre: a.centre };
        m[a.pro_username].visits++;
        m[a.pro_username].leads += (a.leads_captured || 0);
      });
    return m;
  }, [activities, monthYear]);

  // All PROs seen in any activity (unique list)
  const allPros = useMemo(() => {
    const seen = {};
    activities.forEach(a => {
      if (!seen[a.pro_username]) seen[a.pro_username] = { username: a.pro_username, centre: a.centre };
    });
    return Object.values(seen).sort((a, b) => a.username.localeCompare(b.username));
  }, [activities]);

  const startEdit = (pro) => {
    const existing = targets[pro.username] || {};
    setEditing(e => ({ ...e, [pro.username]: {
      visits: existing.target_visits ?? 0,
      leads:  existing.target_leads  ?? 0,
    }}));
  };

  const cancelEdit = (username) => {
    setEditing(e => { const n = {...e}; delete n[username]; return n; });
  };

  const saveTarget = async (pro) => {
    const vals = editing[pro.username];
    if (!vals) return;
    setSaving(s => ({ ...s, [pro.username]: true }));
    const r = await setFieldTargetApi(authUser.token, {
      proUsername:   pro.username,
      monthYear,
      targetVisits:  parseInt(vals.visits) || 0,
      targetLeads:   parseInt(vals.leads)  || 0,
      centre:        pro.centre,
    });
    setSaving(s => ({ ...s, [pro.username]: false }));
    if (r.ok) {
      setTargets(t => ({ ...t, [pro.username]: r.target }));
      cancelEdit(pro.username);
      setSaved(s => ({ ...s, [pro.username]: true }));
      setTimeout(() => setSaved(s => { const n={...s}; delete n[pro.username]; return n; }), 1800);
    } else {
      setErrMsg(r.error || "Save failed");
    }
  };

  const monthLabel = new Date(monthYear + "-01").toLocaleString("en-IN", { month:"long", year:"numeric" });

  const ProgBar = ({ value, target, color }) => {
    const pct = target > 0 ? Math.min(100, Math.round((value/target)*100)) : 0;
    return (
      <div style={{ width:"100%", minWidth: isMobile ? 60 : 80 }}>
        <div style={{ fontSize:11, color: C.muted, marginBottom:3 }}>{value}/{target || "—"}</div>
        {target > 0 && (
          <div style={{ height:6, borderRadius:3, background: C.border, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${pct}%`, borderRadius:3, background: pct>=100 ? C.success : color }}/>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Header controls */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontWeight:700, fontSize:15, color:C.text }}>Monthly Targets</div>
          <div style={{ fontSize:12, color:C.muted, marginTop:1 }}>Set visit & lead targets per PRO for any month</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <input type="month" value={monthYear} onChange={e => setMonthYear(e.target.value)}
            style={{ border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 12px", fontSize:13, color:C.text, background:C.card, outline:"none", cursor:"pointer" }}/>
        </div>
      </div>

      {errMsg && (
        <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#B91C1C" }}>{errMsg}</div>
      )}

      {/* Table */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
        {/* Desktop header */}
        {!isMobile && (
          <div style={{ padding:"12px 18px", borderBottom:`1px solid ${C.border}`, background:"#F9FAFB",
            display:"grid", gridTemplateColumns:"1fr 100px 120px 120px 120px 80px",
            gap:12, alignItems:"center" }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".04em" }}>PRO · Centre</div>
            <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".04em" }}>Actual Visits</div>
            <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".04em" }}>Actual Leads</div>
            <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".04em" }}>Visit Target</div>
            <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".04em" }}>Lead Target</div>
            <div/>
          </div>
        )}

        {loadingT ? (
          <div style={{ padding:"32px 24px", textAlign:"center", color:C.muted, fontSize:13 }}>Loading targets…</div>
        ) : allPros.length === 0 ? (
          <div style={{ padding:"40px 24px", textAlign:"center", color:C.muted, fontSize:13 }}>
            No PRO activity found. Targets can only be set for PROs who have logged at least one activity.
          </div>
        ) : (
          allPros.map((pro, i) => {
            const tgt    = targets[pro.username] || {};
            const actual = monthActuals[pro.username] || { visits:0, leads:0 };
            const isEdit = !!editing[pro.username];
            const isSav  = saving[pro.username];
            const wasSaved = saved[pro.username];
            const ev     = editing[pro.username] || {};

            if (isMobile) {
              /* ── Mobile card layout ── */
              return (
                <div key={pro.username}
                  style={{ borderBottom: i < allPros.length-1 ? `1px solid ${C.border}` : "none",
                    padding:"14px 14px",
                    background: isEdit ? `${C.brand}06` : "transparent",
                    transition:"background .12s",
                  }}>
                  {/* PRO name + centre */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14, color:C.text }}>
                        {pro.username.replace(/\.pro$/i,"").replace(/^\w/,c=>c.toUpperCase())}
                      </div>
                      <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{pro.centre}</div>
                    </div>
                    {/* Edit / Save button top-right */}
                    <div style={{ display:"flex", gap:6 }}>
                      {isEdit ? (
                        <>
                          <button onClick={() => cancelEdit(pro.username)}
                            style={{ padding:"6px 10px", borderRadius:7, border:`1px solid ${C.border}`, background:"transparent", color:C.muted, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center" }}>
                            <X size={14}/>
                          </button>
                          <button onClick={() => saveTarget(pro)} disabled={isSav}
                            style={{ padding:"7px 14px", borderRadius:7, border:"none", background:C.brand, color:"#fff",
                              fontSize:12, fontWeight:700, cursor: isSav ? "not-allowed" : "pointer", opacity: isSav ? 0.7 : 1,
                              display:"flex", alignItems:"center", gap:4 }}>
                            {isSav ? "…" : <><Check size={12}/> Save</>}
                          </button>
                        </>
                      ) : (
                        <button onClick={() => startEdit(pro)}
                          style={{ padding:"7px 14px", borderRadius:7, border:`1px solid ${C.border}`, background:"transparent",
                            color: wasSaved ? C.success : C.muted, fontSize:12, fontWeight:600, cursor:"pointer",
                            display:"flex", alignItems:"center", gap:4 }}>
                          {wasSaved ? <><Check size={12}/> Saved</> : <><Edit2 size={11}/> Set</>}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actuals row */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                    <div style={{ background:"#F9FAFB", borderRadius:8, padding:"8px 10px" }}>
                      <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:".04em", marginBottom:4 }}>Actual Visits</div>
                      <ProgBar value={actual.visits} target={tgt.target_visits||0} color={C.brand}/>
                    </div>
                    <div style={{ background:"#F9FAFB", borderRadius:8, padding:"8px 10px" }}>
                      <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:".04em", marginBottom:4 }}>Actual Leads</div>
                      <ProgBar value={actual.leads} target={tgt.target_leads||0} color={C.info}/>
                    </div>
                  </div>

                  {/* Target inputs row */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    <div>
                      <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:".04em", marginBottom:4 }}>Visit Target</div>
                      {isEdit ? (
                        <input type="number" min="0" value={ev.visits}
                          onChange={e => setEditing(ed => ({ ...ed, [pro.username]: { ...ed[pro.username], visits: e.target.value }}))}
                          style={{ width:"100%", border:`1.5px solid ${C.brand}`, borderRadius:7, padding:"8px 10px",
                            fontSize:14, fontWeight:600, color:C.text, background:C.card, outline:"none", textAlign:"center", boxSizing:"border-box" }}/>
                      ) : (
                        <div style={{ fontSize:16, fontWeight:700, color: tgt.target_visits ? C.text : C.faint, padding:"6px 0" }}>
                          {tgt.target_visits || "—"}
                        </div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:"uppercase", letterSpacing:".04em", marginBottom:4 }}>Lead Target</div>
                      {isEdit ? (
                        <input type="number" min="0" value={ev.leads}
                          onChange={e => setEditing(ed => ({ ...ed, [pro.username]: { ...ed[pro.username], leads: e.target.value }}))}
                          style={{ width:"100%", border:`1.5px solid ${C.info}`, borderRadius:7, padding:"8px 10px",
                            fontSize:14, fontWeight:600, color:C.text, background:C.card, outline:"none", textAlign:"center", boxSizing:"border-box" }}/>
                      ) : (
                        <div style={{ fontSize:16, fontWeight:700, color: tgt.target_leads ? C.text : C.faint, padding:"6px 0" }}>
                          {tgt.target_leads || "—"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            /* ── Desktop grid row ── */
            return (
              <div key={pro.username}
                style={{ borderBottom: i < allPros.length-1 ? `1px solid ${C.border}` : "none",
                  padding:"14px 18px",
                  display:"grid",
                  gridTemplateColumns:"1fr 100px 120px 120px 120px 80px",
                  gap:12, alignItems:"center",
                  background: isEdit ? `${C.brand}05` : "transparent",
                  transition:"background .12s",
                }}>
                {/* PRO name */}
                <div>
                  <div style={{ fontWeight:600, fontSize:14, color:C.text }}>
                    {pro.username.replace(/\.pro$/i,"").replace(/^\w/,c=>c.toUpperCase())}
                  </div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>{pro.centre}</div>
                </div>

                <ProgBar value={actual.visits} target={tgt.target_visits||0} color={C.brand}/>
                <ProgBar value={actual.leads} target={tgt.target_leads||0} color={C.info}/>

                {/* Visit target input */}
                <div>
                  {isEdit ? (
                    <input type="number" min="0" value={ev.visits}
                      onChange={e => setEditing(ed => ({ ...ed, [pro.username]: { ...ed[pro.username], visits: e.target.value }}))}
                      style={{ width:"100%", border:`1.5px solid ${C.brand}`, borderRadius:7, padding:"6px 8px",
                        fontSize:13, fontWeight:600, color:C.text, background:C.card, outline:"none", textAlign:"center" }}/>
                  ) : (
                    <div style={{ fontSize:15, fontWeight:700, color: tgt.target_visits ? C.text : C.faint }}>
                      {tgt.target_visits || "—"}
                    </div>
                  )}
                </div>

                {/* Lead target input */}
                <div>
                  {isEdit ? (
                    <input type="number" min="0" value={ev.leads}
                      onChange={e => setEditing(ed => ({ ...ed, [pro.username]: { ...ed[pro.username], leads: e.target.value }}))}
                      style={{ width:"100%", border:`1.5px solid ${C.info}`, borderRadius:7, padding:"6px 8px",
                        fontSize:13, fontWeight:600, color:C.text, background:C.card, outline:"none", textAlign:"center" }}/>
                  ) : (
                    <div style={{ fontSize:15, fontWeight:700, color: tgt.target_leads ? C.text : C.faint }}>
                      {tgt.target_leads || "—"}
                    </div>
                  )}
                </div>

                {/* Action button */}
                <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                  {isEdit ? (
                    <>
                      <button onClick={() => cancelEdit(pro.username)}
                        style={{ padding:"6px 10px", borderRadius:7, border:`1px solid ${C.border}`, background:"transparent", color:C.muted, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center" }}>
                        <X size={14}/>
                      </button>
                      <button onClick={() => saveTarget(pro)} disabled={isSav}
                        style={{ padding:"6px 12px", borderRadius:7, border:"none", background:C.brand, color:"#fff",
                          fontSize:12, fontWeight:700, cursor: isSav ? "not-allowed" : "pointer", opacity: isSav ? 0.7 : 1,
                          display:"flex", alignItems:"center", gap:4 }}>
                        {isSav ? "…" : <><Check size={12}/> Save</>}
                      </button>
                    </>
                  ) : (
                    <button onClick={() => startEdit(pro)}
                      style={{ padding:"6px 12px", borderRadius:7, border:`1px solid ${C.border}`, background:"transparent",
                        color: wasSaved ? C.success : C.muted, fontSize:12, fontWeight:600, cursor:"pointer",
                        display:"flex", alignItems:"center", gap:4 }}>
                      {wasSaved ? <><Check size={12}/> Saved</> : <><Edit2 size={11}/> Set</>}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={{ fontSize:11, color:C.faint }}>
        Targets for <strong>{monthLabel}</strong>. PROs see their progress bars on the Field Tracker app dashboard.
      </div>
    </div>
  );
}

// ─── helpers for Leaflet custom markers ──────────────────────────────────────
// ─── Google Maps PRO marker (custom HTML overlay) ─────────────────────────────
function ProMarker({ session, selected, onClick, elapsedLabel }) {
  const initial = (session.pro_username || "?")[0].toUpperCase();
  return (
    <OverlayView
      position={{ lat: session.lat, lng: session.lng }}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <div
        onClick={onClick}
        style={{ position:"relative", width:44, height:44, cursor:"pointer", transform:"translate(-22px,-44px)" }}
      >
        {session.selfie_photo ? (
          <div style={{
            width:44, height:44, borderRadius:"50%",
            border:`3px solid ${selected ? "#fff" : "#16A34A"}`,
            overflow:"hidden",
            boxShadow: selected ? "0 0 0 3px #16A34A, 0 4px 14px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.25)",
            background:"#fff",
          }}>
            <img src={session.selfie_photo} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="selfie"/>
          </div>
        ) : (
          <div style={{
            width:44, height:44, borderRadius:"50%",
            border:`3px solid ${selected ? "#fff" : "#7e1749"}`,
            background:"#7e1749",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow: selected ? "0 0 0 3px #7e1749, 0 4px 14px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.25)",
            color:"#fff", fontWeight:800, fontSize:18, fontFamily:"sans-serif",
          }}>
            {initial}
          </div>
        )}
        <div style={{
          width:10, height:10, borderRadius:"50%",
          background:"#16A34A", border:"2px solid #fff",
          position:"absolute", bottom:1, right:1,
          animation:"_lpulse 2s ease-in-out infinite",
        }}/>
      </div>
    </OverlayView>
  );
}

const GMAP_OPTIONS = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  fullscreenControl: true,
  mapTypeControl: false,
  clickableIcons: false,
  styles: [
    { featureType:"poi", elementType:"labels", stylers:[{ visibility:"off" }] },
    { featureType:"transit", elementType:"labels", stylers:[{ visibility:"off" }] },
  ],
};

// ─── LIVE TAB ─────────────────────────────────────────────────────────────────
function LiveTab({ authUser, isMobile }) {
  const [sessions,    setSessions]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [refreshing,  setRefreshing]  = useState(false);
  const [view,        setView]        = useState("map"); // "map" | "cards"
  const [selected,    setSelected]    = useState(null);
  const [tick,        setTick]        = useState(0);
  const mapRef                        = useRef(null);

  const { isLoaded: gmapLoaded } = useJsApiLoader({
    googleMapsApiKey: GMAP_KEY,
    id: "vsa-gmap",
  });

  const load = async (manual = false) => {
    if (manual) setRefreshing(true);
    const r = await getLiveSessionsApi(authUser.token);
    if (r.ok) setSessions(r.sessions || []);
    setLoading(false);
    setRefreshing(false);
    setLastRefresh(new Date());
  };

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [authUser.token]);
  useEffect(() => { const t = setInterval(() => setTick(k => k+1), 10000); return () => clearInterval(t); }, []);

  // Auto-fit bounds when map loads or sessions change
  const fitBounds = useCallback((map) => {
    if (!map) return;
    const pts = sessions.filter(s => s.lat && s.lng);
    if (pts.length === 0) {
      map.setCenter({ lat:10.8505, lng:76.2711 });
      map.setZoom(8);
    } else if (pts.length === 1) {
      map.setCenter({ lat: pts[0].lat, lng: pts[0].lng });
      map.setZoom(14);
    } else {
      const bounds = new window.google.maps.LatLngBounds();
      pts.forEach(s => bounds.extend({ lat: s.lat, lng: s.lng }));
      map.fitBounds(bounds, 60);
    }
  }, [sessions]);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    fitBounds(map);
  }, [fitBounds]);

  useEffect(() => { fitBounds(mapRef.current); }, [sessions]);

  const elapsed = (at) => {
    const m = Math.floor((Date.now() - new Date(at)) / 60000);
    return m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60}m`;
  };
  const fmtRefresh = () => {
    if (!lastRefresh) return "";
    const s = Math.floor((Date.now() - lastRefresh) / 1000);
    return s < 60 ? `${s}s ago` : `${Math.floor(s/60)}m ago`;
  };

  const gpsCount   = sessions.filter(s => s.lat && s.lng).length;
  const selSession = sessions.find(s => s.id === selected);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <style>{`
        @keyframes _lpulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.6);opacity:.5} }
        @keyframes _spin    { to { transform:rotate(360deg); } }
        .gm-style-iw { padding:0 !important; border-radius:14px !important; overflow:hidden !important; }
        .gm-style-iw-d { overflow:hidden !important; padding:0 !important; }
        .gm-style-iw-c { padding:0 !important; border-radius:14px !important; box-shadow:0 8px 32px rgba(0,0,0,0.18) !important; }
        .gm-style-iw-tc::after { display:none; }
        button.gm-ui-hover-effect { top:4px !important; right:4px !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:10, height:10, borderRadius:"50%", background:"#16A34A", animation:"_lpulse 2s ease-in-out infinite" }}/>
          <span style={{ fontWeight:800, fontSize:16, color:C.text }}>
            {sessions.length > 0 ? `${sessions.length} PRO${sessions.length>1?"s":""} Active` : "Live Tracker"}
          </span>
          {gpsCount > 0 && <span style={{ fontSize:11, color:C.muted }}>· {gpsCount} on map</span>}
          {lastRefresh && <span style={{ fontSize:11, color:C.faint }}>· {fmtRefresh()}</span>}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {/* View toggle */}
          <div style={{ display:"flex", border:`1px solid ${C.border}`, borderRadius:8, overflow:"hidden" }}>
            {["map","cards"].map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{ padding:"6px 14px", border:"none", background: view===v ? C.brand : C.card, color: view===v ? "#fff" : C.muted, fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit", textTransform:"capitalize" }}>
                {v === "map" ? "Map" : "Cards"}
              </button>
            ))}
          </div>
          {/* Refresh */}
          <button onClick={() => load(true)} disabled={refreshing}
            style={{ display:"flex", alignItems:"center", gap:5, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 12px", background:C.card, cursor:"pointer", fontFamily:"inherit", fontSize:12, color:C.muted, fontWeight:600 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              style={{ animation: refreshing ? "_spin .8s linear infinite" : "none" }}>
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:80, color:C.muted, fontSize:13 }}>Loading…</div>
      ) : sessions.length === 0 ? (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"60px 24px", textAlign:"center" }}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:14 }}><MapPin size={36} color={C.muted}/></div>
          <div style={{ fontWeight:700, fontSize:15, color:C.text, marginBottom:6 }}>No active visits right now</div>
          <div style={{ fontSize:13, color:C.muted }}>PROs appear here when they check in from the Field Tracker app.</div>
        </div>
      ) : view === "map" ? (
        /* ── MAP VIEW ── */
        <div style={{ display:"flex", gap:14, flexDirection: isMobile ? "column" : "row" }}>

          {/* Google Map */}
          <div style={{ flex:1, borderRadius:16, overflow:"hidden", border:`1px solid ${C.border}`, boxShadow:"0 2px 16px rgba(0,0,0,0.08)", minHeight:480 }}>
            {gmapLoaded ? (
              <GoogleMap
                mapContainerStyle={{ height: isMobile ? 340 : 520, width:"100%" }}
                center={{ lat:10.8505, lng:76.2711 }}
                zoom={8}
                options={GMAP_OPTIONS}
                onLoad={onMapLoad}
                onClick={() => setSelected(null)}
              >
                {/* PRO markers */}
                {sessions.filter(s => s.lat && s.lng).map(s => (
                  <ProMarker
                    key={s.id}
                    session={s}
                    selected={s.id === selected}
                    elapsedLabel={elapsed(s.check_in_at)}
                    onClick={(e) => { e.stopPropagation(); setSelected(s.id === selected ? null : s.id); }}
                  />
                ))}

                {/* Info popup for selected PRO */}
                {selSession && selSession.lat && selSession.lng && (
                  <InfoWindow
                    position={{ lat: selSession.lat, lng: selSession.lng }}
                    onCloseClick={() => setSelected(null)}
                    options={{ pixelOffset: new window.google.maps.Size(0, -50) }}
                  >
                    <div style={{ fontFamily:"system-ui,sans-serif", width:260 }}>
                      {/* Popup header */}
                      <div style={{ background:"linear-gradient(135deg,#16A34A,#15803D)", padding:"12px 16px", display:"flex", alignItems:"center", gap:10 }}>
                        {selSession.selfie_photo
                          ? <img src={selSession.selfie_photo} style={{ width:40,height:40,borderRadius:8,objectFit:"cover",border:"2px solid rgba(255,255,255,0.4)",flexShrink:0 }} alt="selfie"/>
                          : <div style={{ width:40,height:40,borderRadius:8,background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:18,flexShrink:0 }}>
                              {(selSession.pro_username||"?")[0].toUpperCase()}
                            </div>
                        }
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:800,fontSize:14,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{selSession.pro_username}</div>
                          <div style={{ fontSize:11,color:"rgba(255,255,255,0.8)" }}>{selSession.centre}</div>
                        </div>
                        <div style={{ background:"rgba(255,255,255,0.2)", borderRadius:20, padding:"3px 10px", fontSize:12, fontWeight:800, color:"#fff", whiteSpace:"nowrap", flexShrink:0 }}>
                          {elapsed(selSession.check_in_at)}
                        </div>
                      </div>
                      {/* Popup body */}
                      <div style={{ padding:"12px 16px" }}>
                        <div style={{ fontWeight:700, fontSize:14, color:"#111827", marginBottom:3 }}>{selSession.venue_name}</div>
                        {selSession.district && <div style={{ fontSize:12, color:"#6B7280", marginBottom:8 }}>{selSession.district}</div>}
                        <div style={{ fontSize:11, color:"#9CA3AF" }}>
                          Since {new Date(selSession.check_in_at).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}
                        </div>
                        <div style={{ display:"flex", gap:6, marginTop:10, flexWrap:"wrap" }}>
                          <span style={{ background:"#EFF6FF", color:"#2563EB", border:"1px solid #BFDBFE", borderRadius:20, padding:"3px 10px", fontSize:10, fontWeight:700 }}>
                            GPS Verified
                          </span>
                          {selSession.selfie_photo && (
                            <span style={{ background:"#F0FDF4", color:"#16A34A", border:"1px solid #BBF7D0", borderRadius:20, padding:"3px 10px", fontSize:10, fontWeight:700 }}>
                              Selfie
                            </span>
                          )}
                        </div>
                        <a
                          href={`https://www.google.com/maps?q=${selSession.lat},${selSession.lng}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ display:"inline-flex", alignItems:"center", gap:5, marginTop:10, color:"#2563EB", fontSize:11, fontWeight:600, textDecoration:"none" }}
                        >
                          <MapPin size={11}/> View in Google Maps
                        </a>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            ) : (
              <div style={{ height: isMobile ? 340 : 520, display:"flex", alignItems:"center", justifyContent:"center", color:C.muted, fontSize:13 }}>
                Loading map…
              </div>
            )}
          </div>

          {/* Side list */}
          <div style={{ width: isMobile ? "100%" : 280, display:"flex", flexDirection:"column", gap:10, flexShrink:0 }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".06em" }}>
              All Sessions ({sessions.length})
            </div>
            {sessions.map(s => (
              <div key={s.id}
                onClick={() => setSelected(s.id === selected ? null : s.id)}
                style={{ background:C.card, border:`1.5px solid ${s.id===selected ? "#16A34A" : C.border}`, borderRadius:12, padding:"12px 14px", cursor:"pointer", transition:"border-color .15s", boxShadow: s.id===selected ? "0 0 0 3px #16A34A18" : "none" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  {s.selfie_photo
                    ? <img src={s.selfie_photo} style={{ width:36,height:36,borderRadius:8,objectFit:"cover",flexShrink:0 }} alt="selfie"/>
                    : <div style={{ width:36,height:36,borderRadius:8,background:`${C.brand}12`,display:"flex",alignItems:"center",justifyContent:"center",color:C.brand,fontWeight:800,fontSize:15,flexShrink:0 }}>
                        {(s.pro_username||"?")[0].toUpperCase()}
                      </div>
                  }
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:13, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.pro_username}</div>
                    <div style={{ fontSize:11, color:C.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.venue_name}</div>
                  </div>
                  <div style={{ flexShrink:0, textAlign:"right" }}>
                    <div style={{ fontSize:12, fontWeight:800, color:"#16A34A" }}>{elapsed(s.check_in_at)}</div>
                    {!s.lat && <div style={{ fontSize:9, color:C.faint, marginTop:2 }}>No GPS</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── CARDS VIEW ── */
        <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(340px,1fr))", gap:14 }}>
          {sessions.map(s => (
            <div key={s.id} style={{ background:C.card, border:`1.5px solid #16A34A25`, borderRadius:16, overflow:"hidden", boxShadow:"0 2px 12px rgba(22,163,74,0.07)" }}>
              <div style={{ background:"linear-gradient(135deg,#16A34A,#15803D)", padding:"10px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <div style={{ width:7,height:7,borderRadius:"50%",background:"#fff",animation:"_lpulse 2s ease-in-out infinite" }}/>
                  <span style={{ color:"#fff",fontWeight:700,fontSize:11,letterSpacing:".06em",textTransform:"uppercase" }}>Live Visit</span>
                </div>
                <span style={{ background:"rgba(255,255,255,0.2)",color:"#fff",borderRadius:20,padding:"3px 10px",fontSize:12,fontWeight:800 }}>
                  {elapsed(s.check_in_at)}
                </span>
              </div>
              <div style={{ padding:"14px 16px", display:"flex", gap:14 }}>
                {s.selfie_photo
                  ? <img src={s.selfie_photo} style={{ width:54,height:54,borderRadius:12,objectFit:"cover",border:"2px solid #16A34A30",flexShrink:0 }} alt="selfie"/>
                  : <div style={{ width:54,height:54,borderRadius:12,background:`${C.brand}12`,border:`1px solid ${C.brand}20`,display:"flex",alignItems:"center",justifyContent:"center",color:C.brand,fontWeight:800,fontSize:20,flexShrink:0 }}>
                      {(s.pro_username||"?")[0].toUpperCase()}
                    </div>
                }
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:800,fontSize:15,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.venue_name}</div>
                  {s.district && <div style={{ fontSize:12,color:C.muted,marginTop:2 }}>{s.district}</div>}
                  <div style={{ fontSize:12,color:C.text,fontWeight:600,marginTop:6 }}>{s.pro_username}</div>
                  <div style={{ fontSize:11,color:C.muted }}>{s.centre} · Since {new Date(s.check_in_at).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</div>
                </div>
              </div>
              <div style={{ padding:"10px 16px", borderTop:`1px solid ${C.border}`, display:"flex", gap:8, flexWrap:"wrap" }}>
                {s.lat && s.lng
                  ? <a href={`https://www.google.com/maps?q=${s.lat},${s.lng}`} target="_blank" rel="noopener noreferrer"
                      style={{ display:"inline-flex",alignItems:"center",gap:5,background:"#EFF6FF",color:"#2563EB",border:"1px solid #BFDBFE",borderRadius:20,padding:"4px 12px",fontSize:11,fontWeight:700,textDecoration:"none" }}>
                      <MapPin size={11}/> GPS Verified · View Map
                    </a>
                  : <span style={{ display:"inline-flex",alignItems:"center",gap:5,background:C.bg,color:C.muted,border:`1px solid ${C.border}`,borderRadius:20,padding:"4px 12px",fontSize:11,fontWeight:600 }}>
                      <MapPin size={11}/> No GPS
                    </span>
                }
                {s.selfie_photo && (
                  <span style={{ display:"inline-flex",alignItems:"center",gap:5,background:"#F0FDF4",color:"#16A34A",border:"1px solid #BBF7D0",borderRadius:20,padding:"4px 12px",fontSize:11,fontWeight:700 }}>
                    <Camera size={11}/> Selfie Verified
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TERRITORY ADMIN TAB ──────────────────────────────────────────────────────
function TerritoryAdminTab({ authUser, proMap, isMobile }) {
  const [territories, setTerritories] = useState([]);
  const [editing,     setEditing]     = useState({}); // { pro_username: [districts] }
  const [saving,      setSaving]      = useState({});
  const [saved,       setSaved]       = useState({});
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    getTerritoriesApi(authUser.token).then(r => {
      if (r.ok) setTerritories(r.territories || []);
      setLoading(false);
    });
  }, [authUser.token]);

  const territoryMap = {};
  territories.forEach(t => { territoryMap[t.pro_username] = t.districts || []; });

  const toggleDistrict = (pro, dist) => {
    const cur = editing[pro] ?? (territoryMap[pro] || []);
    const next = cur.includes(dist) ? cur.filter(d => d !== dist) : [...cur, dist];
    setEditing(e => ({ ...e, [pro]: next }));
  };

  const handleSave = async (pro) => {
    setSaving(s => ({ ...s, [pro]: true }));
    const districts = editing[pro] ?? (territoryMap[pro] || []);
    const res = await setTerritoryApi(authUser.token, { proUsername: pro, districts });
    setSaving(s => ({ ...s, [pro]: false }));
    if (res.ok) {
      setTerritories(prev => {
        const idx = prev.findIndex(t => t.pro_username === pro);
        if (idx >= 0) { const n = [...prev]; n[idx] = { ...n[idx], districts }; return n; }
        return [...prev, { pro_username: pro, districts }];
      });
      setSaved(s => ({ ...s, [pro]: true }));
      setTimeout(() => setSaved(s => ({ ...s, [pro]: false })), 2000);
      setEditing(e => { const n = {...e}; delete n[pro]; return n; });
    }
  };

  const KERALA_DISTRICTS_LIST = ["Thiruvananthapuram","Kollam","Pathanamthitta","Alappuzha","Kottayam","Idukki","Ernakulam","Thrissur","Palakkad","Malappuram","Kozhikode","Wayanad","Kannur","Kasaragod"];

  if (loading) return <div style={{ textAlign:"center", padding:60, color:C.muted }}>Loading…</div>;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ fontSize:13, color:C.muted, marginBottom:4 }}>Assign Kerala districts to each PRO. PROs see their territory on the Field Tracker app.</div>

      {proMap.map(pro => {
        const cur = editing[pro.username] ?? (territoryMap[pro.username] || []);
        const isDirty = editing[pro.username] !== undefined;
        const isSav = saving[pro.username];
        const wasSaved = saved[pro.username];

        return (
          <div key={pro.username} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px 18px" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:14, color:C.text }}>{displayName(pro.username)}</div>
                <div style={{ fontSize:12, color:C.muted }}>{pro.centre} · {cur.length} district{cur.length !== 1 ? "s" : ""} assigned</div>
              </div>
              <button onClick={() => handleSave(pro.username)} disabled={isSav || (!isDirty && !wasSaved)}
                style={{ padding:"7px 16px", borderRadius:8, border:"none", background: wasSaved ? C.success : C.brand, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", opacity:isSav?0.7:1, display:"flex", alignItems:"center", gap:5 }}>
                {isSav ? "Saving…" : wasSaved ? <><Check size={13}/> Saved</> : "Save"}
              </button>
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
              {KERALA_DISTRICTS_LIST.map(d => {
                const on = cur.includes(d);
                return (
                  <button key={d} onClick={() => toggleDistrict(pro.username, d)}
                    style={{ padding: isMobile ? "7px 14px" : "5px 12px", borderRadius:20, border:`1.5px solid ${on ? C.brand : C.border}`, background: on ? `${C.brand}12` : "transparent",
                      color: on ? C.brand : C.muted, fontSize: isMobile ? 13 : 12, fontWeight: on ? 700 : 500, cursor:"pointer", fontFamily:"inherit" }}>
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {proMap.length === 0 && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"48px 24px", textAlign:"center", color:C.muted, fontSize:13 }}>
          No PROs found. Territory assignment requires at least one PRO with logged activities.
        </div>
      )}
    </div>
  );
}

// ─── PHOTOS TAB ───────────────────────────────────────────────────────────────
function PhotosTab({ authUser, proMap, isMobile }) {
  const [photos,      setPhotos]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [lightbox,    setLightbox]    = useState(null); // signed URL
  const [filterPro,   setFilterPro]   = useState("");
  const [filterFrom,  setFilterFrom]  = useState("");
  const [filterTo,    setFilterTo]    = useState("");

  const load = useCallback(() => {
    setLoading(true);
    getFieldPhotosApi(authUser.token, {
      limit: 60,
      ...(filterPro  ? { proUsername: filterPro }  : {}),
      ...(filterFrom ? { dateFrom: filterFrom }     : {}),
      ...(filterTo   ? { dateTo:   filterTo }       : {}),
    }).then(r => {
      if (r.ok) setPhotos(r.photos || []);
      setLoading(false);
    });
  }, [authUser.token, filterPro, filterFrom, filterTo]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      {/* Filters */}
      <div style={{ display:"flex", flexDirection: isMobile ? "column" : "row", gap:10, flexWrap:"wrap", marginBottom:18 }}>
        <select value={filterPro} onChange={e => setFilterPro(e.target.value)}
          style={{ padding:"9px 12px", border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, fontFamily:"inherit", background:"#fff", width: isMobile ? "100%" : "auto" }}>
          <option value="">All PROs</option>
          {proMap.map(p => <option key={p.username} value={p.username}>{p.username}</option>)}
        </select>
        <div style={{ display:"flex", gap:8, width: isMobile ? "100%" : "auto" }}>
          <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
            style={{ flex:1, padding:"9px 12px", border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, fontFamily:"inherit" }}/>
          <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
            style={{ flex:1, padding:"9px 12px", border:`1px solid ${C.border}`, borderRadius:8, fontSize:13, fontFamily:"inherit" }}/>
        </div>
        {(filterPro || filterFrom || filterTo) && (
          <button onClick={() => { setFilterPro(""); setFilterFrom(""); setFilterTo(""); }}
            style={{ padding:"9px 12px", border:`1px solid ${C.border}`, background:"transparent", color:C.muted, borderRadius:8, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:4, width: isMobile ? "100%" : "auto", justifyContent:"center" }}>
            <X size={11}/> Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:60, color:C.muted }}>Loading photos…</div>
      ) : photos.length === 0 ? (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"48px 24px", textAlign:"center" }}>
          <Camera size={36} color={C.muted} style={{ marginBottom:12 }}/>
          <div style={{ fontWeight:700, fontSize:15, color:C.text, marginBottom:4 }}>No photos found</div>
          <div style={{ fontSize:13, color:C.muted }}>PROs can attach photos when logging field activities.</div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
          {photos.map(p => (
            <div key={p.id} onClick={() => setLightbox(p.signedUrl)}
              style={{ borderRadius:10, overflow:"hidden", border:`1px solid ${C.border}`, cursor:"pointer", background:C.card, position:"relative" }}>
              {p.signedUrl ? (
                <img src={p.signedUrl} alt={p.caption || "field photo"} style={{ width:"100%", height:160, objectFit:"cover", display:"block" }}/>
              ) : (
                <div style={{ height:160, background:"#F3F4F6", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Camera size={24} color={C.muted}/>
                </div>
              )}
              <div style={{ padding:"8px 10px" }}>
                {p.caption && <div style={{ fontSize:12, fontWeight:600, color:C.text, marginBottom:2 }}>{p.caption}</div>}
                <div style={{ fontSize:11, color:C.muted }}>
                  {p.field_activities?.pro_username || "—"} · {p.field_activities?.venue_name || "—"}
                </div>
                <div style={{ fontSize:11, color:C.faint, marginTop:1 }}>
                  {p.field_activities?.activity_date ? new Date(p.field_activities.activity_date).toLocaleDateString("en-IN",{day:"numeric",month:"short"}) : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", zIndex:9500, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <img src={lightbox} alt="Field photo" style={{ maxWidth:"100%", maxHeight:"90vh", borderRadius:10, objectFit:"contain" }}/>
          <button onClick={() => setLightbox(null)}
            style={{ position:"absolute", top:20, right:20, background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", borderRadius:"50%", width:36, height:36, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><X size={16}/></button>
        </div>
      )}
    </div>
  );
}

// ── Admin District Heatmap ────────────────────────────────────────────────────
const KERALA_DISTRICT_CENTERS = {
  Kasaragod:          { lat: 12.499, lng: 74.987 },
  Kannur:             { lat: 11.874, lng: 75.370 },
  Wayanad:            { lat: 11.685, lng: 76.132 },
  Kozhikode:          { lat: 11.259, lng: 75.780 },
  Malappuram:         { lat: 11.051, lng: 76.071 },
  Palakkad:           { lat: 10.787, lng: 76.655 },
  Thrissur:           { lat: 10.528, lng: 76.214 },
  Ernakulam:          { lat: 10.016, lng: 76.342 },
  Idukki:             { lat:  9.919, lng: 77.103 },
  Alappuzha:          { lat:  9.498, lng: 76.339 },
  Kottayam:           { lat:  9.592, lng: 76.522 },
  Pathanamthitta:     { lat:  9.265, lng: 76.787 },
  Kollam:             { lat:  8.893, lng: 76.614 },
  Thiruvananthapuram: { lat:  8.524, lng: 76.937 },
};

function AdminMapTab({ activities, isMobile }) {
  const [selected,  setSelected]  = useState(null);
  const [hovered,   setHovered]   = useState(null);
  const [filterPro, setFilterPro] = useState("");
  const { isLoaded: gmapLoaded } = useJsApiLoader({ googleMapsApiKey: GMAP_KEY, id: "vsa-gmap" });

  // Aggregate per district (memoized)
  const byDistrict = useMemo(() => {
    const m = {};
    activities.forEach(a => {
      if (!a.district) return;
      if (!m[a.district]) m[a.district] = { acts:0, leads:0, pros:new Set(), venues:new Set() };
      m[a.district].acts++;
      m[a.district].leads += (a.leads_captured || 0);
      m[a.district].pros.add(a.pro_username);
      m[a.district].venues.add(a.venue_name);
    });
    return m;
  }, [activities]);

  const maxActs      = useMemo(() => Math.max(...Object.values(byDistrict).map(d => d.acts), 1), [byDistrict]);
  const totalLeadsAll    = useMemo(() => activities.reduce((s, a) => s + (a.leads_captured || 0), 0), [activities]);
  const venuesCoveredAll = useMemo(() => new Set(activities.map(a => a.venue_name).filter(Boolean)).size, [activities]);

  const heatColor = (d) => {
    const info = byDistrict[d];
    if (!info || !info.acts) return "#E5E7EB";
    const t = info.acts / maxActs;
    if (t < 0.15) return "#EDE9FE";
    if (t < 0.35) return "#C4B5FD";
    if (t < 0.6)  return "#A78BFA";
    if (t < 0.8)  return "#7C3AED";
    return "#5B21B6";
  };
  const dotRadius = (d) => {
    const info = byDistrict[d];
    if (!info) return 7;
    return Math.min(22, 9 + info.acts * 0.7);
  };

  // District drill-down
  const distActs = selected
    ? activities.filter(a => a.district === selected && (!filterPro || a.pro_username === filterPro))
    : [];

  const venueBreakdown = {};
  distActs.forEach(a => {
    const vn = a.venue_name || "Unknown";
    if (!venueBreakdown[vn]) venueBreakdown[vn] = { leads:0, acts:0, pros:new Set() };
    venueBreakdown[vn].acts++;
    venueBreakdown[vn].leads += (a.leads_captured || 0);
    venueBreakdown[vn].pros.add(a.pro_username);
  });

  const proBreakdown = {};
  distActs.forEach(a => {
    const p = a.pro_username || "Unknown";
    if (!proBreakdown[p]) proBreakdown[p] = { leads:0, acts:0 };
    proBreakdown[p].acts++;
    proBreakdown[p].leads += (a.leads_captured || 0);
  });

  const selInfo = selected ? byDistrict[selected] : null;

  return (
    <div>
      <style>{`@keyframes _admpulse{0%,100%{opacity:.2;transform:scale(1)}50%{opacity:.07;transform:scale(1.7)}}@keyframes _admfade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}._admcard{animation:_admfade .3s ease both}`}</style>

      {/* KPI row */}
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)", gap:10, marginBottom:16 }}>
        {[
          { label:"Active Districts", value:`${Object.keys(byDistrict).length}/14`, color:C.brand   },
          { label:"Total Activities", value:activities.length,                      color:C.info    },
          { label:"Total Leads",      value:totalLeadsAll,                          color:C.success },
          { label:"Venues Covered",   value:venuesCoveredAll,                       color:C.warning },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 16px" }}>
            <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:".05em", marginBottom:3 }}>{label}</div>
            <div style={{ fontSize:22, fontWeight:800, color }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", flexDirection:isMobile?"column":"row", gap:16, alignItems:"flex-start" }}>

        {/* SVG Map */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px 16px 12px", flexShrink:0, width:isMobile?"100%":285, overflow:"hidden" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:13, color:C.text }}>Activity Heatmap</div>
              <div style={{ fontSize:10, color:C.muted }}>Tap district to drill down</div>
            </div>
            <div style={{ display:"flex", gap:4, alignItems:"center" }}>
              {["#E5E7EB","#C4B5FD","#A78BFA","#5B21B6"].map((c,i) => (
                <div key={i} style={{ width:10, height:10, borderRadius:2, background:c }}/>
              ))}
              <span style={{ fontSize:9, color:C.muted, marginLeft:2 }}>Low→High</span>
            </div>
          </div>

          {gmapLoaded ? <GoogleMap
            mapContainerStyle={{ width:"100%", height: isMobile ? 270 : 420, borderRadius:8 }}
            center={{ lat:10.3, lng:76.3 }}
            zoom={isMobile ? 6 : 7}
            options={{ ...GMAP_OPTIONS, zoomControl:true, fullscreenControl:false }}
            onClick={() => setSelected(null)}
          >
            {Object.entries(KERALA_DISTRICT_CENTERS).map(([name, pos]) => {
              const info  = byDistrict[name];
              const col   = heatColor(name);
              const sz    = dotRadius(name);
              const isSel = selected === name;
              const px    = sz * 2 + 4;
              return (
                <OverlayView key={name} position={pos} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                  <div
                    onClick={(e) => { e.stopPropagation(); setSelected(isSel ? null : name); }}
                    style={{ position:"relative", transform:`translate(-${px/2}px,-${px/2}px)`, cursor:"pointer", userSelect:"none" }}
                  >
                    {/* Pulse ring when selected */}
                    {isSel && (
                      <div style={{ position:"absolute", inset:-8, borderRadius:"50%", background:col, animation:"_admpulse 2.2s ease-in-out infinite" }}/>
                    )}
                    {/* Main bubble */}
                    <div style={{
                      width:px, height:px, borderRadius:"50%",
                      background: col,
                      opacity: info?.acts ? 0.9 : 0.35,
                      border: `${isSel ? 2.5 : 1.5}px solid ${isSel ? "#7C3AED" : col+"90"}`,
                      boxShadow: isSel ? `0 0 0 4px ${col}30, 0 3px 10px rgba(0,0,0,0.2)` : "0 2px 6px rgba(0,0,0,0.15)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      transition:"all .2s",
                      position:"relative",
                    }}>
                      {info?.acts > 0 && (
                        <span style={{ color:"#fff", fontWeight:800, fontSize:px>28?10:8, lineHeight:1 }}>{info.acts}</span>
                      )}
                    </div>
                    {/* District label */}
                    <div style={{
                      position:"absolute", top:"100%", left:"50%", transform:"translateX(-50%)",
                      marginTop:2, whiteSpace:"nowrap",
                      fontSize: isSel ? 9 : 8, fontWeight: isSel ? 700 : 500,
                      color: isSel ? "#7C3AED" : C.muted,
                      textShadow:"0 1px 2px rgba(255,255,255,0.9)",
                      pointerEvents:"none",
                    }}>
                      {name.length>11 ? name.slice(0,10)+"…" : name}
                    </div>
                  </div>
                </OverlayView>
              );
            })}
          </GoogleMap> : (
            <div style={{ height: isMobile ? 270 : 420, display:"flex", alignItems:"center", justifyContent:"center", color:C.muted, fontSize:13, borderRadius:8, background:C.bg }}>Loading map…</div>
          )}
          <div style={{ textAlign:"center", fontSize:11, color:C.faint, marginTop:6 }}>
            {Object.keys(byDistrict).length} active districts · {activities.length} total activities
          </div>
        </div>

        {/* Detail Panel */}
        <div style={{ flex:1, minWidth:0 }}>
          {!selected ? (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"52px 24px", textAlign:"center" }}>
              <div style={{ width:56, height:56, borderRadius:16, background:`${C.brand}10`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                <Map size={26} color={C.brand}/>
              </div>
              <div style={{ fontWeight:700, fontSize:16, color:C.text, marginBottom:6 }}>Select a district</div>
              <div style={{ fontSize:13, color:C.muted, lineHeight:1.6 }}>
                Darker nodes = more activity. Tap any district to see the full breakdown.
              </div>
            </div>
          ) : (
            <div className="_admcard" style={{ display:"flex", flexDirection:"column", gap:12 }}>

              {/* Header */}
              <div style={{ background:"linear-gradient(135deg,#EDE9FE,#F8FAFC)", border:"1.5px solid #A78BFA40", borderRadius:16, padding:"18px 20px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                  <div>
                    <div style={{ fontWeight:800, fontSize:22, color:C.text }}>{selected}</div>
                    <div style={{ fontSize:12, color:C.muted, marginTop:3 }}>
                      {selInfo?.acts||0} activities · {selInfo?.pros?.size||0} PROs · {selInfo?.venues?.size||0} venues
                    </div>
                  </div>
                  <button onClick={() => { setSelected(null); setFilterPro(""); }}
                    style={{ border:`1px solid ${C.border}`, background:"rgba(255,255,255,0.8)", color:C.muted, borderRadius:8, padding:"5px 10px", cursor:"pointer", display:"flex", alignItems:"center", gap:3, fontSize:11 }}>
                    <X size={11}/> Clear
                  </button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap:8 }}>
                  {[
                    { label:"Activities", value:selInfo?.acts||0 },
                    { label:"Leads",      value:selInfo?.leads||0 },
                    { label:"PROs",       value:selInfo?.pros?.size||0 },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background:"rgba(255,255,255,0.8)", borderRadius:10, padding:"10px 12px" }}>
                      <div style={{ fontSize:9, color:C.muted, textTransform:"uppercase", letterSpacing:".05em" }}>{label}</div>
                      <div style={{ fontSize:24, fontWeight:800, color:C.text, marginTop:2 }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PRO filter + breakdown */}
              {Object.keys(proBreakdown).length > 0 && (
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 16px" }}>
                  <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:12, flexWrap:"wrap" }}>
                    <span style={{ fontSize:12, fontWeight:700, color:C.text }}>PRO Filter:</span>
                    <select value={filterPro} onChange={e => setFilterPro(e.target.value)}
                      style={{ padding:"5px 10px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:12, color:C.text, background:C.card, fontFamily:"inherit", outline:"none" }}>
                      <option value="">All PROs</option>
                      {[...selInfo.pros].sort().map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {Object.entries(proBreakdown)
                      .sort(([,a],[,b]) => b.leads - a.leads)
                      .map(([pro, info]) => {
                        const maxProActs = Math.max(...Object.values(proBreakdown).map(p => p.acts), 1);
                        const pct = Math.round((info.acts / maxProActs) * 100);
                        return (
                          <div key={pro} style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <div style={{ width:28, height:28, borderRadius:"50%", background:`${C.brand}15`, display:"flex", alignItems:"center", justifyContent:"center", color:C.brand, fontWeight:800, fontSize:11, flexShrink:0 }}>
                              {pro.slice(0,1).toUpperCase()}
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                                <span style={{ fontSize:12, fontWeight:600, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{pro}</span>
                                <span style={{ fontSize:11, color:C.muted, whiteSpace:"nowrap", marginLeft:8 }}>{info.acts} visit{info.acts!==1?"s":""} · <strong style={{ color:C.brand }}>{info.leads}</strong> leads</span>
                              </div>
                              <div style={{ height:4, background:C.border, borderRadius:2 }}>
                                <div style={{ height:"100%", width:`${pct}%`, background:C.brand, borderRadius:2, transition:"width .5s" }}/>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Venue breakdown */}
              {Object.keys(venueBreakdown).length === 0 ? (
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"32px 24px", textAlign:"center", color:C.muted, fontSize:13 }}>
                  No activities in {selected}{filterPro ? ` by ${filterPro}` : ""}.
                </div>
              ) : (
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
                  <div style={{ padding:"12px 18px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontWeight:700, fontSize:13, color:C.text }}>Venues in {selected}</span>
                    <span style={{ fontSize:11, color:C.muted }}>{Object.keys(venueBreakdown).length} venue{Object.keys(venueBreakdown).length!==1?"s":""}</span>
                  </div>
                  {Object.entries(venueBreakdown)
                    .sort(([,a],[,b]) => b.acts - a.acts)
                    .map(([vname, info], i, arr) => {
                      const maxVA = Math.max(...Object.values(venueBreakdown).map(v => v.acts), 1);
                      const pct = Math.round((info.acts / maxVA) * 100);
                      return (
                        <div key={i} style={{ padding:"13px 18px", borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none",
                          transition:"background .12s" }}
                          onMouseEnter={e=>e.currentTarget.style.background="#FAFAFA"}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontWeight:600, fontSize:13, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{vname}</div>
                              <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>
                                {info.acts} visit{info.acts!==1?"s":""} · {info.pros.size} PRO{info.pros.size!==1?"s":""}
                              </div>
                            </div>
                            <div style={{ textAlign:"right", flexShrink:0, marginLeft:12 }}>
                              <div style={{ fontSize:20, fontWeight:800, color:C.brand }}>{info.leads}</div>
                              <div style={{ fontSize:9, color:C.muted }}>leads</div>
                            </div>
                          </div>
                          <div style={{ height:4, background:C.border, borderRadius:2 }}>
                            <div style={{ height:"100%", width:`${pct}%`, background:C.brand, borderRadius:2, transition:"width .5s ease" }}/>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SESSIONS TAB — Trust Score + Fraud Flags ────────────────────────────────
function SessionsTab({ authUser, isMobile }) {
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [fPro,     setFPro]     = useState("");
  const [fFrom,    setFFrom]    = useState("");
  const [fTo,      setFTo]      = useState("");
  const [fFlag,    setFFlag]    = useState(""); // "fake_gps" | "short" | "auto" | "late"

  useEffect(() => {
    setLoading(true);
    getFieldSessionsApi(authUser.token, { limit: 300, ...(fFrom ? { dateFrom: fFrom } : {}), ...(fTo ? { dateTo: fTo } : {}) })
      .then(r => { if (r.ok) setSessions(r.sessions || []); })
      .finally(() => setLoading(false));
  }, [authUser.token, fFrom, fTo]);

  const proOptions = useMemo(() => [...new Set(sessions.map(s => s.pro_username))].sort(), [sessions]);

  const filtered = useMemo(() => sessions.filter(s => {
    if (fPro  && s.pro_username !== fPro) return false;
    if (fFlag === "fake_gps" && !s.flagged_fake_gps)    return false;
    if (fFlag === "short"    && !s.flagged_short_visit)  return false;
    if (fFlag === "auto"     && !s.is_auto_checkout)     return false;
    if (fFlag === "low"      && (s.trust_score == null || s.trust_score > 2)) return false;
    return true;
  }), [sessions, fPro, fFlag]);

  const TrustBadge = ({ score }) => {
    if (score == null) return <span style={{ fontSize:11, color:C.muted }}>—</span>;
    const color = score >= 4 ? C.success : score >= 3 ? C.warning : "#DC2626";
    const bg    = score >= 4 ? `${C.success}12` : score >= 3 ? `${C.warning}12` : "#FEF2F2";
    const Icon  = score >= 4 ? ShieldCheck : ShieldAlert;
    return (
      <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 8px", borderRadius:20, background:bg, color, fontSize:11, fontWeight:700 }}>
        <Icon size={10} strokeWidth={2.5}/>{score}/5
      </span>
    );
  };

  const elapsed = (inAt, outAt) => {
    const m = Math.round((new Date(outAt) - new Date(inAt)) / 60000);
    if (m < 60) return `${m}m`;
    return `${Math.floor(m/60)}h ${m%60}m`;
  };

  const ss = { padding:"7px 10px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:12, color:C.text, background:C.card, fontFamily:"inherit", outline:"none", cursor:"pointer" };

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:14, padding:"11px 14px", background:C.card, borderRadius:10, border:`1px solid ${C.border}`, alignItems:"center" }}>
        <Filter size={14} color={C.muted}/>
        <select value={fPro} onChange={e => setFPro(e.target.value)} style={ss}>
          <option value="">All PROs</option>
          {proOptions.map(p => <option key={p} value={p}>{displayName(p)}</option>)}
        </select>
        <select value={fFlag} onChange={e => setFFlag(e.target.value)} style={ss}>
          <option value="">All sessions</option>
          <option value="fake_gps">Fake GPS flagged</option>
          <option value="short">Short visit (&lt;20 min)</option>
          <option value="auto">Auto-checkout</option>
          <option value="low">Low trust (0–2)</option>
        </select>
        <input type="date" value={fFrom} onChange={e => setFFrom(e.target.value)} style={{ ...ss, cursor:"text" }} title="From"/>
        <input type="date" value={fTo}   onChange={e => setFTo(e.target.value)}   style={{ ...ss, cursor:"text" }} title="To"/>
        {(fPro || fFlag || fFrom || fTo) && (
          <button onClick={() => { setFPro(""); setFFlag(""); setFFrom(""); setFTo(""); }}
            style={{ padding:"6px 10px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.muted, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
            <X size={11}/> Clear
          </button>
        )}
        <span style={{ marginLeft:"auto", fontSize:12, color:C.muted }}>{filtered.length} sessions</span>
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:60, color:C.muted, fontSize:14 }}>Loading sessions…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:48, color:C.muted, fontSize:13, background:C.card, borderRadius:12, border:`1px solid ${C.border}` }}>No sessions found</div>
      ) : isMobile ? (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {filtered.map(s => (
            <div key={s.id} style={{ background:C.card, border:`1px solid ${s.flagged_fake_gps || (s.trust_score != null && s.trust_score <= 2) ? "#DC262640" : C.border}`, borderRadius:12, padding:"12px 14px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:13, color:C.text }}>{s.venue_name}</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{displayName(s.pro_username)} · {s.district}</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>
                    {new Date(s.check_in_at).toLocaleDateString("en-IN", { day:"numeric", month:"short" })} · {elapsed(s.check_in_at, s.check_out_at)}
                  </div>
                </div>
                <TrustBadge score={s.trust_score}/>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {s.flagged_fake_gps    && <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:20, background:"#FEF2F2", color:"#DC2626", display:"flex", alignItems:"center", gap:3 }}><ShieldAlert size={9}/>Fake GPS</span>}
                {s.flagged_short_visit && <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:20, background:`${C.warning}15`, color:C.warning, display:"flex", alignItems:"center", gap:3 }}><Clock size={9}/>Short visit</span>}
                {s.is_auto_checkout    && <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:20, background:`${C.info}12`, color:C.info, display:"flex", alignItems:"center", gap:3 }}><LogOut size={9}/>Auto-closed</span>}
                {s.selfie_photo        && <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:20, background:`${C.success}12`, color:C.success, display:"flex", alignItems:"center", gap:3 }}><Camera size={9}/>Selfie</span>}
                {s.distance_from_venue != null && <span style={{ fontSize:10, color:C.muted, padding:"2px 7px" }}>{Math.round(s.distance_from_venue)}m from venue</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background:C.card, borderRadius:12, border:`1px solid ${C.border}`, overflow:"hidden" }}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:800 }}>
              <thead>
                <tr style={{ background:C.bg }}>
                  {["Date","PRO","Venue","Duration","Trust","Flags","Distance","Selfie"].map(h => (
                    <th key={h} style={{ padding:"9px 14px", textAlign:"left", fontSize:11, fontWeight:600, color:C.muted, letterSpacing:.4, borderBottom:`1px solid ${C.border}`, whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const suspicious = s.flagged_fake_gps || (s.trust_score != null && s.trust_score <= 2);
                  return (
                    <tr key={s.id}
                      style={{ borderBottom:`1px solid ${C.border}`, background: suspicious ? "#FFF8F8" : "transparent" }}>
                      <td style={{ padding:"10px 14px", fontSize:12, color:C.muted, whiteSpace:"nowrap" }}>
                        {new Date(s.check_in_at).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
                      </td>
                      <td style={{ padding:"10px 14px", fontSize:12, fontWeight:600, color:C.text }}>{displayName(s.pro_username)}</td>
                      <td style={{ padding:"10px 14px", fontSize:12, color:C.text, maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={s.venue_name}>{s.venue_name}</td>
                      <td style={{ padding:"10px 14px", fontSize:12, color:C.muted, whiteSpace:"nowrap" }}>
                        {s.duration_mins != null ? (s.duration_mins < 60 ? `${s.duration_mins}m` : `${Math.floor(s.duration_mins/60)}h ${s.duration_mins%60}m`) : "—"}
                      </td>
                      <td style={{ padding:"10px 14px" }}><TrustBadge score={s.trust_score}/></td>
                      <td style={{ padding:"10px 14px" }}>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                          {s.flagged_fake_gps    && <span style={{ fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:20, background:"#FEF2F2", color:"#DC2626", display:"flex", alignItems:"center", gap:3, whiteSpace:"nowrap" }}><ShieldAlert size={9}/>Fake GPS</span>}
                          {s.flagged_short_visit && <span style={{ fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:20, background:`${C.warning}15`, color:C.warning, display:"flex", alignItems:"center", gap:3, whiteSpace:"nowrap" }}><Clock size={9}/>Short</span>}
                          {s.is_auto_checkout    && <span style={{ fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:20, background:`${C.info}12`, color:C.info, display:"flex", alignItems:"center", gap:3, whiteSpace:"nowrap" }}><LogOut size={9}/>Auto</span>}
                          {!s.flagged_fake_gps && !s.flagged_short_visit && !s.is_auto_checkout && <span style={{ fontSize:10, color:C.muted }}>—</span>}
                        </div>
                      </td>
                      <td style={{ padding:"10px 14px", fontSize:11, color:s.distance_from_venue != null ? (s.distance_from_venue <= 300 ? C.success : C.warning) : C.muted }}>
                        {s.distance_from_venue != null ? `${Math.round(s.distance_from_venue)}m` : "—"}
                      </td>
                      <td style={{ padding:"10px 14px" }}>
                        {s.selfie_photo
                          ? <img src={s.selfie_photo} alt="selfie" style={{ width:32, height:32, borderRadius:6, objectFit:"cover", border:`1px solid ${C.border}` }}/>
                          : <span style={{ fontSize:11, color:C.muted }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LOGIN SELFIES TAB — audit who actually logged in each day ────────────────
function LoginSelfiesTab({ authUser, isMobile }) {
  const [selfies,   setSelfies]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [dateFrom,  setDateFrom]  = useState("");
  const [dateTo,    setDateTo]    = useState("");
  const [proFilter, setProFilter] = useState("");
  const [preview,   setPreview]   = useState(null); // full-screen selfie preview

  const load = () => {
    setLoading(true);
    getLoginSelfiesApi(authUser.token, {
      ...(dateFrom   ? { dateFrom }  : {}),
      ...(dateTo     ? { dateTo }    : {}),
      ...(proFilter  ? { proUsername: proFilter } : {}),
      limit: 200,
    }).then(r => {
      if (r.ok) setSelfies(r.selfies || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const today = new Date().toISOString().slice(0, 10);

  // Group by date for cleaner view
  const byDate = selfies.reduce((acc, s) => {
    const d = s.login_date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(s);
    return acc;
  }, {});
  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  return (
    <div>
      <style>{`@keyframes _spin{to{transform:rotate(360deg)}}`}</style>

      {/* Filters */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:18 }}>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          style={{ border:`1px solid ${C.border}`, borderRadius:8, padding:"7px 10px", fontSize:13, fontFamily:"inherit", color:C.text, background:"#fff" }}/>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          max={today}
          style={{ border:`1px solid ${C.border}`, borderRadius:8, padding:"7px 10px", fontSize:13, fontFamily:"inherit", color:C.text, background:"#fff" }}/>
        <input type="text" placeholder="Filter by PRO username..." value={proFilter} onChange={e => setProFilter(e.target.value)}
          style={{ border:`1px solid ${C.border}`, borderRadius:8, padding:"7px 12px", fontSize:13, fontFamily:"inherit", flex:1, minWidth:160, color:C.text, background:"#fff" }}/>
        <button onClick={load} style={{ background:C.brand, color:"#fff", border:"none", borderRadius:8, padding:"7px 16px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:6 }}>
          <RefreshCw size={13}/> Apply
        </button>
      </div>

      {loading && (
        <div style={{ textAlign:"center", padding:"48px 0", color:C.muted, fontSize:13 }}>
          <span style={{ display:"inline-block", width:18, height:18, border:"2px solid #E5E7EB", borderTopColor:C.brand, borderRadius:"50%", animation:"_spin 0.7s linear infinite" }}/>
          <div style={{ marginTop:10 }}>Loading login selfies...</div>
        </div>
      )}

      {!loading && selfies.length === 0 && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"48px 24px", textAlign:"center", color:C.muted, fontSize:13 }}>
          <User size={32} color={C.border} style={{ marginBottom:10 }}/>
          <div style={{ fontWeight:600, color:C.text, marginBottom:4 }}>No login selfies yet</div>
          <div>Selfies will appear here when PROs log in.</div>
        </div>
      )}

      {!loading && dates.map(date => (
        <div key={date} style={{ marginBottom:28 }}>
          {/* Date header */}
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
            <Calendar size={14} color={C.brand}/>
            <span style={{ fontWeight:700, fontSize:14, color:C.text }}>
              {new Date(date + "T00:00:00").toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}
            </span>
            <span style={{ background:`${C.brand}12`, color:C.brand, borderRadius:20, padding:"2px 9px", fontSize:11, fontWeight:700 }}>
              {byDate[date].length} login{byDate[date].length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Grid of selfie cards */}
          <div style={{ display:"grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fill,minmax(160px,1fr))", gap:12 }}>
            {byDate[date].map(s => (
              <div key={s.id}
                onClick={() => setPreview(s)}
                style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden", cursor:"pointer", transition:"box-shadow .15s" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.12)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow="none"}>
                {/* Selfie thumbnail */}
                <div style={{ width:"100%", aspectRatio:"4/3", overflow:"hidden", background:"#111", position:"relative" }}>
                  <img src={s.login_selfie} alt="login selfie"
                    style={{ width:"100%", height:"100%", objectFit:"cover", transform:"scaleX(-1)", display:"block" }}/>
                  {/* Time badge */}
                  <div style={{ position:"absolute", bottom:6, right:6, background:"rgba(0,0,0,0.62)", borderRadius:6, padding:"2px 7px" }}>
                    <span style={{ color:"#fff", fontSize:11, fontWeight:600 }}>{s.login_time || "--:--"}</span>
                  </div>
                </div>
                {/* Info */}
                <div style={{ padding:"10px 10px 12px" }}>
                  <div style={{ fontWeight:700, fontSize:13, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {displayName(s.pro_username)}
                  </div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{s.centre || "—"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Full-screen preview modal */}
      {preview && (
        <div onClick={() => setPreview(null)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:"#fff", borderRadius:18, overflow:"hidden", maxWidth:400, width:"100%" }}>
            {/* Header */}
            <div style={{ padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${C.border}` }}>
              <div>
                <div style={{ fontWeight:700, fontSize:15, color:C.text }}>{displayName(preview.pro_username)}</div>
                <div style={{ fontSize:12, color:C.muted }}>
                  {new Date(preview.login_date + "T00:00:00").toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
                  {preview.login_time ? ` · ${preview.login_time}` : ""}
                  {preview.centre ? ` · ${preview.centre}` : ""}
                </div>
              </div>
              <button onClick={() => setPreview(null)}
                style={{ background:C.bg, border:"none", borderRadius:"50%", width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                <X size={14} color={C.muted}/>
              </button>
            </div>
            {/* Full selfie */}
            <img src={preview.login_selfie} alt="login selfie"
              style={{ width:"100%", display:"block", transform:"scaleX(-1)" }}/>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FaceIdTab — manage face credentials for all PRO field staff ─────────────
function FaceIdTab({ authUser, isMobile }) {
  const [users,         setUsers]         = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [enrollTarget,  setEnrollTarget]  = useState(null);
  const [confirmRevoke, setConfirmRevoke] = useState(null);
  const [error,         setError]         = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true); setError("");
    const res = await fetchUsersApi(authUser.token);
    setLoading(false);
    if (res.ok) setUsers((res.users || []).filter(u => u.role === "pro"));
    else setError(res.error || "Failed to load PRO users");
  }, [authUser]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleRevoke = async (username) => {
    setConfirmRevoke(null);
    const res = await revokeFaceApi(authUser.token, { username });
    if (res.ok) loadUsers();
    else setError(res.error || "Failed to revoke");
  };

  const pros = users || [];
  const enrolled    = pros.filter(u => u.faceEnrolled).length;
  const notEnrolled = pros.filter(u => !u.faceEnrolled).length;

  return (
    <div>
      {/* Summary bar */}
      <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
        {[
          { label:"Total PROs",     value: pros.length,  color:C.info  },
          { label:"Face Enrolled",  value: enrolled,     color:"#16A34A" },
          { label:"Not Enrolled",   value: notEnrolled,  color:C.warning },
        ].map(s => (
          <div key={s.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 20px", flex:1, minWidth:100 }}>
            <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{loading ? "—" : s.value}</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background:"#FFF1F2", border:`1px solid #FECACA`, borderRadius:10, padding:"11px 16px", marginBottom:14, fontSize:13, color:C.danger, display:"flex", alignItems:"center", gap:8 }}>
          <AlertCircle size={14} color={C.danger}/> {error}
        </div>
      )}

      <div style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`, overflow:"hidden" }}>
        <div style={{ padding:"14px 20px 12px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontWeight:700, fontSize:14, color:C.text }}>PRO Face Credentials</div>
          <button onClick={loadUsers}
            style={{ border:"none", background:"transparent", cursor:"pointer", color:C.muted, display:"flex", alignItems:"center", gap:5, fontSize:12, fontWeight:600 }}>
            <RefreshCw size={13}/> Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ padding:"40px", textAlign:"center", color:C.muted, fontSize:13 }}>Loading PRO users…</div>
        ) : pros.length === 0 ? (
          <div style={{ padding:"40px", textAlign:"center", color:C.muted, fontSize:13 }}>No PRO users found. Add PRO users in Settings.</div>
        ) : (
          <div>
            {pros.map((u, i) => (
              <div key={u.username} style={{
                display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10,
                padding:"14px 20px",
                borderBottom: i < pros.length-1 ? `1px solid ${C.border}` : "none",
              }}>
                {/* User info */}
                <div style={{ display:"flex", alignItems:"center", gap:12, flex:1, minWidth:0 }}>
                  <div style={{ width:38, height:38, borderRadius:"50%", background:`${C.brand}12`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontWeight:700, fontSize:14, color:C.brand }}>
                    {(u.displayName||u.username).charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:14, color:C.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                      {u.displayName || u.username}
                    </div>
                    <div style={{ fontSize:11, color:C.muted }}>{u.username} · {u.centre || "—"}</div>
                  </div>
                </div>

                {/* Status badge */}
                <div style={{ flexShrink:0 }}>
                  {u.faceEnrolled ? (
                    <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#ECFDF5", color:"#16A34A", borderRadius:20, padding:"4px 11px", fontSize:11, fontWeight:700 }}>
                      <CheckCircle size={12} strokeWidth={2.5}/> Enrolled
                    </span>
                  ) : (
                    <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#FFF7ED", color:"#D97706", borderRadius:20, padding:"4px 11px", fontSize:11, fontWeight:700 }}>
                      <AlertCircle size={12} strokeWidth={2.5}/> Not enrolled
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                  {u.faceEnrolled ? (
                    <button onClick={() => setConfirmRevoke(u.username)}
                      style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:8, border:`1px solid #7C3AED40`, background:`#7C3AED08`, color:"#7C3AED", fontSize:12, cursor:"pointer", fontWeight:600 }}>
                      <ScanFace size={13}/> Re-Enroll
                    </button>
                  ) : (
                    <button onClick={() => setEnrollTarget(u)}
                      style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:8, border:`1px solid #7C3AED60`, background:`#7C3AED14`, color:"#7C3AED", fontSize:12, cursor:"pointer", fontWeight:700 }}>
                      <ScanFace size={13}/> Enroll Face
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info note */}
      <div style={{ marginTop:14, fontSize:12, color:C.muted, lineHeight:1.6 }}>
        Face credentials allow automatic identity verification when a PRO logs into Field Tracker. Models load from <code style={{ background:"#F3F4F6", padding:"1px 5px", borderRadius:4 }}>/public/models</code>.
      </div>

      {/* Enroll modal */}
      {enrollTarget && (
        <EnrollFaceModal
          authUser={authUser}
          target={enrollTarget}
          onClose={() => setEnrollTarget(null)}
          onEnrolled={() => { setEnrollTarget(null); loadUsers(); }}
        />
      )}

      {/* Confirm re-enroll */}
      {confirmRevoke && (
        <>
          <div onClick={() => setConfirmRevoke(null)}
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", backdropFilter:"blur(2px)", zIndex:80 }}/>
          <div style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", background:"#fff", borderRadius:14, padding:"28px 24px", zIndex:90, boxShadow:"0 4px 32px rgba(0,0,0,0.14)", maxWidth:360, width:"90%", textAlign:"center" }}>
            <div style={{ width:44, height:44, borderRadius:"50%", background:"#F5F3FF", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
              <ScanFace size={22} color="#7C3AED"/>
            </div>
            <div style={{ fontWeight:700, fontSize:15, color:C.text, marginBottom:8 }}>Re-enroll face for {confirmRevoke}?</div>
            <div style={{ fontSize:13, color:C.muted, marginBottom:20 }}>The existing credential will be replaced. The PRO must re-verify on next login.</div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setConfirmRevoke(null)}
                style={{ flex:1, padding:"11px", borderRadius:9, border:`1px solid ${C.border}`, background:"#fff", color:C.muted, fontSize:13, cursor:"pointer", fontWeight:600 }}>Cancel</button>
              <button onClick={() => {
                const target = pros.find(u => u.username === confirmRevoke);
                setConfirmRevoke(null);
                setEnrollTarget(target);
              }}
                style={{ flex:1, padding:"11px", borderRadius:9, border:"none", background:"#7C3AED", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                Re-Enroll
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── TrailTab — Google Maps Timeline-quality PRO route viewer ────────────────
const TRAIL_MAP_OPTS = {
  disableDefaultUI: false, zoomControl: true,
  streetViewControl: false, fullscreenControl: true,
  mapTypeControl: false, clickableIcons: false,
  styles: [
    { featureType:"poi",     elementType:"labels", stylers:[{ visibility:"off" }] },
    { featureType:"transit", elementType:"labels", stylers:[{ visibility:"off" }] },
  ],
};

function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", hour12:true });
}
function fmtDuration(min) {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60), m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// Reverse geocode a stop using OpenStreetMap Nominatim (free, no key needed)
async function reverseGeocode(lat, lng) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=17`,
      { headers: { "Accept-Language": "en" } }
    );
    const d = await r.json();
    if (d?.display_name) {
      const parts = d.display_name.split(",").map(s => s.trim());
      // Return the 2 most local parts (e.g. "Shop Name, Street Name")
      return parts.slice(0, 2).join(", ");
    }
  } catch { /* silent */ }
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

function TrailTab({ authUser, proMap, isMobile }) {
  // proMap is an array: [{ username, centre, acts, leads, lastDate }]
  const proList = (proMap || []).map(p => p.username).sort();
  // lookup helper
  const proNameMap = useMemo(() => {
    const m = {};
    (proMap || []).forEach(p => { m[p.username] = p; });
    return m;
  }, [proMap]);
  const todayStr = new Date().toLocaleDateString("en-CA");

  const [selPro,    setSelPro]    = useState(proList[0] || "");
  const [selDate,   setSelDate]   = useState(todayStr);
  const [summary,   setSummary]   = useState([]);       // trail summary (which PROs have data)
  const [trailData, setTrailData] = useState(null);     // { points, stops, trailDate, totalPoints }
  const [loading,   setLoading]   = useState(false);
  const [selStop,   setSelStop]   = useState(null);     // clicked stop index
  const [placeNames, setPlaceNames] = useState({});     // stop index → place name
  const mapRef = useRef(null);

  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || "", id:"fmp-trail-map" });

  // Load summary when date changes
  useEffect(() => {
    if (!authUser?.token || !selDate) return;
    getTrailSummaryApi(authUser.token, { date: selDate })
      .then(r => { if (r.ok) setSummary(r.summary || []); });
  }, [authUser?.token, selDate]);

  // Load trail when PRO or date changes
  const loadTrail = useCallback(async () => {
    if (!selPro || !selDate || !authUser?.token) return;
    setLoading(true);
    setTrailData(null);
    setSelStop(null);
    setPlaceNames({});
    const r = await getProTrailApi(authUser.token, { proUsername: selPro, date: selDate });
    if (r.ok) {
      setTrailData(r);
      // Kick off reverse geocoding for each stop (background)
      r.stops?.forEach((stop, i) => {
        reverseGeocode(stop.lat, stop.lng).then(name => {
          setPlaceNames(prev => ({ ...prev, [i]: name }));
        });
      });
    }
    setLoading(false);
  }, [selPro, selDate, authUser?.token]);

  useEffect(() => { loadTrail(); }, [loadTrail]);

  const points    = trailData?.points  || [];
  const stops     = trailData?.stops   || [];
  const pathCoords = points.map(p => ({ lat: p.lat, lng: p.lng }));

  // Centre of the route
  const mapCenter = useMemo(() => {
    if (points.length === 0) return { lat: 10.3, lng: 76.3 };
    const lats = points.map(p => p.lat), lngs = points.map(p => p.lng);
    return {
      lat: (Math.min(...lats) + Math.max(...lats)) / 2,
      lng: (Math.min(...lngs) + Math.max(...lngs)) / 2,
    };
  }, [points]);

  // Pan map when stop is selected
  const panToStop = useCallback((stop, i) => {
    setSelStop(i);
    if (mapRef.current) {
      mapRef.current.panTo({ lat: stop.lat, lng: stop.lng });
      mapRef.current.setZoom(16);
    }
  }, []);

  const proWithData = summary.map(s => s.proUsername);

  return (
    <div>
      <style>{`
        .trail-timeline::-webkit-scrollbar { width:4px }
        .trail-timeline::-webkit-scrollbar-track { background:transparent }
        .trail-timeline::-webkit-scrollbar-thumb { background:#E5E7EB; border-radius:2px }
      `}</style>

      {/* ── Controls ── */}
      <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap", marginBottom:16 }}>
        {/* PRO selector */}
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          <label style={{ fontSize:11, color:C.muted, fontWeight:600, letterSpacing:".04em", textTransform:"uppercase" }}>PRO</label>
          <select value={selPro} onChange={e => setSelPro(e.target.value)}
            style={{ border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 12px", fontSize:13, color:C.text, background:C.card, fontFamily:"inherit", minWidth:160, cursor:"pointer" }}>
            {proList.length === 0 && <option>No PROs</option>}
            {proList.map(p => (
              <option key={p} value={p}>
                {p}{proWithData.includes(p) ? " *" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Date picker */}
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          <label style={{ fontSize:11, color:C.muted, fontWeight:600, letterSpacing:".04em", textTransform:"uppercase" }}>Date</label>
          <input type="date" value={selDate} onChange={e => setSelDate(e.target.value)}
            max={todayStr}
            style={{ border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 12px", fontSize:13, color:C.text, background:C.card, fontFamily:"inherit", cursor:"pointer" }}/>
        </div>

        {/* Stats chips */}
        {trailData && (
          <div style={{ display:"flex", gap:8, marginTop:16, flexWrap:"wrap" }}>
            <div style={{ background:"#EFF6FF", borderRadius:8, padding:"6px 12px", display:"flex", alignItems:"center", gap:6 }}>
              <LocateFixed size={13} color="#2563EB"/>
              <span style={{ fontSize:12, color:"#1D4ED8", fontWeight:600 }}>{trailData.totalPoints} GPS points</span>
            </div>
            <div style={{ background:"#ECFDF5", borderRadius:8, padding:"6px 12px", display:"flex", alignItems:"center", gap:6 }}>
              <Footprints size={13} color="#16A34A"/>
              <span style={{ fontSize:12, color:"#166534", fontWeight:600 }}>{stops.length} stop{stops.length !== 1 ? "s" : ""}</span>
            </div>
            {points.length > 0 && (
              <div style={{ background:"#FFF7ED", borderRadius:8, padding:"6px 12px", display:"flex", alignItems:"center", gap:6 }}>
                <Clock size={13} color="#D97706"/>
                <span style={{ fontSize:12, color:"#92400E", fontWeight:600 }}>
                  {fmtTime(points[0]?.recordedAt)} – {fmtTime(points[points.length-1]?.recordedAt)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:300, color:C.muted, fontSize:14, gap:10 }}>
          <div style={{ width:20, height:20, border:"2px solid rgba(0,0,0,0.1)", borderTopColor:C.brand, borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
          Loading trail data…
        </div>
      )}

      {/* ── No data ── */}
      {!loading && trailData && points.length === 0 && (
        <div style={{ background:C.card, borderRadius:14, border:`1px solid ${C.border}`, padding:48, textAlign:"center" }}>
          <Route size={32} color={C.muted} style={{ marginBottom:10, opacity:0.4 }}/>
          <div style={{ fontSize:14, fontWeight:600, color:C.muted }}>No trail data for this day</div>
          <div style={{ fontSize:12, color:C.muted, marginTop:4, opacity:0.7 }}>
            GPS tracking starts automatically when the PRO logs in on a device with location access.
          </div>
        </div>
      )}

      {/* ── Map + Timeline ── */}
      {!loading && points.length > 0 && (
        <div style={{
          display:"flex", gap:0, borderRadius:16, overflow:"hidden",
          border:`1px solid ${C.border}`, height: isMobile ? "auto" : 580,
          flexDirection: isMobile ? "column" : "row",
          boxShadow:"0 2px 16px rgba(0,0,0,0.07)",
        }}>
          {/* Map panel */}
          <div style={{ flex:1, minWidth:0, position:"relative", height: isMobile ? 300 : "100%" }}>
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={{ width:"100%", height:"100%" }}
                center={mapCenter} zoom={13}
                options={TRAIL_MAP_OPTS}
                onLoad={map => { mapRef.current = map; }}>

                {/* Blue route line */}
                <Polyline
                  path={pathCoords}
                  options={{ strokeColor:"#1A73E8", strokeWeight:4, strokeOpacity:0.85, geodesic:true }}/>

                {/* Start marker (green) */}
                {points[0] && (
                  <OverlayView position={{ lat: points[0].lat, lng: points[0].lng }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                    <div style={{
                      transform:"translate(-50%,-50%)", width:14, height:14, borderRadius:"50%",
                      background:"#16A34A", border:"2px solid #fff", boxShadow:"0 1px 4px rgba(0,0,0,0.3)",
                    }} title="Start"/>
                  </OverlayView>
                )}

                {/* End marker (red) */}
                {points.length > 1 && (
                  <OverlayView position={{ lat: points[points.length-1].lat, lng: points[points.length-1].lng }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                    <div style={{
                      transform:"translate(-50%,-50%)", width:14, height:14, borderRadius:"50%",
                      background:"#DC2626", border:"2px solid #fff", boxShadow:"0 1px 4px rgba(0,0,0,0.3)",
                    }} title="End"/>
                  </OverlayView>
                )}

                {/* Stop markers — numbered circles */}
                {stops.map((stop, i) => (
                  <OverlayView key={i} position={{ lat: stop.lat, lng: stop.lng }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                    <div
                      onClick={() => { setSelStop(selStop === i ? null : i); }}
                      style={{
                        transform:"translate(-50%,-50%)", cursor:"pointer",
                        width:28, height:28, borderRadius:"50%",
                        background: selStop === i ? C.brand : "#1A73E8",
                        border:"2px solid #fff", display:"flex", alignItems:"center", justifyContent:"center",
                        boxShadow: selStop === i ? `0 0 0 3px ${C.brand}40,0 2px 8px rgba(0,0,0,0.3)` : "0 2px 8px rgba(0,0,0,0.3)",
                        transition:"all 0.15s", zIndex: selStop === i ? 10 : 1,
                      }}>
                      <span style={{ color:"#fff", fontSize:11, fontWeight:700 }}>{i+1}</span>
                    </div>
                  </OverlayView>
                ))}

                {/* Popup for selected stop */}
                {selStop != null && stops[selStop] && (
                  <InfoWindow
                    position={{ lat: stops[selStop].lat, lng: stops[selStop].lng }}
                    onCloseClick={() => setSelStop(null)}>
                    <div style={{ fontFamily:"'Inter',-apple-system,sans-serif", minWidth:160, maxWidth:220 }}>
                      <div style={{ fontWeight:700, fontSize:13, color:"#111827", marginBottom:4 }}>
                        Stop {selStop+1}
                      </div>
                      <div style={{ fontSize:12, color:"#6B7280", marginBottom:8, lineHeight:1.4 }}>
                        {placeNames[selStop] || `${stops[selStop].lat.toFixed(5)}, ${stops[selStop].lng.toFixed(5)}`}
                      </div>
                      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                        <span style={{ background:"#EFF6FF", color:"#1D4ED8", borderRadius:6, padding:"2px 7px", fontSize:11, fontWeight:600 }}>
                          {fmtTime(stops[selStop].arrivedAt)} – {fmtTime(stops[selStop].leftAt)}
                        </span>
                        <span style={{ background:"#ECFDF5", color:"#166534", borderRadius:6, padding:"2px 7px", fontSize:11, fontWeight:600 }}>
                          {fmtDuration(stops[selStop].durationMin)}
                        </span>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            ) : (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", color:C.muted }}>Loading map…</div>
            )}

            {/* Legend overlay */}
            <div style={{ position:"absolute", bottom:10, left:10, background:"rgba(255,255,255,0.94)", borderRadius:10, padding:"7px 12px", boxShadow:"0 1px 8px rgba(0,0,0,0.12)", display:"flex", gap:12, alignItems:"center", fontSize:11, pointerEvents:"none" }}>
              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:"#16A34A" }}/>
                <span style={{ color:"#374151" }}>Start</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                <div style={{ width:24, height:3, background:"#1A73E8", borderRadius:2 }}/>
                <span style={{ color:"#374151" }}>Route</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                <div style={{ width:14, height:14, borderRadius:"50%", background:"#1A73E8", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ color:"#fff", fontSize:8, fontWeight:700 }}>N</span>
                </div>
                <span style={{ color:"#374151" }}>Stop</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:"#DC2626" }}/>
                <span style={{ color:"#374151" }}>End</span>
              </div>
            </div>
          </div>

          {/* Timeline sidebar */}
          <div className="trail-timeline" style={{
            width: isMobile ? "100%" : 280, flexShrink:0,
            background:C.card, borderLeft: isMobile ? "none" : `1px solid ${C.border}`,
            borderTop: isMobile ? `1px solid ${C.border}` : "none",
            overflowY:"auto", display:"flex", flexDirection:"column",
          }}>
            {/* Sidebar header */}
            <div style={{ padding:"14px 16px", borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, background:C.card, zIndex:2 }}>
              <div style={{ fontWeight:700, fontSize:13, color:C.text }}>
                {selPro}
              </div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
                {new Date(selDate + "T00:00:00").toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long" })}
              </div>
            </div>

            {/* Start event */}
            {points[0] && (
              <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.border}50`, display:"flex", gap:10, alignItems:"flex-start" }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:"#16A34A", marginTop:3, flexShrink:0 }}/>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#166534" }}>Tracking started</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>{fmtTime(points[0].recordedAt)}</div>
                </div>
              </div>
            )}

            {/* Stops */}
            {stops.map((stop, i) => (
              <div key={i}
                onClick={() => panToStop(stop, i)}
                style={{
                  padding:"12px 16px", borderBottom:`1px solid ${C.border}50`,
                  display:"flex", gap:10, alignItems:"flex-start", cursor:"pointer",
                  background: selStop === i ? `${C.brand}08` : "transparent",
                  borderLeft: selStop === i ? `3px solid ${C.brand}` : "3px solid transparent",
                  transition:"all 0.12s",
                }}>
                {/* Stop number badge */}
                <div style={{
                  width:22, height:22, borderRadius:"50%", background: selStop === i ? C.brand : "#1A73E8",
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1,
                }}>
                  <span style={{ color:"#fff", fontSize:10, fontWeight:700 }}>{i+1}</span>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:C.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                    {placeNames[i] || "Locating…"}
                  </div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
                    {fmtTime(stop.arrivedAt)} – {fmtTime(stop.leftAt)}
                  </div>
                  <div style={{ display:"flex", gap:6, marginTop:4 }}>
                    <span style={{ background:"#EFF6FF", color:"#1D4ED8", borderRadius:5, padding:"1px 6px", fontSize:10, fontWeight:600 }}>
                      {fmtDuration(stop.durationMin)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* End event */}
            {points.length > 0 && (
              <div style={{ padding:"12px 16px", display:"flex", gap:10, alignItems:"flex-start" }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:"#DC2626", marginTop:3, flexShrink:0 }}/>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#991B1B" }}>Last recorded point</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>{fmtTime(points[points.length-1].recordedAt)}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FieldMarketingInner({ authUser, isMobile }) {
  const [tab, setTab] = useState(() => {
    const h = window.location.hash.slice(1);
    return ["overview","activities","live","trail","sessions","venues","leads","targets","map","territory","photos","logins","faceid"].includes(h) ? h : "overview";
  });
  const [activities,  setActivities]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [selectedAct, setSelectedAct] = useState(null);

  useEffect(() => {
    function onHash() {
      const h = window.location.hash.slice(1);
      const ids = ["overview","activities","live","trail","sessions","venues","leads","targets","map","territory","photos","logins","faceid"];
      if (ids.includes(h)) setTab(h);
    }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const loadActivities = useCallback(() => {
    setLoading(true);
    getFieldActivitiesApi(authUser.token, { limit:500 })
      .then(r => { if (r.ok) setActivities(r.activities || []); })
      .finally(() => setLoading(false));
  }, [authUser.token]);

  useEffect(() => { loadActivities(); }, [loadActivities]);

  const handleRefresh = () => {
    setRefreshing(true);
    getFieldActivitiesApi(authUser.token, { limit:500 })
      .then(r => { if (r.ok) setActivities(r.activities || []); })
      .finally(() => setRefreshing(false));
  };

  // Aggregate PRO stats from all activities
  const proMap = useMemo(() => {
    const m = {};
    activities.forEach(a => {
      if (!m[a.pro_username]) m[a.pro_username] = { username:a.pro_username, centre:a.centre, acts:0, leads:0, lastDate:"" };
      m[a.pro_username].acts++;
      m[a.pro_username].leads += (a.leads_captured || 0);
      if (!m[a.pro_username].lastDate || a.activity_date > m[a.pro_username].lastDate)
        m[a.pro_username].lastDate = a.activity_date;
    });
    return Object.values(m).sort((a, b) => b.leads - a.leads);
  }, [activities]);

  const totalLeads    = activities.reduce((s, a) => s + (a.leads_captured || 0), 0);
  const totalActs     = activities.length;
  const activePros    = proMap.length;
  const venuesCovered = [...new Set(activities.map(a => a.venue_name).filter(Boolean))].length;

  // ── All tabs — icon + label, single scrollable row (top-developer pattern) ──
  const TABS = [
    { id:"overview",   label:"Overview",   short:"Overview",  Icon: LayoutDashboard },
    { id:"activities", label: totalActs ? `Activities (${totalActs})` : "Activities", short:"Acts", Icon: Activity },
    { id:"live",       label:"Live",       short:"Live",      Icon: null, isLive: true },
    { id:"trail",      label:"Trail",      short:"Trail",     Icon: Route },
    { id:"sessions",   label:"Sessions",   short:"Sessions",  Icon: Clock },
    { id:"venues",     label:"Venues",     short:"Venues",    Icon: Building2 },
    { id:"leads",      label:"Leads",      short:"Leads",     Icon: Users },
    { id:"targets",    label:"Targets",    short:"Targets",   Icon: Target },
    { id:"map",        label:"Map",        short:"Map",       Icon: Map },
    { id:"territory",  label:"Territory",  short:"Territory", Icon: MapPin },
    { id:"photos",     label:"Photos",     short:"Photos",    Icon: Camera },
    { id:"logins",     label:"Login Selfies", short:"Selfies", Icon: User },
    { id:"faceid",     label:"Face ID",    short:"Face ID",   Icon: ScanFace },
  ];

  return (
    <div style={{ maxWidth:1200, margin:"0 auto" }}>
      <style>{`
        @keyframes _livepulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.4)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .fm-tabbar{display:flex;gap:4px;padding:4px;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none;background:#F9FAFB;border-radius:10px;border:1px solid #E5E7EB;}
        .fm-tabbar::-webkit-scrollbar{display:none}
        .fm-tab{display:flex;align-items:center;gap:5px;padding:6px 12px;border:none;border-radius:7px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:500;white-space:nowrap;transition:all .15s;flex-shrink:0;background:transparent;color:#6B7280;}
        .fm-tab:hover{background:#fff;color:#374151;}
        .fm-tab.active{background:#fff;color:#7e1749;font-weight:700;box-shadow:0 1px 3px rgba(0,0,0,0.10);}
        @media(max-width:640px){
          .fm-tab{padding:5px 10px;font-size:12px;gap:4px;}
          .fm-tab-icon{display:none}
        }
      `}</style>

      {/* ── Page header — responsive ── */}
      <div style={{ marginBottom:16, display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:9, background:`${C.brand}12`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Navigation size={17} color={C.brand}/>
          </div>
          <div>
            <div style={{ fontSize: isMobile ? 16 : 20, fontWeight:800, color:C.text }}>Field Marketing</div>
            {!isMobile && <div style={{ fontSize:12, color:C.muted, marginTop:1 }}>PRO activities, leads and venues · all centres</div>}
          </div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          {!loading && totalActs > 0 && (
            <div style={{ display:"flex", gap: isMobile ? 10 : 16, alignItems:"center" }}>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:".04em" }}>Leads</div>
                <div style={{ fontSize: isMobile ? 18 : 22, fontWeight:800, color:C.brand }}>{totalLeads}</div>
              </div>
              <div style={{ width:1, height:24, background:C.border }}/>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:".04em" }}>Acts</div>
                <div style={{ fontSize: isMobile ? 18 : 22, fontWeight:800, color:C.text }}>{totalActs}</div>
              </div>
              <div style={{ width:1, height:24, background:C.border }}/>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:".04em" }}>PROs</div>
                <div style={{ fontSize: isMobile ? 18 : 22, fontWeight:800, color:C.success }}>{activePros}</div>
              </div>
            </div>
          )}
          <button onClick={handleRefresh} disabled={refreshing || loading}
            title="Refresh"
            style={{ width:32, height:32, borderRadius:8, border:`1px solid ${C.border}`, background:C.card, color:C.muted, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, opacity: (refreshing||loading) ? 0.5 : 1 }}>
            <RefreshCw size={13} style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none" }}/>
          </button>
        </div>
      </div>

      {/* ── Tab bar — scrollable pill style (Linear / Stripe pattern) ── */}
      <div className="fm-tabbar" style={{ marginBottom:20 }}>
        {TABS.map(({ id, label, Icon, isLive }) => {
          const isActive = tab === id;
          return (
            <button key={id} className={`fm-tab${isActive ? " active" : ""}`} onClick={() => { window.location.hash = "#" + id; setTab(id); }}>
              {isLive ? (
                <span style={{ width:7, height:7, borderRadius:"50%", background: isActive ? "#DC2626" : "#9CA3AF", display:"inline-block", flexShrink:0, animation: isActive ? "_livepulse 1.6s ease-in-out infinite" : "none" }}/>
              ) : Icon ? (
                <span className="fm-tab-icon" style={{ display:"flex", alignItems:"center", opacity: isActive ? 1 : 0.7 }}>
                  <Icon size={13}/>
                </span>
              ) : null}
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ── */}
      {tab === "overview" && (
        loading ? (
          <div style={{ textAlign:"center", padding:80, color:C.muted, fontSize:14 }}>Loading field data…</div>
        ) : (
          <OverviewTab
            activities={activities} proMap={proMap}
            totalLeads={totalLeads} totalActs={totalActs}
            activePros={activePros} venuesCovered={venuesCovered}
            isMobile={isMobile}
            onSelectActivity={setSelectedAct}
            onChangeTab={setTab}
          />
        )
      )}

      {tab === "activities" && (
        <ActivitiesTab
          activities={activities} authUser={authUser}
          isMobile={isMobile} onSelectActivity={setSelectedAct}
          loading={loading}
        />
      )}

      {tab === "sessions"  && <SessionsTab    authUser={authUser} isMobile={isMobile}/>}
      {tab === "logins"    && <LoginSelfiesTab authUser={authUser} isMobile={isMobile}/>}
      {tab === "venues"   && <VenuesTab   authUser={authUser} isMobile={isMobile}/>}
      {tab === "leads"    && <FieldLeadsTab authUser={authUser} isMobile={isMobile}/>}
      {tab === "targets"   && <TargetsTab   authUser={authUser} proMap={proMap} activities={activities} isMobile={isMobile}/>}
      {tab === "live"      && <LiveTab      authUser={authUser} isMobile={isMobile}/>}
      {tab === "map"       && <AdminMapTab activities={activities} isMobile={isMobile}/>}
      {tab === "territory" && <TerritoryAdminTab authUser={authUser} proMap={proMap} isMobile={isMobile}/>}
      {tab === "photos"    && <PhotosTab    authUser={authUser} proMap={proMap} isMobile={isMobile}/>}
      {tab === "faceid"    && <FaceIdTab    authUser={authUser} isMobile={isMobile}/>}
      {tab === "trail"     && <TrailTab     authUser={authUser} proMap={proMap} isMobile={isMobile}/>}

      {/* ── Activity detail drawer ── */}
      {selectedAct && (
        <ActivityDetailDrawer
          activity={selectedAct}
          onClose={() => setSelectedAct(null)}
          isMobile={isMobile}
          authToken={authUser.token}
        />
      )}
    </div>
  );
}


// ── Default export — creates authUser from vsa-field auth ────────────────────
export default function AdminPage() {
  const user  = getUser();
  const token = getToken();
  const authUser = { ...(user || {}), token: token || "" };
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  React.useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return <FieldMarketingInner authUser={authUser} isMobile={isMobile} />;
}
