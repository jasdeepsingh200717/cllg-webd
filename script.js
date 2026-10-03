/* =====================================================
   PulseFit – script.js
   Sections: 1 Data · 2 Helpers · 3 Navigation · 4 Home
             5 Workouts · 6 Diet · 7 BMI · 8 Tracker
   ===================================================== */


/* ---------- 1. DATA (edit your plan here) ---------- */

const workoutPlan = {
  Monday:    { title: "Chest + Triceps 💪", exercises: [["Push-ups", "3 × 15"], ["Dumbbell press", "3 × 12"], ["Incline press", "3 × 10"], ["Tricep dips", "3 × 12"]] },
  Tuesday:   { title: "Back + Biceps 🏋️",   exercises: [["Pull-ups", "3 × 8"], ["Dumbbell rows", "3 × 12"], ["Bicep curls", "3 × 12"], ["Hammer curls", "3 × 10"]] },
  Wednesday: { title: "Legs 🦵",            exercises: [["Squats", "4 × 12"], ["Lunges", "3 × 12"], ["Glute bridges", "3 × 15"], ["Calf raises", "3 × 20"]] },
  Thursday:  { title: "Shoulders 🔥",       exercises: [["Shoulder press", "3 × 10"], ["Lateral raises", "3 × 15"], ["Front raises", "3 × 12"], ["Shrugs", "3 × 15"]] },
  Friday:    { title: "Full Body ⚡",        exercises: [["Burpees", "3 × 10"], ["Squats", "3 × 15"], ["Push-ups", "3 × 15"], ["Plank", "3 × 40 sec"]] },
  Saturday:  { title: "Cardio 🫀",          exercises: [["Brisk walk / jog", "20 min"], ["Skipping", "5 × 1 min"], ["Stretching", "10 min"]] },
  Sunday:    { title: "Rest 😴",            exercises: [["Light stretching", "10 min"], ["Drink plenty of water", "all day"]] }
};

const meals = [
  { name: "Breakfast 🥣", food: "Oats + Banana + Milk",   kcal: 350, protein: 14 },
  { name: "Lunch 🍛",     food: "Roti + Dal + Sabzi",     kcal: 550, protein: 20 },
  { name: "Snack 🍎",     food: "Fruits + Nuts",          kcal: 250, protein: 8  },
  { name: "Dinner 🌙",    food: "Paneer + Roti",          kcal: 600, protein: 30 }
];


/* ---------- 2. HELPERS ---------- */

// Short way to find an element by id
const $ = id => document.getElementById(id);

// Save / load data in the browser (so it stays after refresh)
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

// Small pop-up message at the bottom
function toast(message) {
  const t = $("toast");
  t.textContent = message;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2000);
}

// Today's name, e.g. "Monday"
const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });

// A key that changes every day, so ticks reset each morning
const todayKey = new Date().toISOString().slice(0, 10);


/* ---------- 3. NAVIGATION ---------- */

const pageNames = ["home", "workouts", "diet", "bmi", "tracker"];

function showPage(name) {
  // hide every page, then show the one we want
  pageNames.forEach(p => $(p).classList.add("hidden"));
  $(name).classList.remove("hidden");

  // highlight the active nav button
  document.querySelectorAll(".nav-links button").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === name);
  });

  // refresh page content when opened
  if (name === "home") renderSummary();
  if (name === "workouts") renderWorkout();
  if (name === "diet") renderDiet();
  if (name === "tracker") renderTracker();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Any element with data-page becomes a navigation button
document.querySelectorAll("[data-page]").forEach(btn => {
  btn.addEventListener("click", () => showPage(btn.dataset.page));
});


/* ---------- 4. HOME SUMMARY ---------- */

function renderSummary() {
  const done = load("done-" + todayKey, []).length;
  const total = workoutPlan[todayName].exercises.length;
  const eaten = load("eaten-" + todayKey, []);
  const kcal = eaten.reduce((sum, i) => sum + meals[i].kcal, 0);
  const weights = load("track", []);
  const last = weights.length ? weights[weights.length - 1].weight + " kg" : "No entries yet";

  $("summary").innerHTML = `
    <div class="card"><span class="muted">Today · ${todayName}</span><strong>${workoutPlan[todayName].title}</strong>${done}/${total} exercises done</div>
    <div class="card"><span class="muted">Calories eaten</span><strong>${kcal} kcal</strong>${eaten.length}/${meals.length} meals</div>
    <div class="card"><span class="muted">Latest weight</span><strong>${last}</strong>${weights.length} entries</div>
  `;
}


/* ---------- 5. WORKOUTS ---------- */

let selectedDay = todayName; // start on today's workout

function renderWorkout() {
  // day tabs
  $("dayTabs").innerHTML = Object.keys(workoutPlan).map(day =>
    `<button class="${day === selectedDay ? "active" : ""}" data-day="${day}">${day.slice(0, 3)}</button>`
  ).join("");

  // exercises for the selected day
  const day = workoutPlan[selectedDay];
  const done = load("done-" + selectedDay + "-" + todayKey, []);

  $("workoutTitle").textContent = `${selectedDay} – ${day.title}`;

  $("exerciseList").innerHTML = day.exercises.map(([name, reps], i) => `
    <label class="exercise ${done.includes(i) ? "done" : ""}">
      <input type="checkbox" data-index="${i}" ${done.includes(i) ? "checked" : ""}>
      ${name} <small>${reps}</small>
    </label>
  `).join("");

  updateWorkoutProgress(done.length, day.exercises.length);
}

