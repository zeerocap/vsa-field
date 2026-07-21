import { useState, useEffect, useMemo } from "react";
import C from "../../constants/theme.js";
import { Spinner } from "../../components/ui.jsx";
import { getActivities, getUsers } from "../../api/field.api.js";

const fmtDate = d => d ? new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "—";
const typeLabel = v => v ? v.replace(/_/g," ") : "—";
const displayName = u => { if(!u)return"—"; const n=u.replace(/\.pro$/i,""); return n.charAt(0).toUpperCase()+n.slice(1); };
const Pill=({label,color="#7e1749"})=><span style={{display:"inline-flex",alignItems:"center",padding:"2px 9px",borderRadius:20,background:`${color}15`,color,fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>{label}</span>;

export default function AdminActivities() {
  const [activities,setActivities]=useState([]);
  const [loading,setLoading]=useState(true);
  const [fPro,setFPro]=useState("");
  const [fType,setFType]=useState("");
  const [fVenue,setFVenue]=useState("");
  const [fFrom,setFFrom]=useState("");
  const [fTo,setFTo]=useState("");

  useEffect(()=>{
    getActivities({limit:500})
      .then(a=>setActivities(a?.activities || []))
      .catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  const proOptions=useMemo(()=>[...new Set(activities.map(a=>a.pro_username).filter(Boolean))].sort(),[activities]);
  const typeOptions=useMemo(()=>[...new Set(activities.map(a=>a.activity_type||a.type).filter(Boolean))].sort(),[activities]);

  const filtered=useMemo(()=>activities.filter(a=>{
    if(fPro&&a.pro_username!==fPro)return false;
    if(fType&&(a.activity_type||a.type)!==fType)return false;
    if(fFrom&&a.activity_date<fFrom)return false;
    if(fTo&&a.activity_date>fTo)return false;
    if(fVenue&&!(a.venue_name||"").toLowerCase().includes(fVenue.toLowerCase()))return false;
    return true;
  }),[activities,fPro,fType,fFrom,fTo,fVenue]);

  const totalLeads=filtered.reduce((s,a)=>s+(a.leads_captured||0),0);
  const hasFilter=fPro||fType||fVenue||fFrom||fTo;
  const clearAll=()=>{setFPro("");setFType("");setFVenue("");setFFrom("");setFTo("");};
  const ss={padding:"7px 10px",borderRadius:8,border:"1px solid #E8E8E8",fontSize:12,color:"#111827",background:"#fff",fontFamily:"inherit",outline:"none",cursor:"pointer"};

  if(loading)return<div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:300}}><Spinner/></div>;

  return(
    <div>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:22,fontWeight:800,color:"#111827"}}>Activities</div>
        <div style={{fontSize:12,color:"#6B7280",marginTop:3}}>All field activities · {activities.length} total</div>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14,padding:"11px 14px",background:"#fff",borderRadius:10,border:"1px solid #E8E8E8",alignItems:"center"}}>
        <span style={{fontSize:13,color:"#6B7280"}}>🔍</span>
        <input value={fVenue} onChange={e=>setFVenue(e.target.value)} placeholder="Search venue…" style={{...ss,cursor:"text",minWidth:160}}/>
        <select value={fPro} onChange={e=>setFPro(e.target.value)} style={ss}>
          <option value="">All PROs</option>
          {proOptions.map(p=><option key={p} value={p}>{displayName(p)}</option>)}
        </select>
        <select value={fType} onChange={e=>setFType(e.target.value)} style={ss}>
          <option value="">All Types</option>
          {typeOptions.map(t=><option key={t} value={t}>{typeLabel(t)}</option>)}
        </select>
        <input type="date" value={fFrom} onChange={e=>setFFrom(e.target.value)} style={{...ss,cursor:"text"}} title="From"/>
        <input type="date" value={fTo}   onChange={e=>setFTo(e.target.value)}   style={{...ss,cursor:"text"}} title="To"/>
        {hasFilter&&<button onClick={clearAll} style={{padding:"6px 10px",borderRadius:8,border:"1px solid #E8E8E8",background:"transparent",color:"#6B7280",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>✕ Clear</button>}
        <div style={{marginLeft:"auto",display:"flex",gap:16,alignItems:"center"}}>
          <span style={{fontSize:12,color:"#6B7280"}}>{filtered.length} records</span>
          <span style={{fontSize:12,color:"#7e1749",fontWeight:700}}>{totalLeads} leads</span>
        </div>
      </div>
      <div style={{background:"#fff",borderRadius:12,border:"1px solid #E8E8E8",overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,.05)"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}>
            <thead><tr style={{background:"#F7F8FA"}}>
              {["Date","PRO","Centre","Venue","Type","Leads","Notes"].map(h=>(
                <th key={h} style={{padding:"9px 16px",textAlign:"left",fontSize:11,fontWeight:600,color:"#6B7280",letterSpacing:.4,borderBottom:"1px solid #E8E8E8"}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length===0&&<tr><td colSpan={7} style={{textAlign:"center",padding:48,color:"#6B7280",fontSize:13}}>No activities match filters</td></tr>}
              {filtered.map((a,i)=>(
                <tr key={a.id||i} style={{borderBottom:"1px solid #E8E8E8"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#FFF8FB"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{padding:"10px 16px",fontSize:12,color:"#6B7280",whiteSpace:"nowrap"}}>{fmtDate(a.activity_date)}</td>
                  <td style={{padding:"10px 16px",fontSize:12,fontWeight:600,color:"#111827"}}>{displayName(a.pro_username||a.user_name||"—")}</td>
                  <td style={{padding:"10px 16px"}}>{a.centre?<Pill label={a.centre} color="#2563EB"/>:<span style={{color:"#9CA3AF",fontSize:12}}>—</span>}</td>
                  <td style={{padding:"10px 16px",fontSize:12,color:"#111827",maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={a.venue_name}>{a.venue_name||"—"}</td>
                  <td style={{padding:"10px 16px"}}><Pill label={typeLabel(a.activity_type||a.type)} color="#7C3AED"/></td>
                  <td style={{padding:"10px 16px"}}>
                    <span style={{fontSize:15,fontWeight:800,color:(a.leads_captured||0)>0?"#7e1749":"#6B7280"}}>{a.leads_captured||0}</span>
                    {a.is_late_entry&&<span style={{marginLeft:6,fontSize:10,color:"#D97706",fontWeight:600,background:"#FFFBEB",borderRadius:4,padding:"1px 5px"}}>LATE</span>}
                  </td>
                  <td style={{padding:"10px 16px",fontSize:11,color:"#6B7280",maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={a.notes||a.description}>{a.notes||a.description||"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
