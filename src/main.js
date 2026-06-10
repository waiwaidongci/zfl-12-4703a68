import "./styles.css";

const STORAGE_KEY = "zfl-12-trip";
const PACKING_CATEGORIES = ["证件", "衣物", "电子设备", "药品", "其他"];
let state = loadState();
const app = document.querySelector("#app");

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);
  const today = new Date().toISOString().slice(0, 10);
  return {
    tripName: "杭州周末旅行",
    activeDate: today,
    activeTab: "plan",
    activeCategory: "全部",
    items: [
      {
        id: crypto.randomUUID(),
        date: today,
        time: "10:00",
        place: "西湖",
        title: "湖边散步和拍照",
        budget: 80,
        note: "提前看天气，带轻便外套"
      }
    ],
    packingItems: [
      { id: crypto.randomUUID(), name: "身份证", category: "证件", packed: false },
      { id: crypto.randomUUID(), name: "换洗衣物", category: "衣物", packed: true },
      { id: crypto.randomUUID(), name: "充电宝", category: "电子设备", packed: false }
    ]
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  const dates = uniqueDates();
  const activeItems = state.items
    .filter((item) => item.date === state.activeDate)
    .sort((a, b) => a.time.localeCompare(b.time));
  const totalBudget = sumBudget(state.items);
  const activeBudget = sumBudget(activeItems);
  const packingStats = getPackingStats();
  const filteredPackingItems = getFilteredPackingItems();

  app.innerHTML = `
    <main class="shell">
      <section class="hero">
        <p>本地旅行行程板</p>
        <h1>${escapeHtml(state.tripName)}</h1>
        <label class="trip-name">旅行名称<input id="trip-name" value="${escapeHtml(state.tripName)}"></label>
        <div class="stats">
          <div class="stat"><span>行程条目</span><strong>${state.items.length}</strong></div>
          <div class="stat"><span>总预算</span><strong>¥${totalBudget}</strong></div>
          <div class="stat"><span>当天预算</span><strong>¥${activeBudget}</strong></div>
        </div>
      </section>

      <div class="main-tabs">
        <button class="main-tab ${state.activeTab === "plan" ? "active" : ""}" data-main-tab="plan">行程安排</button>
        <button class="main-tab ${state.activeTab === "packing" ? "active" : ""}" data-main-tab="packing">打包清单</button>
      </div>

      ${state.activeTab === "plan" ? renderPlanSection(dates, activeItems) : renderPackingSection(packingStats, filteredPackingItems)}
    </main>
  `;

  bindEvents();
}

function renderPlanSection(dates, activeItems) {
  return `
      <section class="layout">
        <aside class="panel">
          <h2>新增行程</h2>
          <form class="form" id="plan-form">
            <label>日期<input name="date" type="date" value="${state.activeDate}" required></label>
            <label>时间<input name="time" type="time" required></label>
            <label>地点<input name="place" required placeholder="例如美术馆"></label>
            <label>事项<input name="title" required placeholder="例如看展"></label>
            <label>预算<input name="budget" type="number" min="0" step="1" value="0"></label>
            <label>备注<textarea name="note" placeholder="交通、门票或注意事项"></textarea></label>
            <button class="primary" type="submit">加入行程</button>
          </form>
        </aside>

        <section>
          <div class="tabs">
            ${dates.map((date) => `<button class="tab ${date === state.activeDate ? "active" : ""}" data-date="${date}">${date}</button>`).join("")}
          </div>
          <div class="timeline">
            ${activeItems.length ? activeItems.map(renderItem).join("") : `<div class="empty">这一天还没有行程</div>`}
          </div>
        </section>
      </section>
  `;
}

function renderPackingSection(stats, filteredItems) {
  const categories = ["全部", ...PACKING_CATEGORIES];
  return `
      <section class="layout">
        <aside class="panel">
          <h2>新增物品</h2>
          <form class="form" id="packing-form">
            <label>物品名称<input name="name" required placeholder="例如：墨镜"></label>
            <label>分类
              <select name="category" required>
                ${PACKING_CATEGORIES.map((cat) => `<option value="${cat}">${cat}</option>`).join("")}
              </select>
            </label>
            <button class="primary" type="submit">加入清单</button>
          </form>
          <div class="packing-summary">
            <div class="stat"><span>已准备</span><strong>${stats.packed}</strong></div>
            <div class="stat"><span>总计</span><strong>${stats.total}</strong></div>
          </div>
        </aside>

        <section>
          <div class="tabs">
            ${categories.map((cat) => `<button class="tab ${state.activeCategory === cat ? "active" : ""}" data-category="${cat}">${cat}</button>`).join("")}
          </div>
          <div class="packing-list">
            ${filteredItems.length ? filteredItems.map(renderPackingItem).join("") : `<div class="empty">暂无物品，添加一个吧</div>`}
          </div>
        </section>
      </section>
  `;
}

