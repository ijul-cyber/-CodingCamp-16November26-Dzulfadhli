/* ==========================================================================
   Life Dashboard — JavaScript
   1 file JS sesuai aturan folder.
   Vanilla JavaScript — tanpa framework.
   Penyimpanan: Local Storage API.
   ========================================================================== */

(function () {
  "use strict";

  /* ======================================================================
     BAGIAN 1: STATE & STORAGE HELPERS
     ====================================================================== */

  const STORAGE_KEYS = {
    todos: "dashboard_todos",
    links: "dashboard_links",
    name: "dashboard_name",
    theme: "dashboard_theme",
    pomodoro: "dashboard_pomodoro",
  };

  /** Membaca data dari localStorage dengan aman (parsing JSON). */
  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error("Gagal membaca " + key, e);
      return fallback;
    }
  }

  /** Menyimpan data ke localStorage. */
  function saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("Gagal menyimpan " + key, e);
    }
  }

  /* ======================================================================
     BAGIAN 2: CLOCK & GREETING (MVP: Sapaan)
     ====================================================================== */

  const greetingEl = document.getElementById("greetingText");
  const clockEl = document.getElementById("clock");
  const dateEl = document.getElementById("dateText");
  const nameInput = document.getElementById("nameInput");

  // Nama hari & bulan dalam Bahasa Indonesia
  const hariList = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const bulanList = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  let customName = loadJSON(STORAGE_KEYS.name, "");

  /** Menentukan sapaan berdasarkan jam. */
  function getGreeting(hour) {
    if (hour >= 5 && hour < 11) return "Selamat pagi";
    if (hour >= 11 && hour < 15) return "Selamat siang";
    if (hour >= 15 && hour < 18) return "Selamat sore";
    return "Selamat malam";
  }

  /** Memperbarui tampilan jam, tanggal, dan sapaan setiap detik. */
  function updateClock() {
    const now = new Date();
    const h = now.getHours();
    const m = String(now.getMinutes()).padStart(2, "0");
    const s = String(now.getSeconds()).padStart(2, "0");
    const hh = String(h).padStart(2, "0");

    clockEl.textContent = hh + ":" + m + ":" + s;

    // Format tanggal: "Sabtu, 16 November 2026"
    const tanggal = now.getDate();
    const hari = hariList[now.getDay()];
    const bulan = bulanList[now.getMonth()];
    const tahun = now.getFullYear();
    dateEl.textContent = hari + ", " + tanggal + " " + bulan + " " + tahun;

    // Sapaan + nama kustom (fitur opsional)
    const sapaan = getGreeting(h);
    greetingEl.textContent = customName
      ? sapaan + ", " + customName + " 👋"
      : sapaan + " 👋";
  }

  // Simpan nama saat pengguna mengetik
  nameInput.addEventListener("input", function () {
    customName = nameInput.value.trim();
    saveJSON(STORAGE_KEYS.name, customName);
    updateClock();
  });

  // Isi input nama dari storage saat halaman dimuat
  nameInput.value = customName || "";

  // Perbarui jam setiap detik
  updateClock();
  setInterval(updateClock, 1000);

  /* ======================================================================
     BAGIAN 3: DARK / LIGHT MODE (Fitur Opsional)
     ====================================================================== */

  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");

  /** Menerapkan tema. */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
  }

  // Muat preferensi tema tersimpan, atau gunakan preferensi sistem
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
  applyTheme(initialTheme);

  themeToggle.addEventListener("click", function () {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem(STORAGE_KEYS.theme, next);
  });

  /* ======================================================================
     BAGIAN 4: FOCUS TIMER (MVP: Pengatur Waktu Fokus + Fitur Opsional: Ubah Durasi)
     ====================================================================== */

  const timerDisplay = document.getElementById("timerDisplay");
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const resetBtn = document.getElementById("resetBtn");
  const durationInput = document.getElementById("durationInput");
  const setDurationBtn = document.getElementById("setDurationBtn");
  const timerStatus = document.getElementById("timerStatus");
  const presetButtons = document.querySelectorAll(".preset-btn");

  let timerDuration = loadJSON(STORAGE_KEYS.pomodoro, 25); // dalam menit
  let remainingSeconds = timerDuration * 60;
  let timerInterval = null;
  let isRunning = false;

  /** Format detik menjadi "MM:SS". */
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  /** Memperbarui tampilan timer. */
  function renderTimer() {
    timerDisplay.textContent = formatTime(remainingSeconds);
    durationInput.value = timerDuration;
    // Tandai tombol preset yang aktif
    presetButtons.forEach(function (btn) {
      btn.classList.toggle("active", Number(btn.dataset.min) === timerDuration);
    });
  }

  /** Memulai timer. */
  function startTimer() {
    if (isRunning) return;
    isRunning = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    timerStatus.textContent = "Sesi fokus sedang berjalan... fokus!";

    timerInterval = setInterval(function () {
      remainingSeconds--;
      renderTimer();

      if (remainingSeconds <= 0) {
        clearInterval(timerInterval);
        isRunning = false;
        remainingSeconds = timerDuration * 60;
        renderTimer();
        startBtn.disabled = false;
        stopBtn.disabled = true;
        timerStatus.textContent = "✅ Waktu habis! Saatnya istirahat sejenak.";
        // Notifikasi suara pendek (beep) jika didukung browser
        playBeep();
      }
    }, 1000);
  }

  /** Memberhentikan timer (pause). */
  function stopTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    timerStatus.textContent = "Timer dijeda. Tekan Mulai untuk lanjut.";
  }

  /** Mereset timer ke durasi awal. */
  function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    remainingSeconds = timerDuration * 60;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    timerStatus.textContent = "Timer direset. Tekan Mulai untuk memulai sesi fokus.";
    renderTimer();
  }

  /** Mengatur durasi Pomodoro kustom (fitur opsional). */
  function setDuration(minutes) {
    minutes = Math.max(1, Math.min(90, Math.floor(minutes)));
    timerDuration = minutes;
    saveJSON(STORAGE_KEYS.pomodoro, timerDuration);
    resetTimer();
  }

  /** Bunyi "beep" sederhana menggunakan Web Audio API. */
  function playBeep() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = 880;
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      /* Browser mungkin memblokir audio — abaikan */
    }
  }

  startBtn.addEventListener("click", startTimer);
  stopBtn.addEventListener("click", stopTimer);
  resetBtn.addEventListener("click", resetTimer);

  setDurationBtn.addEventListener("click", function () {
    const val = parseInt(durationInput.value, 10);
    if (!isNaN(val) && val > 0) {
      setDuration(val);
    }
  });

  durationInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      setDurationBtn.click();
    }
  });

  presetButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setDuration(Number(btn.dataset.min));
    });
  });

  renderTimer();

  /* ======================================================================
     BAGIAN 5: TO-DO LIST (MVP: Daftar Tugas + Local Storage)
     ====================================================================== */

  const todoForm = document.getElementById("todoForm");
  const todoInput = document.getElementById("todoInput");
  const todoList = document.getElementById("todoList");
  const todoCount = document.getElementById("todoCount");
  const todoHint = document.getElementById("todoHint");
  const clearCompletedBtn = document.getElementById("clearCompletedBtn");

  let todos = loadJSON(STORAGE_KEYS.todos, []);

  /** Menyimpan todos ke localStorage. */
  function saveTodos() {
    saveJSON(STORAGE_KEYS.todos, todos);
  }

  /** Membuat elemen <li> untuk satu tugas. */
  function createTodoElement(todo) {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.completed ? " completed" : "");
    li.dataset.id = todo.id;

    // Checkbox untuk menandai selesai
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "todo-checkbox";
    checkbox.checked = todo.completed;
    checkbox.addEventListener("change", function () {
      toggleTodo(todo.id);
    });

    // Teks tugas
    const span = document.createElement("span");
    span.className = "todo-text";
    span.textContent = todo.text;
    span.addEventListener("dblclick", function () {
      editTodo(li, todo);
    });

    // Tombol aksi (edit & hapus)
    const actions = document.createElement("div");
    actions.className = "todo-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "icon-btn edit-btn";
    editBtn.innerHTML = "✏️";
    editBtn.title = "Edit tugas";
    editBtn.addEventListener("click", function () {
      editTodo(li, todo);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "icon-btn delete-btn";
    deleteBtn.innerHTML = "🗑️";
    deleteBtn.title = "Hapus tugas";
    deleteBtn.addEventListener("click", function () {
      deleteTodo(todo.id);
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(actions);

    return li;
  }

  /** Merender seluruh daftar tugas. */
  function renderTodos() {
    todoList.innerHTML = "";
    todos.forEach(function (todo) {
      todoList.appendChild(createTodoElement(todo));
    });
    updateCount();
  }

  /** Memperbarui hitungan tugas. */
  function updateCount() {
    const total = todos.length;
    const done = todos.filter(function (t) {
      return t.completed;
    }).length;
    todoCount.textContent = total === 0
      ? "Belum ada tugas"
      : done + "/" + total + " selesai";
  }

  /** Membuat ID unik sederhana. */
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /** Menambah tugas baru (dengan cegah duplikat). */
  function addTodo(text) {
    text = text.trim();
    if (!text) return;

    // Cegah tugas duplikat (case-insensitive, abaikan spasi berlebih)
    const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();
    const isDuplicate = todos.some(function (t) {
      return t.text.toLowerCase().replace(/\s+/g, " ").trim() === normalized;
    });

    if (isDuplicate) {
      showHint("Tugas ini sudah ada!");
      return;
    }

    todos.push({
      id: generateId(),
      text: text,
      completed: false,
      createdAt: Date.now(),
    });
    saveTodos();
    renderTodos();
    showHint("");
  }

  /** Menampilkan pesan hint singkat. */
  function showHint(message) {
    todoHint.textContent = message;
    if (message) {
      setTimeout(function () {
        if (todoHint.textContent === message) {
          todoHint.textContent = "";
        }
      }, 2500);
    }
  }

  /** Mengubah status selesai tugas. */
  function toggleTodo(id) {
    const todo = todos.find(function (t) {
      return t.id === id;
    });
    if (todo) {
      todo.completed = !todo.completed;
      saveTodos();
      renderTodos();
    }
  }

  /** Mengganti tugas ke mode edit. */
  function editTodo(li, todo) {
    const span = li.querySelector(".todo-text");
    const input = document.createElement("input");
    input.type = "text";
    input.className = "todo-edit-input";
    input.value = todo.text;
    input.maxLength = 120;

    li.replaceChild(input, span);
    input.focus();
    input.select();

    function saveEdit() {
      const newText = input.value.trim();
      if (newText && newText !== todo.text) {
        // Cegah duplikat saat edit
        const normalized = newText.toLowerCase().replace(/\s+/g, " ").trim();
        const isDuplicate = todos.some(function (t) {
          return t.id !== todo.id && t.text.toLowerCase().replace(/\s+/g, " ").trim() === normalized;
        });
        if (isDuplicate) {
          showHint("Tugas ini sudah ada!");
          renderTodos();
          return;
        }
        todo.text = newText;
        saveTodos();
      }
      renderTodos();
    }

    input.addEventListener("blur", saveEdit);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        input.blur();
      } else if (e.key === "Escape") {
        renderTodos();
      }
    });
  }

  /** Menghapus tugas. */
  function deleteTodo(id) {
    todos = todos.filter(function (t) {
      return t.id !== id;
    });
    saveTodos();
    renderTodos();
  }

  // Event listener form
  todoForm.addEventListener("submit", function (e) {
    e.preventDefault();
    addTodo(todoInput.value);
    todoInput.value = "";
    todoInput.focus();
  });

  // Hapus semua tugas yang selesai
  clearCompletedBtn.addEventListener("click", function () {
    todos = todos.filter(function (t) {
      return !t.completed;
    });
    saveTodos();
    renderTodos();
  });

  renderTodos();

  /* ======================================================================
     BAGIAN 6: QUICK LINKS (MVP: Tautan Cepat + Local Storage)
     ====================================================================== */

  const linkForm = document.getElementById("linkForm");
  const linkNameInput = document.getElementById("linkName");
  const linkUrlInput = document.getElementById("linkUrl");
  const linkGrid = document.getElementById("linkGrid");

  let links = loadJSON(STORAGE_KEYS.links, []);

  // Tautan default jika kosong (pengalaman pertama)
  if (links.length === 0) {
    links = [
      { id: "default1", name: "Google", url: "https://www.google.com" },
      { id: "default2", name: "YouTube", url: "https://www.youtube.com" },
      { id: "default3", name: "GitHub", url: "https://github.com" },
      { id: "default4", name: "RevoU", url: "https://revou.co" },
    ];
    saveJSON(STORAGE_KEYS.links, links);
  }

  /** Menyimpan links ke localStorage. */
  function saveLinks() {
    saveJSON(STORAGE_KEYS.links, links);
  }

  /** Memastikan URL memiliki protokol (https). */
  function normalizeUrl(url) {
    url = url.trim();
    if (!url) return "";
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }
    return url;
  }

  /** Mendapatkan favicon dari URL. */
  function getFaviconUrl(url) {
    try {
      const domain = new URL(url).hostname;
      return "https://www.google.com/s2/favicons?domain=" + domain + "&sz=64";
    } catch (e) {
      return "";
    }
  }

  /** Membuat elemen tile untuk satu tautan. */
  function createLinkElement(link) {
    const tile = document.createElement("a");
    tile.className = "link-tile";
    tile.href = link.url;
    tile.target = "_blank";
    tile.rel = "noopener noreferrer";
    tile.title = link.url;

    const favicon = document.createElement("img");
    favicon.className = "link-favicon";
    favicon.src = getFaviconUrl(link.url);
    favicon.alt = "";
    favicon.onerror = function () {
      favicon.style.display = "none";
    };

    const name = document.createElement("span");
    name.className = "link-name";
    name.textContent = link.name;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "link-delete";
    deleteBtn.innerHTML = "×";
    deleteBtn.title = "Hapus tautan";
    deleteBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      deleteLink(link.id);
    });

    tile.appendChild(favicon);
    tile.appendChild(name);
    tile.appendChild(deleteBtn);

    return tile;
  }

  /** Merender seluruh tautan cepat. */
  function renderLinks() {
    linkGrid.innerHTML = "";
    links.forEach(function (link) {
      linkGrid.appendChild(createLinkElement(link));
    });
  }

  /** Menambah tautan baru. */
  function addLink(name, url) {
    name = name.trim();
    url = normalizeUrl(url);

    if (!name || !url) return;

    // Validasi URL
    try {
      new URL(url);
    } catch (e) {
      return;
    }

    links.push({
      id: generateId(),
      name: name,
      url: url,
    });
    saveLinks();
    renderLinks();
  }

  /** Menghapus tautan. */
  function deleteLink(id) {
    links = links.filter(function (l) {
      return l.id !== id;
    });
    saveLinks();
    renderLinks();
  }

  // Event listener form
  linkForm.addEventListener("submit", function (e) {
    e.preventDefault();
    addLink(linkNameInput.value, linkUrlInput.value);
    linkNameInput.value = "";
    linkUrlInput.value = "";
    linkNameInput.focus();
  });

  renderLinks();

})();
