
import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api";

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: "▦" },
  { id: "customers", label: "Customers", icon: "♙" },
  { id: "products", label: "Products", icon: "▣" },
  { id: "orders", label: "Orders", icon: "▤" },
  { id: "care", label: "Customer Care", icon: "✉" },
  { id: "analytics", label: "Analytics", icon: "▥" },
];

const pageTitles = {
  dashboard: "Dashboard",
  customers: "Customers",
  products: "Products",
  orders: "Orders",
  care: "Customer Care",
  analytics: "Analytics",
};

const emptyProduct = {
  name: "",
  sku: "",
  description: "",
  category: "",
  price: "0",
  stock_quantity: "0",
  status: "active",
};

function App() {
  const [page, setPage] = useState("dashboard");
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  const [productForm, setProductForm] = useState(emptyProduct);

  async function loadCustomers() {
    const response = await fetch(`${API}/customers`);
    if (!response.ok) throw new Error("Could not load customers.");
    setCustomers(await response.json());
  }

  async function loadProducts() {
    const response = await fetch(`${API}/products`);
    if (!response.ok) throw new Error("Could not load products.");
    setProducts(await response.json());
  }

  useEffect(() => {
    Promise.all([loadCustomers(), loadProducts()])
      .catch(() => {
        setError(
          "Could not load data. Check that the backend is running on port 5000 and MySQL is connected."
        );
      })
      .finally(() => {
        setLoading(false);
        setProductsLoading(false);
      });
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  }

  function handleProductChange(event) {
    const { name, value } = event.target;
    setProductForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await fetch(`${API}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Could not add customer.");
      }

      await loadCustomers();
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
      });
      setSuccess("Customer added successfully!");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleProductSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const payload = {
        ...productForm,
        name: productForm.name.trim(),
        sku: productForm.sku.trim(),
        description: productForm.description.trim(),
        category: productForm.category.trim(),
        price: Number(productForm.price),
        stock_quantity: Number(productForm.stock_quantity),
      };

      const isEditing = editingProductId !== null;
      const response = await fetch(
        isEditing
          ? `${API}/products/${editingProductId}`
          : `${API}/products`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not save product.");
      }

      await loadProducts();
      setProductForm(emptyProduct);
      setEditingProductId(null);
      setSuccess(isEditing ? "Product updated successfully!" : "Product added successfully!");
    } catch (err) {
      setError(err.message || "Could not save product.");
    } finally {
      setSaving(false);
    }
  }

  function startEditing(product) {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name || "",
      sku: product.sku || "",
      description: product.description || "",
      category: product.category || "",
      price: String(product.price ?? 0),
      stock_quantity: String(product.stock_quantity ?? 0),
      status: product.status || "active",
    });
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditing() {
    setEditingProductId(null);
    setProductForm(emptyProduct);
    setError("");
    setSuccess("");
  }

  async function deleteProduct(product) {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API}/products/${product.id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not delete product.");
      }

      await loadProducts();

      if (editingProductId === product.id) {
        cancelEditing();
      }

      setSuccess("Product deleted successfully.");
    } catch (err) {
      setError(err.message || "Could not delete product.");
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    const searchable = [
      customer.first_name,
      customer.last_name,
      customer.email,
      customer.phone,
    ].join(" ").toLowerCase();

    return searchable.includes(search.toLowerCase());
  });

  const filteredProducts = products.filter((product) => {
    const searchable = [
      product.name,
      product.sku,
      product.category,
      product.status,
    ].join(" ").toLowerCase();

    return searchable.includes(search.toLowerCase());
  });

  const money = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);

  function openPage(id) {
    setPage(id);
    setError("");
    setSuccess("");
    setSearch("");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => openPage("dashboard")}
          aria-label="Open dashboard"
        >
          <span className="brand-mark">W</span>
          <span>
            <strong>StorePilot</strong>
            <small>CRM WORKSPACE</small>
          </span>
        </button>

        <div className="nav-heading">WORKSPACE</div>

        <nav className="navigation">
          {navigation.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${page === item.id ? "active" : ""}`}
              onClick={() => openPage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.id === "customers" && (
                <span className="nav-count">{customers.length}</span>
              )}
              {item.id === "products" && (
                <span className="nav-count">{products.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="online-dot" />
          <span>Local development</span>
          <span className="version">v1.0</span>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <div className="eyebrow">STORE MANAGEMENT</div>
            <h1>{pageTitles[page]}</h1>
          </div>

          <div className="topbar-right">
            <span className="connection-badge">
              <span className="online-dot" />
              Local CRM
            </span>
            <div className="user-avatar">A</div>
          </div>
        </header>

        <div className="page-content">
          {error && <div className="alert error" role="alert">{error}</div>}
          {success && <div className="alert success" role="status">{success}</div>}

          {page === "dashboard" && (
            <>
              <section className="welcome-banner">
                <div>
                  <span className="banner-label">YOUR STORE AT A GLANCE</span>
                  <h2>Welcome to your workspace.</h2>
                  <p>Manage customer relationships and prepare your store for growth.</p>
                  <button
                    className="primary-button banner-button"
                    onClick={() => openPage("customers")}
                  >
                    View customers <span>→</span>
                  </button>
                </div>
                <div className="banner-art" aria-hidden="true">
                  <span>✦</span>
                  <div className="art-card">CRM</div>
                </div>
              </section>

              <section className="stats-grid">
                <StatCard icon="♙" tone="blue" label="Total customers"
                  value={loading ? "..." : customers.length}
                  note="Live from your database" />
                <StatCard icon="▣" tone="purple" label="Products"
                  value={productsLoading ? "..." : products.length}
                  note="Live from your database" />
                <StatCard icon="▤" tone="orange" label="Total orders"
                  value="—" note="Order API not added yet" />
                <StatCard icon="₹" tone="green" label="Sales revenue"
                  value="—" note="Waiting for order data" />
              </section>

              <section className="dashboard-grid">
                <div className="panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Sales overview</h3>
                      <p>Revenue trends will appear when order data is connected.</p>
                    </div>
                    <span className="soft-badge">Analytics</span>
                  </div>
                  <div className="chart-placeholder">
                    <div className="chart-y-labels">
                      <span>Revenue</span><span>Monthly</span>
                    </div>
                    <div className="chart-visual">
                      <div className="chart-grid-line" />
                      <div className="chart-grid-line" />
                      <div className="chart-grid-line" />
                      <div className="chart-grid-line" />
                      <div className="chart-empty">
                        <span className="chart-empty-icon">↗</span>
                        <strong>Sales analytics coming next</strong>
                        <span>Connect order records to display real sales charts.</span>
                      </div>
                      <div className="chart-months">
                        <span>Jan</span><span>Feb</span><span>Mar</span>
                        <span>Apr</span><span>May</span><span>Jun</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-heading">
                    <div><h3>Quick actions</h3><p>Get work done faster.</p></div>
                  </div>
                  <div className="quick-actions">
                    <button onClick={() => openPage("customers")}>
                      <span className="quick-icon blue">＋</span>
                      <span><strong>Add customer</strong><small>Create a customer record</small></span>
                      <span className="arrow">→</span>
                    </button>
                    <button onClick={() => openPage("products")}>
                      <span className="quick-icon purple">＋</span>
                      <span><strong>Add product</strong><small>Manage products and stock</small></span>
                      <span className="arrow">→</span>
                    </button>
                    <button onClick={() => openPage("orders")}>
                      <span className="quick-icon orange">＋</span>
                      <span><strong>Record order</strong><small>Track an order</small></span>
                      <span className="arrow">→</span>
                    </button>
                    <button onClick={() => openPage("care")}>
                      <span className="quick-icon green">＋</span>
                      <span><strong>Customer support</strong><small>Manage customer enquiries</small></span>
                      <span className="arrow">→</span>
                    </button>
                  </div>
                </div>
              </section>

              <section className="panel recent-panel">
                <div className="panel-heading">
                  <div><h3>Recent customers</h3><p>Your latest customer records from MySQL.</p></div>
                  <button className="text-button" onClick={() => openPage("customers")}>
                    View all →
                  </button>
                </div>
                <CustomerTable customers={customers.slice(0, 5)} loading={loading} />
              </section>

              <section className="panel recent-panel">
                <div className="panel-heading">
                  <div><h3>Recent products</h3><p>Your latest products from MySQL.</p></div>
                  <button className="text-button" onClick={() => openPage("products")}>
                    View all →
                  </button>
                </div>
                <ProductTable
                  products={products.slice(0, 5)}
                  loading={productsLoading}
                  onEdit={startEditing}
                  onDelete={deleteProduct}
                />
              </section>
            </>
          )}

          {page === "customers" && (
            <>
              <div className="section-intro">
                <div><h2>Customer directory</h2><p>Manage customer contact information and records.</p></div>
              </div>

              <section className="panel form-panel">
                <div className="panel-heading">
                  <div><h3>Add customer</h3><p>Fields marked with * are required.</p></div>
                </div>
                <form onSubmit={handleSubmit} className="customer-form">
                  <div className="form-grid">
                    <FormField label="First name *" name="first_name" value={formData.first_name} onChange={handleChange} placeholder="Enter first name" />
                    <FormField label="Last name *" name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Enter last name" />
                    <FormField label="Email address *" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="customer@example.com" />
                    <FormField label="Phone number" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="Enter phone number" required={false} />
                  </div>
                  <button className="primary-button" type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save customer"}
                  </button>
                </form>
              </section>

              <section className="panel">
                <div className="panel-heading customer-list-heading">
                  <div><h3>All customers <span className="count-badge">{customers.length}</span></h3><p>Search and review your customer records.</p></div>
                  <input className="search-input" value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search customers..." aria-label="Search customers" />
                </div>
                <CustomerTable customers={filteredCustomers} loading={loading} />
              </section>
            </>
          )}

          {page === "products" && (
            <>
              <div className="section-intro">
                <div>
                  <h2>Product catalogue</h2>
                  <p>Add, edit, search, and manage your product inventory.</p>
                </div>
                <span className="soft-badge">{products.length} products</span>
              </div>

              <section className="panel form-panel">
                <div className="panel-heading">
                  <div>
                    <h3>{editingProductId !== null ? `Edit product #${editingProductId}` : "Add a product"}</h3>
                    <p>Name and SKU are required. Price and stock cannot be negative.</p>
                  </div>
                  {editingProductId !== null && (
                    <button type="button" className="secondary-button" onClick={cancelEditing}>
                      Cancel edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleProductSubmit} className="customer-form">
                  <div className="form-grid">
                    <FormField label="Product name *" name="name" value={productForm.name} onChange={handleProductChange} placeholder="e.g. Cotton T-Shirt" />
                    <FormField label="SKU *" name="sku" value={productForm.sku} onChange={handleProductChange} placeholder="e.g. TSHIRT-001" />
                    <FormField label="Category" name="category" value={productForm.category} onChange={handleProductChange} placeholder="e.g. Clothing" required={false} />
                    <FormField label="Price (₹) *" name="price" type="number" value={productForm.price} onChange={handleProductChange} placeholder="499.00" min="0" step="0.01" />
                    <FormField label="Stock quantity *" name="stock_quantity" type="number" value={productForm.stock_quantity} onChange={handleProductChange} placeholder="25" min="0" step="1" />
                    <label className="form-field">
                      <span>Status *</span>
                      <select name="status" value={productForm.status} onChange={handleProductChange}>
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                      </select>
                    </label>
                    <label className="form-field product-description-field">
                      <span>Description</span>
                      <textarea name="description" value={productForm.description}
                        onChange={handleProductChange} placeholder="Describe the product..." rows="3" />
                    </label>
                  </div>

                  <div className="form-actions">
                    <button className="primary-button" type="submit" disabled={saving}>
                      {saving ? "Saving..." : editingProductId !== null ? "Update product" : "Save product"}
                    </button>
                    {editingProductId !== null && (
                      <button type="button" className="secondary-button" onClick={cancelEditing}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </section>

              <section className="panel">
                <div className="panel-heading customer-list-heading">
                  <div>
                    <h3>All products <span className="count-badge">{products.length}</span></h3>
                    <p>Product information and current stock levels.</p>
                  </div>
                  <input className="search-input" value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search products..." aria-label="Search products" />
                </div>
                <ProductTable
                  products={filteredProducts}
                  loading={productsLoading}
                  onEdit={startEditing}
                  onDelete={deleteProduct}
                />
              </section>
            </>
          )}

          {["orders", "care", "analytics"].includes(page) && (
            <section className="panel upcoming-panel">
              <div className="upcoming-icon">
                {page === "orders" ? "▤" : page === "care" ? "✉" : "▥"}
              </div>
              <span className="banner-label">NEXT BUILD STEP</span>
              <h2>
                {page === "orders" && "Order management"}
                {page === "care" && "Customer care"}
                {page === "analytics" && "Business analytics"}
              </h2>
              <p>
                {page === "orders" && "Record orders and track payment and fulfilment status."}
                {page === "care" && "Create support tickets, assign staff, and track customer issues."}
                {page === "analytics" && "View charts based on real orders, revenue, products, and customers."}
              </p>
              <div className="upcoming-note">
                This section is a navigation placeholder. We will connect it to MySQL and Express APIs in the next steps.
              </div>
              <button className="secondary-button" onClick={() => openPage("dashboard")}>
                ← Back to dashboard
              </button>
            </section>
          )}

          <footer className="page-footer">
            <span>StorePilot CRM</span>
            <span>React · Express · MySQL</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, tone, label, value, note }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <span className={`stat-icon ${tone}`}>{icon}</span>
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function FormField({
  label, name, value, onChange, placeholder,
  type = "text", required = true, min, step,
}) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        step={step}
      />
    </label>
  );
}

function CustomerTable({ customers, loading }) {
  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead><tr><th>ID</th><th>Customer</th><th>Email</th><th>Phone</th></tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="4" className="empty-cell">Loading customers...</td></tr>
          ) : customers.length === 0 ? (
            <tr><td colSpan="4" className="empty-cell">No customers found.</td></tr>
          ) : customers.map((customer) => {
            const id = customer.customer_id ?? customer.id ?? customer.email;
            const initials = `${customer.first_name?.[0] ?? ""}${customer.last_name?.[0] ?? ""}`;
            return (
              <tr key={id}>
                <td>#{customer.customer_id ?? customer.id ?? "—"}</td>
                <td><div className="customer-cell">
                  <span className="customer-avatar">{initials.toUpperCase()}</span>
                  <strong>{customer.first_name} {customer.last_name}</strong>
                </div></td>
                <td>{customer.email}</td>
                <td>{customer.phone || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ProductTable({ products, loading, onEdit, onDelete }) {
  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>SKU</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="7" className="empty-cell">Loading products...</td></tr>
          ) : products.length === 0 ? (
            <tr><td colSpan="7" className="empty-cell">No products found. Add your first product above.</td></tr>
          ) : products.map((product) => (
            <tr key={product.id}>
              <td><strong>{product.name}</strong></td>
              <td>{product.sku}</td>
              <td>{product.category || "—"}</td>
              <td>{new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                minimumFractionDigits: 2,
              }).format(Number(product.price) || 0)}</td>
              <td>{product.stock_quantity}</td>
              <td><span className={`product-status status-${product.status}`}>{product.status}</span></td>
              <td>
                <div className="table-actions">
                  <button type="button" className="table-action" onClick={() => onEdit(product)}>Edit</button>
                  <button type="button" className="table-action delete-action" onClick={() => onDelete(product)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
