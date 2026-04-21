# Wdrozenie na VPS

## 1. Rozpakuj paczke

Na VPS wrzuc paczke ZIP do folderu, w ktorym ma dzialac strona, np.:

```bash
/var/www/profil-ciala
```

Rozpakuj ja tak, zeby w folderze byly pliki `Dockerfile`, `docker-compose.yml`, `package.json`, katalog `app` itd.

## 2. Utworz plik .env

Skopiuj przyklad:

```bash
cp .env.example .env
```

W pliku `.env` ustaw prawdziwe dane SMTP oraz Cloudflare Turnstile:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=kontakt@example.com
SMTP_PASS=twoje-haslo-smtp
MAIL_FROM="Formularz kontaktowy <kontakt@example.com>"
NEXT_PUBLIC_TURNSTILE_SITE_KEY=tu_wklej_site_key_z_cloudflare
TURNSTILE_SECRET_KEY=tu_wklej_secret_key_z_cloudflare
```

`NEXT_PUBLIC_TURNSTILE_SITE_KEY` to Site Key z Cloudflare Turnstile.
`TURNSTILE_SECRET_KEY` to Secret Key z Cloudflare Turnstile.

## 3. Uruchom strone

```bash
docker compose up -d --build
```

Jesli serwer uzywa starego Dockera:

```bash
docker-compose up -d --build
```

## 4. Sprawdz status

```bash
docker compose ps
docker compose logs -f
```

Lokalnie na VPS aplikacja dziala na:

```txt
http://127.0.0.1:3000
```

## 5. Sprawdz naglowki po wdrozeniu

```bash
curl -I https://profil-ciala.jtk.ovh/
```

W odpowiedzi powinny byc m.in.:

```txt
content-security-policy
strict-transport-security
x-frame-options
x-content-type-options
referrer-policy
permissions-policy
```

Nie powinno byc:

```txt
x-powered-by: Next.js
```
