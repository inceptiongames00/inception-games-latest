import { submitContactForm, getContactForms } from "./contact.service";

export const handleSubmitContactForm = async (req, res) => {
  await submitContactForm(req, res);
};

export const handleGetContactForms = async (req, res) => {
  await getContactForms(req, res);
}; 