function renderItem(item) {
  return `
    <article class="item">
      <div class="item-top">
        <div>
          <span class="time">${item.time}</span>
          <h3>${escapeHtml(item.title)}</h3>
        </div>
        <button class="ghost" data-delete="${item.id}">删除</button>
      </div>
      <p>${escapeHtml(item.note || "暂无备注")}</p>
      <div class="chips">
        <span class="chip">${escapeHtml(item.place)}</span>
        <span class="chip">预算 ¥${Number(item.budget || 0)}</span>
      </div>
    </article>
  `;
}

function renderPackingItem(item) {
  return `
    <article class="packing-item ${item.packed ? "packed" : ""}">
      <label class="packing-check">
        <input type="checkbox" data-toggle="${item.id}" ${item.packed ? "checked" : ""}>
        <span class="checkmark"></span>
      </label>
      <div class="packing-info">
        <h3>${escapeHtml(item.name)}</h3>
        <span class="chip">${item.category}</span>
      </div>
      <button class="ghost" data-delete-packing="${item.id}">删除</button>
    </article>
  `;
}

function getPackingStats() {
  const total = state.packingItems.length;
  const packed = state.packingItems.filter((item) => item.packed).length;
  return { total, packed };
}

function getFilteredPackingItems() {
  if (state.activeCategory === "全部") {
    return state.packingItems.slice().sort((a, b) => {
      if (a.packed !== b.packed) return a.packed ? 1 : -1;
      return a.name.localeCompare(b.name, "zh");
    });
  }
  return state.packingItems
    .filter((item) => item.category === state.activeCategory)
    .sort((a, b) => {
      if (a.packed !== b.packed) return a.packed ? 1 : -1;
      return a.name.localeCompare(b.name, "zh");
    });
}

function bindEvents() {
  document.querySelector("#trip-name").addEventListener("input", (event) => {
    state.tripName = event.target.value || "未命名旅行";
    saveState();
  });

  document.querySelectorAll("[data-main-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.mainTab;
      saveState();
      render();
    });
  });

  if (state.activeTab === "plan") {
    bindPlanEvents();
  } else {
    bindPackingEvents();
  }
}

function bindPlanEvents() {
  document.querySelector("#plan-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    state.activeDate = data.date;
    state.items.push({
      id: crypto.randomUUID(),
      date: data.date,
      time: data.time,
      place: data.place.trim(),
      title: data.title.trim(),
      budget: Number(data.budget || 0),
      note: data.note.trim()
    });
    saveState();
    render();
  });

  document.querySelectorAll("[data-date]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeDate = button.dataset.date;
      saveState();
      render();
    });
  });

  document.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      state.items = state.items.filter((item) => item.id !== button.dataset.delete);
      if (!state.items.some((item) => item.date === state.activeDate) && state.items[0]) {
        state.activeDate = state.items[0].date;
      }
      saveState();
      render();
    });
  });
}

function bindPackingEvents() {
  document.querySelector("#packing-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    state.packingItems.push({
      id: crypto.randomUUID(),
      name: data.name.trim(),
      category: data.category,
      packed: false
    });
    saveState();
    render();
  });

  document.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeCategory = button.dataset.category;
      saveState();
      render();
    });
  });

  document.querySelectorAll("[data-toggle]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const item = state.packingItems.find((i) => i.id === checkbox.dataset.toggle);
      if (item) {
        item.packed = checkbox.checked;
        saveState();
        render();
      }
    });
  });

  document.querySelectorAll("[data-delete-packing]").forEach((button) => {
    button.addEventListener("click", () => {
      state.packingItems = state.packingItems.filter((item) => item.id !== button.dataset.deletePacking);
      saveState();
      render();
    });
  });
}

function uniqueDates() {
  const dates = [...new Set([state.activeDate, ...state.items.map((item) => item.date)])].filter(Boolean);
  return dates.sort();
}

function sumBudget(items) {
  return items.reduce((total, item) => total + Number(item.budget || 0), 0);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

render();
