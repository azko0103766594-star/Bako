const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const input = $("#inputText");
let currentText = localStorage.getItem("textpro_draft") || "";

function stats(text){
  const chars=[...text].length;
  const words=text.trim()?text.trim().split(/\s+/).length:0;
  const lines=text?text.split(/\r?\n/).length:0;
  return {chars,words,lines};
}
function updateStats(){
  const s=stats(input.value);
  $("#liveStats").textContent=`${s.chars} caractères · ${s.words} mots · ${s.lines} lignes`;
  if(localStorage.getItem("textpro_stats")!=="false") $("#liveStats").style.display="";
}
function toast(msg){
  const el=$("#toast"); el.textContent=msg; el.classList.add("show");
  clearTimeout(window.__toast); window.__toast=setTimeout(()=>el.classList.remove("show"),2200);
}
function go(view){
  $$(".view").forEach(v=>v.classList.remove("active"));
  const el=$("#view-"+view)||$("#view-home"); el.classList.add("active");
  window.scrollTo({top:0,behavior:"smooth"});
  if(view==="history") renderHistory();
  if(view==="share") updateSharePreview();
}
function getText(){ return input.value.trimEnd(); }
function saveDraft(){ localStorage.setItem("textpro_draft",input.value); }
function cleanText(text, opts={}){
  let out=text.replace(/\r\n?/g,"\n");
  if(opts.invisible!==false) out=out.replace(/[\u200B-\u200D\uFEFF\u00AD]/g,"");
  if(opts.emoji) out=out.replace(/[\p{Extended_Pictographic}\uFE0F]/gu,"");
  if(opts.special) out=out.replace(/[^\p{L}\p{N}\s.,!?;:'"()\-_%€$@/]/gu,"");
  if(opts.spaces!==false) out=out.split("\n").map(l=>l.replace(/[ \t]+/g," ").trim()).join("\n");
  if(opts.blank!==false) out=out.split("\n").filter((l,i,a)=>l.trim()!=="" || (i>0&&a[i-1].trim()!=="")).join("\n");
  if(opts.dupes!==false){
    const seen=new Set();
    out=out.split("\n").filter(l=>{const k=l.trim().toLowerCase(); if(!k)return true; if(seen.has(k))return false; seen.add(k); return true;}).join("\n");
  }
  return out.trim();
}
function saveHistory(text){
  if(!text.trim()) return;
  let h=JSON.parse(localStorage.getItem("textpro_history")||"[]");
  h.unshift({text, time:new Date().toLocaleString("fr-FR",{dateStyle:"short",timeStyle:"short"})});
  h=h.slice(0,30);
  localStorage.setItem("textpro_history",JSON.stringify(h));
}
function copyText(text){
  if(!text){toast("Aucun texte à copier.");return;}
  navigator.clipboard?.writeText(text).then(()=>toast("Texte copié ✓")).catch(()=>{
    const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove();toast("Texte copié ✓");
  });
}
input.value=currentText; updateStats();
input.addEventListener("input",()=>{updateStats();saveDraft();updateSharePreview()});
$("#clearInput").onclick=()=>{input.value="";saveDraft();updateStats();toast("Texte effacé.")};
$("#pasteBtn").onclick=async()=>{try{input.value=await navigator.clipboard.readText();saveDraft();updateStats();updateSharePreview();toast("Texte collé ✓")}catch{toast("Autorise l'accès au presse-papiers ou colle manuellement.")}};
$("#autoClean").onclick=()=>{if(!getText()){toast("Colle d'abord un texte.");return} const before=getText();const after=cleanText(before,{spaces:true,blank:true,dupes:true,invisible:true});input.value=after;saveDraft();updateStats();saveHistory(after);toast(before===after?"Ton texte est déjà propre ✨":"Texte nettoyé ✓")};

$$("[data-view]").forEach(b=>b.addEventListener("click",e=>{e.preventDefault();go(b.dataset.view)}));
$("#settingsBtn").onclick=()=>go("settings");
$("#themeBtn").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("textpro_dark",document.body.classList.contains("dark"));$("#darkToggle").checked=document.body.classList.contains("dark")};
$("#darkToggle").onchange=e=>{document.body.classList.toggle("dark",e.target.checked);localStorage.setItem("textpro_dark",e.target.checked)};
if(localStorage.getItem("textpro_dark")==="true"){document.body.classList.add("dark");$("#darkToggle").checked=true}
$("#statsToggle").onchange=e=>{localStorage.setItem("textpro_stats",e.target.checked);$("#liveStats").style.display=e.target.checked?"":"none"};
if(localStorage.getItem("textpro_stats")==="false"){$("#statsToggle").checked=false;$("#liveStats").style.display="none"}

$("#cleanBtn").onclick=()=>{
  if(!getText()){toast("Colle d'abord un texte.");return}
  const before=getText(), after=cleanText(before,{
    spaces:$("#optSpaces").checked,blank:$("#optBlank").checked,dupes:$("#optDupes").checked,
    invisible:$("#optInvisible").checked,emoji:$("#optEmoji").checked,special:$("#optSpecial").checked
  });
  input.value=after; saveDraft(); updateStats(); saveHistory(after);
  const bs=stats(before), as=stats(after);
  $("#cleanResult").classList.remove("hidden");
  $("#cleanResult").innerHTML=`<h3>✅ Texte nettoyé</h3><div class="stats">${bs.chars-as.chars>0?`<span>${bs.chars-as.chars} caractères retirés</span>`:""}<span>${Math.max(0,bs.lines-as.lines)} lignes retirées</span></div><div class="result-text"></div><div class="action-row"><button class="primary-btn" id="copyClean">📋 Copier</button><button class="secondary-btn" id="undoClean">↩️ Annuler</button></div>`;
  $(".result-text").textContent=after;$("#copyClean").onclick=()=>copyText(after);$("#undoClean").onclick=()=>{input.value=before;saveDraft();updateStats();$("#cleanResult").classList.add("hidden")};
};

$$("[data-improve]").forEach(b=>b.onclick=()=>{
  if(!getText()){toast("Colle d'abord un texte.");return}
  let t=getText(), mode=b.dataset.improve;
  if(mode==="short") t=t.split(/(?<=[.!?])\s+/).map(s=>s.length>120?s.slice(0,117).trim()+"…":s).join(" ");
  if(mode==="professional") t=cleanText(t,{spaces:true,blank:true,dupes:true,invisible:true}).replace(/\b(slt|salut)\b/gi,"Bonjour").replace(/\bmerciii+\b/gi,"Merci");
  if(mode==="simple") t=cleanText(t,{spaces:true,blank:true,dupes:true,invisible:true}).replace(/\bafin de\b/gi,"pour").replace(/\bcependant\b/gi,"mais");
  if(mode==="announcement") t="📢 "+t.replace(/\n+/g,"\n\n");
  if(mode==="list") t=t.split("\n").filter(Boolean).map((x,i)=>`${i+1}. ${x}`).join("\n");
  if(mode==="paragraph") t=cleanText(t,{spaces:true,blank:true,dupes:false,invisible:true}).replace(/([.!?])\s+/g,"$1\n\n");
  $("#improveResult").classList.remove("hidden");$("#improveResult").innerHTML=`<h3>✨ Résultat</h3><div class="result-text"></div><div class="action-row"><button class="primary-btn" id="useImprove">Utiliser</button><button class="secondary-btn" id="copyImprove">📋 Copier</button></div>`;
  $("#improveResult .result-text").textContent=t;$("#useImprove").onclick=()=>{input.value=t;saveDraft();updateStats();go("home")};$("#copyImprove").onclick=()=>copyText(t);saveHistory(t);
});

const formatArea=$("#formatText");
function applyFormat(type){
  let t=formatArea.value||getText(); if(!t){toast("Colle d'abord un texte.");return}
  if(type==="bold") t=`*${t}*`; // WhatsApp-compatible markers
  if(type==="italic") t=`_${t}_`;
  if(type==="strike") t=`~${t}~`;
  if(type==="bullets") t=t.split("\n").filter(Boolean).map(x=>"• "+x).join("\n");
  if(type==="number") t=t.split("\n").filter(Boolean).map((x,i)=>`${i+1}. ${x}`).join("\n");
  if(type==="quote") t=t.split("\n").map(x=>"> "+x).join("\n");
  formatArea.value=t;
}
$$("[data-format]").forEach(b=>b.onclick=()=>applyFormat(b.dataset.format));
$$("[data-transform]").forEach(b=>b.onclick=()=>{
  let t=formatArea.value||getText();if(!t){toast("Colle d'abord un texte.");return}
  const type=b.dataset.transform;
  if(type==="upper")t=t.toUpperCase();if(type==="lower")t=t.toLowerCase();
  if(type==="title")t=t.toLowerCase().replace(/(^|[.!?]\s+)([a-zà-ÿ])/g,(m,a,c)=>a+c.toUpperCase());
  if(type==="single")t=t.replace(/\s*\n+\s*/g," ").replace(/[ \t]+/g," ").trim();
  formatArea.value=t;
});
$("#formatCopy").onclick=()=>copyText(formatArea.value);
$("#formatSave").onclick=()=>{if(formatArea.value){input.value=formatArea.value;saveDraft();saveHistory(formatArea.value);updateStats();toast("Texte enregistré ✓")}};

function updateSharePreview(){
  const t=getText();$("#sharePreview").textContent=t||"Ton texte apparaîtra ici.";$("#shareStats").textContent=`${stats(t).chars} caractères`;
}
$$("[data-platform]").forEach(b=>b.onclick=()=>{
  const t=getText();if(!t){toast("Colle d'abord un texte.");return}
  const p=b.dataset.platform;saveHistory(t);
  if(p==="whatsapp"){window.location.href="https://wa.me/?text="+encodeURIComponent(t);return}
  if(p==="facebook"){window.open("https://www.facebook.com/sharer/sharer.php?u="+encodeURIComponent(location.href)+"&quote="+encodeURIComponent(t),"_blank","noopener");return}
  if(p==="instagram"){copyText(t);toast("Légende Instagram copiée ✓");return}
  if(navigator.share){navigator.share({text:t}).catch(()=>{})}else copyText(t);
});

function renderHistory(){
  const list=$("#historyList"),h=JSON.parse(localStorage.getItem("textpro_history")||"[]");
  if(!h.length){list.innerHTML='<div class="about-box"><b>Aucun texte enregistré</b><p>Ton historique apparaîtra ici après une transformation ou un nettoyage.</p></div>';return}
  list.innerHTML=h.map((x,i)=>`<article class="history-item"><div class="history-meta">${x.time}</div><p>${escapeHTML(x.text)}</p><div class="history-actions"><button data-hcopy="${i}">📋 Copier</button><button data-huse="${i}">Utiliser</button><button data-hdel="${i}">🗑️</button></div></article>`).join("");
  $$("[data-hcopy]").forEach(b=>b.onclick=()=>copyText(h[+b.dataset.hcopy].text));
  $$("[data-huse]").forEach(b=>b.onclick=()=>{input.value=h[+b.dataset.huse].text;saveDraft();updateStats();go("home")});
  $$("[data-hdel]").forEach(b=>b.onclick=()=>{h.splice(+b.dataset.hdel,1);localStorage.setItem("textpro_history",JSON.stringify(h));renderHistory()});
}
function escapeHTML(s){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
$("#clearHistory").onclick=()=>{if(confirm("Effacer tout l'historique ?")){localStorage.removeItem("textpro_history");renderHistory();toast("Historique effacé.")}};
$("#year").textContent=new Date().getFullYear();

let deferredInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();

  deferredInstallPrompt = e;

  const btn = $("#installAppBtn");
  if (btn) {
    btn.style.display = "inline-flex";
  }
});

$("#installAppBtn")?.addEventListener("click", async () => {

  if (!deferredInstallPrompt) {
    toast("L'installation n'est pas disponible pour le moment.");
    return;
  }

  deferredInstallPrompt.prompt();

  const result = await deferredInstallPrompt.userChoice;

  if (result.outcome === "accepted") {
    toast("TEXT PRO est en cours d'installation ✓");
  }

  deferredInstallPrompt = null;
  $("#installAppBtn").style.display = "none";
});

window.addEventListener("appinstalled", () => {
  toast("TEXT PRO a été installé ✓");
});
