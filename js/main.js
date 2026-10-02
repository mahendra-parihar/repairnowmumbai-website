/* ============================================
   RepairNow Mumbai - Main JS
   Handles: mobile nav, FAQ accordion, forms,
   click-to-call / WhatsApp tracking hooks,
   dynamic year, simple conversion helpers
   ============================================ */

// ---------- CONFIG (edit these once, applies everywhere) ----------
const REPAIRNOW_CONFIG = {
  phone: "+918850705511",
  phoneDisplay: "88507 05511",
  whatsapp: "918850705511",
  email: "repairnowmumbai@gmail.com",
  companyName: "RepairNow Mumbai",

  // ⚠️ From Supabase Dashboard > Project Settings > API
  supabaseUrl: "https://vdqyvrfjzmzeficdgspu.supabase.co/",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkcXl2cmZqem16ZWZpY2Rnc3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NTM4ODIsImV4cCI6MjEwNTMyOTg4Mn0.-wi2nI_yx0gtCu11cHXsQbH3pdMbyQTKVyackel539o" // safe to expose — insert-only via RLS
};

// ---------- Supabase client (plain ES6, no framework needed) ----------
// Loaded via CDN as an ES module — see the <script type="module"> note below.
let supabaseClient = null;

async function initSupabase(){
  if (!REPAIRNOW_CONFIG.supabaseUrl.includes("YOUR-PROJECT")) {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    supabaseClient = createClient(REPAIRNOW_CONFIG.supabaseUrl, REPAIRNOW_CONFIG.supabaseAnonKey);
  }
}

async function saveLeadToDatabase(data){
  if (!supabaseClient) {
    console.warn("[RepairNow] Supabase not configured yet — lead not saved to DB.");
    return { error: "not_configured" };
  }

  const urlParams = new URLSearchParams(window.location.search);

  const { error } = await supabaseClient.from("leads").insert({
    name: data.name,
    phone: data.phone,
    email: data.email || null,
    appliance: data.appliance || data.service || null,
    service_type: data.service_type || null,
    area: data.area || null,
    issue: data.issue || null,
    source_page: window.location.pathname,
    gclid: urlParams.get("gclid") || null
  });

  if (error) console.error("[RepairNow] Supabase insert failed:", error);
  return { error };
}



// ---------- Mobile Nav Toggle ----------
function initMobileNav(){
  const hamburger = document.querySelector(".hamburger");
  const nav = document.querySelector(".main-nav");
  if(!hamburger || !nav) return;

  hamburger.addEventListener("click", () => {
    nav.classList.toggle("open");
    hamburger.classList.toggle("open");
  });

  // Dropdown toggle on mobile (tap to expand instead of hover)
  document.querySelectorAll(".nav-dropdown > a").forEach(function(link){
    link.addEventListener("click", function(e){
      if(window.innerWidth <= 768){
        e.preventDefault();
        this.parentElement.classList.toggle("open");
      }
    });
  });

  // Close nav when a normal link is clicked (mobile)
  document.querySelectorAll(".main-nav a:not(.nav-dropdown > a)").forEach(function(link){
    link.addEventListener("click", function(){
      nav.classList.remove("open");
    });
  });
}

// ---------- Nested Submenu Toggle (Mobile) ----------
function initNestedSubmenus() {
  document.querySelectorAll('.nav-submenu .submenu-toggle').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var item = btn.closest('.nav-submenu');
      var open = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
}

// ---------- FAQ Accordion ----------
function initFAQ(){
  document.querySelectorAll(".faq-item").forEach(function(item){
    const q = item.querySelector(".faq-q");
    if(!q) return;
    q.addEventListener("click", function(){
      const isOpen = item.classList.contains("open");
      // Close all others in same list (optional accordion behavior)
      item.parentElement.querySelectorAll(".faq-item.open").forEach(function(openItem){
        if(openItem !== item) openItem.classList.remove("open");
      });
      item.classList.toggle("open", !isOpen);
    });
  });
}

// ---------- Conversion tracking stub ----------
// Hook Google Ads / GA4 conversion events here.
function trackConversion(label, extra){
  extra = extra || {};
  // Example (uncomment and configure once Google Ads/GA4 is set up):
  // gtag('event', 'conversion', {'send_to': 'AW-XXXXXXXXX/XXXXXXXX', ...extra});
  // gtag('event', label, extra);
  console.log("[RepairNow] Conversion tracked:", label, extra);
}

