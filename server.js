const express = require("express");
const mysql = require("mysql2");

const app = express();
const port = 3000;
const categories = ["friend", "family", "school"];

app.use(express.json());
app.use(express.static(__dirname));

const database = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "contacts_db"
});

database.connect((error) => {
    if (error) {
        console.error("Database connection failed:", error.message);
        return;
    }

    console.log("Connected to contacts_db");
});

function validateContact(body) {
    const contact = {
        name: typeof body.name === "string" ? body.name.trim() : "",
        phone_number: typeof body.phone_number === "string" ? body.phone_number.trim() : "",
        email_address: typeof body.email_address === "string" ? body.email_address.trim() : "",
        category: typeof body.category === "string" ? body.category.trim().toLowerCase() : ""
    };

    if (!contact.name || contact.name.length > 50 || !contact.phone_number || !contact.category) {
        return { error: "Enter a name (up to 50 characters), phone number, and category." };
    }

    if (contact.email_address && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email_address)) {
        return { error: "Enter a valid email address." };
    }

    if (!categories.includes(contact.category)) {
        return { error: "Choose friend, family, or school." };
    }

    return { contact };
}

function validId(value) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

app.get("/api/contacts", (req, res) => {
    if (req.query.id !== undefined) {
        const id = validId(req.query.id);
        if (id === null) return res.status(400).json({ message: "Enter a valid contact ID." });

        database.query("SELECT * FROM contacts WHERE id = ?", [id], (error, rows) => {
            if (error) return res.status(500).json({ message: "Could not load contacts." });
            res.json(rows);
        });
        return;
    }

    if (req.query.category !== undefined && req.query.category !== "") {
        const category = String(req.query.category).toLowerCase();
        if (!categories.includes(category)) {
            return res.status(400).json({ message: "Choose a valid category." });
        }

        database.query("SELECT * FROM contacts WHERE category = ? ORDER BY id", [category], (error, rows) => {
            if (error) return res.status(500).json({ message: "Could not load contacts." });
            res.json(rows);
        });
        return;
    }

    database.query("SELECT * FROM contacts ORDER BY id", (error, rows) => {
        if (error) return res.status(500).json({ message: "Could not load contacts." });
        res.json(rows);
    });
});

app.get("/api/contacts/:id", (req, res) => {
    const id = validId(req.params.id);
    if (id === null) return res.status(400).json({ message: "Enter a valid contact ID." });

    database.query("SELECT * FROM contacts WHERE id = ?", [id], (error, rows) => {
        if (error) return res.status(500).json({ message: "Could not load the contact." });
        if (rows.length === 0) return res.status(404).json({ message: "Contact not found." });
        res.json(rows[0]);
    });
});

app.post("/api/contacts", (req, res) => {
    const { contact, error } = validateContact(req.body || {});
    if (error) return res.status(400).json({ message: error });

    const sql = `INSERT INTO contacts (name, phone_number, email_address, category)
        VALUES (?, ?, ?, ?)`;

    database.query(sql, [contact.name, contact.phone_number, contact.email_address || null, contact.category], (queryError, result) => {
        if (queryError) return res.status(500).json({ message: "Could not add the contact." });
        res.status(201).json({ message: "Contact added.", id: result.insertId });
    });
});

app.put("/api/contacts/:id", (req, res) => {
    const id = validId(req.params.id);
    if (id === null) return res.status(400).json({ message: "Enter a valid contact ID." });

    const { contact, error } = validateContact(req.body || {});
    if (error) return res.status(400).json({ message: error });

    const sql = `UPDATE contacts
        SET name = ?, phone_number = ?, email_address = ?, category = ?
        WHERE id = ?`;

    database.query(sql, [contact.name, contact.phone_number, contact.email_address || null, contact.category, id], (queryError, result) => {
        if (queryError) return res.status(500).json({ message: "Could not update the contact." });
        if (result.affectedRows > 0) return res.json({ message: "Contact updated." });

        database.query("SELECT id FROM contacts WHERE id = ?", [id], (lookupError, rows) => {
            if (lookupError) return res.status(500).json({ message: "Could not update the contact." });
            if (rows.length === 0) return res.status(404).json({ message: "Contact not found." });
            res.json({ message: "Contact updated." });
        });
    });
});

app.delete("/api/contacts/:id", (req, res) => {
    const id = validId(req.params.id);
    if (id === null) return res.status(400).json({ message: "Enter a valid contact ID." });

    database.query("DELETE FROM contacts WHERE id = ?", [id], (error, result) => {
        if (error) return res.status(500).json({ message: "Could not delete the contact." });
        if (result.affectedRows === 0) return res.status(404).json({ message: "Contact not found." });
        res.json({ message: "Contact deleted." });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});