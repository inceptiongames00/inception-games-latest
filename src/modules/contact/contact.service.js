import pool from "../../database/db";

export const submitContactForm = async (req, res) => {
  const { name, email, phone, message } = req.body;

  try {
    const sql = `INSERT INTO contacts (name, email, phone, message) VALUES (?, ?, ?, ?)`;
    const values = [name, email, phone, message];
    const [result] = await pool.query(sql, values); // MySQL returns [result, fields]
    res.status(201).json({ success: true, insertId: result.insertId });
  } catch (error) {
    console.error("Error submitting contact form:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getContactForms = async (req, res) => {
  try {
    const sql = `SELECT * FROM contacts ORDER BY created_at DESC`;
    const [rows] = await pool.query(sql); // MySQL returns [rows, fields]
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error("Error fetching contact forms:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