function initCallTracking(){
  document.querySelectorAll('a[href^="tel:"]').forEach(function(el){
    el.addEventListener("click", function(){
      trackConversion("phone_call_click", { source: el.dataset.source || "unknown" });
    });
  });
}

function initWhatsAppTracking(){
  document.querySelectorAll('a[href*="wa.me"]').forEach(function(el){
    el.addEventListener("click", function(){
      trackConversion("whatsapp_click", { source: el.dataset.source || "unknown" });
    });
  });
}

// ---------- Populate phone/WhatsApp dynamically (single source of truth) ----------
function populateContactLinks(){
  document.querySelectorAll("[data-phone-link]").forEach(function(el){
    el.setAttribute("href", "tel:" + REPAIRNOW_CONFIG.phone);
  });
  document.querySelectorAll("[data-phone-display]").forEach(function(el){
    el.textContent = REPAIRNOW_CONFIG.phoneDisplay;
  });
  document.querySelectorAll("[data-wa-link]").forEach(function(el){
    const msg = el.dataset.waMessage || "Hi, I need help with a home appliance repair in Mumbai.";
    el.setAttribute("href", "https://wa.me/" + REPAIRNOW_CONFIG.whatsapp + "?text=" + encodeURIComponent(msg));
  });
}

// ---------- Quick Quote Form (hero) & Booking Form ----------
function initForms(){
  const forms = document.querySelectorAll("form[data-lead-form]");
  forms.forEach(function(form){
    form.addEventListener("submit", function(e){
      e.preventDefault();

      // Basic validation
      const name = form.querySelector('[name="name"]');
      const phone = form.querySelector('[name="phone"]');
      let valid = true;

      if(name && name.value.trim().length < 2){
        valid = false;
        name.style.borderColor = "#e2453c";
      } else if(name){
        name.style.borderColor = "";
      }

      const phonePattern = /^[6-9]\d{9}$/;
      if(phone && !phonePattern.test(phone.value.trim())){
        valid = false;
        phone.style.borderColor = "#e2453c";
      } else if(phone){
        phone.style.borderColor = "";
      }

      if(!valid){
        alert("Please enter a valid name and a 10-digit mobile number.");
        return;
      }

      // Collect data
      const data = {};
      new FormData(form).forEach(function(value, key){ data[key] = value; });

      // Track conversion
      trackConversion("lead_form_submit", { form_id: form.id || "lead_form", ...data });

      // Save to database (fire-and-forget — don't block the UI on it)
      saveLeadToDatabase(data);
      console.log("[RepairNow] Lead captured:", data);

      // Show thank-you state
      const thankYou = form.parentElement.querySelector(".thankyou-box");
      if(thankYou){
        form.style.display = "none";
        thankYou.style.display = "block";
      } else {
        alert("Thank you! Our technician-dispatch team will call you within 15 minutes.");
        form.reset();
      }

      // Optional: redirect to WhatsApp with pre-filled details after booking
      if(form.dataset.waRedirect === "true"){
        const waMsg = `New Booking Request:%0AName: ${data.name}%0APhone: ${data.phone}%0AAppliance: ${data.appliance || data.service || "N/A"}%0AArea: ${data.area || "N/A"}%0AIssue: ${data.issue || "N/A"}`;
        setTimeout(function(){
          window.open("https://wa.me/" + REPAIRNOW_CONFIG.whatsapp + "?text=" + waMsg, "_blank");
        }, 1200);
      }
    });
  });
}

// ---------- Sticky bar data-source tagging (for tracking which page/section) ----------
function tagCtaSources(){
  const page = document.body.dataset.page || "unknown";
  document.querySelectorAll('a[href^="tel:"], a[href*="wa.me"]').forEach(function(el){
    if(!el.dataset.source){
      el.dataset.source = page + ":" + (el.closest("header") ? "header" : el.closest(".mobile-sticky-bar") ? "sticky_bar" : el.closest(".hero") ? "hero" : el.closest(".wa-float") ? "float" : "body");
    }
  });
}

// ---------- Footer year ----------
function setYear(){
  document.querySelectorAll("[data-year]").forEach(function(el){
    el.textContent = new Date().getFullYear();
  });
}

// ---------- Init all ----------
document.addEventListener("DOMContentLoaded", function(){
  initMobileNav();
  initNestedSubmenus();
  initFAQ();
  populateContactLinks();
  tagCtaSources();
  initCallTracking();
  initWhatsAppTracking();
  initForms();
  setYear();
  initSupabase(); // safe to call even before you've added your keys
});
