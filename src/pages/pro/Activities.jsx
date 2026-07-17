import { useState, useEffect } from "react";
import C from "../../constants/theme.js";
import { Card, Btn, Modal, Input, Select, Spinner, Empty } from "../../components/ui.jsx";
import { getActivities, addActivity, getVenues } from "../../api/field.api.js";

const TYPES=["Venue Visit","Demo","Meeting","Event","Door-to-Door","School Visit","College Visit","Corporate Visit","Other"];
const typeLabel=v=>v?v.replace(/_/g," "):"—";
const fmtDate=d=>d?new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):"—";

export default function ProActivities() {
  const [items,setItems]=useState([]);
  const [venues,setVenues]=useState([]);
  const [loading,setLoading]=useState(true);
  const [open,setOpen]=useState(false);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({venue_id:"",activity_type:"Venue Visit",leads_captured:"",notes:"",duration_min:"",activity_date:new Date().toISOString().slice(0,10)});

  const load=()=>{
    Promise.all([getActivities({}),getVenues()])
      .then(([a,v])=>{setItems(a?.activities||a||[]);setVenues(v?.venues||v||[]);})
      .catch(()=>{}).finally(()=>setLoading(false));
  };
  useEffect(load,[]);
  const F=(k,v)=>setForm(f=>({...f,[k]:v}));
  const openNew=()=>{setForm({venue_id:"",activity_type:"Venue Visit",leads_captured:"",notes:"",duration_min:"",activity_date:new Date().toISOString().slice(0,10)});setOpen(true);};

  async function handleSave(e){
    e.preventDefault();setSaving(true);
    try{
      await addActivity({...form,venue_id:form.venue_id?Number(form.venue_id):undefined,leads_captured:form.leads_captured?Number(form.leads_captured):0,duration_min:form.duration_min?Number(form.duration_min):undefined});
      setOpen(false);load();
    }catch(err){alert(err.message);}finally{setSaving(false);}
  }

  if(loading)return<Spinner/>;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontWeight:700,fontSize:20,color:C.text}}>Activities</div>
          <div style={{fontSize:12,color:C.muted,marginTop:2}}>{items.length} logged</div>
        </div>
        <Btn onClick={openNew}>+ Log Activity</Btn>
      </div>
      {items.length===0?<Empty msg="No activities yet" icon="📋"/>:items.map((a,i)=>(
        <Card key={a.id||i} style={{padding:"14px 16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
            <div>
              <div style={{fontWeight:700,fontSize:14,color:C.text}}>{typeLabel(a.activity_type||a.type)}</div>
              <div style={{fontSize:12,color:C.muted,marginTop:2}}>{fmtDate(a.activity_date)}{a.venue_name?` · ${a.venue_name}`:""}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:22,fontWeight:900,color:(a.leads_captured||0)>0?C.brand:C.muted}}>{a.leads_captured||0}</div>
              <div style={{fontSize:10,color:C.muted}}>leads</div>
            </div>
          </div>
          {(a.notes||a.description)&&<div style={{fontSize:12,color:C.muted,background:C.bg,borderRadius:8,padding:"8px 10px",marginTop:6}}>{(a.notes||a.description).slice(0,120)}</div>}
          <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
            {a.duration_min&&<span style={{background:C.infoBg,color:C.info,borderRadius:20,padding:"2px 8px",fontSize:11}}>⏱ {a.duration_min} min</span>}
            {a.is_late_entry&&<span style={{background:C.warningBg,color:C.warning,borderRadius:20,padding:"2px 8px",fontSize:11,fontWeight:600}}>Late Entry</span>}
            {(a.fake_gps_flag||a.gps_flag)&&<span style={{background:C.dangerBg,color:C.danger,borderRadius:20,padding:"2px 8px",fontSize:11,fontWeight:600}}>GPS Flag</span>}
          </div>
        </Card>
      ))}
      <Modal open={open} onClose={()=>setOpen(false)} title="Log Activity">
        <form onSubmit={handleSave} style={{display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <label style={{fontSize:12,fontWeight:600,color:C.muted,display:"block",marginBottom:6}}>Date</label>
            <input type="date" value={form.activity_date} onChange={e=>F("activity_date",e.target.value)}
              style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1px solid ${C.border}`,fontSize:13,color:C.text,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
          </div>
          <Select label="Venue" value={form.venue_id} onChange={e=>F("venue_id",e.target.value)}
            options={[{value:"",label:"— Select venue —"},...venues.map(v=>({value:String(v.id),label:v.name}))]}/>
          <Select label="Activity Type" value={form.activity_type} onChange={e=>F("activity_type",e.target.value)} required
            options={TYPES.map(t=>({value:t,label:t}))}/>
          <Input label="Leads Captured" value={form.leads_captured} onChange={e=>F("leads_captured",e.target.value)} type="number" placeholder="How many leads?" min="0"/>
          <Input label="Duration (minutes)" value={form.duration_min} onChange={e=>F("duration_min",e.target.value)} type="number" placeholder="e.g. 45" min="1"/>
          <Input label="Notes" value={form.notes} onChange={e=>F("notes",e.target.value)} placeholder="What did you do?"/>
          <Btn type="submit" disabled={saving} size="lg" style={{width:"100%"}}>{saving?"Saving…":"Save Activity"}</Btn>
        </form>
      </Modal>
    </div>
  );
}
