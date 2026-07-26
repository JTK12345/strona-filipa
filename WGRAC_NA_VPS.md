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
ENABLE_TEST_CHECKOUT=true
APP_URL=https://twojadomena.pl

# Przelewy24 pozostaje wylaczone do czasu testow Sandbox.
P24_ENABLED=false
P24_ENV=sandbox
P24_MERCHANT_ID=
P24_POS_ID=
P24_API_KEY=
P24_CRC=

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
- `ENABLE_TEST_CHECKOUT=true` wlacza zakup testowy bez pobierania oplaty.
  Przed uruchomieniem prawdziwych platnosci ustaw `false`.
- Puste dane P24 sa prawidlowe, dopoki `P24_ENABLED=false`. Nie wlaczaj tej
  opcji przed ukonczeniem i sprawdzeniem integracji Sandbox.
- `APP_URL` musi zawierac publiczny adres HTTPS strony bez ukosnika na koncu.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` musi byc dostepny przy budowaniu i uruchamianiu kontenera.
- Po zmianie zmiennych uruchom pelny rebuild obrazu, a nie sam restart kontenera.

## 3. Uruchom strone i baze

`docker-compose.yml` uruchamia dwa kontenery:

- `strona` - aplikacja Next.js,
- `postgres` - baza danych PostgreSQL z trwalym volume `postgres_data`.

Przed uruchomieniem Next.js kontener `strona` automatycznie wykonuje brakujace
migracje z katalogu `database/migrations`. Dane pozostaja w volume
`postgres_data` podczas przebudowy i ponownego tworzenia kontenera aplikacji.

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
docker compose exec strona node scripts/db-status.mjs
curl http://127.0.0.1:3010/api/health
```

Poprawna odpowiedz endpointu:

```json
{"status":"ok","database":"connected"}
```

Pierwsza migracja tworzy tabele uzytkownikow, sesji, kursow, modulow, lekcji,
biblioteki, zakupow, zdarzen platniczych, uprawnien, postepu i notatek.
Kolejne migracje rozszerzaja zamowienia pod operatora platnosci oraz dodaja dwa
pierwsze kursy do katalogu PostgreSQL. Migracje uruchamiaja sie automatycznie
podczas startu kontenera aplikacji.

## 4. Konta, administrator i zakup testowy

Aktualnie dziala system kont i sesji w PostgreSQL:

- `/kursy` - publiczny katalog oferty widoczny bez logowania,
- `/kup` - testowy zakup nadajacy dostep do panelu, biblioteki, notatek i lekcji wideo,
- `/rejestracja` - utworzenie konta z haslem,
- `/logowanie` - logowanie e-mailem i haslem,
- `/biblioteka` - prywatna biblioteka widoczna po aktywnym uprawnieniu,
- `/panel` - panel widoczny po zalogowaniu; bez zakupu pokazuje informacje o braku dostepu.

Link `Panel` pojawia sie po zalogowaniu, a `Biblioteka` dopiero po aktywacji
dostepu. Zakup testowy zapisuje w bazie transakcje i uprawnienie `all_access`.
Nie pobiera prawdziwej oplaty.

Utworz lub zaktualizuj konto administratora po uruchomieniu kontenerow:

```bash
read -s ADMIN_PASSWORD
printf '%s' "$ADMIN_PASSWORD" | docker compose exec -T strona npm run db:create-admin -- --email admin@example.com --password-stdin
unset ADMIN_PASSWORD
```

Zmien `admin@example.com` na swoj adres. Polecenie nie zapisuje jawnego hasla
w historii powloki. Administrator loguje sie na `/logowanie` i omija paywall.

Sesje sa losowymi tokenami. W bazie przechowywany jest tylko ich hash, a hasla
uzytkownikow sa hashowane bcrypt. Przed produkcja trzeba jeszcze podlaczyc
operatora platnosci, webhook i odzyskiwanie hasla.

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

Przed aktualizacja zawierajaca nowa migracje wykonaj backup PostgreSQL:

```bash
cd /home/ubuntu/strona-filipa
mkdir -p backups
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "backups/strona-$(date +%Y%m%d-%H%M%S).dump"
ls -lh backups
```

Nastepnie pobierz kod i przebuduj kontenery:

```bash
cd /home/ubuntu/strona-filipa
git pull origin main
docker compose up -d --build
docker compose ps
```

Sprawdz, czy migracje `002` i `003` zostaly wykonane:

```bash
docker compose exec strona node scripts/db-status.mjs
docker compose logs --tail=100 strona
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
curl http://127.0.0.1:3010/api/health
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
