import React, { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import { collection, onSnapshot, addDoc, updateDoc, doc } from "firebase/firestore";
import { signOut } from "firebase/auth";

const C = {
  bg:"#0A0300", bgCard:"#140800", bgCard2:"#1E0D00",
  border:"#6B3410", ochre:"#D4891A", orange:"#C45E1A", red:"#B5330A",
  chalk:"#EDE0C4", chalkDim:"#9A8060", green:"#1E5C3A", greenLight:"#4CAF80",
  indigo:"#4A8FD4", kumkum:"#C1121F",
};

const CATS = [
  {id:1,icon:"🛒",name:"दुकानें",color:"#C45E1A",sub:[{id:101,name:"किराना"},{id:102,name:"बीज & खाद"},{id:103,name:"दवाई"},{id:104,name:"कपड़ा"},{id:105,name:"Hardware"},{id:106,name:"Mobile"}]},
  {id:2,icon:"🔧",name:"मिस्त्री",color:"#2EC4B6",sub:[{id:201,name:"Mobile Repair"},{id:202,name:"Electrician"},{id:203,name:"Pump"},{id:204,name:"Tractor"},{id:205,name:"Welder"},{id:206,name:"Plumber"}]},
  {id:3,icon:"🌾",name:"किसान",color:"#4CAF80",sub:[{id:301,name:"सब्जी & फल"},{id:302,name:"दूध & डेयरी"},{id:303,name:"अनाज & दाल"}]},
  {id:4,icon:"🚗",name:"यातायात",color:"#F4A261",sub:[{id:401,name:"Auto"},{id:402,name:"Tractor"},{id:403,name:"Tempo"}]},
  {id:5,icon:"👩‍⚕️",name:"स्वास्थ्य",color:"#E63946",sub:[{id:501,name:"Doctor"},{id:502,name:"ASHA"},{id:503,name:"Ayurvedic"}]},
  {id:6,icon:"🏗️",name:"निर्माण",color:"#8B6FD4",sub:[{id:601,name:"राज मिस्त्री"},{id:602,name:"Carpenter"},{id:603,name:"Painter"}]},
  {id:7,icon:"✂️",name:"सेवाएं",color:"#FF9F1C",sub:[{id:701,name:"Tailor"},{id:702,name:"Barber"},{id:703,name:"Laundry"}]},
  {id:8,icon:"🏛️",name:"सरकारी",color:"#4A8FD4",sub:[{id:801,name:"CSC"},{id:802,name:"Bank Mitra"},{id:803,name:"Insurance"}]},
];

const PCATS = [
  {id:"road",icon:"🛣️",name:"सड़क",subs:["सड़क टूटी","पुल खराब","स्ट्रीट लाइट"]},
  {id:"water",icon:"💧",name:"पानी",subs:["नल बंद","हैंडपंप खराब","पानी गंदा"]},
  {id:"elec",icon:"💡",name:"बिजली",subs:["बिजली नहीं","खंभा गिरा","मीटर खराब"]},
  {id:"school",icon:"🏫",name:"स्कूल",subs:["शिक्षक नहीं","इमारत खराब","Midday meal"]},
  {id:"health",icon:"🏥",name:"स्वास्थ्य",subs:["PHC बंद","दवाई नहीं","Ambulance"]},
  {id:"forest",icon:"🌿",name:"जंगल",subs:["अवैध कटाई","खनन","जानवर"]},
  {id:"scheme",icon:"📋",name:"योजनाएं",subs:["राशन नहीं","पेंशन रुकी","PM Kisan"]},
  {id:"other",icon:"🆘",name:"अन्य",subs:["अन्य समस्या"]},
];

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

const Stars = ({r}) => (
  <span style={{color:C.ochre,fontSize:12}}>{"★".repeat(Math.floor(r||0))}{"☆".repeat(5-Math.floor(r||0))}<span style={{color:C.chalkDim,fontSize:11,marginLeft:4}}>{r||0}</span></span>
);

export default function CustomerApp({ currentUser }) {
  const [tab, setTab] = useState("home");
  const [screen, setScreen] = useState("home");
  const [shops, setShops] = useState([]);
  const [problems, setProblems] = useState([]);
  const [myQueries, setMyQueries] = useState([]);
  const [selCat, setSelCat] = useState(null);
  const [selSub, setSelSub] = useState(null);
  const [selShop, setSelShop] = useState(null);
  const [search, setSearch] = useState("");
  const [votedIds, setVotedIds] = useState([]);
  const [qText, setQText] = useState("");
  const [qDone, setQDone] = useState(false);
  const [pForm, setPForm] = useState({cat:"",sub:"",desc:"",village:currentUser?.village||"सोंडवा"});
  const [pDone, setPDone] = useState(false);

  useEffect(() => {
    const u1 = onSnapshot(collection(db,"shops"),s=>setShops(s.docs.map(d=>({id:d.id,...d.data()}))));
    const u2 = onSnapshot(collection(db,"problems"),s=>setProblems(s.docs.map(d=>({id:d.id,...d.data()}))));
    const u3 = onSnapshot(collection(db,"queries"),s=>setMyQueries(s.docs.map(d=>({id:d.id,...d.data()})).filter(q=>q.userId===auth.currentUser?.uid)));
    return ()=>{u1();u2();u3();};
  },[]);

  const go = (s,t=null) => { setScreen(s); if(t) setTab(t); setQDone(false); setPDone(false); try{window.scrollTo(0,0);}catch(e){} };

  const villages = ["सोंडवा","भाबरा","जोबट","उदयगढ़","कट्ठीवाड़ा","बोरी"];

  const Nav = () => (
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:`linear-gradient(0deg,${C.bg},${C.bgCard})`,borderTop:`2px solid ${C.border}`,display:"flex",zIndex:100}}>
      {[
        {id:"home",icon:"🏘️",l:"होम"},
        {id:"problems",icon:"📢",l:"समस्या"},
        {id:"queries",icon:"❓",l:"Queries"},
        {id:"profile",icon:"👤",l:"Profile"},
      ].map(t=>(
        <button key={t.id} onClick={()=>{setTab(t.id);go(t.id==="queries"?"myqueries":t.id);}} style={{flex:1,padding:"9px 0",background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,borderTop:`3px solid ${tab===t.id?C.ochre:"transparent"}`}}>
          <span style={{fontSize:18}}>{t.icon}</span>
          <span style={{fontSize:9,color:tab===t.id?C.ochre:C.chalkDim,fontFamily:"'Baloo 2',sans-serif"}}>{t.l}</span>
        </button>
      ))}
    </div>
  );

  const Hdr = ({title,back,right}) => (
    <div style={{background:`linear-gradient(135deg,#1E0800,#0A0300)`,position:"sticky",top:0,zIndex:99}}>
      <PBar/>
      <div style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
        {back&&<button onClick={back} style={{background:"rgba(212,137,26,.15)",border:`1px solid ${C.ochre}`,color:C.ochre,borderRadius:9,width:34,height:34,cursor:"pointer",fontSize:17,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>←</button>}
        <div style={{flex:1,fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:17,fontWeight:700,color:C.ochre}}>{title}</div>
        {right}
      </div>
    </div>
  );

  const wrap = (children) => (
    <div style={{minHeight:"100vh",background:C.bg,color:C.chalk,maxWidth:430,margin:"0 auto",paddingBottom:80,fontFamily:"'Baloo 2',sans-serif"}}>
      {children}<Nav/>
    </div>
  );

  const shopsBySub = (id) => shops.filter(s=>s.catId===Number(id));

  // HOME
  if(screen==="home") return wrap(<>
    <div style={{background:`linear-gradient(160deg,#260B00,#0A0300)`}}>
      <PBar/>
      <div style={{padding:"16px 18px 0",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div style={{fontSize:10,color:C.orange,letterSpacing:2,marginBottom:4}}>नमस्ते 🙏</div>
          <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:26,color:C.ochre,fontWeight:700}}>{currentUser?.name}</div>
          <div style={{fontSize:11,color:C.chalkDim}}>📍 {currentUser?.village} · 👤 Customer</div>
        </div>
        <div style={{width:48,height:48,borderRadius:"50%",background:`radial-gradient(${C.ochre}28,transparent)`,border:`2px solid ${C.ochre}45`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,overflow:"hidden"}}>
          {currentUser?.photoUrl?<img src={currentUser.photoUrl} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:"👤"}
        </div>
      </div>
      <div style={{padding:"12px 16px 16px"}}>
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="खोजो — दुकान, सामान, सेवा..." style={{width:"100%",padding:"10px 12px 10px 36px",background:C.bgCard,border:`1.5px solid ${C.border}`,borderRadius:10,color:C.chalk,fontSize:13,fontFamily:"'Baloo 2',sans-serif",outline:"none",boxSizing:"border-box"}}/>
        </div>
      </div>
    </div>

    <div style={{display:"flex",background:C.bgCard,borderBottom:`1px solid ${C.border}`}}>
      {[{n:shops.length,l:"दुकानें"},{n:shops.reduce((a,s)=>a+(s.items||[]).filter(i=>i.available).length,0),l:"Items"},{n:problems.filter(p=>p.status==="pending").length,l:"समस्याएं"},{n:myQueries.length,l:"Queries"}].map((s,i)=>(
        <div key={i} style={{flex:1,textAlign:"center",padding:"10px 0",borderRight:`1px solid ${C.border}`}}>
          <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:20,color:C.ochre,fontWeight:700}}>{s.n}</div>
          <div style={{fontSize:9,color:C.chalkDim}}>{s.l}</div>
        </div>
      ))}
    </div>

    <div style={{padding:"0 14px 16px"}}>
      <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:14,color:C.ochre,margin:"14px 0 10px",textAlign:"center"}}>— सेवा श्रेणियाँ —</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {CATS.map(cat=>(
          <Card key={cat.id} onClick={()=>{setSelCat(cat);go("subcat");}}>
            <div style={{padding:"14px 12px"}}>
              <div style={{width:46,height:46,borderRadius:"50%",background:`radial-gradient(${cat.color}22,transparent)`,border:`1.5px solid ${cat.color}50`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,marginBottom:8}}>{cat.icon}</div>
              <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:14,color:C.chalk,fontWeight:700}}>{cat.name}</div>
              <div style={{fontSize:10,color:cat.color,marginTop:4}}>{cat.sub.reduce((a,s)=>a+shopsBySub(s.id).length,0)} listed →</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  </>);

  // SUBCAT
  if(screen==="subcat") return wrap(<>
    <Hdr title={`${selCat.icon} ${selCat.name}`} back={()=>go("home")}/>
    <div style={{padding:14}}>
      {selCat.sub.map(sub=>{
        const cnt=shopsBySub(sub.id).length;
        return(
          <Card key={sub.id} onClick={()=>{setSelSub(sub);go("shoplist");}} style={{marginBottom:9}}>
            <div style={{padding:"13px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:15,color:C.chalk}}>{sub.name}</div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:11,padding:"2px 8px",borderRadius:12,background:cnt>0?"rgba(30,92,58,.3)":"rgba(60,30,0,.5)",color:cnt>0?C.greenLight:C.chalkDim,border:`1px solid ${cnt>0?C.green:C.border}`}}>{cnt>0?`${cnt} दुकानें`:"जल्द"}</span>
                <span style={{color:C.ochre}}>›</span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  </>);

  // SHOP LIST
  if(screen==="shoplist") return wrap(<>
    <Hdr title={selSub?.name} back={()=>go("subcat")}/>
    <div style={{padding:14}}>
      {shopsBySub(selSub?.id).length===0?(
        <div style={{textAlign:"center",padding:50}}>
          <div style={{fontSize:48}}>🕐</div>
          <div style={{color:C.chalkDim,fontFamily:"'Tiro Devanagari Hindi',serif",marginTop:12}}>जल्द ही दुकानें जुड़ेंगी...</div>
        </div>
      ):shopsBySub(selSub?.id).map(shop=>(
        <Card key={shop.id} style={{marginBottom:12}}>
          <div style={{padding:"14px 14px 12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:16,color:C.ochre,fontWeight:700,flex:1,marginRight:8}}>{shop.name}</div>
              <span style={{fontSize:10,padding:"3px 8px",borderRadius:20,background:shop.open?"rgba(30,92,58,.3)":"rgba(181,51,10,.2)",color:shop.open?C.greenLight:C.red,border:`1px solid ${shop.open?C.green:C.red}`,whiteSpace:"nowrap",flexShrink:0}}>{shop.open?"🟢 खुला":"🔴 बंद"}</span>
            </div>
            <div style={{fontSize:12,color:C.chalkDim,marginTop:4}}>👤 {shop.owner} · 📍 {shop.village}</div>
            <div style={{marginTop:4}}><Stars r={shop.rating}/></div>
            <div style={{marginTop:9,display:"flex",flexWrap:"wrap",gap:5}}>
              {(shop.items||[]).slice(0,4).map((it,i)=>(
                <span key={i} style={{fontSize:11,padding:"3px 8px",borderRadius:8,background:it.available?"rgba(30,92,58,.18)":"rgba(60,20,0,.5)",color:it.available?C.greenLight:C.chalkDim,border:`1px solid ${it.available?C.green:C.border}`}}>
                  {it.emoji} {it.name?.split(" ")[0]} {it.available?"✓":"✗"}
                </span>
              ))}
            </div>
            <div style={{display:"flex",gap:8,marginTop:12}}>
              <button onClick={()=>{setSelShop(shop);go("shopdetail");}} style={{flex:1,background:"rgba(212,137,26,.12)",border:`1px solid ${C.ochre}`,color:C.ochre,borderRadius:9,padding:"8px 0",cursor:"pointer",fontFamily:"'Baloo 2',sans-serif",fontSize:13,fontWeight:600}}>👁️ देखें</button>
              <button onClick={()=>{setSelShop(shop);go("query");}} style={{flex:1,background:`linear-gradient(135deg,${C.red},${C.orange})`,border:"none",color:C.chalk,borderRadius:9,padding:"8px 0",cursor:"pointer",fontFamily:"'Baloo 2',sans-serif",fontSize:13,fontWeight:700}}>❓ Query</button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  </>);

  // SHOP DETAIL
  if(screen==="shopdetail") return wrap(<>
    <Hdr title="दुकान की जानकारी" back={()=>go("shoplist")}/>
    <div style={{padding:14}}>
      <Card style={{marginBottom:14}}>
        <div style={{padding:16}}>
          <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:21,color:C.ochre,fontWeight:700}}>{selShop?.name}</div>
          <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:5,fontSize:13}}>
            <div>👤 <span style={{color:C.chalk}}>{selShop?.owner}</span></div>
            <div style={{color:C.chalkDim}}>📍 {selShop?.village} · 📞 {selShop?.phone}</div>
            <div><Stars r={selShop?.rating}/></div>
            <div style={{color:selShop?.open?C.greenLight:C.red}}>{selShop?.open?"🟢 अभी खुला":"🔴 बंद"}</div>
          </div>
          {selShop?.desc&&<div style={{marginTop:10,padding:"9px 12px",background:"rgba(212,137,26,.08)",borderRadius:8,fontSize:13,borderLeft:`3px solid ${C.ochre}`}}>{selShop.desc}</div>}
        </div>
      </Card>
      <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:13,color:C.ochre,margin:"0 0 10px",textAlign:"center"}}>📦 उपलब्ध सामान</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
        {(selShop?.items||[]).map((item,i)=>(
          <div key={i} style={{background:item.available?"rgba(30,92,58,.12)":"rgba(60,20,0,.4)",border:`1.5px solid ${item.available?C.green:C.border}`,borderRadius:10,padding:"12px 10px",textAlign:"center"}}>
            <div style={{fontSize:26,marginBottom:4}}>{item.emoji}</div>
            <div style={{fontSize:12,color:C.chalk,fontWeight:600,lineHeight:1.3}}>{item.name}</div>
            <div style={{fontSize:13,color:C.ochre,fontWeight:700,marginTop:3}}>₹{item.price}</div>
            <div style={{marginTop:6,fontSize:10,padding:"2px 8px",borderRadius:8,display:"inline-block",background:item.available?"rgba(30,92,58,.3)":"rgba(181,51,10,.2)",color:item.available?C.greenLight:"#FF6B4A"}}>{item.available?"✅ उपलब्ध":"❌ खत्म"}</div>
          </div>
        ))}
      </div>
      <Btn onClick={()=>go("query")} bg={C.red} tc={C.chalk}>📝 Query भेजो →</Btn>
    </div>
  </>);

  // QUERY FORM
  if(screen==="query") return wrap(<>
    <Hdr title={`Query → ${selShop?.name}`} back={()=>go("shopdetail")}/>
    <div style={{padding:16}}>
      {qDone?(
        <div style={{textAlign:"center",paddingTop:50}}>
          <div style={{fontSize:60}}>✅</div>
          <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:22,color:C.ochre,marginTop:14}}>Query भेज दी गई!</div>
          <div style={{fontSize:13,color:C.chalkDim,marginTop:8}}>दुकानदार को जवाब देने पर notification मिलेगा।</div>
          <Btn onClick={()=>{setTab("queries");go("myqueries");}} bg={C.ochre} style={{marginTop:20}}>मेरी Queries देखो →</Btn>
        </div>
      ):(
        <>
          <Card style={{marginBottom:14}}>
            <div style={{padding:"12px 14px"}}>
              <div style={{fontSize:11,color:C.chalkDim}}>Query जा रही है:</div>
              <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",color:C.ochre,fontSize:15,marginTop:4}}>{selShop?.name}</div>
            </div>
          </Card>
          <div style={{fontSize:13,color:C.chalkDim,marginBottom:8}}>आप क्या जानना चाहते हैं?</div>
          <textarea value={qText} onChange={e=>setQText(e.target.value)} placeholder="जैसे: क्या 10kg आटा है? कब आएगा?" rows={4} style={{width:"100%",padding:12,background:C.bgCard,border:`1.5px solid ${C.border}`,borderRadius:10,color:C.chalk,fontSize:14,fontFamily:"'Baloo 2',sans-serif",resize:"none",outline:"none",boxSizing:"border-box",marginBottom:12}}/>
          <Btn onClick={async()=>{
            if(!qText.trim()) return;
            try {
              await addDoc(collection(db,"queries"),{
                shopId:selShop.id, shopName:selShop.name,
                query:qText, status:"pending", reply:"",
                userId:auth.currentUser?.uid, userName:currentUser?.name,
                time:"अभी", createdAt:new Date()
              });
              setQText(""); setQDone(true);
            } catch(e){ alert("Error! Dobara try karo."); }
          }} bg={C.red} tc={C.chalk}>📤 Query भेजो</Btn>
        </>
      )}
    </div>
  </>);

  // PROBLEMS
  if(screen==="problems") return wrap(<>
    <Hdr title="📢 सार्वजनिक समस्याएं"/>
    <div style={{padding:14}}>
      <Btn onClick={()=>go("postproblem")} bg={C.kumkum} tc={C.chalk} style={{marginBottom:14}}>➕ नई समस्या दर्ज करें</Btn>
      {problems.map(p=>(
        <Card key={p.id} style={{marginBottom:12}}>
          <div style={{padding:"14px 14px 12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:22}}>{p.cat}</span>
              <span style={{fontSize:10,padding:"3px 9px",borderRadius:20,background:p.status==="solved"?"rgba(30,92,58,.3)":p.status==="inprogress"?"rgba(212,137,26,.2)":"rgba(181,51,10,.2)",color:p.status==="solved"?C.greenLight:p.status==="inprogress"?C.ochre:"#FF6B4A",border:`1px solid ${p.status==="solved"?C.green:p.status==="inprogress"?C.ochre:C.red}`}}>{p.status==="solved"?"✅ हल हुई":p.status==="inprogress"?"🔄 Progress":"🔴 Pending"}</span>
            </div>
            <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:14,color:C.chalk,marginBottom:6}}>{p.title}</div>
            <div style={{fontSize:11,color:C.chalkDim}}>👤 {p.user} · 📍 {p.village}</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
              <span style={{color:C.ochre,fontWeight:700}}>👍 {p.votes} support</span>
              {!votedIds.includes(p.id)&&p.status!=="solved"&&(
                <button onClick={async()=>{
                  await updateDoc(doc(db,"problems",p.id),{votes:(p.votes||0)+1});
                  setVotedIds(v=>[...v,p.id]);
                }} style={{background:"rgba(212,137,26,.15)",border:`1px solid ${C.ochre}`,color:C.ochre,borderRadius:8,padding:"6px 14px",cursor:"pointer",fontFamily:"'Baloo 2',sans-serif",fontSize:12,fontWeight:600}}>👍 Support</button>
              )}
            </div>
            {(p.votes||0)>=50&&<div style={{marginTop:8,fontSize:11,padding:"6px 10px",background:"rgba(212,137,26,.1)",borderRadius:6,color:C.ochre,borderLeft:`3px solid ${C.ochre}`}}>🔔 50+ Votes — सरपंच को सूचना भेजी गई</div>}
          </div>
        </Card>
      ))}
    </div>
  </>);

  // POST PROBLEM
  if(screen==="postproblem") return wrap(<>
    <Hdr title="समस्या दर्ज करें" back={()=>go("problems")}/>
    <div style={{padding:16}}>
      {pDone?(
        <div style={{textAlign:"center",paddingTop:50}}>
          <div style={{fontSize:60}}>📢</div>
          <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:22,color:C.ochre,marginTop:14}}>समस्या दर्ज हो गई!</div>
          <Btn onClick={()=>go("problems")} bg={C.ochre} style={{marginTop:20}}>सभी समस्याएं देखो →</Btn>
        </div>
      ):(
        <>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:13,color:C.chalkDim,marginBottom:10}}>श्रेणी चुनें:</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {PCATS.map(pc=>(
                <button key={pc.id} onClick={()=>setPForm(f=>({...f,cat:pc.id,sub:""}))}
                  style={{background:pForm.cat===pc.id?"rgba(212,137,26,.2)":C.bgCard,border:`1.5px solid ${pForm.cat===pc.id?C.ochre:C.border}`,color:C.chalk,borderRadius:10,padding:"10px 8px",cursor:"pointer",textAlign:"left",fontFamily:"'Baloo 2',sans-serif"}}>
                  <div style={{fontSize:20}}>{pc.icon}</div>
                  <div style={{fontSize:11,marginTop:4}}>{pc.name}</div>
                </button>
              ))}
            </div>
          </div>
          {pForm.cat&&(
            <div style={{marginBottom:14}}>
              <select value={pForm.sub} onChange={e=>setPForm(f=>({...f,sub:e.target.value}))} style={{width:"100%",background:C.bgCard,border:`1px solid ${C.border}`,color:C.chalk,borderRadius:8,padding:"10px 12px",fontFamily:"'Baloo 2',sans-serif",fontSize:13,outline:"none"}}>
                <option value="">-- उप-श्रेणी चुनें --</option>
                {PCATS.find(p=>p.id===pForm.cat)?.subs.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          )}
          <select value={pForm.village} onChange={e=>setPForm(f=>({...f,village:e.target.value}))} style={{width:"100%",background:C.bgCard,border:`1px solid ${C.border}`,color:C.chalk,borderRadius:8,padding:"10px 12px",fontFamily:"'Baloo 2',sans-serif",fontSize:13,outline:"none",marginBottom:14}}>
            {villages.map(v=><option key={v}>{v}</option>)}
          </select>
          <textarea value={pForm.desc} onChange={e=>setPForm(f=>({...f,desc:e.target.value}))} placeholder="समस्या विस्तार से लिखें..." rows={4} style={{width:"100%",padding:12,background:C.bgCard,border:`1.5px solid ${C.border}`,borderRadius:10,color:C.chalk,fontSize:14,fontFamily:"'Baloo 2',sans-serif",resize:"none",outline:"none",boxSizing:"border-box",marginBottom:12}}/>
          <Btn onClick={async()=>{
            if(!pForm.cat||!pForm.desc.trim()) return;
            const co=PCATS.find(p=>p.id===pForm.cat);
            try {
              await addDoc(collection(db,"problems"),{cat:co.icon,title:pForm.desc.slice(0,70),user:currentUser?.name,village:pForm.village,days:0,votes:0,status:"pending",userId:auth.currentUser?.uid,createdAt:new Date()});
              setPDone(true);
            } catch(e){ alert("Error! Dobara try karo."); }
          }} bg={C.kumkum} tc={C.chalk}>📤 समस्या पोस्ट करें</Btn>
        </>
      )}
    </div>
  </>);

  // MY QUERIES
  if(screen==="myqueries") return wrap(<>
    <Hdr title="❓ मेरी Queries"/>
    <div style={{padding:14}}>
      {myQueries.length===0?(
        <div style={{textAlign:"center",padding:40,color:C.chalkDim}}>अभी कोई Query नहीं</div>
      ):myQueries.map(q=>(
        <Card key={q.id} style={{marginBottom:12}}>
          <div style={{padding:14}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:13,color:C.ochre}}>{q.shopName}</div>
              <span style={{fontSize:10,color:C.chalkDim}}>{q.time}</span>
            </div>
            <div style={{fontSize:14,color:C.chalk}}>❓ {q.query}</div>
            {q.status==="answered"?(
              <div style={{marginTop:10,padding:"8px 10px",background:"rgba(30,92,58,.2)",borderRadius:8,fontSize:13,color:C.greenLight,borderLeft:`3px solid ${C.green}`}}>✅ जवाब: {q.reply}</div>
            ):(
              <div style={{marginTop:8,fontSize:12,color:C.chalkDim}}>⏳ जवाब का इंतज़ार...</div>
            )}
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
            {currentUser?.photoUrl?<img src={currentUser.photoUrl} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:"👤"}
          </div>
          <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:20,color:C.ochre,marginTop:10}}>{currentUser?.name}</div>
          <div style={{fontSize:12,color:C.chalkDim}}>📍 {currentUser?.village} · {currentUser?.gender} · {currentUser?.dob}</div>
          <div style={{fontSize:11,color:C.orange,marginTop:4}}>👤 Customer</div>
          <div style={{fontSize:12,color:C.chalkDim,marginTop:4}}>{currentUser?.phone||currentUser?.email}</div>
          <div style={{display:"flex",justifyContent:"center",gap:24,marginTop:16}}>
            {[{n:myQueries.length,l:"Queries"},{n:votedIds.length,l:"Support"},{n:problems.filter(p=>p.userId===auth.currentUser?.uid).length,l:"समस्याएं"}].map(s=>(
              <div key={s.l} style={{textAlign:"center"}}>
                <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:22,color:C.ochre,fontWeight:700}}>{s.n}</div>
                <div style={{fontSize:10,color:C.chalkDim}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
      <Btn onClick={async()=>{await signOut(auth);}} bg={C.red} tc={C.chalk}>🚪 Logout</Btn>
    </div>
  </>);

  return null;
}
