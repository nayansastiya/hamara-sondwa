
import React, { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import { collection, addDoc, updateDoc, doc, getDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Auth from "./Auth";

const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Hindi&family=Baloo+2:wght@400;600;700;800&display=swap";
document.head.appendChild(fontLink);

const C = {
  bg:"#0A0300", bgCard:"#140800", bgCard2:"#1E0D00",
  border:"#6B3410", ochre:"#D4891A", orange:"#C45E1A", red:"#B5330A",
  chalk:"#EDE0C4", chalkDim:"#9A8060",
  green:"#1E5C3A", greenLight:"#4CAF80",
  indigo:"#4A8FD4", kumkum:"#C1121F",
};

const pithora = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L55 30 L30 55 L5 30Z' stroke='%23C45E1A' stroke-width='0.6' fill='none' opacity='0.18'/%3E%3Cpath d='M30 15 L45 30 L30 45 L15 30Z' stroke='%23D4891A' stroke-width='0.4' fill='none' opacity='0.13'/%3E%3Ccircle cx='30' cy='30' r='2' fill='%23D4891A' opacity='0.15'/%3E%3Ccircle cx='5' cy='5' r='1.2' fill='%23C45E1A' opacity='0.12'/%3E%3Ccircle cx='55' cy='55' r='1.2' fill='%23C45E1A' opacity='0.12'/%3E%3Ccircle cx='5' cy='55' r='1.2' fill='%23D4891A' opacity='0.10'/%3E%3Ccircle cx='55' cy='5' r='1.2' fill='%23D4891A' opacity='0.10'/%3E%3C/svg%3E")`;

const gondDots = `url("data:image/svg+xml,%3Csvg width='28' height='28' viewBox='0 0 28 28' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23D4891A' opacity='0.13'/%3E%3Ccircle cx='14' cy='14' r='1' fill='%23C45E1A' opacity='0.09'/%3E%3Ccircle cx='26' cy='2' r='1' fill='%23D4891A' opacity='0.10'/%3E%3Ccircle cx='2' cy='26' r='1' fill='%23C45E1A' opacity='0.10'/%3E%3Ccircle cx='26' cy='26' r='1' fill='%23D4891A' opacity='0.11'/%3E%3C/svg%3E")`;

const villages = ["सोंडवा","भाबरा","जोबट","उदयगढ़","कट्ठीवाड़ा","बोरी"];

const CATS = [
  {id:1,icon:"🛒",name:"दुकानें",eng:"Shops",color:"#C45E1A",sub:[{id:101,name:"किराना / General Store"},{id:102,name:"बीज & खाद"},{id:103,name:"दवाई / Pharmacy"},{id:104,name:"कपड़ा & गारमेंट"},{id:105,name:"Hardware & Tools"},{id:106,name:"Mobile & Electronics"}]},
  {id:2,icon:"🔧",name:"मिस्त्री",eng:"Technicians",color:"#2EC4B6",sub:[{id:201,name:"Mobile Repair"},{id:202,name:"Electrician"},{id:203,name:"Pump & Motor"},{id:204,name:"Tractor Mechanic"},{id:205,name:"Welder"},{id:206,name:"Plumber"}]},
  {id:3,icon:"🌾",name:"किसान",eng:"Farmers",color:"#4CAF80",sub:[{id:301,name:"सब्जी & फल"},{id:302,name:"दूध & डेयरी"},{id:303,name:"अनाज & दाल"},{id:304,name:"Organic उपज"}]},
  {id:4,icon:"🚗",name:"यातायात",eng:"Transport",color:"#F4A261",sub:[{id:401,name:"Auto / Rickshaw"},{id:402,name:"Tractor किराए पर"},{id:403,name:"Tempo / Truck"}]},
  {id:5,icon:"👩‍⚕️",name:"स्वास्थ्य",eng:"Health",color:"#E63946",sub:[{id:501,name:"Doctor / Clinic"},{id:502,name:"ASHA / ANM"},{id:503,name:"Ayurvedic वैद्य"}]},
  {id:6,icon:"🏗️",name:"निर्माण",eng:"Construction",color:"#8B6FD4",sub:[{id:601,name:"राज मिस्त्री"},{id:602,name:"Carpenter"},{id:603,name:"Painter"}]},
  {id:7,icon:"✂️",name:"सेवाएं",eng:"Services",color:"#FF9F1C",sub:[{id:701,name:"Tailor / दर्ज़ी"},{id:702,name:"Barber / Salon"},{id:703,name:"Laundry"}]},
  {id:8,icon:"🏛️",name:"सरकारी",eng:"Govt & Finance",color:"#4A8FD4",sub:[{id:801,name:"CSC / Digital Seva"},{id:802,name:"Bank Mitra"},{id:803,name:"Insurance"}]},
];

const PCATS = [
  {id:"road",icon:"🛣️",name:"सड़क",subs:["सड़क टूटी","पुल खराब","स्ट्रीट लाइट"]},
  {id:"water",icon:"💧",name:"पानी",subs:["नल बंद","हैंडपंप खराब","पानी गंदा"]},
  {id:"elec",icon:"💡",name:"बिजली",subs:["बिजली नहीं","खंभा गिरा","मीटर खराब"]},
  {id:"school",icon:"🏫",name:"स्कूल",subs:["शिक्षक नहीं","इमारत खराब","Midday meal"]},
  {id:"health",icon:"🏥",name:"स्वास्थ्य",subs:["PHC बंद","दवाई नहीं","Ambulance नहीं"]},
  {id:"forest",icon:"🌿",name:"जंगल",subs:["अवैध कटाई","खनन","जानवर खतरा"]},
  {id:"scheme",icon:"📋",name:"योजनाएं",subs:["राशन नहीं","पेंशन रुकी","PM Kisan"]},
  {id:"other",icon:"🆘",name:"अन्य",subs:["अन्य समस्या"]},
];

const SHOPS0 = [
  {id:1,name:"AJAY SASTIYA KIRANA SHOP",owner:"AJAY SASTIYA",village:"PUJARA FALIYA, SAKDI ROAD ,SONDWA",phone:"9754849608",rating:4.5,reviews:12,open:true,catId:101,desc:"COLD DRINKS,TADI, NAMKEEN, BISCUITS, CHIPS, TOILETRIES, HOUSEHOLD ITEMS",
   items:[{id:1,name:"TADI 1 JUG",price:50,unit:"₹",available:true,emoji:"🧂"},{id:2,name:"fanta ",price:50,unit:"₹",available:true,emoji:"🛢️"},{id:3,name:"चीनी 1kg",price:45,unit:"₹",available:false,emoji:"🍬"},{id:4,name:"बासमती चावल 5kg",price:280,unit:"₹",available:true,emoji:"🍚"},{id:5,name:"आटा 10kg",price:320,unit:"₹",available:true,emoji:"🌾"},{id:6,name:"दाल चना 1kg",price:90,unit:"₹",available:false,emoji:"🫘"}]},
  {id:2,name:"SASTIYA SUTAR",owner:"VINOD SASTIYA",village:"PUJARA FALIYA, SAKDI ROAD ,SONDWA",phone:"9669714652",rating:4.7,reviews:20,open:true,catId:102,desc:"SABHI PRAKAR KE SUTARI KAM KIYE JATE HAIN",
   items:[{id:1,name:"DAP खाद 50kg",price:1350,unit:"₹",available:true,emoji:"🌱"},{id:2,name:"यूरिया 45kg",price:280,unit:"₹",available:true,emoji:"💊"},{id:3,name:"गेहूं बीज 1kg",price:65,unit:"₹",available:false,emoji:"🌾"},{id:4,name:"सोयाबीन बीज",price:85,unit:"₹",available:true,emoji:"🫘"}]},
  {id:3,name:"जन औषधि स्टोर",owner:"डॉ. सुरेश",village:"सोंडवा",phone:"99251XXXXX",rating:4.8,reviews:35,open:true,catId:103,desc:"सस्ती दवाइयाँ, PM Jan Aushadhi",
   items:[{id:1,name:"Paracetamol 10",price:8,unit:"₹",available:true,emoji:"💊"},{id:2,name:"ORS Packet",price:5,unit:"₹",available:true,emoji:"🧪"},{id:3,name:"Betadine 100ml",price:65,unit:"₹",available:true,emoji:"🩺"},{id:4,name:"BP Machine",price:850,unit:"₹",available:false,emoji:"🫀"}]},
  {id:4,name:"रोहित मोबाइल रिपेयर",owner:"रोहित सोलंकी",village:"सोंडवा",phone:"97251XXXXX",rating:4.3,reviews:18,open:true,catId:201,desc:"सभी कंपनियों के मोबाइल रिपेयर",
   items:[{id:1,name:"Screen Replace",price:800,unit:"₹ से",available:true,emoji:"📱"},{id:2,name:"Battery",price:350,unit:"₹ से",available:true,emoji:"🔋"},{id:3,name:"Charging Port",price:200,unit:"₹ से",available:true,emoji:"🔌"},{id:4,name:"Back Cover",price:150,unit:"₹ से",available:false,emoji:"📲"}]},
  {id:5,name:"गीता फ्रेश सब्जियाँ",owner:"गीता बाई",village:"सोंडवा",phone:"94251XXXXX",rating:4.9,reviews:41,open:true,catId:301,desc:"ताज़ी सब्जियाँ, सुबह 6 बजे से",
   items:[{id:1,name:"टमाटर 1kg",price:25,unit:"₹",available:true,emoji:"🍅"},{id:2,name:"प्याज 1kg",price:30,unit:"₹",available:true,emoji:"🧅"},{id:3,name:"आलू 1kg",price:20,unit:"₹",available:true,emoji:"🥔"},{id:4,name:"पालक",price:10,unit:"₹",available:false,emoji:"🥬"},{id:5,name:"भिंडी 1kg",price:40,unit:"₹",available:true,emoji:"🫑"}]},
];

const PROBS0 = [
  {id:1,cat:"💧",title:"वार्ड 3 का हैंडपंप 2 हफ्ते से खराब है",user:"मोहन पटेल",village:"सोंडवा",days:14,votes:78,status:"pending"},
  {id:2,cat:"🛣️",title:"मेन रोड पर बड़ा गड्ढा, दुर्घटना का खतरा",user:"सुरेश कुमार",village:"सोंडवा",days:7,votes:124,status:"inprogress"},
  {id:3,cat:"💡",title:"पश्चिम टोले में 5 दिन से बिजली नहीं",user:"गीता बाई",village:"सोंडवा",days:5,votes:56,status:"pending"},
  {id:4,cat:"🏫",title:"प्राथमिक स्कूल में पूरे हफ्ते शिक्षक नहीं आए",user:"रामू भाई",village:"सोंडवा",days:8,votes:93,status:"solved"},
];

const QUERIES0 = [
  {id:1,shopId:1,shopName:"रमेश किराना स्टोर",query:"5kg चीनी का थोक भाव?",status:"answered",reply:"हाँ भाई, 5kg पर ₹10 छूट मिलेगी।",time:"2 घंटे पहले"},
  {id:2,shopId:2,shopName:"किसान एग्रो सेंटर",query:"कल DAP खाद मिलेगी क्या?",status:"pending",reply:"",time:"5 घंटे पहले"},
];

/* ── ATOMS ── */
const PBar = () => (
  <div style={{height:6,background:`repeating-linear-gradient(90deg,${C.red} 0,${C.red} 10px,${C.ochre} 10px,${C.ochre} 20px,${C.orange} 20px,${C.orange} 28px,#7A2E08 28px,#7A2E08 38px)`}}/>
);

const Divider = () => (
  <div style={{textAlign:"center",fontSize:12,color:C.ochre,letterSpacing:8,margin:"10px 0",opacity:.45}}>◆ · ◆ · ◆</div>
);

const STitle = ({children}) => (
  <div style={{display:"flex",alignItems:"center",gap:8,margin:"14px 0 10px"}}>
    <div style={{height:1.5,flex:1,background:`linear-gradient(90deg,${C.red},transparent)`}}/>
    <span style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:12,color:C.ochre,whiteSpace:"nowrap"}}>{children}</span>
    <div style={{height:1.5,flex:1,background:`linear-gradient(90deg,transparent,${C.red})`}}/>
  </div>
);

