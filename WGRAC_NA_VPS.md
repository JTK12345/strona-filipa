# Wdrozenie na VPS

Instrukcja dotyczy repozytorium:
`https://github.com/JTK12345/strona-filipa.git`.

## 1. Wymagania

- Ubuntu z Docker Engine i `docker compose`,
- Nginx Proxy Manager w zewnetrznej sieci Docker `proxy`,
- publiczna domena HTTPS,
- minimum kilkanascie GB wolnego miejsca poza miejscem na filmy,
- osobny backup bazy i filmow poza tym VPS.

Sprawdz:

```bash
docker --version
docker compose version
docker network inspect proxy >/dev/null 2>&1 || docker network create proxy
```

## 2. Pierwsza instalacja

```bash
cd /home/ubuntu
git clone https://github.com/JTK12345/strona-filipa.git
cd strona-filipa
cp .env.example .env
```

Wygeneruj trzy rozne sekrety:

```bash
openssl rand -hex 32
openssl rand -hex 32
openssl rand -hex 32
```

Pierwszy ustaw jako `POSTGRES_PASSWORD`, drugi jako
`TRUSTED_PROXY_SECRET`, a trzeci jako `LOG_SALT`. Haslo bazy wpisz takze w
`DATABASE_URL`.

Edytuj konfiguracje:

```bash
nano .env
```

Minimalny przyklad dla domeny `profil-ciala.jtk.ovh`:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=kontakt@example.com
SMTP_PASS=tu_wpisz_haslo_smtp
MAIL_TO=kontakt@example.com
MAIL_FROM="Formularz kontaktowy <kontakt@example.com>"
NEXT_PUBLIC_TURNSTILE_SITE_KEY=tu_wpisz_site_key
TURNSTILE_SECRET_KEY=tu_wpisz_secret_key

POSTGRES_DB=strona_db
POSTGRES_USER=strona_user
POSTGRES_PASSWORD=tu_wpisz_pierwszy_losowy_sekret
DATABASE_URL=postgresql://strona_user:tu_wpisz_pierwszy_losowy_sekret@postgres:5432/strona_db
DATABASE_POOL_MAX=10

APP_URL=https://profil-ciala.jtk.ovh
VIDEO_STORAGE_PATH=/data/videos
VIDEO_STORAGE_HOST_PATH=./data/videos

P24_ENABLED=false
P24_ENV=sandbox
P24_MERCHANT_ID=
P24_POS_ID=
P24_API_KEY=
P24_CRC=
P24_HTTP_TIMEOUT_MS=8000
TEST_PAYMENTS_ENABLED=false
TEST_PAYMENT_EMAILS=

ALLOWED_ORIGINS=https://profil-ciala.jtk.ovh
TRUSTED_PROXY_SECRET=tu_wpisz_drugi_losowy_sekret
LOG_SALT=tu_wpisz_trzeci_losowy_sekret
```

Nie zapisuj `.env` w Git. Nie wysylaj jego tresci w rozmowie ani na zrzucie
ekranu.

## 3. Start i migracje

Utworz katalog filmow i uruchom caly stack:

```bash
cd /home/ubuntu/strona-filipa
mkdir -p data/videos/kregoslup data/videos/kark-barki backups
docker compose up -d --build
docker compose ps
```

Kontener aplikacji automatycznie wykonuje migracje `001`-`005` przed startem
Next.js. Sprawdz:

```bash
docker compose exec strona node scripts/db-status.mjs
docker compose logs --tail=150 strona
curl http://127.0.0.1:3010/api/health
```

Poprawna odpowiedz:

```json
{"status":"ok","database":"connected"}
```

Port `3010` jest zwiazany tylko z `127.0.0.1`, wiec nie wystawia aplikacji
bezposrednio do internetu.

## 4. Administrator

Utworz administratora dla ustalonego adresu:

```bash
read -s -p "Haslo administratora: " ADMIN_PASSWORD; echo
printf '%s' "$ADMIN_PASSWORD" | docker compose exec -T strona npm run db:create-admin -- --email lokiju12345@wp.pl --password-stdin
unset ADMIN_PASSWORD
```

Brak znakow podczas wpisywania hasla jest prawidlowy. `unset` usuwa haslo z
biezacej zmiennej powloki po przekazaniu go do kontenera. W bazie jest tylko
hash bcrypt.

Administrator loguje sie przez `/logowanie` i ma dostep do `/panel/admin`.

## 5. Nginx Proxy Manager

W Proxy Host ustaw:

```txt
Domain Names: profil-ciala.jtk.ovh
Scheme: http
Forward Hostname / IP: profil-ciala
Forward Port: 3000
Cache Assets: OFF
Block Common Exploits: ON
Websockets Support: ON
```

`profil-ciala` jest stalym aliasem sieciowym z `docker-compose.yml`. Nie uzywaj
nazwy typu `strona-filipa-strona-1`, bo moze zmienic sie po odtworzeniu
kontenera.

W zakladce Advanced dodaj naglowek z ta sama wartoscia co
`TRUSTED_PROXY_SECRET` w `.env`:

```nginx
proxy_set_header X-Trusted-Proxy-Secret "TU_WPISZ_TEN_SAM_SEKRET";
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $remote_addr;
```

W SSL:

```txt
Request a new SSL Certificate
Force SSL: ON
HTTP/2 Support: ON
```

Po zapisie:

```bash
curl -I https://profil-ciala.jtk.ovh
```

Odpowiedz powinna zawierac CSP, HSTS, `X-Frame-Options: DENY`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy` i `Permissions-Policy`.

