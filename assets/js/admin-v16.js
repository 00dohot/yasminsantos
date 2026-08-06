
(() => {
  "use strict";
  const cfg = window.YASMIN_APP_CONFIG;
  if (!cfg?.apiBase) return;
  const apiBase = cfg.apiBase.replace(/\/$/, "");
  const sessionKey = cfg.storageKeys?.adminSession || "yasmin_admin_session_v136";
  const $ = selector => document.querySelector(selector);
  const readSession = () => { try { const s=JSON.parse(localStorage.getItem(sessionKey)||"null"); return s?.token && Date.parse(s.expiresAt)>Date.now()?s:null; } catch { return null; } };
  const saveSession = s => localStorage.setItem(sessionKey, JSON.stringify(s));
  const clearSession = () => localStorage.removeItem(sessionKey);
  const show = (selector, text, error=false) => { const el=$(selector); if(!el)return; el.textContent=text; el.classList.add("show"); el.style.borderColor=error?"#ef4444":"#22c55e"; };
  const api = async (path, options={}) => {
    const headers = new Headers(options.headers||{});
    const s = readSession();
    if (s?.token) headers.set("Authorization", `Bearer ${s.token}`);
    if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type","application/json");
    const response = await fetch(`${apiBase}${path}`, {...options, headers});
    const data = await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.erro||"Não foi possível concluir.");
    return data;
  };

  async function bootstrap(event){
    event.preventDefault(); const form=event.currentTarget;
    try{
      const response=await fetch(`${apiBase}/api/admin/bootstrap`,{method:"POST",headers:{"Content-Type":"application/json","X-Admin-Bootstrap":form.elements.segredo.value},body:JSON.stringify({email:form.elements.email.value,senha:form.elements.senha.value})});
      const data=await response.json().catch(()=>({})); if(!response.ok) throw new Error(data.erro||"Não foi possível criar.");
      show("#admin-message","Administrador criado. Agora entre no painel e remova o ADMIN_BOOTSTRAP_SECRET do Cloudflare."); form.reset();
    }catch(error){show("#admin-message",error.message,true)}
  }
  async function login(event){event.preventDefault(); const f=event.currentTarget; try{const d=await api("/api/admin/login",{method:"POST",body:JSON.stringify({email:f.elements.email.value,senha:f.elements.senha.value})});saveSession(d.sessao);render();}catch(e){show("#admin-message",e.message,true)}}
  async function loadContent(){const box=$("#admin-content-list"); try{const d=await api("/api/admin/conteudos"); box.innerHTML=""; for(const item of d.conteudos){const row=document.createElement("article");row.className="admin-item"; const media=item.mime_type?.startsWith("video/")?"<div></div>":"<div></div>"; row.innerHTML=`${media}<div><h3>${item.title||item.section}</h3><p>${item.section} • ${item.visibility} • ordem ${item.sort_order}</p></div><button class="admin-button danger" data-delete="${item.content_id}">Excluir</button>`; box.append(row);} if(!box.children.length)box.innerHTML='<p class="admin-muted">Nenhum conteúdo publicado.</p>'; box.querySelectorAll("[data-delete]").forEach(b=>b.onclick=async()=>{if(!confirm("Excluir esta publicação?"))return;await api(`/api/admin/conteudos/${encodeURIComponent(b.dataset.delete)}`,{method:"DELETE"});loadContent();});}catch(e){box.innerHTML=`<p class="admin-muted">${e.message}</p>`}}
  async function loadUsers(){const box=$("#admin-user-list"); try{const d=await api("/api/admin/usuarios"); box.innerHTML=""; for(const u of d.usuarios){const el=document.createElement("article");el.className="admin-user";el.innerHTML=`<strong>${u.nome||"Assinante"}</strong><small>${u.email||""}</small><small>${u.telefone||""} • ${u.cpf||""}</small><small>${u.produto||""} / ${u.plano||""}</small><button class="admin-button secondary" data-reset="${u.userId}">Redefinir senha</button>`;box.append(el);} if(!box.children.length)box.innerHTML='<p class="admin-muted">Nenhum assinante cadastrado.</p>'; box.querySelectorAll("[data-reset]").forEach(b=>b.onclick=async()=>{const senha=prompt("Digite a nova senha temporária:");if(!senha)return;try{await api(`/api/admin/usuarios/${encodeURIComponent(b.dataset.reset)}/redefinir-senha`,{method:"POST",body:JSON.stringify({novaSenha:senha})});alert("Senha temporária definida.");}catch(e){alert(e.message)}});}catch(e){box.innerHTML=`<p class="admin-muted">${e.message}</p>`}}
  async function publish(event){event.preventDefault(); const f=event.currentTarget; const btn=f.querySelector("button[type=submit]"); btn.disabled=true;btn.textContent="Enviando…"; try{const form=new FormData();form.append("arquivo",f.elements.arquivo.files[0]);const upload=await api("/api/admin/upload",{method:"POST",body:form});await api("/api/admin/conteudos",{method:"POST",body:JSON.stringify({secao:f.elements.secao.value,visibilidade:f.elements.visibilidade.value,titulo:f.elements.titulo.value,legenda:f.elements.legenda.value,ordem:Number(f.elements.ordem.value||0),mediaKey:upload.mediaKey,mimeType:upload.mimeType,publicado:true})});f.reset();show("#admin-dashboard-message","Publicado com sucesso.");loadContent();}catch(e){show("#admin-dashboard-message",e.message,true)}finally{btn.disabled=false;btn.textContent="Fazer upload e publicar"}}
  function render(){const logged=!!readSession();$("#admin-login-panel")?.toggleAttribute("hidden",logged);$("#admin-dashboard")?.toggleAttribute("hidden",!logged);if(logged){loadContent();loadUsers();}}
  document.addEventListener("DOMContentLoaded",()=>{$("#admin-bootstrap-form")?.addEventListener("submit",bootstrap);$("#admin-login-form")?.addEventListener("submit",login);$("#admin-content-form")?.addEventListener("submit",publish);$("#admin-logout")?.addEventListener("click",()=>{clearSession();render()});if(document.body.dataset.adminPage==="dashboard")render();});
})();
