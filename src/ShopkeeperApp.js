import React, { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import { collection, onSnapshot, addDoc, updateDoc, doc, query, where } from "firebase/firestore";
import { signOut } from "firebase/auth";

const C = {
  bg:"#0A0300", bgCard:"#140800", bgCard2:"#1E0D00",
  border:"#6B3410", ochre:"#D4891A", orange:"#C45E1A", red:"#B5330A",
  chalk:"#EDE0C4", chalkDim:"#9A8060", green:"#1E5C3A", greenLight:"#4CAF80",
};

const CATS = [
  {id:101,name:"किराना"},{id:102,name:"बीज & खाद"},{id:103,name:"दवाई"},
  {id:104,name:"कपड़ा"},{id:105,name:"Hardware"},{id:106,name:"Mobile"},
  {id:201,name:"Mobile Repair"},{id:202,name:"Electrician"},{id:203,name:"Pump"},
  {id:301,name:"सब्जी & फल"},{id:302,name:"दूध"},{id:303,name:"अनाज"},
  {id:401,name:"Auto"},{id:501,name:"Doctor"},{id:601,name:"राज मिस्त्री"},
  {id:701,name:"Tailor"},{id:702,name:"Barber"},{id:801,name:"CSC"},
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

const Toggle = ({on,onToggle}) => (
  <div onClick={e=>{e.stopPropagation();onToggle();}} style={{width:50,height:26,borderRadius:13,cursor:"pointer",position:"relative",background:on?`linear-gradient(90deg,${C.green},${C.greenLight})`:`linear-gradient(90deg,#2A1010,#4A2020)`,border:`1.5px solid ${on?C.greenLight:"#6A3030"}`,transition:"all .3s",flexShrink:0}}>
    <div style={{position:"absolute",top:2,left:on?26:2,width:18,height:18,borderRadius:"50%",background:on?C.greenLight:"#7A4040",transition:"left .3s"}}/>
  </div>
);

export default function ShopkeeperApp({ currentUser }) {
  const [tab, setTab] = useState("dashboard");
  const [screen, setScreen] = useState("dashboard");
  const [myShop, setMyShop] = useState(null);
  const [shopQueries, setShopQueries] = useState([]);
  const [newItem, setNewItem] = useState({name:"",price:"",emoji:"📦"});
  const [showAddItem, setShowAddItem] = useState(false);
  const [shopForm, setShopForm] = useState({name:"",catId:"",village:currentUser?.village||"सोंडवा",phone:currentUser?.phone?.replace("+91","")||"",openTime:"8:00 AM",closeTime:"8:00 PM",desc:""});
  const [regDone, setRegDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const villages = ["सोंडवा","भाबरा","जोबट","उदयगढ़","कट्ठीवाड़ा","बोरी"];

  useEffect(()=>{
    if(!auth.currentUser) return;
    const q1 = query(collection(db,"shops"),where("ownerId","==",auth.currentUser.uid));
    const u1 = onSnapshot(q1,s=>{
      if(!s.empty) setMyShop({id:s.docs[0].id,...s.docs[0].data()});
    });
    return ()=>u1();
  },[]);

  useEffect(()=>{
    if(!myShop) return;
    const q2 = query(collection(db,"queries"),where("shopId","==",myShop.id));
    const u2 = onSnapshot(q2,s=>setShopQueries(s.docs.map(d=>({id:d.id,...d.data()}))));
    return ()=>u2();
  },[myShop]);

  const go = (s,t=null) => { setScreen(s); if(t) setTab(t); setShowAddItem(false); try{window.scrollTo(0,0);}catch(e){} };

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

  const Nav = () => (
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:`linear-gradient(0deg,${C.bg},${C.bgCard})`,borderTop:`2px solid ${C.border}`,display:"flex",zIndex:100}}>
      {[
        {id:"dashboard",icon:"📊",l:"Dashboard"},
        {id:"items",icon:"📦",l:"Items"},
        {id:"queries",icon:"❓",l:"Queries"},
        {id:"profile",icon:"👤",l:"Profile"},
      ].map(t=>(
        <button key={t.id} onClick={()=>{setTab(t.id);go(t.id==="items"?"manageItems":t.id==="queries"?"shopQueries":t.id);}} style={{flex:1,padding:"9px 0",background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,borderTop:`3px solid ${tab===t.id?C.ochre:"transparent"}`}}>
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

  // REGISTER SHOP FORM
  if(!myShop && !regDone) return (
    <div style={{minHeight:"100vh",background:C.bg,color:C.chalk,maxWidth:430,margin:"0 auto",paddingBottom:40,fontFamily:"'Baloo 2',sans-serif"}}>
      <PBar/>
      <div style={{padding:"16px 16px 14px",background:`linear-gradient(135deg,#1E0800,#0A0300)`}}>
        <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:20,color:C.ochre,fontWeight:700}}>🏪 दुकान Register करो</div>
        <div style={{fontSize:11,color:C.chalkDim,marginTop:2}}>नमस्ते {currentUser?.name} जी! अपनी दुकान add करो</div>
      </div>
      <div style={{padding:16}}>
        {[
          {label:"दुकान का नाम *",key:"name",placeholder:"जैसे: रमेश किराना स्टोर"},
          {label:"Phone *",key:"phone",placeholder:"10 अंक"},
          {label:"खुलने का समय",key:"openTime",placeholder:"8:00 AM"},
          {label:"बंद होने का समय",key:"closeTime",placeholder:"8:00 PM"},
        ].map(f=>(
          <div key={f.key} style={{marginBottom:12}}>
            <div style={{fontSize:12,color:C.chalkDim,marginBottom:6}}>{f.label}</div>
            <input value={shopForm[f.key]} onChange={e=>setShopForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder}
              style={{width:"100%",background:C.bgCard,border:`1px solid ${C.border}`,color:C.chalk,borderRadius:8,padding:"10px 12px",fontFamily:"'Baloo 2',sans-serif",fontSize:14,outline:"none",boxSizing:"border-box"}}/>
          </div>
        ))}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:12,color:C.chalkDim,marginBottom:6}}>Category *</div>
          <select value={shopForm.catId} onChange={e=>setShopForm(p=>({...p,catId:e.target.value}))} style={{width:"100%",background:C.bgCard,border:`1px solid ${C.border}`,color:C.chalk,borderRadius:8,padding:"10px 12px",fontFamily:"'Baloo 2',sans-serif",fontSize:13,outline:"none"}}>
            <option value="">-- चुनें --</option>
            {CATS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:12,color:C.chalkDim,marginBottom:6}}>गाँव *</div>
          <select value={shopForm.village} onChange={e=>setShopForm(p=>({...p,village:e.target.value}))} style={{width:"100%",background:C.bgCard,border:`1px solid ${C.border}`,color:C.chalk,borderRadius:8,padding:"10px 12px",fontFamily:"'Baloo 2',sans-serif",fontSize:13,outline:"none"}}>
            {villages.map(v=><option key={v}>{v}</option>)}
          </select>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:12,color:C.chalkDim,marginBottom:6}}>विवरण *</div>
          <textarea value={shopForm.desc} onChange={e=>setShopForm(p=>({...p,desc:e.target.value}))} placeholder="दुकान के बारे में लिखो..." rows={3}
            style={{width:"100%",padding:12,background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:8,color:C.chalk,fontSize:13,fontFamily:"'Baloo 2',sans-serif",resize:"none",outline:"none",boxSizing:"border-box"}}/>
        </div>
        {error&&<div style={{color:"#FF6B4A",fontSize:12,marginBottom:12,padding:"8px 12px",background:"rgba(181,51,10,.15)",borderRadius:8}}>{error}</div>}
        <Btn onClick={async()=>{
          if(!shopForm.name||!shopForm.catId||!shopForm.desc) {setError("सभी fields भरो!"); return;}
          setLoading(true);
          try {
            await addDoc(collection(db,"shops"),{
              name:shopForm.name, catId:Number(shopForm.catId),
              village:shopForm.village, phone:shopForm.phone,
              openTime:shopForm.openTime, closeTime:shopForm.closeTime,
              desc:shopForm.desc, owner:currentUser.name,
              ownerId:auth.currentUser.uid, rating:0, reviews:0,
              open:true, items:[], createdAt:new Date()
            });
            setRegDone(true);
          } catch(e){ setError("Error! Dobara try karo."); }
          setLoading(false);
        }} bg={C.ochre}>{loading?"Register हो रही है...":"🏪 दुकान Register करो!"}</Btn>
      </div>
    </div>
  );

  if(regDone && !myShop) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Baloo 2',sans-serif"}}>
      <div style={{fontSize:70}}>🎉</div>
      <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:24,color:C.ochre,marginTop:16}}>दुकान Register हो गई!</div>
      <div style={{fontSize:13,color:C.chalkDim,marginTop:8,textAlign:"center"}}>अब items add करो!</div>
    </div>
  );

  // DASHBOARD
  if(screen==="dashboard") return wrap(<>
    <div style={{background:`linear-gradient(160deg,#260B00,#0A0300)`}}>
      <PBar/>
      <div style={{padding:"16px 18px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div style={{fontSize:10,color:C.orange,letterSpacing:2,marginBottom:4}}>नमस्ते 🙏</div>
          <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:22,color:C.ochre,fontWeight:700}}>{currentUser?.name}</div>
          <div style={{fontSize:11,color:C.chalkDim}}>🏪 Shopkeeper · {currentUser?.village}</div>
        </div>
        <div style={{textAlign:"center"}}>
          <Toggle on={myShop?.open} onToggle={async()=>{
            if(myShop) await updateDoc(doc(db,"shops",myShop.id),{open:!myShop.open});
          }}/>
          <div style={{fontSize:9,color:myShop?.open?C.greenLight:C.red,marginTop:3}}>{myShop?.open?"खुला":"बंद"}</div>
        </div>
      </div>
    </div>

    <div style={{padding:14}}>
      <Card style={{marginBottom:14}}>
        <div style={{padding:16}}>
          <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:18,color:C.ochre,fontWeight:700}}>{myShop?.name}</div>
          <div style={{fontSize:12,color:C.chalkDim,marginTop:4}}>📍 {myShop?.village} · ⏰ {myShop?.openTime} - {myShop?.closeTime}</div>
          <div style={{display:"flex",gap:8,marginTop:12}}>
            {[
              {n:(myShop?.items||[]).length,l:"Total Items",c:C.ochre},
              {n:(myShop?.items||[]).filter(i=>i.available).length,l:"Available",c:C.greenLight},
              {n:shopQueries.filter(q=>q.status==="pending").length,l:"New Queries",c:C.red},
            ].map(s=>(
              <div key={s.l} style={{flex:1,textAlign:"center",background:C.bgCard,borderRadius:8,padding:"8px 4px",border:`1px solid ${C.border}`}}>
                <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:20,color:s.c,fontWeight:700}}>{s.n}</div>
                <div style={{fontSize:9,color:C.chalkDim}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        {[
          {label:"Items Manage",icon:"📦",color:C.ochre,sc:"manageItems",tab:"items"},
          {label:"Queries",icon:"❓",color:C.red,sc:"shopQueries",tab:"queries"},
          {label:"Shop Edit",icon:"✏️",color:C.indigo||"#4A8FD4",sc:"editShop",tab:"dashboard"},
          {label:"Profile",icon:"👤",color:C.greenLight,sc:"profile",tab:"profile"},
        ].map(btn=>(
          <button key={btn.label} onClick={()=>go(btn.sc,btn.tab)}
            style={{background:`linear-gradient(135deg,${btn.color}18,${btn.color}06)`,border:`1.5px solid ${btn.color}60`,color:btn.color,borderRadius:12,padding:"14px 8px",cursor:"pointer",fontFamily:"'Baloo 2',sans-serif",fontSize:13,fontWeight:700,textAlign:"center"}}>
            <div style={{fontSize:24,marginBottom:4}}>{btn.icon}</div>{btn.label}
          </button>
        ))}
      </div>

      {shopQueries.filter(q=>q.status==="pending").length>0&&(
        <>
          <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:13,color:C.red,margin:"0 0 10px",textAlign:"center"}}>🔴 नई Queries आई हैं!</div>
          {shopQueries.filter(q=>q.status==="pending").slice(0,2).map(q=>(
            <Card key={q.id} style={{marginBottom:8}}>
              <div style={{padding:12}}>
                <div style={{fontSize:11,color:C.chalkDim}}>👤 {q.userName}</div>
                <div style={{fontSize:13,color:C.chalk,marginTop:4}}>❓ {q.query}</div>
                <Btn onClick={()=>go("shopQueries","queries")} bg={C.ochre} style={{marginTop:10,padding:"8px 0",fontSize:12}}>जवाब दो →</Btn>
              </div>
            </Card>
          ))}
        </>
      )}
    </div>
  </>);

  // MANAGE ITEMS
  if(screen==="manageItems") return wrap(<>
    <Hdr title="📦 Items Manage" back={()=>go("dashboard")}
      right={<button onClick={()=>setShowAddItem(true)} style={{background:`linear-gradient(135deg,${C.green},${C.greenLight})`,border:"none",color:C.chalk,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontFamily:"'Baloo 2',sans-serif",fontSize:12,fontWeight:700}}>+ जोड़ो</button>}
    />
    <div style={{padding:14}}>
      {showAddItem&&(
        <Card style={{marginBottom:14}}>
          <div style={{padding:14}}>
            <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",color:C.ochre,marginBottom:10,fontSize:15}}>नया Item जोड़ें:</div>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <input value={newItem.emoji} onChange={e=>setNewItem(p=>({...p,emoji:e.target.value}))}
                style={{width:48,background:C.bgCard,border:`1px solid ${C.border}`,color:C.chalk,borderRadius:8,padding:"8px",fontSize:20,textAlign:"center",outline:"none",flexShrink:0}}/>
              <input value={newItem.name} onChange={e=>setNewItem(p=>({...p,name:e.target.value}))} placeholder="Item का नाम..."
                style={{flex:1,background:C.bgCard,border:`1px solid ${C.border}`,color:C.chalk,borderRadius:8,padding:"8px 10px",fontFamily:"'Baloo 2',sans-serif",fontSize:13,outline:"none"}}/>
            </div>
            <input value={newItem.price} onChange={e=>setNewItem(p=>({...p,price:e.target.value}))} placeholder="कीमत (₹)" type="number"
              style={{width:"100%",background:C.bgCard,border:`1px solid ${C.border}`,color:C.chalk,borderRadius:8,padding:"8px 10px",fontFamily:"'Baloo 2',sans-serif",fontSize:13,outline:"none",boxSizing:"border-box",marginBottom:10}}/>
            <div style={{display:"flex",gap:8}}>
              <Btn onClick={async()=>{
                if(!newItem.name||!newItem.price) return;
                const updatedItems=[...(myShop.items||[]),{id:Date.now(),name:newItem.name,price:Number(newItem.price),unit:"₹",available:true,emoji:newItem.emoji||"📦"}];
                await updateDoc(doc(db,"shops",myShop.id),{items:updatedItems});
                setNewItem({name:"",price:"",emoji:"📦"}); setShowAddItem(false);
              }} bg={C.green}>✅ जोड़ें</Btn>
              <Btn onClick={()=>{setShowAddItem(false);setNewItem({name:"",price:"",emoji:"📦"});}} bg={C.border} tc={C.chalk}>रद्द</Btn>
            </div>
          </div>
        </Card>
      )}
      {(myShop?.items||[]).length===0&&!showAddItem&&(
        <div style={{textAlign:"center",padding:40,color:C.chalkDim}}>
          <div style={{fontSize:48}}>📦</div>
          <div style={{marginTop:12}}>कोई item नहीं — ऊपर "+ जोड़ो" click करो!</div>
        </div>
      )}
      {(myShop?.items||[]).map(item=>(
        <Card key={item.id} style={{marginBottom:9}}>
          <div style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontSize:26,width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center",background:`radial-gradient(${C.ochre}12,transparent)`,borderRadius:"50%",border:`1px solid ${C.border}`,flexShrink:0}}>{item.emoji}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:14,color:C.chalk,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
              <div style={{fontSize:13,color:C.ochre,fontWeight:700,marginTop:2}}>₹{item.price}</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,flexShrink:0}}>
              <Toggle on={item.available} onToggle={async()=>{
                const updatedItems=(myShop.items||[]).map(i=>i.id===item.id?{...i,available:!i.available}:i);
                await updateDoc(doc(db,"shops",myShop.id),{items:updatedItems});
              }}/>
              <span style={{fontSize:9,color:item.available?C.greenLight:"#FF6B4A",fontFamily:"'Baloo 2',sans-serif"}}>{item.available?"उपलब्ध":"खत्म"}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  </>);

  // SHOP QUERIES
  if(screen==="shopQueries") return wrap(<>
    <Hdr title="❓ Customer Queries" back={()=>go("dashboard")}/>
    <div style={{padding:14}}>
      {shopQueries.length===0?(
        <div style={{textAlign:"center",padding:40,color:C.chalkDim}}>अभी कोई Query नहीं</div>
      ):shopQueries.map(q=>(
        <Card key={q.id} style={{marginBottom:12}}>
          <div style={{padding:14}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <div>
                <span style={{fontSize:11,padding:"2px 8px",borderRadius:12,background:q.status==="answered"?"rgba(30,92,58,.3)":"rgba(212,137,26,.2)",color:q.status==="answered"?C.greenLight:C.ochre,border:`1px solid ${q.status==="answered"?C.green:C.ochre}`}}>{q.status==="answered"?"✅ जवाब दिया":"⏳ जवाब बाकी"}</span>
              </div>
              <span style={{fontSize:10,color:C.chalkDim}}>{q.time}</span>
            </div>
            <div style={{fontSize:11,color:C.chalkDim,marginBottom:4}}>👤 {q.userName}</div>
            <div style={{fontSize:14,color:C.chalk}}>❓ {q.query}</div>
            {q.status==="answered"?(
              <div style={{marginTop:8,padding:"8px 10px",background:"rgba(30,92,58,.15)",borderRadius:8,fontSize:12,color:C.greenLight,borderLeft:`3px solid ${C.green}`}}>आपका जवाब: {q.reply}</div>
            ):(
              <ReplyBox qId={q.id} db={db}/>
            )}
          </div>
        </Card>
      ))}
    </div>
  </>);

  // EDIT SHOP
  if(screen==="editShop") return wrap(<>
    <Hdr title="✏️ Shop Edit" back={()=>go("dashboard")}/>
    <div style={{padding:16}}>
      {["name","phone","openTime","closeTime","desc"].map(k=>(
        <div key={k} style={{marginBottom:12}}>
          <div style={{fontSize:12,color:C.chalkDim,marginBottom:6}}>{k==="name"?"दुकान का नाम":k==="phone"?"Phone":k==="openTime"?"खुलने का समय":k==="closeTime"?"बंद होने का समय":"विवरण"}:</div>
          <input defaultValue={myShop?.[k]} id={`edit_${k}`}
            style={{width:"100%",background:C.bgCard,border:`1px solid ${C.border}`,color:C.chalk,borderRadius:8,padding:"10px 12px",fontFamily:"'Baloo 2',sans-serif",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
        </div>
      ))}
      <Btn onClick={async()=>{
        const updates={};
        ["name","phone","openTime","closeTime","desc"].forEach(k=>{
          updates[k]=document.getElementById(`edit_${k}`)?.value||myShop?.[k];
        });
        await updateDoc(doc(db,"shops",myShop.id),updates);
        alert("✅ Save ho gaya!");
        go("dashboard");
      }} bg={C.ochre}>✅ Save करें</Btn>
    </div>
  </>);

  // PROFILE
  if(screen==="profile") return wrap(<>
    <Hdr title="👤 मेरा Profile"/>
    <div style={{padding:16}}>
      <Card style={{marginBottom:16,textAlign:"center"}}>
        <div style={{padding:20}}>
          <div style={{width:80,height:80,borderRadius:"50%",background:`radial-gradient(${C.ochre}28,transparent)`,border:`2px solid ${C.ochre}45`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,margin:"0 auto",overflow:"hidden"}}>
            {currentUser?.photoUrl?<img src={currentUser.photoUrl} style={{width:"100%",height:"100%",objectFit:"cover"}} alt=""/>:"🏪"}
          </div>
          <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:20,color:C.ochre,marginTop:10}}>{currentUser?.name}</div>
          <div style={{fontSize:12,color:C.chalkDim}}>📍 {currentUser?.village} · {currentUser?.gender}</div>
          <div style={{fontSize:11,color:C.orange,marginTop:4}}>🏪 Shopkeeper</div>
          <div style={{fontSize:12,color:C.chalkDim,marginTop:4}}>{currentUser?.phone||currentUser?.email}</div>
        </div>
      </Card>
      <Card style={{marginBottom:12}}>
        <div style={{padding:14}}>
          <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:15,color:C.ochre,marginBottom:8}}>🏪 मेरी दुकान</div>
          <div style={{fontSize:13,color:C.chalk}}>{myShop?.name}</div>
          <div style={{fontSize:11,color:C.chalkDim,marginTop:4}}>📍 {myShop?.village} · {(myShop?.items||[]).length} items</div>
        </div>
      </Card>
      <Btn onClick={async()=>{await signOut(auth);}} bg={C.red} tc={C.chalk}>🚪 Logout</Btn>
    </div>
  </>);

  return null;
}

// Reply component
function ReplyBox({qId, db}) {
  const [reply, setReply] = useState("");
  const [sent, setSent] = useState(false);
  if(sent) return <div style={{marginTop:8,fontSize:12,color:"#4CAF80"}}>✅ Reply भेज दी!</div>;
  return (
    <div style={{marginTop:10}}>
      <input value={reply} onChange={e=>setReply(e.target.value)} placeholder="जवाब लिखो..."
        style={{width:"100%",background:"#140800",border:"1px solid #6B3410",color:"#EDE0C4",borderRadius:8,padding:"8px 10px",fontFamily:"'Baloo 2',sans-serif",fontSize:13,outline:"none",boxSizing:"border-box",marginBottom:8}}/>
      <button onClick={async()=>{
        if(!reply.trim()) return;
        await updateDoc(doc(db,"queries",qId),{status:"answered",reply:reply});
        setSent(true);
      }} style={{background:"rgba(212,137,26,.15)",border:"1px solid #D4891A",color:"#D4891A",borderRadius:8,padding:"7px 16px",cursor:"pointer",fontFamily:"'Baloo 2',sans-serif",fontSize:12,fontWeight:600}}>
        📤 Reply भेजो
      </button>
    </div>
  );
}