## 6. Filmy na VPS

Filmy trzymaj pod `data/videos`, nigdy w `public` ani w repozytorium.
Przyklad:

```bash
cp /sciezka/do/punkt-wyjscia.mp4 \
  /home/ubuntu/strona-filipa/data/videos/kregoslup/punkt-wyjscia.mp4
```

Przypisz plik do lekcji:

```bash
docker compose exec strona npm run db:set-video -- \
  --course kregoslup-bez-przeciazen \
  --lesson punkt-wyjscia \
  --file kregoslup/punkt-wyjscia.mp4 \
  --duration 720
```

Kontener widzi filmy tylko do odczytu. Endpoint filmu sprawdza sesje, dostep do
kursu, sciezke pliku oraz zakres HTTP potrzebny do przewijania.

## 7. Backup przed aktualizacja

Wykonaj backup przed kazda wersja z nowa migracja:

```bash
cd /home/ubuntu/strona-filipa
mkdir -p backups
docker compose exec -T postgres sh -c \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  > "backups/strona-$(date +%Y%m%d-%H%M%S).dump"
ls -lh backups
```

Skopiuj plik `.dump` i katalog `data/videos` poza VPS. Backup na tym samym
dysku nie chroni przed awaria serwera.

Przywracanie wymaga okna serwisowego:

```bash
docker compose stop strona
docker compose exec -T postgres sh -c \
  'dropdb -U "$POSTGRES_USER" --if-exists "$POSTGRES_DB" && createdb -U "$POSTGRES_USER" "$POSTGRES_DB"'
docker compose exec -T postgres sh -c \
  'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists' \
  < backups/NAZWA_PLIKU.dump
docker compose start strona
```

Najpierw przetestuj odtwarzanie na kopii, nie na jedynej bazie.

## 8. Aktualizacja z GitHuba

```bash
cd /home/ubuntu/strona-filipa
git status --short
git pull origin main
docker compose up -d --build
docker compose ps
docker compose exec strona node scripts/db-status.mjs
curl http://127.0.0.1:3010/api/health
```

Jesli `git pull` zatrzyma sie przez lokalny `docker-compose.yml`:

```bash
git diff -- docker-compose.yml
git stash push -m "vps-przed-aktualizacja" -- docker-compose.yml
git pull origin main
docker compose up -d --build
```

Nie uzywaj `git reset --hard`, jezeli nie sprawdziles lokalnych zmian.

## 9. Testy bez Przelewy24

Symulator tworzy prawdziwe zamowienie w bazie, zapisuje wynik oraz nadaje
dostep przez te sama tabele `access_grants`, ale nie laczy sie z bankiem i nie
pobiera pieniedzy. Jest dostepny tylko dla adresow wpisanych w `.env`.

1. W `.env` ustaw:

```env
P24_ENABLED=false
P24_ENV=sandbox
TEST_PAYMENTS_ENABLED=true
TEST_PAYMENT_EMAILS=lokiju12345-test@wp.pl
```

Kilka kont oddziel przecinkami. Nie wpisuj tutaj kont klientow.

2. Przebuduj aplikacje:

```bash
docker compose up -d --build
```

3. Wlacz sprzedaz testowanych kursow:

```bash
docker compose exec strona npm run db:set-sales -- \
  --course kregoslup-bez-przeciazen --enable
docker compose exec strona npm run db:set-sales -- \
  --course kark-barki-praca-siedzaca --enable
```

4. Przez `/rejestracja` utworz zwykle konto
   `lokiju12345-test@wp.pl`. Nie uzywaj konta administratora, bo administrator
   ma dostep do wszystkich kursow bez zakupu.
