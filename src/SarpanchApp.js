import React, { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import { collection, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { signOut } from "firebase/auth";

const C = {
  bg:"#0A0300", bgCard:"#140800", bgCard2:"#1E0D00",
  border:"#6B3410", ochre:"#D4891A", orange:"#C45E1A", red:"#B5330A",
  chalk:"#EDE0C4", chalkDim:"#9A8060", green:"#1E5C3A", greenLight:"#4CAF80",
  indigo:"#4A8FD4", kumkum:"#C1121F",
};

const PBar = () => (
  <div style={{height:5,background:`repeating-linear-gradient(90deg,${C.red} 0,${C.red} 10px,${C.ochre} 10px,${C.ochre} 20px,${C.orange} 20px,${C.orange} 28px)`}}/>
);

const Card = ({children,style={},onClick}) => (
  <div onClick={onClick} style={{background:`linear-gradient(145deg,${C.bgCard},${C.bgCard2})`,border:`1.5px solid ${C.border}`,borderRadius:14,overflow:"hidden",position:"relative",cursor:onClick?"pointer":undefined,...style}}>
    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${C.red},${C.ochre},${C.orange})`}}/>
    {children}
  </div>
);

const Btn = ({children,onClick,bg=C.ochre,tc="#0A0300",style={}}) => (
  <button onClick={onClick} style={{background:`linear-gradient(135deg,${bg},${bg}CC)`,border:"none",color:tc,borderRadius:10,padding:"12px 0",cursor:"pointer",fontFamily:"'Baloo 2',sans-serif",fontSize:14,fontWeight:700,width:"100%",...style}}>{children}</button>
);

export default function SarpanchApp({ currentUser }) {
  const [tab, setTab] = useState("problems");
  const [screen, setScreen] = useState("problems");
  const [problems, setProblems] = useState([]);
  const [shops, setShops] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(()=>{
    const u1 = onSnapshot(collection(db,"problems"),s=>setProblems(s.docs.map(d=>({id:d.id,...d.data()}))));
    const u2 = onSnapshot(collection(db,"shops"),s=>setShops(s.docs.map(d=>({id:d.id,...d.data()}))));
    return ()=>{u1();u2();};
  },[]);

  const go = (s,t=null) => { setScreen(s); if(t) setTab(t); try{window.scrollTo(0,0);}catch(e){} };

  const Hdr = ({title,back}) => (
    <div style={{background:`linear-gradient(135deg,#1E0800,#0A0300)`,position:"sticky",top:0,zIndex:99}}>
      <PBar/>
      <div style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
        {back&&<button onClick={back} style={{background:"rgba(212,137,26,.15)",border:`1px solid ${C.ochre}`,color:C.ochre,borderRadius:9,width:34,height:34,cursor:"pointer",fontSize:17,display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>}
        <div style={{flex:1,fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:17,fontWeight:700,color:C.ochre}}>{title}</div>
      </div>
    </div>
  );

  const Nav = () => (
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:`linear-gradient(0deg,${C.bg},${C.bgCard})`,borderTop:`2px solid ${C.border}`,display:"flex",zIndex:100}}>
      {[
        {id:"problems",icon:"📢",l:"समस्याएं"},
        {id:"stats",icon:"📊",l:"Stats"},
        {id:"shops",icon:"🏪",l:"दुकानें"},
        {id:"profile",icon:"👤",l:"Profile"},
      ].map(t=>(
        <button key={t.id} onClick={()=>{setTab(t.id);go(t.id);}} style={{flex:1,padding:"9px 0",background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,borderTop:`3px solid ${tab===t.id?C.ochre:"transparent"}`}}>
          <span style={{fontSize:18}}>{t.icon}</span>
          <span style={{fontSize:9,color:tab===t.id?C.ochre:C.chalkDim,fontFamily:"'Baloo 2',sans-serif"}}>{t.l}</span>
        </button>
      ))}
    </div>
  );

  const wrap = (children) => (
    <div style={{minHeight:"100vh",background:C.bg,color:C.chalk,maxWidth:430,margin:"0 auto",paddingBottom:80,fontFamily:"'Baloo 2',sans-serif"}}>
      {children}<Nav/>
    </div>
  );

  const filteredProblems = filter==="all" ? problems : problems.filter(p=>p.status===filter);

  // PROBLEMS
  if(screen==="problems") return wrap(<>
    <div style={{background:`linear-gradient(160deg,#260B00,#0A0300)`}}>
      <PBar/>
      <div style={{padding:"16px 18px"}}>
        <div style={{fontSize:10,color:C.orange,letterSpacing:2,marginBottom:4}}>नमस्ते 🙏</div>
        <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:24,color:C.ochre,fontWeight:700}}>{currentUser?.name} जी</div>
        <div style={{fontSize:11,color:C.chalkDim}}>🏛️ सरपंच · {currentUser?.village}</div>
      </div>
    </div>

    <div style={{display:"flex",background:C.bgCard,borderBottom:`1px solid ${C.border}`}}>
      {[
        {n:problems.filter(p=>p.status==="pending").length,l:"Pending",c:C.red},
        {n:problems.filter(p=>p.status==="inprogress").length,l:"Progress",c:C.ochre},
        {n:problems.filter(p=>p.status==="solved").length,l:"Solved",c:C.greenLight},
        {n:problems.filter(p=>(p.votes||0)>=50).length,l:"High Priority",c:C.kumkum},
      ].map((s,i)=>(
        <div key={i} style={{flex:1,textAlign:"center",padding:"10px 0",borderRight:`1px solid ${C.border}`}}>
          <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:20,color:s.c,fontWeight:700}}>{s.n}</div>
          <div style={{fontSize:9,color:C.chalkDim}}>{s.l}</div>
        </div>
      ))}
    </div>

    <div style={{padding:14}}>
      {/* Filter buttons */}
      <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
        {[{v:"all",l:"सभी"},{v:"pending",l:"🔴 Pending"},{v:"inprogress",l:"🔄 Progress"},{v:"solved",l:"✅ Solved"}].map(f=>(
          <button key={f.v} onClick={()=>setFilter(f.v)} style={{whiteSpace:"nowrap",padding:"6px 14px",borderRadius:20,border:`1px solid ${filter===f.v?C.ochre:C.border}`,background:filter===f.v?"rgba(212,137,26,.2)":C.bgCard,color:filter===f.v?C.ochre:C.chalkDim,cursor:"pointer",fontFamily:"'Baloo 2',sans-serif",fontSize:12,flexShrink:0}}>{f.l}</button>
        ))}
      </div>

      {filteredProblems.sort((a,b)=>(b.votes||0)-(a.votes||0)).map(p=>(
        <Card key={p.id} style={{marginBottom:12}}>
          <div style={{padding:"14px 14px 12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:22}}>{p.cat}</span>
                {(p.votes||0)>=50&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:12,background:"rgba(193,18,31,.2)",color:"#FF6B4A",border:`1px solid ${C.kumkum}`}}>🔥 High Priority</span>}
              </div>
              <select value={p.status||"pending"} onChange={async(e)=>{
                await updateDoc(doc(db,"problems",p.id),{status:e.target.value});
              }} style={{background:C.bgCard2,border:`1px solid ${C.border}`,color:C.chalk,borderRadius:8,padding:"4px 8px",fontFamily:"'Baloo 2',sans-serif",fontSize:11,outline:"none",cursor:"pointer"}}>
                <option value="pending">🔴 Pending</option>
                <option value="inprogress">🔄 Progress</option>
                <option value="solved">✅ Solved</option>
              </select>
            </div>
            <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:14,color:C.chalk,marginBottom:6}}>{p.title}</div>
            <div style={{fontSize:11,color:C.chalkDim}}>👤 {p.user} · 📍 {p.village}</div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
              <span style={{color:C.ochre,fontWeight:700,fontSize:13}}>👍 {p.votes||0} support</span>
              <span style={{fontSize:11,color:C.chalkDim}}>{p.days||0} दिन पुरानी</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  </>);

  // STATS
  if(screen==="stats") return wrap(<>
    <Hdr title="📊 Village Statistics"/>
    <div style={{padding:14}}>
      <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:14,color:C.ochre,margin:"0 0 12px",textAlign:"center"}}>— गाँव की स्थिति —</div>

      {/* Problems stats */}
      <Card style={{marginBottom:14}}>
        <div style={{padding:16}}>
          <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:16,color:C.ochre,marginBottom:12}}>📢 समस्याएं</div>
          {[
            {l:"कुल दर्ज",n:problems.length,c:C.chalk},
            {l:"Pending",n:problems.filter(p=>p.status==="pending").length,c:C.red},
            {l:"In Progress",n:problems.filter(p=>p.status==="inprogress").length,c:C.ochre},
            {l:"हल हुईं",n:problems.filter(p=>p.status==="solved").length,c:C.greenLight},
            {l:"High Priority (50+ votes)",n:problems.filter(p=>(p.votes||0)>=50).length,c:C.kumkum},
          ].map(s=>(
            <div key={s.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,paddingBottom:10,borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontSize:13,color:C.chalkDim}}>{s.l}</span>
              <span style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:20,color:s.c,fontWeight:700}}>{s.n}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Shops stats */}
      <Card style={{marginBottom:14}}>
        <div style={{padding:16}}>
          <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:16,color:C.ochre,marginBottom:12}}>🏪 दुकानें</div>
          {[
            {l:"कुल दुकानें",n:shops.length,c:C.chalk},
            {l:"अभी खुली",n:shops.filter(s=>s.open).length,c:C.greenLight},
            {l:"कुल Items",n:shops.reduce((a,s)=>a+(s.items||[]).length,0),c:C.ochre},
            {l:"Available Items",n:shops.reduce((a,s)=>a+(s.items||[]).filter(i=>i.available).length,0),c:C.greenLight},
          ].map(s=>(
            <div key={s.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,paddingBottom:10,borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontSize:13,color:C.chalkDim}}>{s.l}</span>
              <span style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:20,color:s.c,fontWeight:700}}>{s.n}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </>);

  // SHOPS LIST (Sarpanch view)
  if(screen==="shops") return wrap(<>
    <Hdr title="🏪 सभी दुकानें"/>
    <div style={{padding:14}}>
      {shops.map(shop=>(
        <Card key={shop.id} style={{marginBottom:10}}>
          <div style={{padding:14}}>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:15,color:C.ochre,fontWeight:700}}>{shop.name}</div>
              <span style={{fontSize:10,padding:"3px 8px",borderRadius:12,background:shop.open?"rgba(30,92,58,.3)":"rgba(181,51,10,.2)",color:shop.open?C.greenLight:C.red,border:`1px solid ${shop.open?C.green:C.red}`}}>{shop.open?"🟢 खुला":"🔴 बंद"}</span>
            </div>
            <div style={{fontSize:12,color:C.chalkDim,marginTop:4}}>👤 {shop.owner} · 📍 {shop.village}</div>
            <div style={{fontSize:11,color:C.ochre,marginTop:4}}>{(shop.items||[]).length} items · {(shop.items||[]).filter(i=>i.available).length} available</div>
          </div>
        </Card>
      ))}
    </div>
  </>);

  // PROFILE
  if(screen==="profile") return wrap(<>
    <Hdr title="👤 मेरा Profile"/>
    <div style={{padding:16}}>
      <Card style={{marginBottom:16,textAlign:"center"}}>
        <div style={{padding:20}}>
          <div style={{width:80,height:80,borderRadius:"50%",background:`radial-gradient(${C.ochre}28,transparent)`,border:`2px solid ${C.ochre}45`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,margin:"0 auto",overflow:"hidden"}}>
            {currentUser?.photoUrl?<img src={currentUser.photoUrl} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:"🏛️"}
          </div>
          <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:20,color:C.ochre,marginTop:10}}>{currentUser?.name}</div>
          <div style={{fontSize:12,color:C.chalkDim}}>📍 {currentUser?.village} · {currentUser?.gender}</div>
          <div style={{fontSize:11,color:C.orange,marginTop:4}}>🏛️ Sarpanch / Official</div>
          <div style={{fontSize:12,color:C.chalkDim,marginTop:4}}>{currentUser?.phone||currentUser?.email}</div>
        </div>
      </Card>
      <Btn onClick={async()=>{await signOut(auth);}} bg={C.red} tc={C.chalk}>🚪 Logout</Btn>
    </div>
  </>);

  return null;
}
