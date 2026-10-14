
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "woocommerce_crm"
});

// Test the backend
app.get("/", (req, res) => {
  res.send("WooCommerce CRM backend is running!");
});

// Test MySQL
app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({
      success: true,
      message: "MySQL connected successfully!"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// =========================
// CUSTOMER APIs
// =========================

// Get all customers
app.get("/api/customers", async (req, res) => {
  try {
    const [customers] = await db.query(
      "SELECT * FROM customers ORDER BY id DESC"
    );
    res.json(customers);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Could not load customers" });
  }
});

// Add a customer
app.post("/api/customers", async (req, res) => {
  try {
    const { first_name, last_name, email, phone } = req.body;

    if (!first_name || !last_name || !email) {
      return res.status(400).json({
        message: "First name, last name and email are required"
      });
    }

    const [result] = await db.query(
      `INSERT INTO customers (first_name, last_name, email, phone)
       VALUES (?, ?, ?, ?)`,
      [first_name.trim(), last_name.trim(), email.trim(), phone || null]
    );

    res.status(201).json({
      id: result.insertId,
      first_name,
      last_name,
      email,
      phone
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Customer already exists"
      });
    }

    console.error(error.message);
    res.status(500).json({ message: "Could not add customer" });
  }
});

// =========================
// PRODUCT APIs
// =========================

// Get all products
app.get("/api/products", async (req, res) => {
  try {
    const [products] = await db.query(
      "SELECT * FROM products ORDER BY id DESC"
    );
    res.json(products);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Could not load products" });
  }
});

// Get one product by ID
app.get("/api/products/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const [products] = await db.query(
      "SELECT * FROM products WHERE id = ?",
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(products[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Could not load product" });
  }
});

// Add a product
app.post("/api/products", async (req, res) => {
  try {
    const {
      name,
      sku,
      description,
      category,
      price = 0,
      stock_quantity = 0,
      status = "active"
    } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof sku !== "string" ||
      !sku.trim()
    ) {
      return res.status(400).json({
        message: "Product name and SKU are required"
      });
    }

    const numericPrice = Number(price);
    const numericStock = Number(stock_quantity);
    const validStatuses = ["active", "draft", "archived"];

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice < 0 ||
      !Number.isInteger(numericStock) ||
      numericStock < 0 ||
      !validStatuses.includes(status)
    ) {
      return res.status(400).json({
        message: "Enter a valid price, stock quantity and status"
      });
    }

    const [result] = await db.query(
      `INSERT INTO products
       (name, sku, description, category, price, stock_quantity, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        sku.trim(),
        description || null,
        category || null,
        numericPrice,
        numericStock,
        status
      ]
    );

    const [products] = await db.query(
      "SELECT * FROM products WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json(products[0]);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "A product with this SKU already exists"
      });
    }

    console.error(error.message);
    res.status(500).json({ message: "Could not add product" });
  }
});

// Update a product
app.put("/api/products/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      name,
      sku,
      description,
      category,
      price,
      stock_quantity,
      status
    } = req.body;

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof sku !== "string" ||
      !sku.trim()
    ) {
      return res.status(400).json({
        message: "Product name and SKU are required"
      });
    }

    const numericPrice = Number(price);
    const numericStock = Number(stock_quantity);
    const validStatuses = ["active", "draft", "archived"];

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice < 0 ||
      !Number.isInteger(numericStock) ||
      numericStock < 0 ||
      !validStatuses.includes(status)
    ) {
      return res.status(400).json({
        message: "Enter a valid price, stock quantity and status"
      });
    }

    const [result] = await db.query(
      `UPDATE products
       SET name = ?, sku = ?, description = ?, category = ?,
           price = ?, stock_quantity = ?, status = ?
       WHERE id = ?`,
      [
        name.trim(),
        sku.trim(),
        description || null,
        category || null,
        numericPrice,
        numericStock,
        status,
        id
      ]
    );

    if (result.affectedRows === 0) {
      const [existing] = await db.query(
        "SELECT id FROM products WHERE id = ?",
        [id]
      );

      if (existing.length === 0) {
        return res.status(404).json({ message: "Product not found" });
      }
    }

    const [products] = await db.query(
      "SELECT * FROM products WHERE id = ?",
      [id]
    );

    res.json(products[0]);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "A product with this SKU already exists"
      });
    }

    console.error(error.message);
    res.status(500).json({ message: "Could not update product" });
  }
});

// Delete a product
app.delete("/api/products/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const [result] = await db.query(
      "DELETE FROM products WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      success: true,
      message: "Product deleted successfully"
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Could not delete product" });
  }
});

// Start backend
app.listen(5000, () => {
  console.log("Server running at http://localhost:5000");
});
