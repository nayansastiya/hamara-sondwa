import React, { useState } from "react";
import { db, auth } from "./firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";

const C = {
  bg:"#0A0300", bgCard:"#140800", bgCard2:"#1E0D00",
  border:"#6B3410", ochre:"#D4891A", orange:"#C45E1A",
  red:"#B5330A", chalk:"#EDE0C4", chalkDim:"#9A8060",
  green:"#1E5C3A", greenLight:"#4CAF80",
};

const CATS = [
  {id:101, name:"किराना / General Store", icon:"🛒"},
  {id:102, name:"बीज & खाद", icon:"🌱"},
  {id:103, name:"दवाई / Pharmacy", icon:"💊"},
  {id:104, name:"कपड़ा & गारमेंट", icon:"👗"},
  {id:105, name:"Hardware & Tools", icon:"🔨"},
  {id:106, name:"Mobile & Electronics", icon:"📱"},
  {id:201, name:"Mobile Repair", icon:"🔧"},
  {id:202, name:"Electrician", icon:"⚡"},
  {id:203, name:"Pump & Motor", icon:"⚙️"},
  {id:204, name:"Tractor Mechanic", icon:"🚜"},
  {id:205, name:"Welder", icon:"🔩"},
  {id:206, name:"Plumber", icon:"🪠"},
  {id:301, name:"सब्जी & फल", icon:"🥦"},
  {id:302, name:"दूध & डेयरी", icon:"🥛"},
  {id:303, name:"अनाज & दाल", icon:"🌾"},
  {id:401, name:"Auto / Rickshaw", icon:"🛺"},
  {id:402, name:"Tractor किराए पर", icon:"🚜"},
  {id:501, name:"Doctor / Clinic", icon:"👨‍⚕️"},
  {id:601, name:"राज मिस्त्री", icon:"🏗️"},
  {id:602, name:"Carpenter", icon:"🪚"},
  {id:701, name:"Tailor / दर्ज़ी", icon:"✂️"},
  {id:702, name:"Barber / Salon", icon:"💈"},
  {id:801, name:"CSC / Digital Seva", icon:"🏛️"},
  {id:802, name:"Bank Mitra", icon:"🏦"},
];

const villages = ["सोंडवा","भाबरा","जोबट","उदयगढ़","कट्ठीवाड़ा","बोरी"];

