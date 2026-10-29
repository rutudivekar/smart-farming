const searchInput = document.getElementById("cropSearch");
const cropCards = document.querySelectorAll(".crop-card");

searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim().toLowerCase();
  cropCards.forEach((card) => {
    const matches = card.textContent.toLowerCase().includes(query);
    card.hidden = !matches;
  });
});

document.querySelectorAll("[data-scroll]").forEach((button) => {
  button.addEventListener("click", () => document.getElementById(button.dataset.scroll).scrollIntoView({ behavior: "smooth" }));
});

const dashboard = document.getElementById("dashboard");
const dashboardTitle = document.getElementById("dashboardTitle");
const dashboardText = document.getElementById("dashboardText");
const dashboardBody = document.getElementById("dashboardBody");
const dashboardEyebrow = document.getElementById("dashboardEyebrow");
const dashboardIcon = document.getElementById("dashboardIcon");
const dashboardDetails = document.getElementById("dashboardDetails");
const dashboardStat = document.getElementById("dashboardStat");
const dashboardAction = document.getElementById("dashboardAction");
const serviceViews = {
  weather: { label: "WEATHER", icon: "☁", title: "Weather outlook", text: "Pune", details: "Updated for planning · verify local conditions before field work", body: "<div class='weather-card'><div class='weather-search'>Pune <span>⌕</span></div><strong>32°C</strong><span>Pune</span><div class='weather-meta'><span>☷ 23% Humidity</span><span>☁ 30.1 km/h Wind speed</span></div></div>", stat: "32°C", action: "Open crop planner", target: "crop-planning" },
  crop: { label: "CROP INFORMATION", icon: "🌱", title: "Crop information", text: "Choose a crop to view its growing guidance.", details: "", body: "<div class='dashboard-list'><div><strong>Wheat</strong><span>Rabi · 110–140 days</span></div><div><strong>Rice</strong><span>Kharif · Varies by variety</span></div><div><strong>Tomato</strong><span>Fertile soil · Region dependent</span></div></div>", stat: "3 crops", action: "Open crop data", target: "crops" },
  expert: { label: "EXPERT SUPPORT", icon: "✦", title: "Talk with an expert", text: "Ask a question and get practical farming guidance.", details: "", body: "<div class='dashboard-question'><input placeholder='Type your farming question'><button class='button' type='button'>Ask expert</button></div><p class='dashboard-note'>Local guidance can help with soil, pests, irrigation, and crop selection.</p>", stat: "Help", action: "Open expert help", target: "expert" },
  market: { label: "MARKET", icon: "▮", title: "Krushi Market", text: "Select a crop and market to compare current available prices.", details: "", body: "<div class='dashboard-list'><div><strong>Wheat</strong><span>Pune Local Market · ₹2,400 / quintal</span></div><div><strong>Rice</strong><span>Pune Local Market · ₹3,100 / quintal</span></div><div><strong>Tomato</strong><span>Pune Local Market · ₹1,800 / quintal</span></div></div>", stat: "Prices", action: "Open market", target: "prices" },
  bulletin: { label: "FARM BULLETIN", icon: "▤", title: "Farm bulletin", text: "Useful seasonal updates for your farm.", details: "", body: "<div class='dashboard-list'><div><strong>Plan irrigation</strong><span>Check local rainfall before watering.</span></div><div><strong>Inspect crops</strong><span>Look for early pest or disease signs.</span></div><div><strong>Verify prices</strong><span>Confirm rates with your local market.</span></div></div>", stat: "3 tips", action: "Read guidance", target: "expert" }
};

document.querySelectorAll("[data-view]").forEach((service) => {
  service.addEventListener("click", () => {
    const view = serviceViews[service.dataset.view];
    document.querySelectorAll("[data-view]").forEach((item) => item.classList.remove("is-selected"));
    service.classList.add("is-selected");
    dashboardEyebrow.textContent = view.label;
    dashboardIcon.textContent = view.icon;
    dashboardTitle.textContent = view.title;
    dashboardText.textContent = view.text;
    dashboardDetails.textContent = view.details;
    dashboardBody.innerHTML = view.body;
    dashboardStat.textContent = view.stat;
    dashboardAction.textContent = view.action;
    dashboard.dataset.active = service.dataset.view;
    dashboardAction.dataset.target = view.target;
    dashboard.hidden = false;
    dashboard.scrollIntoView({ behavior: "smooth", block: "center" });
  });
});

dashboardAction.addEventListener("click", () => document.getElementById(dashboardAction.dataset.target || "crop-planning").scrollIntoView({ behavior: "smooth" }));
document.getElementById("dashboardClose").addEventListener("click", () => { dashboard.hidden = true; });

document.getElementById("planningForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const crop = document.getElementById("planCrop").value;
  const area = document.getElementById("area").value;
  const unit = document.getElementById("areaUnit").value;
  const region = document.getElementById("region").value;
  const plantingDate = document.getElementById("plantingDate").value;
  const response = await fetch("/api/plans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ crop, area, unit, region, planting_date: plantingDate }) });
  const result = await response.json();
  if (!response.ok) {
    document.getElementById("planMessage").textContent = result.error;
    return;
  }
  document.getElementById("planMessage").textContent = "Your crop plan has been saved.";
  const savedPlan = document.getElementById("savedPlan");
  savedPlan.hidden = false;
  savedPlan.textContent = `${crop} plan saved for ${region}.`;
  const planningDate = new Date(`${plantingDate}T00:00:00`);
  planningDate.setDate(planningDate.getDate() + (crop === "Wheat" ? 125 : crop === "Rice" ? 120 : 90));
  const planResult = document.getElementById("planResult");
  planResult.hidden = false;
  planResult.innerHTML = `<strong>${crop} plan summary</strong><span>Expected harvest: around ${planningDate.toLocaleDateString()}</span><span>Field size: ${area} ${unit}</span><span>Next steps: inspect soil, plan irrigation, and monitor pests.</span>`;
  form.reset();
  loadSavedPlans();
});

