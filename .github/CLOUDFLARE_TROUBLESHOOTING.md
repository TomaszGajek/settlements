# 🔧 Cloudflare Pages - Troubleshooting 404

## Problem: ERR_HTTP_RESPONSE_CODE_FAILURE 404

Aplikacja wdraża się pomyślnie, ale zwraca 404 przy próbie dostępu.

---

## ✅ Rozwiązanie 1: Dodaj zmienne środowiskowe w Cloudflare

### Krok po kroku:

1. **Przejdź do Cloudflare Dashboard**
   - URL: https://dash.cloudflare.com/
   
2. **Pages** → **Twój projekt** (np. `settlements-88a`)

3. **Settings** → **Environment variables**

4. **Production** → **Add variable** (dwa razy):

   **Zmienna 1:**
   - Variable name: `PUBLIC_SUPABASE_URL`
   - Value: `https://xxxxx.supabase.co` (twój URL Supabase)
   
   **Zmienna 2:**
   - Variable name: `PUBLIC_SUPABASE_ANON_KEY`
   - Value: `eyJhbGc...` (twój anon key)

5. **Save**

6. **Redeploy**:
   - Przejdź do **Deployments**
   - Kliknij na najnowszy deployment
   - **Retry deployment** lub **Manage deployment** → **Rollback to this deployment** (to wymuś rebuild)

---

## ✅ Rozwiązanie 2: Sprawdź czy _worker.js został wdrożony

### Weryfikacja w Cloudflare Dashboard:

1. **Pages** → **Twój projekt** → **Latest deployment**
2. Sprawdź "Build output directory" - powinno być `dist`
3. Sprawdź logi czy wszystkie pliki zostały przesłane
4. Poszukaj w logach: `_worker.js` - musi być obecny

---

## ✅ Rozwiązanie 3: Użyj GitHub Integration (Zalecane!)

Zamiast używać Direct Upload przez GitHub Actions, skorzystaj z natywnej integracji:

### Krok 1: Usuń projekt z Direct Upload

1. **Cloudflare Dashboard** → **Pages** → **Twój projekt**
2. **Settings** → **Delete project** (jeśli istnieje)

### Krok 2: Utwórz projekt przez Git Integration

1. **Cloudflare Dashboard** → **Pages** → **Create a project**
2. **Connect to Git** → Wybierz **GitHub**
3. Autoryzuj dostęp do repozytorium
4. Wybierz repo: `10x-settlements/settlements`
5. **Set up builds and deployments**:
   - **Production branch**: `master`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   
6. **Environment variables** (Production):
   - `PUBLIC_SUPABASE_URL` = `https://xxxxx.supabase.co`
   - `PUBLIC_SUPABASE_ANON_KEY` = `twój_anon_key`
   
7. **Save and Deploy**

### Krok 3: Zmodyfikuj workflow master.yml

Jeśli używasz Git Integration, **usuń job Deploy** z `.github/workflows/master.yml` lub zmień trigger:

```yaml
on:
  push:
    branches: [master]
  # Dodaj exclude, żeby nie duplikować deployment
  paths-ignore:
    - '**/*'  # To zapobiegnie uruchomieniu, ale Git Integration zadziała
```

LUB po prostu **wyłącz workflow** i polegaj na Cloudflare Git Integration.

---

## ✅ Rozwiązanie 4: Sprawdź Routes Configuration

Jeśli używasz Direct Upload, upewnij się że `_routes.json` jest prawidłowy.

### Sprawdź lokalnie:

```bash
npm run build
cat dist/_routes.json
```

Powinno zawierać coś w stylu:

```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": []
}
```

---

## ✅ Rozwiązanie 5: Debug lokalnie z Wrangler

### Testuj deployment lokalnie:

1. Zainstaluj Wrangler globalnie:
   ```bash
   npm install -g wrangler
   ```

2. Zaloguj się do Cloudflare:
   ```bash
   wrangler login
   ```

3. Zbuduj aplikację:
   ```bash
   npm run build
   ```

4. Przetestuj lokalnie:
   ```bash
   wrangler pages dev dist
   ```

5. Otwórz: http://localhost:8788

Jeśli działa lokalnie, to problem jest w konfiguracji Cloudflare lub brakujących zmiennych.

---

## 🔍 Debugging Checklist

- [ ] Zmienne środowiskowe ustawione w Cloudflare Pages?
  - `PUBLIC_SUPABASE_URL`
  - `PUBLIC_SUPABASE_ANON_KEY`
  
- [ ] `_worker.js` folder istnieje w dist?
  ```bash
  ls dist/_worker.js
  ```

- [ ] Build command jest poprawny?
  - Powinno być: `npm run build`
  
- [ ] Build output directory jest poprawny?
  - Powinno być: `dist`

- [ ] Compatibility date ustawiony?
  - W `wrangler.toml`: `compatibility_date = "2025-10-21"`
  
- [ ] Node.js compatibility flag włączony?
  - W `wrangler.toml`: `compatibility_flags = ["nodejs_compat"]`

---

## 📊 Sprawdź logi Cloudflare

### W Cloudflare Dashboard:

1. **Pages** → **Twój projekt**
2. **Deployments** → Kliknij na najnowszy
3. **View logs** (zobacz build logs)
4. **Functions** → Zobacz runtime logs (jeśli dostępne)

### Czego szukać:

- ❌ `Missing environment variable`
- ❌ `_worker.js not found`
- ❌ `Failed to load module`
- ❌ `Binding not found`

---

## 🚨 Typowe problemy

### Problem: "Cannot read property of undefined"

**Przyczyna**: Brakujące zmienne środowiskowe

**Rozwiązanie**: Dodaj `PUBLIC_SUPABASE_URL` i `PUBLIC_SUPABASE_ANON_KEY` w Cloudflare

### Problem: 404 na wszystkich stronach

**Przyczyna**: Worker nie uruchamia się

**Rozwiązanie**: 
- Sprawdź czy `_worker.js` istnieje w deploymencie
- Sprawdź `_routes.json`
- Dodaj `compatibility_flags = ["nodejs_compat"]` w wrangler.toml

### Problem: "Invalid binding SESSION"

**Przyczyna**: Cloudflare adapter wymaga SESSION binding

**Rozwiązanie**: 
1. Utwórz KV namespace w Cloudflare:
   ```bash
   wrangler kv:namespace create SESSION
   ```
2. Dodaj binding w `wrangler.toml`

LUB

Wyłącz sessions w `astro.config.mjs`:
```javascript
adapter: cloudflare({
  platformProxy: { enabled: true },
  imageService: "compile",
  routes: {
    strategy: "auto"
  },
  mode: "directory" // Zmień z "advanced"
})
```

---

## 📞 Dodatkowa pomoc

Jeśli żadne z powyższych nie zadziałało:

1. **Sprawdź Cloudflare Status**: https://www.cloudflarestatus.com/
2. **Astro Discord**: https://astro.build/chat
3. **Cloudflare Community**: https://community.cloudflare.com/

---

## ✅ Zalecane: Użyj Git Integration

**Najlepsze rozwiązanie**: Usuń Direct Upload i użyj Cloudflare Git Integration.

**Zalety**:
- Automatyczne deployments przy push
- Lepsze logi i debugging
- Preview deployments dla każdego PR
- Łatwiejsza konfiguracja
- Mniej problemów z _worker.js

**Instrukcja**: Zobacz "Rozwiązanie 3" powyżej.

---

**Ostatnia aktualizacja**: 2025-10-21