const Card = ({children,style={},glow,onClick}) => (
  <div onClick={onClick} style={{background:`linear-gradient(145deg,${C.bgCard},${C.bgCard2})`,backgroundImage:gondDots,border:`1.5px solid ${glow?C.ochre:C.border}`,borderRadius:14,overflow:"hidden",position:"relative",boxShadow:glow?`0 0 18px rgba(212,137,26,.2)`:undefined,cursor:onClick?"pointer":undefined,...style}}>
    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${C.red},${C.ochre},${C.orange},${C.ochre},${C.red})`}}/>
    {children}
  </div>
);

const Btn = ({children,onClick,bg=C.ochre,tc="#0A0300",style={}}) => (
  <button onClick={onClick} style={{background:`linear-gradient(135deg,${bg},${bg}CC)`,border:"none",color:tc,borderRadius:10,padding:"12px 0",cursor:"pointer",fontFamily:"'Baloo 2',sans-serif",fontSize:14,fontWeight:700,width:"100%",boxShadow:`0 3px 14px ${bg}30`,...style}}>{children}</button>
);

const Toggle = ({on,onToggle}) => (
  <div onClick={e=>{e.stopPropagation();onToggle();}} style={{width:50,height:26,borderRadius:13,cursor:"pointer",position:"relative",background:on?`linear-gradient(90deg,${C.green},${C.greenLight})`:`linear-gradient(90deg,#2A1010,#4A2020)`,border:`1.5px solid ${on?C.greenLight:"#6A3030"}`,transition:"all .3s",boxShadow:on?`0 0 10px ${C.greenLight}40`:undefined,flexShrink:0}}>
    <div style={{position:"absolute",top:2,left:on?26:2,width:18,height:18,borderRadius:"50%",background:on?C.greenLight:"#7A4040",transition:"left .3s",boxShadow:on?`0 0 6px ${C.greenLight}`:"none"}}/>
  </div>
);

