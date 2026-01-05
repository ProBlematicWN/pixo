import { createContext, useContext, useEffect, useMemo, useState } from "react";

const LanguageContext = createContext(null);

// ✅ Словари (пока минимум — будем расширять постепенно)
const DICT = {
  ru: {
    common: {
      upload: "Загрузить фото",
      gallery: "Галерея",
      profile: "Профиль",
      logout: "Выйти",
      search: "Поиск...",
      loading: "Загрузка...",
      manage: "Управление",
      share: "Поделиться",
      noPhotosAlbums: "Пока нет фото и альбомов",
      noPhotos: "Пока нет фото",
      noAlbumPhotos: "В альбоме пока нет фото",
      selectAlbum: "Выбери альбом…",
      add: "Добавить",
      createAlbum: "Создать альбом",
      addToAlbum: "Добавить в альбом",
      choosePhotoFirst: "Сначала выбери фото (кликни по нему)",
      chooseAlbum: "Выбери альбом",
      addedToAlbum: "Фото добавлено в альбом!",
      albumNamePrompt: "Название альбома:",
      signIn: "Войти",
      signUp: "Регистрация",
      onlyImages: "Можно загрузить только изображение",
      fileTooLarge: "Файл слишком большой. Максимум 5 МБ.",
      uploadError: "Ошибка загрузки",
      connectError: "Ошибка соединения с сервером",
      save: "Сохранить",
      change: "Изменить",
    },

    auth: {
      signInTitle: "Вход",
      signUpTitle: "Регистрация",
      recoverTitle: "Восстановление пароля",

      email: "Email",
      password: "Пароль",

      emailPh: "Введите email",
      passwordPh: "Введите пароль",
      passwordCreatePh: "Придумайте пароль",

      forgotPassword: "Забыли пароль?",
      sendPassword: "Отправить пароль",

      enterEmailPassword: "Введите email и пароль",
      signInError: "Ошибка входа",
      signUpError: "Ошибка регистрации",
      signUpSuccess: "Регистрация успешна! Теперь войдите в аккаунт.",
      signUpBtn: "Зарегистрироваться",
    },

    afterUpload: {
        linkCopied: "Ссылка скопирована!"
    },

     settings: {
        title: "Настройки",
        email: "Электронная почта",
        language: "Язык",
        passwordTitle: "Пароль",
        oldPassword: "Старый пароль",
        newPassword: "Новый пароль",
        confirmPassword: "Подтвердите пароль",
        oldPasswordPh: "Введите старый пароль",
        newPasswordPh: "Введите новый пароль",
        confirmPasswordPh: "Повторите новый пароль",
        emailPh: "Введите email",
    },

    guest: {
        uploading: "Загрузка...",
        uploadPhoto: "Загрузить фото",
        language: "Язык",
    },

    pages: {
      galleryTitle: "Галерея",
      albumTitleFallback: "Название альбома",
    },

    album: {
        hintOpen: "* Двойной клик по фото — открыть страницу фото",
    },
    gallery: {
        hint: "* Фото: клик — выбрать, двойной клик — открыть. Альбом: двойной клик — открыть.",
        createAlbumError: "Ошибка создания альбома",
        attachError: "Ошибка привязки",
        pickAlbumPlaceholder: "Выбери альбом…", // если где-то будет gallery.pickAlbumPlaceholder
        promptAlbumName: "Название альбома:",
        pickPhotoFirst: "Сначала выбери фото (кликни по нему)",
        pickAlbum: "Выбери альбом",
        attachedOk: "Фото добавлено в альбом!",
        empty: "Пока нет фото и альбомов",
        createAlbum: "Создать альбом",
        addToAlbum: "Добавить в альбом"
    },
    image: {
        linkCopied: "Ссылка скопирована!",
    },
  },

  en: {
    common: {
      upload: "Upload photo",
      gallery: "Gallery",
      profile: "Profile",
      logout: "Log out",
      search: "Search...",
      loading: "Loading...",
      manage: "Manage",
      share: "Share",
      noPhotosAlbums: "No photos or albums yet",
      noPhotos: "No photos yet",
      noAlbumPhotos: "No photos in this album yet",
      selectAlbum: "Choose an album…",
      add: "Add",
      createAlbum: "Create album",
      addToAlbum: "Add to album",
      choosePhotoFirst: "Select a photo first (click it)",
      chooseAlbum: "Choose an album",
      addedToAlbum: "Photo added to album!",
      albumNamePrompt: "Album name:",
      signIn: "Sign in",
      signUp: "Sign up",
      onlyImages: "Only images are allowed",
      fileTooLarge: "File is too large. Max 5 MB.",
      uploadError: "Upload error",
      connectError: "Server connection error",
      save: "Save",
      change: "Change",
    },

    auth: {
      signInTitle: "Sign in",
      signUpTitle: "Sign up",
      recoverTitle: "Password recovery",

      email: "Email",
      password: "Password",

      emailPh: "Enter email",
      passwordPh: "Enter password",
      passwordCreatePh: "Create a password",

      forgotPassword: "Forgot password?",
      sendPassword: "Send password",

      enterEmailPassword: "Enter email and password",
      signInError: "Sign in error",
      signUpError: "Sign up error",
      signUpSuccess: "Registration successful! Now sign in to your account.",
      signUpBtn: "Create account",
    },

    afterUpload: {
        linkCopied: "Link copied!",
        signIn: "Sign in",
        signUp: "Sign up",
    },

    settings: {
        title: "Settings",
        email: "Email",
        language: "Language",
        passwordTitle: "Password",
        oldPassword: "Old password",
        newPassword: "New password",
        confirmPassword: "Confirm password",
        oldPasswordPh: "Enter old password",
        newPasswordPh: "Enter new password",
        confirmPasswordPh: "Repeat new password",
        emailPh: "Enter email",
    },

    guest: {
        uploading: "Uploading...",
        uploadPhoto: "Upload photo",
        language: "Language",
    },

    pages: {
      galleryTitle: "Gallery",
      albumTitleFallback: "Album name",
    },

    album: {
        hintOpen: "* Double click a photo to open it",
    },
    gallery: {
        hint: "* Photo: click to select, double click to open. Album: double click to open.",
        createAlbumError: "Failed to create album",
        attachError: "Attach failed",
        pickAlbumPlaceholder: "Choose an album…",
        promptAlbumName: "Album name:",
        pickPhotoFirst: "Select a photo first (click it)",
        pickAlbum: "Choose an album",
        attachedOk: "Photo added to album!",
        empty: "No photos or albums yet",
        createAlbum: "Create an album",
        addToAlbum: "Add to album"
}   ,
    image: {
        linkCopied: "Link copied!",
    },
  },
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("ru");

  useEffect(() => {
    const saved = localStorage.getItem("lang");
    if (saved === "ru" || saved === "en") setLang(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  // ✅ t("common.upload") или t("pages.galleryTitle")
  const t = useMemo(() => {
    return (key) => {
      const parts = String(key).split(".");
      let cur = DICT[lang];
      for (const p of parts) {
        cur = cur?.[p];
      }
      // если ключ не найден — показываем сам ключ, чтобы было видно что забыли добавить
      return cur ?? key;
    };
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang() must be used inside <LanguageProvider>");
  return ctx;
}
