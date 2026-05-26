export const INPUT_PRESETS = {
  name: {
    allowedKeyRegex: /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]$/,
    cleanPasteRegex: /[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g,
  },
  email: {
    allowedKeyRegex: /^[a-zA-Z0-9@._-]$/,
    cleanPasteRegex: /[^a-zA-Z0-9@._-]/g,
  },
  password: (maxLength?: number) => ({
    allowedKeyRegex: /^[a-zA-ZñÑ0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]$/,
    cleanPasteRegex: /[^a-zA-ZñÑ0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/g,
    maxLength,
  }),
  digits: (maxLength?: number) => ({
    allowedKeyRegex: /^[0-9]$/,
    cleanPasteRegex: /\D/g,
    maxLength,
  }),
};