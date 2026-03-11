import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAnalytics, isSupported as analyticsSupported } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
import {
  getDatabase,
  ref,
  set,
  onValue,
  push,
  onDisconnect,
  runTransaction
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAKE72YYkwRVGdGDW2I2dggbk8XERvxS5o",
  authDomain: "xproj-4370e.firebaseapp.com",
  databaseURL: "https://xproj-4370e-default-rtdb.firebaseio.com",
  projectId: "xproj-4370e",
  storageBucket: "xproj-4370e.firebasestorage.app",
  messagingSenderId: "290647526319",
  appId: "1:290647526319:web:0b57bed007542b03d97d5a",
  measurementId: "G-GCD505CNF6"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

analyticsSupported().then((supported) => {
  if (supported) {
    getAnalytics(app);
  }
}).catch(() => {
  // Ignore analytics failures on unsupported environments.
});

const onlineNowEl = document.getElementById("online-now");
const totalVisitsEl = document.getElementById("total-visits");
const gamesOpenedEl = document.getElementById("games-opened");
const timeOnlineEl = document.getElementById("time-online");

const presenceRef = ref(db, "presence");
const mySessionRef = push(presenceRef);
let visitCounted = false;
let gameCountedThisOpen = false;
const sessionStart = Date.now();

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map(v => String(v).padStart(2, "0")).join(":");
}

function incrementOnce(path) {
  return runTransaction(ref(db, path), (current) => (current || 0) + 1);
}

function startSessionTimer() {
  if (!timeOnlineEl) return;
  timeOnlineEl.textContent = "00:00:00";
  setInterval(() => {
    timeOnlineEl.textContent = formatDuration(Date.now() - sessionStart);
  }, 1000);
}

onValue(ref(db, "presence"), (snapshot) => {
  const data = snapshot.val();
  const count = data ? Object.keys(data).length : 0;
  if (onlineNowEl) {
    onlineNowEl.textContent = count;
  }
});

onValue(ref(db, "stats/totalVisits"), (snapshot) => {
  if (totalVisitsEl) {
    totalVisitsEl.textContent = snapshot.val() || 0;
  }
});

onValue(ref(db, "stats/gamesOpened"), (snapshot) => {
  if (gamesOpenedEl) {
    gamesOpenedEl.textContent = snapshot.val() || 0;
  }
});

const connectedRef = ref(db, ".info/connected");
onValue(connectedRef, async (snapshot) => {
  if (snapshot.val() === true) {
    await onDisconnect(mySessionRef).remove();
    await set(mySessionRef, {
      connectedAt: Date.now(),
      page: window.location.pathname || "/"
    });

    if (!visitCounted) {
      visitCounted = true;
      incrementOnce("stats/totalVisits");
    }
  }
});

window.trackGameOpen = function () {
  if (!gameCountedThisOpen) {
    gameCountedThisOpen = true;
    incrementOnce("stats/gamesOpened");
    setTimeout(() => {
      gameCountedThisOpen = false;
    }, 1500);
  }
};

startSessionTimer();
