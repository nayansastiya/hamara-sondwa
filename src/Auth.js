import React, { useState } from "react";
import { auth } from "./firebase";
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber 
} from "firebase/auth";
import { db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

const C = {
  bg:"#0A0300", bgCard:"#140800", bgCard2:"#1E0D00",
  border:"#6B3410", ochre:"#D4891A", orange:"#C45E1A", 
  red:"#B5330A", chalk:"#EDE0C4", chalkDim:"#9A8060",
  green:"#1E5C3A", greenLight:"#4CAF80", kumkum:"#C1121F",
};

export default function Auth({ onLogin }) {
  const [step, setStep] = useState("phone"); 
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [village, setVillage] = useState("सोंडवा");
  const [role, setRole] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const villages = ["सोंडवा","भाबरा","जोबट","उदयगढ़","कट्ठीवाड़ा","बोरी"];

  const sendOTP = async () => {
    if (phone.length !== 10) {
      setError("सही 10 अंक का नंबर डालो");
      return;
    }
    setLoading(true);
    setError("");
    try {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible" }
      );
      const result = await signInWithPhoneNumber(
        auth,
        "+91" + phone,
        window.recaptchaVerifier
      );
      setConfirm(result);
      setStep("otp");
    } catch (e) {
      setError("OTP नहीं गया — दोबारा कोशिश करो");
      console.error(e);
    }
    setLoading(false);
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      setError("6 अंक का OTP डालो");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await confirm.confirm(otp);
      const user = result.user;
      
      // Check if user already exists
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        // Old user — directly login
        onLogin(userDoc.data());
      } else {
        // New user — profile banao
        setStep("profile");
      }
    } catch (e) {
      setError("OTP गलत है — दोबारा डालो");
      console.error(e);
    }
    setLoading(false);
  };

  const createProfile = async () => {
    if (!name.trim()) { setError("नाम डालो"); return; }
    if (!role) { setError("Account type चुनो"); return; }
    setLoading(true);
    try {
      const user = auth.currentUser;
      const userData = {
        uid: user.uid,
        phone: user.phoneNumber,
        name: name,
        village: village,
        role: role,
        createdAt: new Date()
      };
      await setDoc(doc(db, "users", user.uid), userData);
      onLogin(userData);
    } catch (e) {
      setError("Profile नहीं बनी — दोबारा कोशिश करो");
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight:"100vh", background:C.bg, 
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:20, fontFamily:"'Baloo 2',sans-serif",
      maxWidth:430, margin:"0 auto"
    }}>
      {/* Header */}
      <div style={{textAlign:"center", marginBottom:32}}>
        <div style={{fontSize:56, marginBottom:8}}>🏘️</div>
        <div style={{
          fontFamily:"'Tiro Devanagari Hindi',serif",
          fontSize:28, color:C.ochre, fontWeight:700
        }}>हमारा सोंडवा</div>
        <div style={{fontSize:12, color:C.chalkDim, marginTop:4}}>
          अलीराजपुर · मध्यप्रदेश
        </div>
      </div>

      {/* Card */}
      <div style={{
        width:"100%", background:C.bgCard,
        border:`1.5px solid ${C.border}`, borderRadius:16,
        padding:24, position:"relative", overflow:"hidden"
      }}>
        {/* Top color bar */}
        <div style={{
          position:"absolute", top:0, left:0, right:0, height:3,
          background:`linear-gradient(90deg,${C.red},${C.ochre},${C.orange})`
        }}/>

        {/* STEP 1 — Phone */}
        {step === "phone" && (
          <>
            <div style={{
              fontFamily:"'Tiro Devanagari Hindi',serif",
              fontSize:18, color:C.ochre, marginBottom:20
            }}>📱 Phone Number डालो</div>
            
            <div style={{
              display:"flex", gap:8, marginBottom:16,
              background:C.bgCard2, border:`1px solid ${C.border}`,
              borderRadius:10, padding:"10px 14px",
              alignItems:"center"
            }}>
              <span style={{color:C.chalkDim, fontSize:14}}>🇮🇳 +91</span>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
                placeholder="10 अंक का नंबर"
                type="tel"
                style={{
                  flex:1, background:"none", border:"none",
                  color:C.chalk, fontSize:16, outline:"none",
                  fontFamily:"'Baloo 2',sans-serif"
                }}
              />
            </div>

            {error && <div style={{color:"#FF6B4A",fontSize:12,marginBottom:12}}>{error}</div>}
            
            <button onClick={sendOTP} disabled={loading} style={{
              width:"100%", background:`linear-gradient(135deg,${C.ochre},${C.orange})`,
              border:"none", color:C.bg, borderRadius:10, padding:"13px 0",
              cursor:"pointer", fontFamily:"'Baloo 2',sans-serif",
              fontSize:15, fontWeight:700
            }}>
              {loading ? "भेज रहे हैं..." : "OTP भेजो 📤"}
            </button>
            
            <div id="recaptcha-container"/>
          </>
        )}

        {/* STEP 2 — OTP */}
        {step === "otp" && (
          <>
            <div style={{
              fontFamily:"'Tiro Devanagari Hindi',serif",
              fontSize:18, color:C.ochre, marginBottom:8
            }}>🔐 OTP डालो</div>
            <div style={{fontSize:12, color:C.chalkDim, marginBottom:20}}>
              +91 {phone} पर OTP गया है
            </div>
            
            <input
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
              placeholder="6 अंक का OTP"
              type="tel"
              style={{
                width:"100%", background:C.bgCard2,
                border:`1px solid ${C.border}`, color:C.chalk,
                borderRadius:10, padding:"12px 14px", fontSize:20,
                fontFamily:"'Baloo 2',sans-serif", outline:"none",
                textAlign:"center", letterSpacing:8, marginBottom:16,
                boxSizing:"border-box"
              }}
            />

            {error && <div style={{color:"#FF6B4A",fontSize:12,marginBottom:12}}>{error}</div>}
            
            <button onClick={verifyOTP} disabled={loading} style={{
              width:"100%", background:`linear-gradient(135deg,${C.ochre},${C.orange})`,
              border:"none", color:C.bg, borderRadius:10, padding:"13px 0",
              cursor:"pointer", fontFamily:"'Baloo 2',sans-serif",
              fontSize:15, fontWeight:700, marginBottom:12
            }}>
              {loading ? "Check कर रहे हैं..." : "Verify करो ✅"}
            </button>

            <button onClick={() => { setStep("phone"); setOtp(""); setError(""); }} style={{
              width:"100%", background:"none",
              border:`1px solid ${C.border}`, color:C.chalkDim,
              borderRadius:10, padding:"10px 0", cursor:"pointer",
              fontFamily:"'Baloo 2',sans-serif", fontSize:13
            }}>← वापस जाओ</button>
          </>
        )}

        {/* STEP 3 — Profile */}
        {step === "profile" && (
          <>
            <div style={{
              fontFamily:"'Tiro Devanagari Hindi',serif",
              fontSize:18, color:C.ochre, marginBottom:20
            }}>👤 Profile बनाओ</div>

            <div style={{marginBottom:14}}>
              <div style={{fontSize:12,color:C.chalkDim,marginBottom:6}}>आपका नाम:</div>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="नाम यहाँ लिखो..."
                style={{
                  width:"100%", background:C.bgCard2,
                  border:`1px solid ${C.border}`, color:C.chalk,
                  borderRadius:8, padding:"10px 12px",
                  fontFamily:"'Baloo 2',sans-serif", fontSize:14,
                  outline:"none", boxSizing:"border-box"
                }}
              />
            </div>

            <div style={{marginBottom:14}}>
              <div style={{fontSize:12,color:C.chalkDim,marginBottom:6}}>गाँव:</div>
              <select value={village} onChange={e => setVillage(e.target.value)} style={{
                width:"100%", background:C.bgCard2,
                border:`1px solid ${C.border}`, color:C.chalk,
                borderRadius:8, padding:"10px 12px",
                fontFamily:"'Baloo 2',sans-serif", fontSize:14, outline:"none"
              }}>
                {villages.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>

            <div style={{marginBottom:20}}>
              <div style={{fontSize:12,color:C.chalkDim,marginBottom:10}}>Account का प्रकार:</div>
              <div style={{display:"flex", flexDirection:"column", gap:8}}>
                {[
                  {id:"customer", icon:"👤", title:"Customer", desc:"दुकानें खोजो, Query भेजो"},
                  {id:"shopkeeper", icon:"🏪", title:"Shopkeeper", desc:"अपनी दुकान register करो"},
                  {id:"sarpanch", icon:"🏛️", title:"Sarpanch / Official", desc:"समस्याएं manage करो"},
                ].map(r => (
                  <button key={r.id} onClick={() => setRole(r.id)} style={{
                    background: role === r.id ? `rgba(212,137,26,.2)` : C.bgCard2,
                    border: `1.5px solid ${role === r.id ? C.ochre : C.border}`,
                    borderRadius:10, padding:"12px 14px", cursor:"pointer",
                    display:"flex", alignItems:"center", gap:12, textAlign:"left"
                  }}>
                    <span style={{fontSize:24}}>{r.icon}</span>
                    <div>
                      <div style={{
                        fontFamily:"'Tiro Devanagari Hindi',serif",
                        fontSize:14, color:C.chalk, fontWeight:700
                      }}>{r.title}</div>
                      <div style={{fontSize:11, color:C.chalkDim}}>{r.desc}</div>
                    </div>
                    {role === r.id && <span style={{marginLeft:"auto", color:C.ochre}}>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {error && <div style={{color:"#FF6B4A",fontSize:12,marginBottom:12}}>{error}</div>}

            <button onClick={createProfile} disabled={loading} style={{
              width:"100%", background:`linear-gradient(135deg,${C.ochre},${C.orange})`,
              border:"none", color:C.bg, borderRadius:10, padding:"13px 0",
              cursor:"pointer", fontFamily:"'Baloo 2',sans-serif",
              fontSize:15, fontWeight:700
            }}>
              {loading ? "बन रही है..." : "Profile बनाओ 🎉"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}