5. Zaloguj sie tym kontem, otworz `/kup`, zaakceptuj zgody i kliknij
   `Przejdz do symulatora`.
6. Sprawdz oba scenariusze:

- `Zasymuluj sukces` - zamowienie otrzyma status `paid`, a kurs pojawi sie w
  panelu i bibliotece,
- `Zasymuluj odrzucenie` - zamowienie otrzyma status `failed`, bez dostepu do
  kursu.

Po testach wylacz tryb:

```env
TEST_PAYMENTS_ENABLED=false
TEST_PAYMENT_EMAILS=
```

Nastepnie wykonaj `docker compose up -d --build`. Tryb testowy jest dodatkowo
automatycznie blokowany, gdy `P24_ENABLED=true` albo `P24_ENV=production`.

## 10. Przelewy24 Sandbox

Sandbox nie pobiera prawdziwych pieniedzy. Zgodnie z oficjalna dokumentacja P24
potrzebne sa `posId`, klucz API, CRC oraz w razie wymagania publiczny adres IP
VPS wpisany w panelu P24:
https://developers.przelewy24.pl/

1. W panelu P24 utworz/skonfiguruj konto Sandbox.
2. W sekcji danych API Sandbox odczytaj Merchant ID, POS ID, API key i CRC.
3. Wpisz publiczny IPv4 VPS w konfiguracji API P24, jezeli panel tego wymaga.
4. W `.env` ustaw:

```env
P24_ENABLED=true
P24_ENV=sandbox
P24_MERCHANT_ID=...
P24_POS_ID=...
P24_API_KEY=...
P24_CRC=...
```

5. Przebuduj aplikacje:

```bash
docker compose up -d --build
```

6. Zaloguj sie jako administrator, otworz `/panel/admin`, sekcje Przelewy24 i
   kliknij `Sprawdz dostep API`.
7. Dopiero po komunikacie sukcesu wlacz sprzedaz wybranych kursow:

```bash
docker compose exec strona npm run db:set-sales -- \
  --course kregoslup-bez-przeciazen --enable
docker compose exec strona npm run db:set-sales -- \
  --course kark-barki-praca-siedzaca --enable
```

Wylaczenie sprzedazy:

```bash
docker compose exec strona npm run db:set-sales -- \
  --course kregoslup-bez-przeciazen --disable
docker compose exec strona npm run db:set-sales -- \
  --course kark-barki-praca-siedzaca --disable
```

Przetestuj w Sandboxie:

- poprawna platnosc i automatyczny dostep,
- anulowanie albo brak zaplaty bez dostepu,
- ponowiona notyfikacja bez podwojnego grantu,
- zgodnosc kwoty i kursu w panelu administratora,
- widocznosc kursu po ponownym zalogowaniu.

Testy automatyczne pokrywaja bledny podpis, zla kwote, duplikat i `orderId`
typu int64, ale nie zastepuja prawdziwego testu Sandbox.

## 11. Przelaczenie na produkcje

Nie zmieniaj `P24_ENV=production`, dopoki:

- konto P24 nie jest zweryfikowane,
- finalny regulamin i polityka prywatnosci nie sa opublikowane,
- tresc zgody na natychmiastowe dostarczenie zostala zatwierdzona,
- e-mail z potwierdzeniem umowy jest gotowy,
- backup i monitoring zostaly sprawdzone,
- pelny scenariusz Sandbox zakonczyl sie poprawnie.

Produkcja wymaga osobnych kluczy API i CRC. Po zmianie wykonaj ponownie test API,
ale przed wlaczeniem `sales_enabled`.

## 12. Diagnostyka

```bash
docker compose ps
docker compose logs --tail=200 strona
docker compose logs --tail=100 postgres
docker compose exec strona node scripts/db-status.mjs
curl http://127.0.0.1:3010/api/health
curl -I https://profil-ciala.jtk.ovh
docker ps --format "table {{.Names}}\t{{.Networks}}\t{{.Ports}}"
```

Najczestsze przyczyny problemow:

- `403 Host nie jest dozwolony` - popraw `ALLOWED_ORIGINS`,
- formularze odrzucane za proxy - sprawdz `X-Trusted-Proxy-Secret`,
- `testAccess` nie dziala - sprawdz dane Sandbox i IP VPS w panelu P24,
- kurs ma przycisk nieaktywny - sprawdz `P24_ENABLED` i `sales_enabled`,
- brak filmu - sprawdz mount `VIDEO_STORAGE_HOST_PATH` i przypisanie lekcji.