function updateWorkoutProgress(done, total) {
  $("workoutBar").style.width = (done / total * 100) + "%";
  $("workoutCount").textContent = `${done} of ${total} exercises done`;
}

// Click a day tab
$("dayTabs").addEventListener("click", e => {
  if (!e.target.dataset.day) return;
  selectedDay = e.target.dataset.day;
  renderWorkout();
});

// Tick an exercise
$("exerciseList").addEventListener("change", e => {
  const key = "done-" + selectedDay + "-" + todayKey;
  let done = load(key, []);
  const i = Number(e.target.dataset.index);

  done = e.target.checked ? [...done, i] : done.filter(n => n !== i);
  save(key, done);
  if (selectedDay === todayName) save("done-" + todayKey, done); // used by Home summary
  renderWorkout();

  if (done.length === workoutPlan[selectedDay].exercises.length) toast("Workout complete! 🎉");
});

// Rest timer
let timerId = null;

$("restBtn").addEventListener("click", () => {
  clearInterval(timerId);
  let seconds = 60;
  $("restBtn").textContent = `Rest: ${seconds}s`;

  timerId = setInterval(() => {
    seconds--;
    $("restBtn").textContent = `Rest: ${seconds}s`;

    if (seconds === 0) {
      clearInterval(timerId);
      $("restBtn").textContent = "Start 60s rest timer";
      toast("Rest over – next set! 💪");
    }
  }, 1000);
});


/* ---------- 6. DIET ---------- */

function renderDiet() {
  const eaten = load("eaten-" + todayKey, []);

  $("mealList").innerHTML = meals.map((m, i) => `
    <div class="card meal ${eaten.includes(i) ? "eaten" : ""}" data-index="${i}">
      <h3>${m.name}</h3>
      <p>${m.food}</p>
      <p class="muted">${m.kcal} kcal · ${m.protein} g protein</p>
      <b>${eaten.includes(i) ? "✅ Eaten" : "Tap to mark eaten"}</b>
    </div>
  `).join("");

  const goal = meals.reduce((sum, m) => sum + m.kcal, 0);
  const kcal = eaten.reduce((sum, i) => sum + meals[i].kcal, 0);
  const protein = eaten.reduce((sum, i) => sum + meals[i].protein, 0);

  $("dietTotal").textContent = `${kcal} / ${goal} kcal · ${protein} g protein`;
  $("dietBar").style.width = (kcal / goal * 100) + "%";
}

$("mealList").addEventListener("click", e => {
  const card = e.target.closest(".meal");
  if (!card) return;

  const key = "eaten-" + todayKey;
  const i = Number(card.dataset.index);
  let eaten = load(key, []);

  eaten = eaten.includes(i) ? eaten.filter(n => n !== i) : [...eaten, i];
  save(key, eaten);
  renderDiet();
});


/* ---------- 7. BMI ---------- */

$("calcBMI").addEventListener("click", () => {
  const h = $("height").value / 100; // cm → metres
  const w = $("weight").value;

  if (!h || !w) {
    toast("Please enter height and weight");
    return;
  }

  const bmi = w / (h * h);

  let status = "Obese";
  if (bmi < 18.5) status = "Underweight";
  else if (bmi < 25) status = "Normal";
  else if (bmi < 30) status = "Overweight";

  $("bmiResult").innerHTML = `BMI: <b>${bmi.toFixed(1)}</b> (${status})`;

  // move the marker: scale runs from BMI 15 to 40
  const percent = Math.min(Math.max((bmi - 15) / 25, 0), 1) * 100;
  $("bmiMarker").style.left = percent + "%";
});


/* ---------- 8. TRACKER ---------- */

$("saveTrack").addEventListener("click", () => {
  const w = $("tWeight").value;
  if (!w) {
    toast("Enter your weight first");
    return;
  }

  const data = load("track", []);
  data.push({ weight: Number(w), date: new Date().toLocaleDateString() });
  save("track", data);

  $("tWeight").value = "";
  toast("Saved ✅");
  renderTracker();
});

// Delete an entry
$("trackList").addEventListener("click", e => {
  if (e.target.dataset.delete === undefined) return;
  const data = load("track", []);
  data.splice(Number(e.target.dataset.delete), 1);
  save("track", data);
  renderTracker();
});

function renderTracker() {
  const data = load("track", []);

  $("trackList").innerHTML = data.length
    ? data.map((d, i) => `
        <div class="track-row">
          <span>${d.date} – <b>${d.weight} kg</b></span>
          <button data-delete="${i}" title="Delete">🗑</button>
        </div>`).reverse().join("")
    : `<p class="muted">No entries yet. Add today's weight above.</p>`;

  drawChart(data);
}

// Simple line chart drawn with SVG
function drawChart(data) {
  if (data.length < 2) {
    $("chart").innerHTML = "";
    return;
  }

  const W = 600, H = 180, pad = 20;
  const weights = data.map(d => d.weight);
  const min = Math.min(...weights), max = Math.max(...weights);
  const range = max - min || 1; // avoid dividing by zero

  const points = data.map((d, i) => {
    const x = pad + i * (W - 2 * pad) / (data.length - 1);
    const y = H - pad - (d.weight - min) / range * (H - 2 * pad);
    return [x, y];
  });

  $("chart").innerHTML = `
    <svg viewBox="0 0 ${W} ${H}">
      <polyline points="${points.map(p => p.join(",")).join(" ")}" fill="none" stroke="#2f7d4f" stroke-width="3"/>
      ${points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#ff6b1a"/>`).join("")}
    </svg>`;
}


/* ---------- START ---------- */
showPage("home");