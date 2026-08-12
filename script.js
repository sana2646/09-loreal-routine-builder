/* DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const generateBtn = document.getElementById("generateRoutine");
const selectedProductsList = document.getElementById("selectedProductsList");

/* Cloudflare Worker URL */
const WORKER_URL = "https://sparkling-tree-9291loreal-chatbot.ss7671.workers.dev";

/* Store selected products and conversation history */
let selectedProducts = [];
let conversationHistory = [];
let allProducts = [];

/* Load selected products from localStorage on page load */
function loadFromStorage() {
  const saved = localStorage.getItem("selectedProducts");
  if (saved) {
    selectedProducts = JSON.parse(saved);
    updateSelectedProductsList();
  }
}

/* Save selected products to localStorage */
function saveToStorage() {
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

/* Show initial placeholder */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category or search for products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  if (allProducts.length > 0) return allProducts;
  const response = await fetch("products.json");
  const data = await response.json();
  allProducts = data.products;
  return allProducts;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  if (products.length === 0) {
    productsContainer.innerHTML = '<div class="placeholder-message">No products found</div>';
    return;
  }

  productsContainer.innerHTML = products.map((product) => {
    const isSelected = selectedProducts.some(p => p.id === product.id);
    return `
      <div class="product-card ${isSelected ? 'selected' : ''}" data-id="${product.id}">
        <img src="${product.image}" alt="${product.name}">
        <div class="product-info">
          <h3>${product.name}</h3>
          <p class="brand-name">${product.brand}</p>
          <div class="product-description">${product.description}</div>
          <button class="toggle-desc-btn">Show Details</button>
        </div>
      </div>
    `;
  }).join("");

  /* Add click handlers for product selection */
  document.querySelectorAll(".product-card").forEach(card => {
    card.addEventListener("click", (e) => {
      if (e.target.classList.contains("toggle-desc-btn")) return;
      const productId = parseInt(card.dataset.id);
      toggleProduct(productId, products);
    });
  });

  /* Add click handlers for description toggle */
  document.querySelectorAll(".toggle-desc-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const desc = btn.previousElementSibling;
      const isVisible = desc.style.display === "block";
      desc.style.display = isVisible ? "none" : "block";
      btn.textContent = isVisible ? "Show Details" : "Hide Details";
    });
  });
}

/* Filter products based on search and category */
async function filterProducts() {
  const products = await loadProducts();
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const category = categoryFilter.value;

  let filtered = products;

  if (category) {
    filtered = filtered.filter(p => p.category === category);
  }

  if (searchTerm) {
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(searchTerm) ||
      p.brand.toLowerCase().includes(searchTerm)
    );
  }

  if (!category && !searchTerm) {
    productsContainer.innerHTML = '<div class="placeholder-message">Select a category or search for products</div>';
    return;
  }

  displayProducts(filtered);
}

/* Toggle product selection */
function toggleProduct(productId, products) {
  const product = products.find(p => p.id === productId);
  const index = selectedProducts.findIndex(p => p.id === productId);

  if (index === -1) {
    selectedProducts.push(product);
  } else {
    selectedProducts.splice(index, 1);
  }

  saveToStorage();
  updateSelectedProductsList();

  const card = document.querySelector(`[data-id="${productId}"]`);
  if (card) card.classList.toggle("selected");
}

/* Update the selected products list display */
function updateSelectedProductsList() {
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = '<p class="no-selection">No products selected yet</p>';
    return;
  }

  selectedProductsList.innerHTML = selectedProducts.map(product => `
    <div class="selected-tag">
      <span>${product.name}</span>
      <button class="remove-btn" data-id="${product.id}">×</button>
    </div>
  `).join("");

  selectedProductsList.innerHTML += `
    <button class="clear-all-btn" id="clearAll">Clear All</button>
  `;

  document.querySelectorAll(".remove-btn").forEach(btn => {