const Stars = ({r}) => (
  <span>
    <span style={{color:C.ochre,fontSize:12}}>{"★".repeat(Math.floor(r))}{"☆".repeat(5-Math.floor(r))}</span>
    <span style={{color:C.chalkDim,fontSize:11,marginLeft:4}}>{r}</span>
  </span>
);

const Badge = ({s}) => {
  const m = {
    pending:{bg:"rgba(181,51,10,.2)",c:"#FF6B4A",b:C.red,l:"🔴 Pending"},
    inprogress:{bg:"rgba(212,137,26,.2)",c:C.ochre,b:C.ochre,l:"🔄 Progress"},
    solved:{bg:"rgba(30,92,58,.3)",c:C.greenLight,b:C.green,l:"✅ हल हुई"},
  };
  const t = m[s]||m.pending;
  return <span style={{fontSize:10,padding:"3px 9px",borderRadius:20,background:t.bg,color:t.c,border:`1px solid ${t.b}`,fontFamily:"'Baloo 2',sans-serif"}}>{t.l}</span>;
};

const GondSun = ({size=52}) => (
  <svg width={size} height={size} viewBox="0 0 52 52">
    <circle cx="26" cy="26" r="12" fill="none" stroke={C.ochre} strokeWidth="1.5" opacity=".6"/>
    <circle cx="26" cy="26" r="6" fill={C.ochre} opacity=".18"/>
    <circle cx="26" cy="26" r="3" fill={C.ochre} opacity=".6"/>
    {[0,45,90,135,180,225,270,315].map((a,i)=>{const r=Math.PI*a/180;return(<line key={i} x1={26+15*Math.cos(r)} y1={26+15*Math.sin(r)} x2={26+21*Math.cos(r)} y2={26+21*Math.sin(r)} stroke={C.ochre} strokeWidth="1.5" opacity=".5"/>);})}
    {[22.5,67.5,112.5,157.5,202.5,247.5,292.5,337.5].map((a,i)=>{const r=Math.PI*a/180;return(<circle key={i} cx={26+24*Math.cos(r)} cy={26+24*Math.sin(r)} r="1.3" fill={C.orange} opacity=".6"/>);})}
  </svg>
);


/* ── MAIN APP ── */
export default function App() {
  const [screen, setScreen] = useState("home");
  const [currentUser, setCurrentUser] = useState(null);
const [authLoading, setAuthLoading] = useState(true);

useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) setCurrentUser(userDoc.data());
    } else {
      setCurrentUser(null);
    }
    setAuthLoading(false);
  });
  return () => unsub();
}, []);
  const [selCat, setSelCat] = useState(null);
  const [selSub, setSelSub] = useState(null);
  const [selShop, setSelShop] = useState(null);
  const [shops, setShops] = useState(SHOPS0);
  const [queries, setQueries] = useState(QUERIES0);
  const [problems, setProblems] = useState(PROBS0);
  const [votedIds, setVotedIds] = useState([]);
  const [tab, setTab] = useState("home");
  const [village, setVillage] = useState("सोंडवा");
  const [qText, setQText] = useState("");
  const [qDone, setQDone] = useState(false);
  const [pForm, setPForm] = useState({cat:"",sub:"",desc:"",village:"सोंडवा"});
  const [pDone, setPDone] = useState(false);
  const [newItem, setNewItem] = useState({name:"",price:"",emoji:"📦"});
  const [showAddItem, setShowAddItem] = useState(false);

  const go = (s, t=null) => {
    setScreen(s);
    if(t) setTab(t);
    setQDone(false); setPDone(false); setShowAddItem(false);
    try { window.scrollTo(0,0); } catch(e) {}
  };
  useEffect(() => {
  const unsubscribe = onSnapshot(collection(db, "shops"),(snapshot) => {
    const data = snapshot.docs.map(doc => ({id: doc.id,...doc.data()}));
    if(data.length > 0) setShops(data);
  });
  return () => unsubscribe();
}, []);

useEffect(() => {
  const unsubscribe = onSnapshot(collection(db, "problems"),(snapshot) => {
    const data = snapshot.docs.map(doc => ({id: doc.id,...doc.data()}));
    if(data.length > 0) setProblems(data);
  });
  return () => unsubscribe();
}, []);

useEffect(() => {
  const unsubscribe = onSnapshot(collection(db, "queries"),(snapshot) => {
    const data = snapshot.docs.map(doc => ({id: doc.id,...doc.data()}));
    if(data.length > 0) setQueries(data);
  });
  return () => unsubscribe();
}, []);

  const myShop = shops[0];
  const shopsBySub = (id) => shops.filter(s => s.catId === id);

  const Hdr = ({title, back, right}) => (
    <div style={{background:`linear-gradient(135deg,#1E0800,#0A0300)`,backgroundImage:pithora,position:"sticky",top:0,zIndex:99}}>
      <PBar/>
      <div style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
        {back && <button onClick={back} style={{background:"rgba(212,137,26,.15)",border:`1px solid ${C.ochre}`,color:C.ochre,borderRadius:9,width:34,height:34,cursor:"pointer",fontSize:17,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>←</button>}
        <div style={{flex:1,fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:17,fontWeight:700,color:C.ochre}}>{title}</div>
        {right}
      </div>
    </div>
  );

  const Nav = () => (
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:`linear-gradient(0deg,${C.bg},${C.bgCard})`,borderTop:`2px solid ${C.border}`,display:"flex",zIndex:100}}>
      {[
        {id:"home",sc:"home",icon:"🏘️",l:"होम"},
        {id:"problems",sc:"problems",icon:"📢",l:"समस्या"},
        {id:"queries",sc:"myqueries",icon:"❓",l:"Queries"},
        {id:"shop",sc:"shopDash",icon:"🏪",l:"दुकान"},
        {id:"profile",sc:"profile",icon:"👤",l:"Profile"},
      ].map(t => (
        <button key={t.id} onClick={()=>{setTab(t.id);go(t.sc);}} style={{flex:1,padding:"9px 0",background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,borderTop:`3px solid ${tab===t.id?C.ochre:"transparent"}`,transition:"border-color .2s"}}>
          <span style={{fontSize:18}}>{t.icon}</span>
          <span style={{fontSize:9,color:tab===t.id?C.ochre:C.chalkDim,fontFamily:"'Baloo 2',sans-serif"}}>{t.l}</span>
        </button>
      ))}
    </div>
  );

  const wrap = (children) => (
    <div style={{minHeight:"100vh",background:C.bg,color:C.chalk,maxWidth:430,margin:"0 auto",paddingBottom:80,fontFamily:"'Baloo 2',sans-serif"}}>
      {children}
      <Nav/>
    </div>
  );

  if (authLoading) return (
  <div style={{minHeight:"100vh",background:"#0A0300",display:"flex",
    alignItems:"center",justifyContent:"center"}}>
    <div style={{color:"#D4891A",fontSize:18,fontFamily:"'Baloo 2',sans-serif"}}>
      Loading... 🏘️
    </div>
  </div>
);