export default function RegisterShop({ currentUser, onDone }) {
  const [form, setForm] = useState({
    name: "",
    catId: "",
    village: currentUser?.village || "सोंडवा",
    phone: currentUser?.phone?.replace("+91","") || "",
    openTime: "8:00 AM",
    closeTime: "8:00 PM",
    desc: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const validate = () => {
    if (!form.name.trim()) return "दुकान का नाम डालो";
    if (!form.catId) return "Category चुनो";
    if (!form.phone || form.phone.length !== 10) return "सही phone number डालो";
    if (!form.desc.trim()) return "दुकान का विवरण डालो";
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    setError("");
    try {
      // Check karo agar pehle se shop register hai
      const existing = await getDocs(
        query(collection(db, "shops"), 
        where("ownerId", "==", auth.currentUser.uid))
      );
      if (!existing.empty) {
        setError("आपकी दुकान पहले से registered है!");
        setLoading(false);
        return;
      }

      await addDoc(collection(db, "shops"), {
        name: form.name,
        catId: Number(form.catId),
        village: form.village,
        phone: form.phone,
        openTime: form.openTime,
        closeTime: form.closeTime,
        desc: form.desc,
        owner: currentUser.name,
        ownerId: auth.currentUser.uid,
        rating: 0,
        reviews: 0,
        open: true,
        items: [],
        createdAt: new Date(),
      });
      setDone(true);
    } catch(e) {
      setError("दुकान register नहीं हुई — दोबारा कोशिश करो");
      console.error(e);
    }
    setLoading(false);
  };

  if (done) return (
    <div style={{
      minHeight:"100vh", background:C.bg,
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:24, fontFamily:"'Baloo 2',sans-serif"
    }}>
      <div style={{fontSize:70, marginBottom:16}}>🎉</div>
      <div style={{
        fontFamily:"'Tiro Devanagari Hindi',serif",
        fontSize:24, color:C.ochre, textAlign:"center"
      }}>दुकान Register हो गई!</div>
      <div style={{
        fontSize:13, color:C.chalkDim,
        marginTop:8, textAlign:"center", lineHeight:1.7
      }}>
        आपकी दुकान अब live है।<br/>
        अब items add करो!
      </div>
      <button onClick={onDone} style={{
        marginTop:24, background:`linear-gradient(135deg,${C.ochre},${C.orange})`,
        border:"none", color:C.bg, borderRadius:10,
        padding:"13px 32px", cursor:"pointer",
        fontFamily:"'Baloo 2',sans-serif", fontSize:15, fontWeight:700
      }}>Items Add करो →</button>
    </div>
  );

  return (
    <div style={{
      minHeight:"100vh", background:C.bg,
      color:C.chalk, maxWidth:430, margin:"0 auto",
      paddingBottom:40, fontFamily:"'Baloo 2',sans-serif"
    }}>
      {/* Header */}
      <div style={{
        background:`linear-gradient(135deg,#1E0800,#0A0300)`,
        padding:"16px 16px 14px",
        borderBottom:`2px solid ${C.border}`
      }}>
        <div style={{
          fontFamily:"'Tiro Devanagari Hindi',serif",
          fontSize:20, color:C.ochre, fontWeight:700
        }}>🏪 दुकान Register करो</div>
        <div style={{fontSize:11, color:C.chalkDim, marginTop:2}}>
          अपनी दुकान/सेवा हमारा सोंडवा पर add करो
        </div>
      </div>

      <div style={{padding:16}}>

        {/* Dukaan naam */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:13, color:C.chalkDim, marginBottom:6}}>
            दुकान/सेवा का नाम: *
          </div>
          <input
            value={form.name}
            onChange={e => setForm(f=>({...f, name:e.target.value}))}
            placeholder="जैसे: रमेश किराना स्टोर"
            style={{
              width:"100%", background:C.bgCard,
              border:`1px solid ${C.border}`, color:C.chalk,
              borderRadius:8, padding:"10px 12px",
              fontFamily:"'Baloo 2',sans-serif",
              fontSize:14, outline:"none", boxSizing:"border-box"
            }}
          />
        </div>

        {/* Category */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:13, color:C.chalkDim, marginBottom:6}}>
            Category: *
          </div>
          <select
            value={form.catId}
            onChange={e => setForm(f=>({...f, catId:e.target.value}))}
            style={{
              width:"100%", background:C.bgCard,
              border:`1px solid ${C.border}`, color:C.chalk,
              borderRadius:8, padding:"10px 12px",
              fontFamily:"'Baloo 2',sans-serif",
              fontSize:13, outline:"none"
            }}
          >
            <option value="">-- Category चुनो --</option>
            {CATS.map(c => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Village */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:13, color:C.chalkDim, marginBottom:6}}>
            गाँव: *
          </div>
          <select
            value={form.village}
            onChange={e => setForm(f=>({...f, village:e.target.value}))}
            style={{
              width:"100%", background:C.bgCard,
              border:`1px solid ${C.border}`, color:C.chalk,
              borderRadius:8, padding:"10px 12px",
              fontFamily:"'Baloo 2',sans-serif",
              fontSize:13, outline:"none"
            }}
          >
            {villages.map(v => <option key={v}>{v}</option>)}
          </select>
        </div>

        {/* Phone */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:13, color:C.chalkDim, marginBottom:6}}>
            Phone Number: *
          </div>
          <input
            value={form.phone}
            onChange={e => setForm(f=>({...f, phone:e.target.value.replace(/\D/g,'').slice(0,10)}))}
            placeholder="10 अंक का नंबर"
            type="tel"
            style={{
              width:"100%", background:C.bgCard,
              border:`1px solid ${C.border}`, color:C.chalk,
              borderRadius:8, padding:"10px 12px",
              fontFamily:"'Baloo 2',sans-serif",
              fontSize:14, outline:"none", boxSizing:"border-box"
            }}
          />
        </div>

        {/* Timing */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:13, color:C.chalkDim, marginBottom:6}}>
            खुलने का समय:
          </div>
          <div style={{display:"flex", gap:8}}>
            <input
              value={form.openTime}
              onChange={e => setForm(f=>({...f, openTime:e.target.value}))}
              placeholder="8:00 AM"
              style={{
                flex:1, background:C.bgCard,
                border:`1px solid ${C.border}`, color:C.chalk,
                borderRadius:8, padding:"10px 12px",
                fontFamily:"'Baloo 2',sans-serif",
                fontSize:13, outline:"none"
              }}
            />
            <span style={{color:C.chalkDim, alignSelf:"center"}}>से</span>
            <input
              value={form.closeTime}
              onChange={e => setForm(f=>({...f, closeTime:e.target.value}))}
              placeholder="8:00 PM"
              style={{
                flex:1, background:C.bgCard,
                border:`1px solid ${C.border}`, color:C.chalk,
                borderRadius:8, padding:"10px 12px",
                fontFamily:"'Baloo 2',sans-serif",
                fontSize:13, outline:"none"
              }}
            />
          </div>
        </div>

        {/* Description */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:13, color:C.chalkDim, marginBottom:6}}>
            दुकान का विवरण: *
          </div>
          <textarea
            value={form.desc}
            onChange={e => setForm(f=>({...f, desc:e.target.value}))}
            placeholder="जैसे: सभी जरूरी किराना सामान, थोक और खुदरा दोनों..."
            rows={3}
            style={{
              width:"100%", background:C.bgCard,
              border:`1px solid ${C.border}`, color:C.chalk,
              borderRadius:8, padding:"10px 12px",
              fontFamily:"'Baloo 2',sans-serif",
              fontSize:13, outline:"none",
              resize:"none", boxSizing:"border-box"
            }}
          />
        </div>

        {error && (
          <div style={{
            color:"#FF6B4A", fontSize:13,
            marginBottom:14, padding:"8px 12px",
            background:"rgba(181,51,10,.15)",
            borderRadius:8, border:`1px solid ${C.red}`
          }}>{error}</div>
        )}

        <button onClick={submit} disabled={loading} style={{
          width:"100%",
          background:`linear-gradient(135deg,${C.ochre},${C.orange})`,
          border:"none", color:C.bg, borderRadius:10,
          padding:"14px 0", cursor:"pointer",
          fontFamily:"'Baloo 2',sans-serif",
          fontSize:15, fontWeight:700,
          boxShadow:`0 4px 20px ${C.ochre}30`
        }}>
          {loading ? "Register हो रही है..." : "🏪 दुकान Register करो!"}
        </button>

      </div>
    </div>
  );
}