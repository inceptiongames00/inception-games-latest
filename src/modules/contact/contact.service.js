import pool from "../../database/db"


export const submitContactForm = async (req, res) => {
  const { name, email, phone, message } = req.body;

  try {
   const sql = `INSERT INTO contacts (name, email, phone, message) VALUES (?, ?, ?, ?)`;
    const values = [name, email, phone, message];
    const result = await pool.query(sql, values);
    res.status(201).json({ success: true, data: result.rows[0] });
  }
    catch (error) {   
    console.error("Error submitting contact form:", error);
    res.status(500).json({ success: false, message: "Failed to submit contact form" });
  }
};  

export const getContactForms = async (req, res) => {
  try {
    const query = "SELECT * FROM contacts ORDER BY created_at DESC";
    const result = await pool.query(query);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error fetching contact forms:", error);
    res.status(500).json({ success: false, message: "Failed to fetch contact forms" });
  }
};