if (!currentUser) return (
  <Auth onLogin={(user) => setCurrentUser(user)} />
);

  /* ── HOME ── */
  if(screen === "home") return wrap(
    <>
      <div style={{background:`linear-gradient(160deg,#260B00,#0A0300)`,backgroundImage:pithora}}>
        <PBar/>
        <div style={{padding:"18px 18px 0",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:10,color:C.orange,letterSpacing:2,textTransform:"uppercase",marginBottom:4,fontFamily:"'Baloo 2',sans-serif"}}>ALIRAJPUR · MADHYA PRADESH</div>
            <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:30,fontWeight:700,color:C.ochre,lineHeight:1.1}}>हमारा सोंडवा</div>
            <div style={{fontSize:11,color:C.chalkDim,marginTop:3,fontFamily:"'Baloo 2',sans-serif"}}>आपका अपना डिजिटल गाँव 🌿</div>
          </div>
          <GondSun size={60}/>
        </div>
        <Divider/>
        <div style={{padding:"0 16px 16px"}}>
          <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center"}}>
            <span style={{fontSize:13}}>📍</span>
            <select value={village} onChange={e=>setVillage(e.target.value)} style={{flex:1,background:C.bgCard,border:`1px solid ${C.border}`,color:C.chalk,borderRadius:8,padding:"6px 10px",fontSize:13,fontFamily:"'Baloo 2',sans-serif",outline:"none"}}>
              {villages.map(v=><option key={v}>{v}</option>)}
            </select>
          </div>
          <div style={{position:"relative"}}>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}>🔍</span>
            <input placeholder="खोजो — दुकान, सामान, सेवा..." style={{width:"100%",padding:"10px 12px 10px 36px",background:C.bgCard,border:`1.5px solid ${C.border}`,borderRadius:10,color:C.chalk,fontSize:13,fontFamily:"'Baloo 2',sans-serif",outline:"none",boxSizing:"border-box"}}/>
          </div>
        </div>
      </div>

      <div style={{display:"flex",background:C.bgCard,borderBottom:`1px solid ${C.border}`}}>
        {[
          {n:shops.length,l:"दुकानें"},
          {n:shops.reduce((a,s)=>a+s.items.filter(i=>i.available).length,0),l:"Items उपलब्ध"},
          {n:problems.filter(p=>p.status==="pending").length,l:"समस्याएं"},
          {n:villages.length,l:"गाँव"},
        ].map((s,i)=>(
          <div key={i} style={{flex:1,textAlign:"center",padding:"10px 0",borderRight:`1px solid ${C.border}`}}>
            <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:20,color:C.ochre,fontWeight:700}}>{s.n}</div>
            <div style={{fontSize:9,color:C.chalkDim}}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{padding:"0 14px 16px"}}>
        <STitle>सेवा श्रेणियाँ चुनें</STitle>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {CATS.map(cat=>(
            <Card key={cat.id} onClick={()=>{setSelCat(cat);go("subcat");}}>
              <div style={{padding:"14px 12px"}}>
                <div style={{width:46,height:46,borderRadius:"50%",background:`radial-gradient(${cat.color}22,transparent)`,border:`1.5px solid ${cat.color}50`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,marginBottom:8}}>{cat.icon}</div>
                <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:14,color:C.chalk,fontWeight:700}}>{cat.name}</div>
                <div style={{fontSize:10,color:C.chalkDim}}>{cat.eng}</div>
                <div style={{fontSize:10,color:cat.color,marginTop:5}}>{cat.sub.reduce((a,s)=>a+shopsBySub(s.id).length,0)>0?`${cat.sub.reduce((a,s)=>a+shopsBySub(s.id).length,0)} listed →`:`${cat.sub.length} sub-cat →`}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );

  /* ── SUBCAT ── */
  if(screen === "subcat") return wrap(
    <>
      <Hdr title={`${selCat.icon} ${selCat.name}`} back={()=>go("home")}/>
      <div style={{padding:14}}>
        <div style={{fontSize:12,color:C.chalkDim,marginBottom:10}}>उप-श्रेणी चुनें:</div>
        {selCat.sub.map(sub=>{
          const cnt = shopsBySub(sub.id).length;
          return(
            <Card key={sub.id} onClick={()=>{setSelSub(sub);go("shoplist");}} style={{marginBottom:9}}>
              <div style={{padding:"13px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:15,color:C.chalk}}>{sub.name}</div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:11,padding:"2px 8px",borderRadius:12,background:cnt>0?"rgba(30,92,58,.3)":"rgba(60,30,0,.5)",color:cnt>0?C.greenLight:C.chalkDim,border:`1px solid ${cnt>0?C.green:C.border}`}}>{cnt>0?`${cnt} दुकानें`:"जल्द"}</span>
                  <span style={{color:C.ochre}}>›</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );

  /* ── SHOP LIST ── */
  if(screen === "shoplist") return wrap(
    <>
      <Hdr title={selSub.name} back={()=>go("subcat")}/>
      <div style={{padding:14}}>
        {shopsBySub(selSub.id).length===0 ? (
          <div style={{textAlign:"center",padding:50}}>
            <div style={{fontSize:48}}>🕐</div>
            <div style={{color:C.chalkDim,fontFamily:"'Tiro Devanagari Hindi',serif",marginTop:12}}>जल्द ही दुकानें जुड़ेंगी...</div>
          </div>
        ) : shopsBySub(selSub.id).map(shop=>(
          <Card key={shop.id} style={{marginBottom:12}}>
            <div style={{padding:"14px 14px 12px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:16,color:C.ochre,fontWeight:700,flex:1,marginRight:8}}>{shop.name}</div>
                <span style={{fontSize:10,padding:"3px 8px",borderRadius:20,background:shop.open?"rgba(30,92,58,.3)":"rgba(181,51,10,.2)",color:shop.open?C.greenLight:C.red,border:`1px solid ${shop.open?C.green:C.red}`,whiteSpace:"nowrap",flexShrink:0}}>{shop.open?"🟢 खुला":"🔴 बंद"}</span>
              </div>
              <div style={{fontSize:12,color:C.chalkDim,marginTop:4}}>👤 {shop.owner} · 📍 {shop.village}</div>
              <div style={{marginTop:4}}><Stars r={shop.rating}/><span style={{fontSize:11,color:C.chalkDim}}> ({shop.reviews})</span></div>
              <div style={{marginTop:9,display:"flex",flexWrap:"wrap",gap:5}}>
                {shop.items.slice(0,5).map(it=>(
                  <span key={it.id} style={{fontSize:11,padding:"3px 8px",borderRadius:8,background:it.available?"rgba(30,92,58,.18)":"rgba(60,20,0,.5)",color:it.available?C.greenLight:C.chalkDim,border:`1px solid ${it.available?C.green:C.border}`}}>
                    {it.emoji} {it.name.split(" ")[0]} {it.available?"✓":"✗"}
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
    </>
  );

  /* ── SHOP DETAIL ── */
  if(screen === "shopdetail") return wrap(
    <>
      <Hdr title="दुकान की जानकारी" back={()=>go("shoplist")}/>
      <div style={{padding:14}}>
        <Card glow style={{marginBottom:14}}>
          <div style={{padding:16}}>
            <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:21,color:C.ochre,fontWeight:700}}>{selShop.name}</div>
            <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:5,fontSize:13}}>
              <div>👤 <span style={{color:C.chalk}}>{selShop.owner}</span></div>
              <div style={{color:C.chalkDim}}>📍 {selShop.village} &nbsp;·&nbsp; 📞 {selShop.phone}</div>
              <div><Stars r={selShop.rating}/><span style={{color:C.chalkDim}}> ({selShop.reviews} reviews)</span></div>
              <div style={{color:selShop.open?C.greenLight:C.red}}>{selShop.open?"🟢 अभी खुला":"🔴 बंद"}</div>
            </div>
            <div style={{marginTop:10,padding:"9px 12px",background:"rgba(212,137,26,.08)",borderRadius:8,fontSize:13,borderLeft:`3px solid ${C.ochre}`}}>{selShop.desc}</div>
          </div>
        </Card>

        <STitle>📦 उपलब्ध सामान / सेवाएं</STitle>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
          {selShop.items.map(item=>(
            <div key={item.id} style={{background:item.available?"rgba(30,92,58,.12)":"rgba(60,20,0,.4)",border:`1.5px solid ${item.available?C.green:C.border}`,borderRadius:10,padding:"12px 10px",textAlign:"center"}}>
              <div style={{fontSize:26,marginBottom:4}}>{item.emoji}</div>
              <div style={{fontSize:12,color:C.chalk,fontWeight:600,lineHeight:1.3}}>{item.name}</div>
              <div style={{fontSize:13,color:C.ochre,fontWeight:700,marginTop:3}}>{item.unit} {item.price}</div>
              <div style={{marginTop:6,fontSize:10,padding:"2px 8px",borderRadius:8,display:"inline-block",background:item.available?"rgba(30,92,58,.3)":"rgba(181,51,10,.2)",color:item.available?C.greenLight:"#FF6B4A",border:`1px solid ${item.available?C.green:C.red}`}}>
                {item.available?"✅ उपलब्ध":"❌ खत्म"}
              </div>
            </div>
          ))}
        </div>

        <Divider/>
        <div style={{fontSize:12,color:C.chalkDim,marginBottom:10,textAlign:"center"}}>कुछ और पूछना है जो list में नहीं?</div>
        <Btn onClick={()=>go("query")} bg={C.red} tc={C.chalk}>📝 Query भेजो →</Btn>
      </div>
    </>
  );


  /* ── QUERY FORM ── */
  if(screen === "query") return wrap(
    <>
      <Hdr title={`Query → ${selShop?.name}`} back={()=>go("shopdetail")}/>
      <div style={{padding:16}}>
        {qDone ? (
          <div style={{textAlign:"center",paddingTop:50}}>
            <GondSun size={80}/>
            <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:22,color:C.ochre,marginTop:14}}>Query भेज दी गई! ✅</div>
            <div style={{fontSize:13,color:C.chalkDim,marginTop:8,lineHeight:1.7}}>दुकानदार को सूचना मिल गई।<br/>जवाब आने पर notification मिलेगा।</div>
            <Divider/>
            <Btn onClick={()=>{setTab("queries");go("myqueries");}} bg={C.ochre} style={{marginTop:8}}>मेरी Queries देखो →</Btn>
          </div>
        ) : (
          <>
            <Card style={{marginBottom:14}}>
              <div style={{padding:"12px 14px"}}>
                <div style={{fontSize:11,color:C.chalkDim}}>Query जा रही है:</div>
                <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",color:C.ochre,fontSize:15,marginTop:4}}>{selShop?.name}</div>
                <div style={{fontSize:11,color:C.chalkDim}}>📍 {selShop?.village}</div>
              </div>
            </Card>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:13,color:C.chalkDim,marginBottom:8}}>आप क्या जानना चाहते हैं?</div>
              <textarea value={qText} onChange={e=>setQText(e.target.value)} placeholder="जैसे: क्या 10kg आटा है? कब आएगा?" rows={4}
                style={{width:"100%",padding:12,background:C.bgCard,border:`1.5px solid ${C.border}`,borderRadius:10,color:C.chalk,fontSize:14,fontFamily:"'Baloo 2',sans-serif",resize:"none",outline:"none",boxSizing:"border-box"}}/>
            </div>
            <button style={{width:"100%",background:C.bgCard,border:`1.5px dashed ${C.border}`,color:C.chalkDim,borderRadius:10,padding:"12px 0",cursor:"pointer",fontFamily:"'Baloo 2',sans-serif",fontSize:13,marginBottom:12}}>
              🎤 Voice में बोलो (जल्द आएगा)
            </button>
            <Btn onClick={async()=>{
              if(!qText.trim()) return;
              try{
              await addDoc(collection(db, "queries"), {
                shopId: selShop.id,
                shopName: selShop.name,
                query: qText,
                status: "pending",
                reply: "",
                time: "अभी",
                createdAt: new Date()
              });
      
                setQText("");
                setQDone(true);
              }catch (error) {
                console.error("failed to send query",error);
                alert("Query भेजने में समस्या हुई। कृपया फिर से कोशिश करें।");
              }
            }} bg={C.red} tc={C.chalk}>📤 Query भेजो</Btn>
          </>
        )}
      </div>
    </>
  );

  /* ── PROBLEMS ── */
  if(screen === "problems") return wrap(
    <>
      <Hdr title="📢 सार्वजनिक समस्याएं"/>
      <div style={{padding:14}}>
        <Btn onClick={()=>go("postproblem")} bg={C.kumkum} tc={C.chalk} style={{marginBottom:14}}>➕ नई समस्या दर्ज करें</Btn>
        <div style={{fontSize:12,color:C.chalkDim,marginBottom:12}}>
          {problems.length} दर्ज · {problems.filter(p=>p.status==="pending").length} pending · {problems.filter(p=>p.status==="solved").length} हल हुई
        </div>
        {problems.map(p=>(
          <Card key={p.id} style={{marginBottom:12}}>
            <div style={{padding:"14px 14px 12px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:22}}>{p.cat}</span><Badge s={p.status}/></div>
                <span style={{fontSize:11,color:C.chalkDim}}>{p.days} दिन पुरानी</span>
              </div>
              <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:14,color:C.chalk,marginBottom:6}}>{p.title}</div>
              <div style={{fontSize:11,color:C.chalkDim}}>👤 {p.user} · 📍 {p.village}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
                <div style={{fontSize:13}}><span style={{color:C.ochre,fontWeight:700}}>👍 {p.votes}</span><span style={{color:C.chalkDim,fontSize:11}}> support</span></div>
                {!votedIds.includes(p.id) && p.status!=="solved"
                  ? <button onClick={async()=>{await updateDoc(doc(db, "problems", p.id), {votes: p.votes + 1});
setVotedIds(pr=>[...pr,p.id]);}}
                      style={{background:"rgba(212,137,26,.15)",border:`1px solid ${C.ochre}`,color:C.ochre,borderRadius:8,padding:"6px 14px",cursor:"pointer",fontFamily:"'Baloo 2',sans-serif",fontSize:12,fontWeight:600}}>👍 Support</button>
                  : <span style={{fontSize:11,color:p.status==="solved"?C.greenLight:C.greenLight}}>✅ {p.status==="solved"?"Solved":"Supported"}</span>
                }
              </div>
              {p.votes>=50 && <div style={{marginTop:8,fontSize:11,padding:"6px 10px",background:"rgba(212,137,26,.1)",borderRadius:6,color:C.ochre,borderLeft:`3px solid ${C.ochre}`}}>🔔 50+ Votes — सरपंच को सूचना भेजी गई</div>}
            </div>
          </Card>
        ))}
      </div>
    </>
  );

  /* ── POST PROBLEM ── */
  if(screen === "postproblem") return wrap(
    <>
      <Hdr title="समस्या दर्ज करें" back={()=>go("problems")}/>
      <div style={{padding:16}}>
        {pDone ? (
          <div style={{textAlign:"center",paddingTop:50}}>
            <div style={{fontSize:60}}>📢</div>
            <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:22,color:C.ochre,marginTop:14}}>समस्या दर्ज हो गई!</div>
            <div style={{fontSize:13,color:C.chalkDim,marginTop:8}}>सभी लोग देख और support कर सकते हैं।</div>
            <Divider/>
            <Btn onClick={()=>go("problems")} bg={C.ochre} style={{marginTop:8}}>सभी समस्याएं देखो →</Btn>
          </div>
        ) : (
          <>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:13,color:C.chalkDim,marginBottom:10}}>श्रेणी चुनें:</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {PCATS.map(pc=>(
                  <button key={pc.id} onClick={()=>setPForm(f=>({...f,cat:pc.id,sub:""}))}
                    style={{background:pForm.cat===pc.id?"rgba(212,137,26,.2)":C.bgCard,border:`1.5px solid ${pForm.cat===pc.id?C.ochre:C.border}`,color:C.chalk,borderRadius:10,padding:"10px 8px",cursor:"pointer",textAlign:"left",fontFamily:"'Baloo 2',sans-serif",transition:"all .2s"}}>
                    <div style={{fontSize:20}}>{pc.icon}</div>
                    <div style={{fontSize:11,marginTop:4}}>{pc.name}</div>
                  </button>
                ))}
              </div>
            </div>
            {pForm.cat && (
              <div style={{marginBottom:14}}>
                <div style={{fontSize:13,color:C.chalkDim,marginBottom:8}}>उप-श्रेणी:</div>
                <select value={pForm.sub} onChange={e=>setPForm(f=>({...f,sub:e.target.value}))}
                  style={{width:"100%",background:C.bgCard,border:`1px solid ${C.border}`,color:C.chalk,borderRadius:8,padding:"10px 12px",fontFamily:"'Baloo 2',sans-serif",fontSize:13,outline:"none"}}>
                  <option value="">-- चुनें --</option>
                  {PCATS.find(p=>p.id===pForm.cat)?.subs.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            )}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:13,color:C.chalkDim,marginBottom:8}}>गाँव:</div>
              <select value={pForm.village} onChange={e=>setPForm(f=>({...f,village:e.target.value}))}
                style={{width:"100%",background:C.bgCard,border:`1px solid ${C.border}`,color:C.chalk,borderRadius:8,padding:"10px 12px",fontFamily:"'Baloo 2',sans-serif",fontSize:13,outline:"none"}}>
                {villages.map(v=><option key={v}>{v}</option>)}
              </select>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:13,color:C.chalkDim,marginBottom:8}}>समस्या विस्तार से लिखें:</div>
              <textarea value={pForm.desc} onChange={e=>setPForm(f=>({...f,desc:e.target.value}))} placeholder="जैसे: हैंडपंप 2 हफ्ते से खराब है, पानी नहीं आ रहा..." rows={4}
                style={{width:"100%",padding:12,background:C.bgCard,border:`1.5px solid ${C.border}`,borderRadius:10,color:C.chalk,fontSize:14,fontFamily:"'Baloo 2',sans-serif",resize:"none",outline:"none",boxSizing:"border-box"}}/>
            </div>
            <button style={{width:"100%",background:C.bgCard,border:`1.5px dashed ${C.border}`,color:C.chalkDim,borderRadius:10,padding:"12px 0",cursor:"pointer",fontFamily:"'Baloo 2',sans-serif",fontSize:13,marginBottom:12}}>
              📷 फोटो लगाएं (optional)
            </button>
            <Btn onClick={async ()=>{
              if(!pForm.cat||!pForm.desc.trim()) return;
              const co = PCATS.find(p=>p.id===pForm.cat);
              await addDoc(collection(db, "problems"), {
  cat: co.icon,
  title: pForm.desc.slice(0, 70),
  user: "आप",
  village: pForm.village,
  days: 0,
  votes: 0,
  status: "pending",
  createdAt: new Date()
});
            }} bg={C.kumkum} tc={C.chalk}>📤 समस्या पोस्ट करें</Btn>
          </>
        )}
      </div>
    </>
  );

  /* ── MY QUERIES ── */
  if(screen === "myqueries") return wrap(
    <>
      <Hdr title="❓ मेरी Queries"/>
      <div style={{padding:14}}>
        {queries.length===0
          ? <div style={{textAlign:"center",padding:40,color:C.chalkDim}}>अभी कोई Query नहीं</div>
          : queries.map(q=>(
            <Card key={q.id} style={{marginBottom:12}}>
              <div style={{padding:14}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:13,color:C.ochre}}>{q.shopName}</div>
                  <span style={{fontSize:10,color:C.chalkDim}}>{q.time}</span>
                </div>
                <div style={{fontSize:14,color:C.chalk,marginTop:6}}>❓ {q.query}</div>
                {q.status==="answered"
                  ? <div style={{marginTop:10,padding:"8px 10px",background:"rgba(30,92,58,.2)",borderRadius:8,fontSize:13,color:C.greenLight,borderLeft:`3px solid ${C.green}`}}>✅ जवाब: {q.reply}</div>
                  : <div style={{marginTop:8,fontSize:12,color:C.chalkDim,display:"flex",alignItems:"center",gap:6}}><span style={{width:7,height:7,borderRadius:"50%",background:C.ochre,display:"inline-block"}}/>जवाब का इंतज़ार...</div>
                }
              </div>
            </Card>
          ))
        }
      </div>
    </>
  );


  /* ── SHOPKEEPER DASHBOARD ── */
  if(screen === "shopDash") return wrap(
    <>
      <Hdr title="🏪 मेरी दुकान"/>
      <div style={{padding:14}}>
        <Card glow style={{marginBottom:14}}>
          <div style={{padding:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1,marginRight:12}}>
                <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:19,color:C.ochre,fontWeight:700}}>{myShop.name}</div>
                <div style={{fontSize:12,color:C.chalkDim,marginTop:4}}>👤 {myShop.owner} · 📍 {myShop.village}</div>
                <div style={{marginTop:4}}><Stars r={myShop.rating}/></div>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:30,marginBottom:6}}>🏪</div>
                <Toggle on={myShop.open} onToggle={()=>setShops(p=>p.map(s=>s.id===1?{...s,open:!s.open}:s))}/>
                <div style={{fontSize:9,color:myShop.open?C.greenLight:C.red,marginTop:3,fontFamily:"'Baloo 2',sans-serif"}}>{myShop.open?"खुला है":"बंद है"}</div>
              </div>
            </div>
            <Divider/>
            <div style={{display:"flex",gap:8}}>
              {[
                {n:myShop.items.length,l:"Total Items",c:C.ochre},
                {n:myShop.items.filter(i=>i.available).length,l:"Available",c:C.greenLight},
                {n:queries.filter(q=>q.shopId===1&&q.status==="pending").length,l:"New Queries",c:C.red},
              ].map(s=>(
                <div key={s.l} style={{flex:1,textAlign:"center",background:C.bgCard,borderRadius:8,padding:"8px 4px",border:`1px solid ${C.border}`}}>
                  <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:20,color:s.c,fontWeight:700}}>{s.n}</div>
                  <div style={{fontSize:9,color:C.chalkDim}}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          {[
            {label:"Items Manage",icon:"📦",color:C.ochre,sc:"manageItems"},
            {label:"Queries देखो",icon:"❓",color:C.red,sc:"shopQueries"},
            {label:"Profile Edit",icon:"✏️",color:C.indigo,sc:"editShop"},
            {label:"Analytics",icon:"📊",color:C.greenLight,sc:null},
          ].map(btn=>(
            <button key={btn.label} onClick={()=>btn.sc&&go(btn.sc)}
              style={{background:`linear-gradient(135deg,${btn.color}18,${btn.color}06)`,border:`1.5px solid ${btn.color}60`,color:btn.color,borderRadius:12,padding:"14px 8px",cursor:"pointer",fontFamily:"'Baloo 2',sans-serif",fontSize:13,fontWeight:700,textAlign:"center"}}>
              <div style={{fontSize:24,marginBottom:4}}>{btn.icon}</div>{btn.label}
            </button>
          ))}
        </div>

        {queries.filter(q=>q.shopId===1&&q.status==="pending").length>0 && (
          <>
            <STitle>🔴 नई Queries आई हैं</STitle>
            {queries.filter(q=>q.shopId===1&&q.status==="pending").map(q=>(
              <Card key={q.id} style={{marginBottom:8}}>
                <div style={{padding:12}}>
                  <div style={{fontSize:13,color:C.chalk}}>❓ {q.query}</div>
                  <div style={{fontSize:11,color:C.chalkDim,marginTop:4}}>⏰ {q.time}</div>
                  <button onClick={()=>setQueries(p=>p.map(x=>x.id===q.id?{...x,status:"answered",reply:"हाँ उपलब्ध है, पधारें।"}:x))}
                    style={{marginTop:8,background:"rgba(212,137,26,.15)",border:`1px solid ${C.ochre}`,color:C.ochre,borderRadius:7,padding:"6px 14px",cursor:"pointer",fontFamily:"'Baloo 2',sans-serif",fontSize:12,fontWeight:600}}>✏️ जवाब दो</button>
                </div>
              </Card>
            ))}
          </>
        )}
      </div>
    </>
  );

  /* ── MANAGE ITEMS ── */
  if(screen === "manageItems") return wrap(
    <>
      <Hdr title="📦 Items Manage करें" back={()=>go("shopDash")}
        right={<button onClick={()=>setShowAddItem(true)} style={{background:`linear-gradient(135deg,${C.green},${C.greenLight})`,border:"none",color:C.chalk,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontFamily:"'Baloo 2',sans-serif",fontSize:12,fontWeight:700}}>+ जोड़ो</button>}
      />
      <div style={{padding:14}}>
        {showAddItem && (
          <Card glow style={{marginBottom:14}}>
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
                <Btn onClick={()=>{
                  if(!newItem.name.trim()||!newItem.price) return;
                  setShops(p=>p.map(s=>s.id===1?{...s,items:[...s.items,{id:Date.now(),name:newItem.name,price:Number(newItem.price),unit:"₹",available:true,emoji:newItem.emoji||"📦"}]}:s));
                  setNewItem({name:"",price:"",emoji:"📦"}); setShowAddItem(false);
                }} bg={C.green}>✅ जोड़ें</Btn>
                <Btn onClick={()=>{setShowAddItem(false);setNewItem({name:"",price:"",emoji:"📦"});}} bg={C.border} tc={C.chalk}>रद्द</Btn>
              </div>
            </div>
          </Card>
        )}

        <STitle>सभी Items — Toggle करके Availability बदलें</STitle>
        {shops.find(s=>s.id===1)?.items.map(item=>(
          <Card key={item.id} style={{marginBottom:9}}>
            <div style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}>
              <div style={{fontSize:26,width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center",background:`radial-gradient(${C.ochre}12,transparent)`,borderRadius:"50%",border:`1px solid ${C.border}`,flexShrink:0}}>{item.emoji}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:14,color:C.chalk,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                <div style={{fontSize:13,color:C.ochre,fontWeight:700,marginTop:2}}>₹ {item.price}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,flexShrink:0}}>
                <Toggle on={item.available} onToggle={()=>setShops(p=>p.map(s=>s.id===1?{...s,items:s.items.map(i=>i.id===item.id?{...i,available:!i.available}:i)}:s))}/>
                <span style={{fontSize:9,color:item.available?C.greenLight:"#FF6B4A",fontFamily:"'Baloo 2',sans-serif"}}>{item.available?"उपलब्ध":"खत्म"}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );

  /* ── SHOP QUERIES (shopkeeper view) ── */
  if(screen === "shopQueries") return wrap(
    <>
      <Hdr title="❓ Customer Queries" back={()=>go("shopDash")}/>
      <div style={{padding:14}}>
        {queries.filter(q=>q.shopId===1).length===0
          ? <div style={{textAlign:"center",padding:40,color:C.chalkDim}}>अभी कोई Query नहीं</div>
          : queries.filter(q=>q.shopId===1).map(q=>(
            <Card key={q.id} style={{marginBottom:12}}>
              <div style={{padding:14}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:11,padding:"2px 8px",borderRadius:12,background:q.status==="answered"?"rgba(30,92,58,.3)":"rgba(212,137,26,.2)",color:q.status==="answered"?C.greenLight:C.ochre,border:`1px solid ${q.status==="answered"?C.green:C.ochre}`}}>{q.status==="answered"?"✅ जवाब दिया":"⏳ जवाब बाकी"}</span>
                  <span style={{fontSize:10,color:C.chalkDim}}>{q.time}</span>
                </div>
                <div style={{fontSize:14,color:C.chalk}}>❓ {q.query}</div>
                {q.status==="answered"
                  ? <div style={{marginTop:8,padding:"8px 10px",background:"rgba(30,92,58,.15)",borderRadius:8,fontSize:12,color:C.greenLight,borderLeft:`3px solid ${C.green}`}}>आपका जवाब: {q.reply}</div>
                  : <button onClick={()=>setQueries(p=>p.map(x=>x.id===q.id?{...x,status:"answered",reply:"हाँ उपलब्ध है, पधारें।"}:x))}
                      style={{marginTop:10,width:"100%",background:"rgba(212,137,26,.12)",border:`1px solid ${C.ochre}`,color:C.ochre,borderRadius:8,padding:"8px 0",cursor:"pointer",fontFamily:"'Baloo 2',sans-serif",fontSize:13,fontWeight:600}}>✏️ जवाब दें</button>
                }
              </div>
            </Card>
          ))
        }
      </div>
    </>
  );

  /* ── EDIT SHOP ── */
  if(screen === "editShop") return wrap(
    <>
      <Hdr title="✏️ Profile Edit करें" back={()=>go("shopDash")}/>
      <div style={{padding:16}}>
        {["दुकान का नाम","मालिक का नाम","फोन नंबर","पता / गाँव","खुलने का समय","दुकान का विवरण"].map(f=>(
          <div key={f} style={{marginBottom:12}}>
            <div style={{fontSize:12,color:C.chalkDim,marginBottom:6}}>{f}:</div>
            <input placeholder={`${f} यहाँ लिखें...`}
              style={{width:"100%",background:C.bgCard,border:`1px solid ${C.border}`,color:C.chalk,borderRadius:8,padding:"10px 12px",fontFamily:"'Baloo 2',sans-serif",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
          </div>
        ))}
        <Divider/>
        <Btn bg={C.ochre}>✅ Save करें</Btn>
      </div>
    </>
  );

  /* ── PROFILE ── */
  if(screen === "profile") return wrap(
    <>
      <Hdr title="👤 मेरा Profile"/>
      <div style={{padding:16}}>
        <Card glow style={{marginBottom:16,textAlign:"center"}}>
          <div style={{padding:20}}>
            <div style={{width:70,height:70,borderRadius:"50%",background:`radial-gradient(${C.ochre}28,transparent)`,border:`2px solid ${C.ochre}45`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,margin:"0 auto"}}>👤</div>
            <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:20,color:C.ochre,marginTop:10}}>ग्राम निवासी</div>
            <div style={{fontSize:12,color:C.chalkDim}}>📍 सोंडवा, अलीराजपुर</div>
            <Divider/>
            <div style={{display:"flex",justifyContent:"center",gap:24}}>
              {[
                {n:queries.length,l:"Queries"},
                {n:votedIds.length,l:"Support दिया"},
                {n:problems.filter(p=>p.user==="आप").length,l:"समस्याएं"},
              ].map(s=>(
                <div key={s.l} style={{textAlign:"center"}}>
                  <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:22,color:C.ochre,fontWeight:700}}>{s.n}</div>
                  <div style={{fontSize:10,color:C.chalkDim}}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
        {[
          {icon:"🏪",l:"अपनी दुकान Register करें",s:"Shopkeeper बनें"},
          {icon:"🔔",l:"Notifications",s:"Queries & updates"},
          {icon:"🌐",l:"भाषा बदलें",s:"Hindi / English / Bhili"},
          {icon:"🛡️",l:"Privacy & Security",s:"Account settings"},
          {icon:"ℹ️",l:"App के बारे में",s:"हमारा सोंडवा v1.0"},
        ].map(item=>(
          <Card key={item.l} style={{marginBottom:9}}>
            <div style={{padding:"13px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <span style={{fontSize:22,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(212,137,26,.1)",borderRadius:8}}>{item.icon}</span>
                <div>
                  <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",fontSize:14,color:C.chalk}}>{item.l}</div>
                  <div style={{fontSize:10,color:C.chalkDim}}>{item.s}</div>
                </div>
              </div>
              <span style={{color:C.ochre,fontSize:20}}>›</span>
            </div>
          </Card>
        ))}
      </div>
    </>
  );

  return null;
}