import { Router } from "express";
import { handleSubmitContactForm, handleGetContactForms } from "./conatct.conteroller.js";
const router = Router();

router.post("/submit", handleSubmitContactForm);
router.get("/forms", handleGetContactForms);

export default router;