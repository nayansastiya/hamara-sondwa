import React, { useState, useRef } from "react";
import { auth, db } from "./firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  doc, setDoc, getDoc
} from "firebase/firestore";

const C = {
  bg:"#0A0300", bgCard:"#140800", bgCard2:"#1E0D00",
  border:"#6B3410", ochre:"#D4891A", orange:"#C45E1A",
  red:"#B5330A", chalk:"#EDE0C4", chalkDim:"#9A8060",
  green:"#1E5C3A", greenLight:"#4CAF80", kumkum:"#C1121F",
};

const villages = ["सोंडवा","भाबरा","जोबट","उदयगढ़","कट्ठीवाड़ा","बोरी"];

const ROLES = [
  {id:"customer", icon:"👤", title:"Customer", desc:"दुकानें खोजो, Query भेजो"},
  {id:"shopkeeper", icon:"🏪", title:"Shopkeeper", desc:"अपनी दुकान register करो"},
  {id:"sarpanch", icon:"🏛️", title:"Sarpanch / Official", desc:"समस्याएं manage करो"},
];

export default function Auth({ onLogin }) {
  const [step, setStep] = useState("welcome"); 
  // Steps: welcome → role → authChoice → 
  //        registerMethod → registerDetails → registerOTP → done
  //        loginMethod → loginPhone → loginOTP → done
  //        loginEmail → done

  const [role, setRole] = useState("");
  const [authMode, setAuthMode] = useState(""); // register | login
  const [method, setMethod] = useState(""); // phone | email

  // Phone auth
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmResult, setConfirmResult] = useState(null);

  // Email auth
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Profile details
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [village, setVillage] = useState("सोंडवा");
  // eslint-disable-next-line no-unused-vars
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileRef = useRef();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = (toStep) => {
    setStep(toStep);
    setError("");
  };

  // ── PHOTO PICK ──
  const pickPhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  // ── SEND OTP ──
  const sendOTP = async (phoneNum) => {
    if (phoneNum.length !== 10) { setError("सही 10 अंक का नंबर डालो"); return false; }
    setLoading(true); setError("");
    try {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
      }
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth, "recaptcha-container", { size: "invisible" }
      );
      const result = await signInWithPhoneNumber(
        auth, "+91" + phoneNum, window.recaptchaVerifier
      );
      setConfirmResult(result);
      setLoading(false);
      return true;
    } catch(e) {
      setError("OTP नहीं गया — दोबारा कोशिश करो");
      console.error(e);
      setLoading(false);
      return false;
    }
  };

  // ── VERIFY OTP ──
  const verifyOTP = async () => {
    if (otp.length !== 6) { setError("6 अंक का OTP डालो"); return; }
    setLoading(true); setError("");
    try {
      const result = await confirmResult.confirm(otp);
      const user = result.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Role check karo!
        if (userData.role !== role) {
          await auth.signOut();
          const roleNames = {
            customer:"👤 Customer",
            shopkeeper:"🏪 Shopkeeper",
            sarpanch:"🏛️ Sarpanch"
          };
          setError(`❌ Aap ${roleNames[userData.role]} hain! Sahi category "${roleNames[userData.role]}" select karke login karo.`);
          setLoading(false);
          return;
        }
        onLogin(userData);
      } else {
        if (authMode === "login") {
          setError("Account नहीं मिला! पहले Register करो।");
          reset("welcome");
        } else {
          setStep("registerDetails");
        }
      }
    } catch(e) {
      setError("OTP गलत है — दोबारा डालो");
      console.error(e);
    }
    setLoading(false);
  };

  // ── EMAIL REGISTER ──
  const registerWithEmail = async () => {
    if (!email.includes("@")) { setError("सही Email डालो"); return; }
    if (password.length < 6) { setError("Password कम से कम 6 अक्षर का हो"); return; }
    setLoading(true); setError("");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setStep("registerDetails");
    } catch(e) {
      if (e.code === "auth/email-already-in-use") {
        setError("यह Email पहले से registered है! Login करो।");
      } else {
        setError("Error — दोबारा कोशिश करो");
      }
      console.error(e);
    }
    setLoading(false);
  };

  // ── EMAIL LOGIN ──
  const loginWithEmail = async () => {
    if (!email.includes("@")) { setError("सही Email डालो"); return; }
    if (!password) { setError("Password डालो"); return; }
    setLoading(true); setError("");
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "users", result.user.uid));
     if (userDoc.exists()) {
        const userData = userDoc.data();
        // Role check karo!
        if (userData.role !== role) {
          await auth.signOut();
          const roleNames = {
            customer:"👤 Customer",
            shopkeeper:"🏪 Shopkeeper",
            sarpanch:"🏛️ Sarpanch"
          };
          setError(`❌ Aap ${roleNames[userData.role]} hain! Sahi category "${roleNames[userData.role]}" select karke login karo.`);
          setLoading(false);
          return;
        }
        onLogin(userData);
      } else {
        setError("Account नहीं मिला! पहले Register करो।");
        reset("welcome");
      } 
    } catch(e) {
      if (e.code === "auth/wrong-password" || e.code === "auth/invalid-credential") {
        setError("Password गलत है!");
      } else if (e.code === "auth/user-not-found") {
        setError("Account नहीं मिला! पहले Register करो।");
      } else {
        setError("Error — दोबारा कोशिश करो");
      }
      console.error(e);
    }
    setLoading(false);
  };

  // ── SAVE PROFILE ──
  const saveProfile = async () => {
    if (!name.trim()) { setError("नाम डालो"); return; }
    if (!gender) { setError("Gender चुनो"); return; }
    if (!dob) { setError("Date of Birth डालो"); return; }
    setLoading(true); setError("");
    try {
      const user = auth.currentUser;
      const userData = {
        uid: user.uid,
        name: name.trim(),
        gender,
        dob,
        village,
        role,
        phone: method === "phone" ? "+91" + phone : (user.phoneNumber || ""),
        email: method === "email" ? email : (user.email || ""),
        photoUrl: photoPreview || "",
        createdAt: new Date(),
      };
      await setDoc(doc(db, "users", user.uid), userData);
      onLogin(userData);
    } catch(e) {
      setError("Profile नहीं बनी — दोबारा कोशिश करो");
      console.error(e);
    }
    setLoading(false);
  };

  // ── STYLES ──
  const inputStyle = {
    width:"100%", background:C.bgCard2,
    border:`1.5px solid ${C.border}`, color:C.chalk,
    borderRadius:10, padding:"12px 14px",
    fontFamily:"'Baloo 2',sans-serif",
    fontSize:14, outline:"none", boxSizing:"border-box",
    marginBottom:12,
  };

  const primaryBtn = (label, onClick, disabled=false) => (
    <button onClick={onClick} disabled={disabled || loading} style={{
      width:"100%",
      background: disabled||loading ? "#333" : `linear-gradient(135deg,${C.ochre},${C.orange})`,
      border:"none", color: disabled||loading ? C.chalkDim : C.bg,
      borderRadius:10, padding:"13px 0", cursor: disabled||loading ? "default" : "pointer",
      fontFamily:"'Baloo 2',sans-serif", fontSize:15, fontWeight:700,
      marginBottom:10, transition:"all .2s"
    }}>{loading ? "Loading..." : label}</button>
  );

  const outlineBtn = (label, onClick) => (
    <button onClick={onClick} style={{
      width:"100%", background:"none",
      border:`1.5px solid ${C.border}`, color:C.chalkDim,
      borderRadius:10, padding:"11px 0", cursor:"pointer",
      fontFamily:"'Baloo 2',sans-serif", fontSize:13, marginBottom:8
    }}>{label}</button>
  );

  const ErrorBox = () => error ? (
    <div style={{
      color:"#FF6B4A", fontSize:12, marginBottom:12,
      padding:"8px 12px", background:"rgba(181,51,10,.15)",
      borderRadius:8, border:`1px solid ${C.red}`
    }}>{error}</div>
  ) : null;

  const Label = ({children}) => (
    <div style={{fontSize:12, color:C.chalkDim, marginBottom:6}}>{children}</div>
  );

  // ── RENDER ──
  return (
    <div style={{
      minHeight:"100vh", background:C.bg,
      backgroundImage:`url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L55 30 L30 55 L5 30Z' stroke='%23C45E1A' stroke-width='0.5' fill='none' opacity='0.15'/%3E%3C/svg%3E")`,
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center",
      padding:"20px 16px", fontFamily:"'Baloo 2',sans-serif",
    }}>

      {/* Logo */}
      <div style={{textAlign:"center", marginBottom:24}}>
        <div style={{fontSize:52}}>🏘️</div>
        <div style={{
          fontFamily:"'Tiro Devanagari Hindi',serif",
          fontSize:26, color:C.ochre, fontWeight:700, marginTop:6
        }}>हमारा सोंडवा</div>
        <div style={{fontSize:11, color:C.chalkDim, marginTop:3}}>
          अलीराजपुर · मध्यप्रदेश 🌿
        </div>
      </div>

      {/* Steps indicator */}
      <div style={{display:"flex", gap:6, marginBottom:20}}>
        {["role","authChoice","method","done"].map((s,i) => {
          const stepOrder = ["welcome","role","authChoice","registerMethod","registerDetails","registerOTP","loginMethod","loginPhone","loginOTP","loginEmail"];
          const current = stepOrder.indexOf(step);
          const active = i <= Math.floor(current/2.5);
          return (
            <div key={i} style={{
              width: active ? 24 : 8, height:8,
              borderRadius:4,
              background: active ? C.ochre : C.border,
              transition:"all .3s"
            }}/>
          );
        })}
      </div>

      {/* Card */}
      <div style={{
        width:"100%", maxWidth:400,
        background:C.bgCard,
        border:`1.5px solid ${C.border}`,
        borderRadius:18, padding:"24px 20px",
        position:"relative", overflow:"hidden",
        boxShadow:`0 8px 40px rgba(0,0,0,0.5)`
      }}>
        <div style={{
          position:"absolute", top:0, left:0, right:0, height:3,
          background:`linear-gradient(90deg,${C.red},${C.ochre},${C.orange},${C.ochre},${C.red})`
        }}/>

        {/* ══ STEP: WELCOME / ROLE ══ */}
        {(step === "welcome" || step === "role") && (
          <>
            <div style={{
              fontFamily:"'Tiro Devanagari Hindi',serif",
              fontSize:20, color:C.ochre, marginBottom:6
            }}>आप कौन हैं? 👋</div>
            <div style={{fontSize:12, color:C.chalkDim, marginBottom:18}}>
              Account type चुनो — आगे बढ़ने के लिए
            </div>

            {ROLES.map(r=>(
              <button key={r.id} onClick={()=>setRole(r.id)} style={{
                background:role===r.id?`rgba(212,137,26,.18)`:C.bgCard2,
                border:`1.5px solid ${role===r.id?C.ochre:C.border}`,
                borderRadius:12, padding:"13px 14px", cursor:"pointer",
                display:"flex", alignItems:"center", gap:12,
                textAlign:"left", width:"100%", marginBottom:8,
                transition:"all .2s"
              }}>
                <span style={{fontSize:26, flexShrink:0}}>{r.icon}</span>
                <div style={{flex:1}}>
                  <div style={{
                    fontFamily:"'Tiro Devanagari Hindi',serif",
                    fontSize:14, color:C.chalk, fontWeight:700
                  }}>{r.title}</div>
                  <div style={{fontSize:11, color:C.chalkDim}}>{r.desc}</div>
                </div>
                <div style={{
                  width:20, height:20, borderRadius:"50%",
                  border:`2px solid ${role===r.id?C.ochre:C.border}`,
                  background:role===r.id?C.ochre:"none",
                  flexShrink:0, display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:11, color:C.bg
                }}>{role===r.id?"✓":""}</div>
              </button>
            ))}

            <div style={{height:12}}/>
            <ErrorBox/>
            {primaryBtn("आगे बढ़ो →", ()=>{
              if(!role){setError("पहले account type चुनो!"); return;}
              reset("authChoice");
            })}
          </>
        )}

        {/* ══ STEP: AUTH CHOICE ══ */}
        {step === "authChoice" && (
          <>
            <div style={{
              display:"flex", alignItems:"center",
              gap:10, marginBottom:20
            }}>
              <span style={{fontSize:26}}>
                {ROLES.find(r=>r.id===role)?.icon}
              </span>
              <div>
                <div style={{
                  fontFamily:"'Tiro Devanagari Hindi',serif",
                  fontSize:18, color:C.ochre
                }}>
                  {ROLES.find(r=>r.id===role)?.title}
                </div>
                <div style={{fontSize:11, color:C.chalkDim}}>
                  आगे क्या करना है?
                </div>
              </div>
            </div>

            <ErrorBox/>

            {primaryBtn("🆕 नया Account बनाओ", ()=>{
              setAuthMode("register");
              reset("registerMethod");
            })}

            <button onClick={()=>{setAuthMode("login"); reset("loginMethod");}} style={{
              width:"100%", background:"none",
              border:`1.5px solid ${C.ochre}`,
              color:C.ochre, borderRadius:10,
              padding:"13px 0", cursor:"pointer",
              fontFamily:"'Baloo 2',sans-serif",
              fontSize:15, fontWeight:700, marginBottom:10
            }}>🔑 पहले से Account है? Login करो</button>

            {outlineBtn("← वापस", ()=>reset("welcome"))}
          </>
        )}

        {/* ══ STEP: REGISTER METHOD ══ */}
        {step === "registerMethod" && (
          <>
            <div style={{
              fontFamily:"'Tiro Devanagari Hindi',serif",
              fontSize:18, color:C.ochre, marginBottom:6
            }}>🆕 Register करो</div>
            <div style={{fontSize:12, color:C.chalkDim, marginBottom:20}}>
              किस तरह से register करना है?
            </div>

            <button onClick={()=>{setMethod("phone"); reset("registerPhone");}} style={{
              width:"100%", background:`rgba(212,137,26,.12)`,
              border:`1.5px solid ${C.ochre}`,
              color:C.chalk, borderRadius:12,
              padding:"16px 14px", cursor:"pointer",
              display:"flex", alignItems:"center", gap:14,
              textAlign:"left", marginBottom:10
            }}>
              <span style={{fontSize:28}}>📱</span>
              <div>
                <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",
                  fontSize:14, color:C.ochre, fontWeight:700}}>
                  Phone OTP से
                </div>
                <div style={{fontSize:11, color:C.chalkDim}}>
                  Mobile number → OTP → Done!
                </div>
              </div>
            </button>

            <button onClick={()=>{setMethod("email"); reset("registerEmail");}} style={{
              width:"100%", background:`rgba(74,143,212,.1)`,
              border:`1.5px solid #4A8FD4`,
              color:C.chalk, borderRadius:12,
              padding:"16px 14px", cursor:"pointer",
              display:"flex", alignItems:"center", gap:14,
              textAlign:"left", marginBottom:16
            }}>
              <span style={{fontSize:28}}>📧</span>
              <div>
                <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",
                  fontSize:14, color:"#4A8FD4", fontWeight:700}}>
                  Email + Password से
                </div>
                <div style={{fontSize:11, color:C.chalkDim}}>
                  Email address और password set karo
                </div>
              </div>
            </button>

            {outlineBtn("← वापस", ()=>reset("authChoice"))}
          </>
        )}

        {/* ══ STEP: REGISTER PHONE ══ */}
        {step === "registerPhone" && (
          <>
            <div style={{
              fontFamily:"'Tiro Devanagari Hindi',serif",
              fontSize:18, color:C.ochre, marginBottom:6
            }}>📱 Phone Number</div>
            <div style={{fontSize:12, color:C.chalkDim, marginBottom:20}}>
              OTP आएगा verify करने के लिए
            </div>

            <Label>Mobile Number *</Label>
            <div style={{
              display:"flex", gap:8, marginBottom:12,
              background:C.bgCard2, border:`1.5px solid ${C.border}`,
              borderRadius:10, padding:"12px 14px", alignItems:"center"
            }}>
              <span style={{color:C.chalkDim, fontSize:13, flexShrink:0}}>
                🇮🇳 +91
              </span>
              <input
                value={phone}
                onChange={e=>setPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
                placeholder="10 अंक का नंबर"
                type="tel"
                style={{flex:1,background:"none",border:"none",
                  color:C.chalk,fontSize:16,outline:"none",
                  fontFamily:"'Baloo 2',sans-serif"}}
              />
            </div>

            <ErrorBox/>
            {primaryBtn("OTP भेजो 📤", async()=>{
              const ok = await sendOTP(phone);
              if(ok) reset("registerOTP");
            })}
            {outlineBtn("← वापस", ()=>reset("registerMethod"))}
            <div id="recaptcha-container"/>
          </>
        )}

        {/* ══ STEP: REGISTER EMAIL ══ */}
        {step === "registerEmail" && (
          <>
            <div style={{
              fontFamily:"'Tiro Devanagari Hindi',serif",
              fontSize:18, color:C.ochre, marginBottom:20
            }}>📧 Email & Password</div>

            <Label>Email Address *</Label>
            <input
              value={email}
              onChange={e=>setEmail(e.target.value)}
              placeholder="aapki@email.com"
              type="email"
              style={inputStyle}
            />

            <Label>Password बनाओ * (कम से कम 6 अक्षर)</Label>
            <div style={{position:"relative", marginBottom:12}}>
              <input
                value={password}
                onChange={e=>setPassword(e.target.value)}
                placeholder="Strong password डालो"
                type={showPass?"text":"password"}
                style={{...inputStyle, marginBottom:0, paddingRight:44}}
              />
              <button onClick={()=>setShowPass(!showPass)} style={{
                position:"absolute", right:12, top:"50%",
                transform:"translateY(-50%)",
                background:"none", border:"none",
                color:C.chalkDim, cursor:"pointer", fontSize:16
              }}>{showPass?"🙈":"👁️"}</button>
            </div>

            {/* Password strength */}
            <div style={{display:"flex", gap:4, marginBottom:16}}>
              {[1,2,3,4].map(i=>(
                <div key={i} style={{
                  flex:1, height:4, borderRadius:2,
                  background: password.length >= i*3
                    ? i<=1?"#FF6B4A":i<=2?C.ochre:i<=3?C.orange:C.greenLight
                    : C.border,
                  transition:"all .3s"
                }}/>
              ))}
            </div>

            <ErrorBox/>
            {primaryBtn("आगे बढ़ो →", registerWithEmail)}
            {outlineBtn("← वापस", ()=>reset("registerMethod"))}
          </>
        )}

        {/* ══ STEP: REGISTER OTP ══ */}
        {step === "registerOTP" && (
          <>
            <div style={{
              fontFamily:"'Tiro Devanagari Hindi',serif",
              fontSize:18, color:C.ochre, marginBottom:6
            }}>🔐 OTP Verify करो</div>
            <div style={{fontSize:12, color:C.chalkDim, marginBottom:20}}>
              +91 {phone} पर 6 अंक का OTP गया है
            </div>

            <input
              value={otp}
              onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
              placeholder="• • • • • •"
              type="tel"
              style={{...inputStyle, fontSize:28, textAlign:"center", letterSpacing:12}}
            />

            <ErrorBox/>
            {primaryBtn("✅ Verify करो", verifyOTP)}
            {outlineBtn("← OTP दोबारा भेजो", async()=>{
              setOtp(""); 
              const ok = await sendOTP(phone);
              if(ok) setError("OTP दोबारा भेज दिया! ✅");
            })}
            {outlineBtn("← वापस", ()=>reset("registerPhone"))}
          </>
        )}

        {/* ══ STEP: REGISTER DETAILS ══ */}
        {step === "registerDetails" && (
          <>
            <div style={{
              fontFamily:"'Tiro Devanagari Hindi',serif",
              fontSize:18, color:C.ochre, marginBottom:20
            }}>👤 Profile बनाओ</div>

            {/* Photo Upload */}
            <div style={{textAlign:"center", marginBottom:20}}>
              <div
                onClick={()=>fileRef.current.click()}
                style={{
                  width:80, height:80, borderRadius:"50%",
                  background:photoPreview?`url(${photoPreview}) center/cover`:C.bgCard2,
                  border:`2px dashed ${C.ochre}`,
                  margin:"0 auto 8px",
                  display:"flex", alignItems:"center",
                  justifyContent:"center", cursor:"pointer",
                  fontSize:28, overflow:"hidden"
                }}
              >
                {!photoPreview && "📷"}
              </div>
              <div style={{fontSize:11, color:C.chalkDim}}>
                Profile photo add karo (optional)
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={pickPhoto}
                style={{display:"none"}}
              />
            </div>

            <Label>पूरा नाम *</Label>
            <input
              value={name}
              onChange={e=>setName(e.target.value)}
              placeholder="अपना पूरा नाम लिखो"
              style={inputStyle}
            />

            <Label>Gender *</Label>
            <div style={{display:"flex", gap:8, marginBottom:12}}>
              {["पुरुष 👨","महिला 👩","अन्य 🧑"].map(g=>{
                const val = g.split(" ")[0];
                return (
                  <button key={g} onClick={()=>setGender(val)} style={{
                    flex:1, padding:"10px 4px",
                    background:gender===val?`rgba(212,137,26,.2)`:C.bgCard2,
                    border:`1.5px solid ${gender===val?C.ochre:C.border}`,
                    color:gender===val?C.ochre:C.chalk,
                    borderRadius:8, cursor:"pointer",
                    fontFamily:"'Baloo 2',sans-serif", fontSize:12,
                    fontWeight:gender===val?700:400
                  }}>{g}</button>
                );
              })}
            </div>

            <Label>Date of Birth *</Label>
            <input
              value={dob}
              onChange={e=>setDob(e.target.value)}
              type="date"
              max={new Date().toISOString().split("T")[0]}
              style={{...inputStyle, colorScheme:"dark"}}
            />

            <Label>गाँव *</Label>
            <select
              value={village}
              onChange={e=>setVillage(e.target.value)}
              style={{...inputStyle, fontSize:13}}
            >
              {villages.map(v=><option key={v}>{v}</option>)}
            </select>

            {method === "phone" && (
              <div style={{
                padding:"8px 12px", background:"rgba(30,92,58,.15)",
                borderRadius:8, fontSize:12, color:C.greenLight,
                marginBottom:12, border:`1px solid ${C.green}`
              }}>
                ✅ Phone verified: +91 {phone}
              </div>
            )}
            {method === "email" && (
              <div style={{
                padding:"8px 12px", background:"rgba(74,143,212,.15)",
                borderRadius:8, fontSize:12, color:"#4A8FD4",
                marginBottom:12, border:`1px solid #4A8FD4`
              }}>
                ✅ Email: {email}
              </div>
            )}

            <ErrorBox/>
            {primaryBtn("🎉 Account बनाओ!", saveProfile)}
          </>
        )}

        {/* ══ STEP: LOGIN METHOD ══ */}
        {step === "loginMethod" && (
          <>
            <div style={{
              fontFamily:"'Tiro Devanagari Hindi',serif",
              fontSize:18, color:C.ochre, marginBottom:6
            }}>🔑 Login करो</div>
            <div style={{fontSize:12, color:C.chalkDim, marginBottom:20}}>
              कैसे login करना है?
            </div>

            <button onClick={()=>{setMethod("phone"); reset("loginPhone");}} style={{
              width:"100%", background:`rgba(212,137,26,.12)`,
              border:`1.5px solid ${C.ochre}`,
              color:C.chalk, borderRadius:12,
              padding:"16px 14px", cursor:"pointer",
              display:"flex", alignItems:"center", gap:14,
              textAlign:"left", marginBottom:10
            }}>
              <span style={{fontSize:28}}>📱</span>
              <div>
                <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",
                  fontSize:14, color:C.ochre, fontWeight:700}}>
                  Phone OTP से
                </div>
                <div style={{fontSize:11, color:C.chalkDim}}>
                  Mobile number → OTP
                </div>
              </div>
            </button>

            <button onClick={()=>{setMethod("email"); reset("loginEmail");}} style={{
              width:"100%", background:`rgba(74,143,212,.1)`,
              border:`1.5px solid #4A8FD4`,
              color:C.chalk, borderRadius:12,
              padding:"16px 14px", cursor:"pointer",
              display:"flex", alignItems:"center", gap:14,
              textAlign:"left", marginBottom:16
            }}>
              <span style={{fontSize:28}}>📧</span>
              <div>
                <div style={{fontFamily:"'Tiro Devanagari Hindi',serif",
                  fontSize:14, color:"#4A8FD4", fontWeight:700}}>
                  Email + Password से
                </div>
                <div style={{fontSize:11, color:C.chalkDim}}>
                  Email aur password se login
                </div>
              </div>
            </button>

            {outlineBtn("← वापस", ()=>reset("authChoice"))}
          </>
        )}

        {/* ══ STEP: LOGIN PHONE ══ */}
        {step === "loginPhone" && (
          <>
            <div style={{
              fontFamily:"'Tiro Devanagari Hindi',serif",
              fontSize:18, color:C.ochre, marginBottom:20
            }}>📱 Phone से Login</div>

            <Label>Mobile Number *</Label>
            <div style={{
              display:"flex", gap:8, marginBottom:12,
              background:C.bgCard2, border:`1.5px solid ${C.border}`,
              borderRadius:10, padding:"12px 14px", alignItems:"center"
            }}>
              <span style={{color:C.chalkDim, fontSize:13, flexShrink:0}}>
                🇮🇳 +91
              </span>
              <input
                value={phone}
                onChange={e=>setPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
                placeholder="Registered number"
                type="tel"
                style={{flex:1,background:"none",border:"none",
                  color:C.chalk,fontSize:16,outline:"none",
                  fontFamily:"'Baloo 2',sans-serif"}}
              />
            </div>

            <ErrorBox/>
            {primaryBtn("OTP भेजो 📤", async()=>{
              const ok = await sendOTP(phone);
              if(ok) reset("loginOTP");
            })}
            {outlineBtn("← वापस", ()=>reset("loginMethod"))}
            <div id="recaptcha-container"/>
          </>
        )}

        {/* ══ STEP: LOGIN OTP ══ */}
        {step === "loginOTP" && (
          <>
            <div style={{
              fontFamily:"'Tiro Devanagari Hindi',serif",
              fontSize:18, color:C.ochre, marginBottom:6
            }}>🔐 OTP डालो</div>
            <div style={{fontSize:12, color:C.chalkDim, marginBottom:20}}>
              +91 {phone} पर OTP गया है
            </div>

            <input
              value={otp}
              onChange={e=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
              placeholder="• • • • • •"
              type="tel"
              style={{...inputStyle, fontSize:28, textAlign:"center", letterSpacing:12}}
            />

            <ErrorBox/>
            {primaryBtn("✅ Login करो", verifyOTP)}
            {outlineBtn("← OTP दोबारा भेजो", async()=>{
              setOtp("");
              const ok = await sendOTP(phone);
              if(ok) setError("OTP दोबारा भेज दिया! ✅");
            })}
            {outlineBtn("← वापस", ()=>reset("loginPhone"))}
          </>
        )}

        {/* ══ STEP: LOGIN EMAIL ══ */}
        {step === "loginEmail" && (
          <>
            <div style={{
              fontFamily:"'Tiro Devanagari Hindi',serif",
              fontSize:18, color:C.ochre, marginBottom:20
            }}>📧 Email से Login</div>

            <Label>Email Address *</Label>
            <input
              value={email}
              onChange={e=>setEmail(e.target.value)}
              placeholder="aapki@email.com"
              type="email"
              style={inputStyle}
            />

            <Label>Password *</Label>
            <div style={{position:"relative", marginBottom:12}}>
              <input
                value={password}
                onChange={e=>setPassword(e.target.value)}
                placeholder="Password डालो"
                type={showPass?"text":"password"}
                style={{...inputStyle, marginBottom:0, paddingRight:44}}
              />
              <button onClick={()=>setShowPass(!showPass)} style={{
                position:"absolute", right:12, top:"50%",
                transform:"translateY(-50%)",
                background:"none", border:"none",
                color:C.chalkDim, cursor:"pointer", fontSize:16
              }}>{showPass?"🙈":"👁️"}</button>
            </div>

            <ErrorBox/>
            {primaryBtn("🔑 Login करो", loginWithEmail)}
            {outlineBtn("← वापस", ()=>reset("loginMethod"))}
          </>
        )}

      </div>

      <div style={{
        marginTop:16, fontSize:11,
        color:C.chalkDim, textAlign:"center"
      }}>
        🔐 आपका data सुरक्षित है · Powered by Firebase
      </div>
    </div>
  );
}