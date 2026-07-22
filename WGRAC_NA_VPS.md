# Wdrozenie na VPS

## 1. Pobierz projekt z GitHuba

Najwygodniej wdrazac projekt przez GitHuba, a nie przez reczne wrzucanie ZIP-a.

```bash
cd /home/ubuntu
git clone https://github.com/JTK12345/strona-filipa.git
cd strona-filipa
```

Przy kolejnych aktualizacjach:

```bash
cd /home/ubuntu/strona-filipa
git pull origin main
docker compose up -d --build
```

Jesli serwer uzywa starego Dockera, zamiast `docker compose` uzyj `docker-compose`.

## 2. Utworz plik .env

```bash
cp .env.example .env
nano .env
```

Ustaw prawdziwe dane:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=kontakt@example.com
SMTP_PASS=twoje-haslo-smtp
MAIL_TO=kontakt@example.com
MAIL_FROM="Formularz kontaktowy <kontakt@example.com>"
NEXT_PUBLIC_TURNSTILE_SITE_KEY=tu_wklej_site_key_z_cloudflare
TURNSTILE_SECRET_KEY=tu_wklej_secret_key_z_cloudflare

POSTGRES_DB=strona_db
POSTGRES_USER=strona_user
POSTGRES_PASSWORD=tu_wklej_mocne_haslo_do_bazy
DATABASE_URL=postgresql://strona_user:tu_wklej_mocne_haslo_do_bazy@postgres:5432/strona_db

ADMIN_ACCESS_CODE=admin-test-access
ACCESS_SESSION_SECRET=dlugi-losowy-sekret-sesji

ALLOWED_ORIGINS=https://twojadomena.pl,https://www.twojadomena.pl
TRUSTED_PROXY_IPS=127.0.0.1,::1
TRUSTED_PROXY_SECRET=dlugi-losowy-sekret-proxy
LOG_SALT=dlugi-losowy-sekret-logow
FORM_LOG_SALT=dlugi-losowy-sekret-formularzy
REDIS_URL=
```

Wazne:

- `POSTGRES_PASSWORD` musi byc mocne i takie samo jak haslo w `DATABASE_URL`.
- `DATABASE_URL` laczy aplikacje z kontenerem PostgreSQL po nazwie uslugi `postgres`.
- `ADMIN_ACCESS_CODE` to testowy kod logowania admina. Na produkcji zmien go na dlugi sekret.
- `ACCESS_SESSION_SECRET` podpisuje ciasteczko sesji. Na produkcji musi byc losowy i niepubliczny.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` musi byc dostepny przy budowaniu i uruchamianiu kontenera.
- Po zmianie zmiennych uruchom pelny rebuild obrazu, a nie sam restart kontenera.

## 3. Uruchom strone i baze

`docker-compose.yml` uruchamia dwa kontenery:

- `strona` - aplikacja Next.js,
- `postgres` - baza danych PostgreSQL z trwalym volume `postgres_data`.

```bash
docker compose up -d --build
```

Sprawdz status:

```bash
docker compose ps
docker compose logs -f
```

Aplikacja na VPS jest wystawiona pod:

```txt
http://127.0.0.1:3010
```

Wewnatrz kontenera aplikacja nadal dziala na porcie `3000`.

Sprawdz aplikacje:

```bash
curl -I http://127.0.0.1:3010
```

Sprawdz baze (zmienne zostana odczytane wewnatrz kontenera):

```bash
docker compose exec postgres sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

## 4. Testowe logowanie, zakup i panel

Aktualnie dziala testowy przeplyw bez prawdziwej platnosci:

- `/kursy` - publiczny katalog oferty widoczny bez logowania,
- `/kup` - testowy zakup nadajacy dostep do panelu, biblioteki, notatek i lekcji wideo,
- `/logowanie` - logowanie admina kodem z `ADMIN_ACCESS_CODE`,
- `/biblioteka` - prywatna biblioteka widoczna po aktywnej sesji,
- `/panel` - prywatny panel kursow widoczny po aktywnej sesji.

Linki `Biblioteka` i `Panel` pojawiaja sie w menu dopiero po zalogowaniu. Bezposrednie
wejscie na te adresy bez sesji przekierowuje do logowania. Po zalogowaniu uzytkownik
wraca na wybrana strone.

Domyslny testowy kod admina, jesli nie zmienisz go w `.env`:

```txt
admin-test-access
```

To jest tylko tryb testowy oparty na podpisanym ciasteczku. Nie ma jeszcze stalego konta
uzytkownika w PostgreSQL ani prawdziwej platnosci. Przed produkcja zmien
`ADMIN_ACCESS_CODE` i `ACCESS_SESSION_SECRET`, a nastepnie wdroz konta, zapis uprawnien
w bazie oraz operatora platnosci.

## 5. Nginx Proxy Manager

Kontener strony jest podlaczony do zewnetrznej sieci Docker `proxy`.

W Nginx Proxy Manager ustaw:

```txt
Scheme: http
Forward Hostname / IP: strona-filipa-strona-1
Forward Port: 3000
```

Opcje:

```txt
Block Common Exploits: ON
Websockets Support: ON
Cache Assets: OFF
```

SSL:

```txt
Request a new SSL Certificate
Force SSL: ON
HTTP/2 Support: ON
```

Jesli Twoj Nginx Proxy Manager uzywa innej sieci niz `proxy`, sprawdz:

```bash
docker network ls
docker ps --format "table {{.Names}}\t{{.Networks}}"
```

I zmien nazwe sieci w `docker-compose.yml`.

## 6. Aktualizacja

```bash
cd /home/ubuntu/strona-filipa
git pull origin main
docker compose up -d --build
docker compose ps
```

Jesli `git pull` zglasza lokalne zmiany w `docker-compose.yml`, najpierw sprawdz je:

```bash
git status --short
git diff -- docker-compose.yml
```

Jesli jest to tylko stara, lokalna zmiana sieci `proxy`, ktora znajduje sie juz w repozytorium, odloz plik przed aktualizacja:

```bash
git stash push -m "vps-compose-przed-aktualizacja" -- docker-compose.yml
git pull origin main
docker compose up -d --build
```

## 7. Diagnostyka

```bash
docker compose ps
docker compose logs -f strona
docker compose logs -f postgres
curl -I http://127.0.0.1:3010
```

Po domenie:

```bash
curl -I https://twojadomena.pl
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