document.getElementById("marketForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const city = document.getElementById("marketCity").value;
  const crop = document.getElementById("marketProduct").value;
  const quantity = document.getElementById("marketQuantity").value;
  if (!city || !crop || !quantity || Number(quantity) <= 0) {
    document.getElementById("marketMessage").textContent = "Select a city, crop, and a quantity to check prices.";
    document.getElementById("marketMessage").classList.add("error-message");
    return;
  }
  document.getElementById("marketMessage").classList.remove("error-message");
  document.getElementById("marketMessage").textContent = `Showing ${crop} prices for ${city} (${quantity} quantity).`;
});

const loginForm = document.getElementById("login");
const phoneInput = document.getElementById("phone");
const passwordInput = document.getElementById("password");
const loginMessage = document.getElementById("loginMessage");
const accountToggle = document.getElementById("accountToggle");
let registrationMode = false;
const translations = {
  en: { profileLabel: "FARMER PROFILE", languageLabel: "Language", logout: "Logout", servicesEyebrow: "EVERYTHING IN ONE PLACE", servicesTitle: "- Smart Farming For All -", planningEyebrow: "PLAN YOUR NEXT CROP", planningTitle: "Crop Planning", planningDescription: "Enter your details and keep a simple plan for the season." },
  hi: { profileLabel: "किसान प्रोफ़ाइल", languageLabel: "भाषा", logout: "लॉग आउट", servicesEyebrow: "सब कुछ एक जगह", servicesTitle: "- सभी के लिए स्मार्ट खेती -", planningEyebrow: "अपनी अगली फसल की योजना बनाएं", planningTitle: "फसल योजना", planningDescription: "मौसम के लिए अपनी जानकारी दर्ज करें।" },
  mr: { profileLabel: "शेतकरी प्रोफाइल", languageLabel: "भाषा", logout: "बाहेर पडा", servicesEyebrow: "सर्व काही एका ठिकाणी", servicesTitle: "- सर्वांसाठी स्मार्ट शेती -", planningEyebrow: "तुमच्या पुढील पिकाचे नियोजन करा", planningTitle: "पीक नियोजन", planningDescription: "हंगामासाठी तुमची माहिती भरा." }
};

function applyLanguage(language) {
  const selected = translations[language] || translations.en;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = selected[element.dataset.i18n] || translations.en[element.dataset.i18n];
  });
  document.documentElement.lang = language;
  localStorage.setItem("krushiraj-language", language);
}

accountToggle.addEventListener("click", () => {
  registrationMode = !registrationMode;
  accountToggle.textContent = registrationMode ? "Already have an account? Login" : "Don't have an account? Create one";
  loginForm.querySelector("h2").textContent = registrationMode ? "Create your account" : "Welcome back";
  loginForm.querySelector("p").textContent = registrationMode ? "Create an account to save your farm plans." : "Sign in to manage your farming tools.";
  loginForm.querySelector("button[type='submit']").textContent = registrationMode ? "Create account" : "Login";
  loginMessage.textContent = registrationMode ? "Use your phone number and create a password." : "Use your registered phone number and password.";
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const endpoint = registrationMode ? "/api/register" : "/api/login";
  const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: phoneInput.value, password: passwordInput.value }) });
  const result = await response.json();
  if (!response.ok) {
    loginMessage.textContent = result.error;
    loginMessage.classList.add("error-message");
    return;
  }
  if (registrationMode) {
    registrationMode = false;
    accountToggle.textContent = "Don't have an account? Create one";
    loginForm.querySelector("h2").textContent = "Welcome back";
    loginForm.querySelector("p").textContent = "Sign in to manage your farming tools.";
    loginForm.querySelector("button[type='submit']").textContent = "Login";
    loginMessage.textContent = result.message;
    return;
  }
  const portalContent = document.getElementById("portalContent");
  loginMessage.textContent = "Login successful. Opening your farming dashboard...";
  loginMessage.classList.add("success-message");
  loginForm.classList.add("is-logged-in");
  setTimeout(() => {
    document.body.classList.remove("login-page");
    document.body.classList.add("portal-page");
    portalContent.hidden = false;
    document.querySelector(".portal-nav").classList.add("visible");
    document.querySelector(".hero").classList.add("portal-hero");
    document.querySelector(".hero-content").classList.add("compact-hero");
    document.querySelector(".hero").scrollIntoView({ behavior: "smooth" });
    document.getElementById("profilePhone").textContent = `Welcome, ${phoneInput.value}`;
    document.documentElement.lang = "en";
    loadSavedPlans();
  }, 650);
});

async function loadSavedPlans() {
  const response = await fetch("/api/plans");
  if (response.ok) {
    const result = await response.json();
    document.getElementById("savedPlanCount").textContent = result.plans.length;
  }
}

document.getElementById("languageSelect").addEventListener("change", (event) => {
  const language = event.target.value;
  applyLanguage(language);
});

document.getElementById("logoutButton").addEventListener("click", async () => {
  await fetch("/api/logout", { method: "POST" });
  window.location.reload();
});

applyLanguage(localStorage.getItem("krushiraj-language") || "en");

document.getElementById("expertForm").addEventListener("submit", (event) => {
  event.preventDefault();
  event.currentTarget.querySelector("input").value = "";
  event.currentTarget.querySelector("input").placeholder = "Question received - we will help soon";
});
