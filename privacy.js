
(() => {
  const cfg = window.SITE_CONFIG || {};
  document.querySelectorAll("[data-link]").forEach(el => { const u=cfg.links?.[el.dataset.link]; if(u)el.href=u; });

  const plansList = document.getElementById("plansList");
  const toggle = document.getElementById("plansToggle");
  const arrow = document.getElementById("plansArrow");
  toggle.addEventListener("click",()=>{
    const collapsed=plansList.classList.toggle("collapsed");
    arrow.textContent=collapsed?"⌄":"⌃";
  });

  const modal=document.getElementById("paymentModal");
  const paymentLink=document.getElementById("paymentLink");
  const openPayment=url=>{
    if(!url || url.includes("SEU-CHECKOUT")){alert("Configure o checkout no arquivo config.js.");return}
    paymentLink.href=url;modal.classList.add("open");modal.setAttribute("aria-hidden","false");
  };
  document.getElementById("mainOffer").addEventListener("click",()=>openPayment(cfg.subscription?.mainOffer?.checkoutUrl));
  document.querySelectorAll("[data-plan]").forEach(btn=>btn.addEventListener("click",()=>openPayment(cfg.subscription?.plans?.[btn.dataset.plan]?.checkoutUrl)));
  document.querySelectorAll("[data-close-payment]").forEach(x=>x.addEventListener("click",()=>{modal.classList.remove("open");modal.setAttribute("aria-hidden","true")}));

  const post=document.querySelector(".privacy-post");
  const likeBtn=post.querySelector("[data-like]");
  const saveBtn=post.querySelector("[data-save]");
  const count=post.querySelector("[data-like-count]");
  const key="yasmin-privacy-main-v8";
  const read=()=>{try{return JSON.parse(localStorage.getItem(key)||'{"liked":false,"saved":false,"likes":0,"comments":[]}')}catch{return{liked:false,saved:false,likes:0,comments:[]}}};
  const save=d=>localStorage.setItem(key,JSON.stringify(d));
  const comments=document.getElementById("privacyComments");
  const render=()=>{const d=read();likeBtn.textContent=d.liked?"♥":"♡";likeBtn.classList.toggle("active",d.liked);saveBtn.textContent=d.saved?"◆":"◇";saveBtn.classList.toggle("active",d.saved);count.textContent=15200+d.likes;comments.innerHTML=d.comments.map(c=>`<div class="privacy-comment"><strong>${c.handle}</strong> ${c.text}</div>`).join("")};
  likeBtn.addEventListener("click",()=>{const d=read();d.liked=!d.liked;d.likes+=d.liked?1:-1;save(d);render()});
  saveBtn.addEventListener("click",()=>{const d=read();d.saved=!d.saved;save(d);render()});
  post.querySelector("[data-share]").addEventListener("click",async()=>{try{if(navigator.share)await navigator.share({title:document.title,url:location.href});else{await navigator.clipboard.writeText(location.href);alert("Link copiado.")}}catch{}});
  document.getElementById("privacyCommentFocus").addEventListener("click",()=>document.getElementById("privacyHandle").focus());
  document.getElementById("privacyCommentForm").addEventListener("submit",e=>{e.preventDefault();let h=document.getElementById("privacyHandle").value.trim();const t=document.getElementById("privacyComment").value.trim();if(!h.startsWith("@"))h="@"+h;const d=read();d.comments.push({handle:h,text:t});save(d);e.target.reset();render()});
  render();
})();
