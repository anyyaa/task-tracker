# Task Tracker

Простой таск-трекер с фронтендом на React (Vite) и бэкендом на Supabase.
Позволяет создавать задачи, хранить их в базе и прикреплять файлы.

---

## Структура проекта

task-tracker/

├─ frontend/  # React проект на Vite

│   ├─ package.json

│   ├─ vite.config.ts

│   └─ src/

│       ├─ lib/

│       │   └─ supabase.ts   # инициализация Supabase клиента

│       └─ App.tsx

├─ supabase/          # Настройки Supabase / миграции (опционально)

├─ docs/              # Документация, схемы и т.д.

└─ README.md

---

## Установка и запуск локально

Перейти в папку фронтенда:

cd frontend

Установить зависимости:

npm install

Создать файл `.env` на основе `.env.example`:

VITE_SUPABASE_URL=ваш-url-проекта
VITE_SUPABASE_ANON_KEY=ваш-anon-key

Получить URL проекта и ANON KEY можно в Supabase: Settings → API → Project URL / Anon Key

Запустить сервер разработки:

npm run dev

Открыть в браузере:

http://127.0.0.1:5173

Если порт занят, Vite предложит свободный порт, используйте его.

---

## Работа с Supabase

Файл инициализации: `frontend/src/lib/supabase.ts`

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

Пример запроса к таблице `tasks`:

const { data, error } = await supabase.from('tasks').select('*')

Файл `.env.example`:

VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

Копировать `.env.example` → `.env` и вставлять свои ключи.

---

## CI / GitHub Actions (опционально)

Файл: `.github/workflows/ci.yml`

Автоматическая сборка фронтенда при пуше или pull request:

name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 24
      - run: npm install
        working-directory: ./frontend
      - run: npm run build
        working-directory: ./frontend

---

## Дополнительно

- Фронтенд React (Vite) — для интерфейса
- Supabase — база данных, хранение файлов, аутентификация
- Можно расширять проект: добавлять авторизацию, прикрепление файлов, фильтры задач и т.д.
