# Wdrozenie na VPS

Instrukcja dotyczy repozytorium:
`https://github.com/JTK12345/strona-filipa.git`.

Model dostepu nie uzywa platnosci. Administrator generuje kody i
dodaje materialy w panelu, a uzytkownik wpisuje kod na stronie.

## 1. Wymagania

- Ubuntu z Docker Engine i `docker compose`,
- Nginx Proxy Manager w zewnetrznej sieci Docker `proxy`,
- publiczna domena HTTPS,
- wolne miejsce na pliki wideo i dokumenty,
- backup bazy oraz katalogu `data/videos` poza VPS.

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

Minimalny przyklad `.env` dla domeny `profil-ciala.jtk.ovh`:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=kontakt@example.com
SMTP_PASS=tu_wpisz_haslo_smtp
MAIL_TO=kontakt@example.com
MAIL_FROM="Swiadomy Profil Ciala <kontakt@example.com>"
NEXT_PUBLIC_TURNSTILE_SITE_KEY=tu_wpisz_site_key
TURNSTILE_SECRET_KEY=tu_wpisz_secret_key

POSTGRES_DB=strona_db
POSTGRES_USER=strona_user
POSTGRES_PASSWORD=tu_wpisz_pierwszy_losowy_sekret
DATABASE_URL=postgresql://strona_user:tu_wpisz_pierwszy_losowy_sekret@postgres:5432/strona_db
DATABASE_POOL_MAX=10
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=tu_wpisz_haslo_admina

APP_URL=https://profil-ciala.jtk.ovh
VIDEO_STORAGE_PATH=/data/videos
VIDEO_STORAGE_HOST_PATH=./data/videos
LIBRARY_STORAGE_PATH=

ALLOWED_ORIGINS=https://profil-ciala.jtk.ovh
TRUSTED_PROXY_SECRET=tu_wpisz_drugi_losowy_sekret
LOG_SALT=tu_wpisz_trzeci_losowy_sekret
```

Nie zapisuj `.env` w Git. Nie wysylaj jego tresci w rozmowie ani na zrzucie
ekranu.

### Co wpisac w `.env`

Plik `.env` ustawiasz tylko na VPS. Nie wrzucaj go do GitHuba i nie wysylaj
nikomu calej tresci. Najlatwiej edytowac go tak:

```bash
cd /home/ubuntu/strona-filipa
nano .env
```

#### 1. Wygeneruj sekrety

Wpisz trzy razy:

```bash
openssl rand -hex 32
```

Otrzymane wartosci wklej do:

```env
POSTGRES_PASSWORD=pierwszy_wygenerowany_sekret
TRUSTED_PROXY_SECRET=drugi_wygenerowany_sekret
LOG_SALT=trzeci_wygenerowany_sekret
```

Ten sam `POSTGRES_PASSWORD` musi byc tez w `DATABASE_URL`.

#### 2. Baza danych

Te wartosci moga zostac prawie jak w przykladzie. Zmien tylko haslo.

```env
POSTGRES_DB=strona_db
POSTGRES_USER=strona_user
POSTGRES_PASSWORD=pierwszy_wygenerowany_sekret
DATABASE_URL=postgresql://strona_user:pierwszy_wygenerowany_sekret@postgres:5432/strona_db
DATABASE_POOL_MAX=10
```

Nie zmieniaj hosta `postgres`, jesli uzywasz tego `docker-compose.yml`.
To nazwa kontenera bazy w sieci Docker.

#### 3. Domena strony

Wpisz publiczny adres strony z `https://`:

```env
APP_URL=https://profil-ciala.jtk.ovh
ALLOWED_ORIGINS=https://profil-ciala.jtk.ovh
```

Jesli uzywasz innej domeny, wpisz ja w obu miejscach. Te dwie wartosci zwykle
sa takie same.

`APP_URL` jest uzywane miedzy innymi do linkow resetu hasla. Jesli mail z
resetem ma link zaczynajacy sie od `0.0.0.0:3000`, to znaczy, ze `APP_URL` jest
brakujace albo bledne.

#### 4. Poczta SMTP

To odpowiada za wysylke maili systemowych, na przyklad reset hasla i
powiadomienie o nowym zgloszeniu.

```env
SMTP_HOST=smtp.twojadomena.pl
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=kontakt@swiadomyprofilciala.pl
SMTP_PASS=haslo_smtp_albo_haslo_aplikacji
MAIL_TO=kontakt@swiadomyprofilciala.pl
MAIL_FROM="Swiadomy Profil Ciala <kontakt@swiadomyprofilciala.pl>"
```

Typowe ustawienia:

- port `587` -> `SMTP_SECURE=false`,
- port `465` -> `SMTP_SECURE=true`.

`SMTP_USER` to konto, przez ktore aplikacja wysyla maile. `MAIL_FROM` to nazwa
i adres widoczne dla odbiorcy. Najbezpieczniej uzyc tego samego adresu w
`SMTP_USER`, `MAIL_TO` i w nawiasie w `MAIL_FROM`.

#### 5. Pliki, filmy i biblioteka

Zostaw tak:

```env
VIDEO_STORAGE_PATH=/data/videos
VIDEO_STORAGE_HOST_PATH=./data/videos
LIBRARY_STORAGE_PATH=
```

`VIDEO_STORAGE_PATH` to sciezka widziana przez aplikacje w kontenerze.
`VIDEO_STORAGE_HOST_PATH` to folder na VPS obok projektu. Pusta wartosc
`LIBRARY_STORAGE_PATH` oznacza, ze biblioteka korzysta z tego samego miejsca co
filmy.

Przed startem utworz folder:

```bash
mkdir -p data/videos backups
```

#### 6. Konto administratora

Te dane tworza albo aktualizuja glowne konto admina przy starcie kontenera:

```env
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=tu_wpisz_mocne_haslo_admina
```

Zmien oba pola na prawdziwy e-mail i mocne haslo. Nie zostawiaj przykladowego
hasla.

#### 7. Cloudflare Turnstile

To zabezpieczenie formularzy przed spamem.

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=tu_wpisz_site_key
TURNSTILE_SECRET_KEY=tu_wpisz_secret_key
```

Klucze bierzesz z panelu Cloudflare Turnstile:

- `Site key` wpisz jako `NEXT_PUBLIC_TURNSTILE_SITE_KEY`,
- `Secret key` wpisz jako `TURNSTILE_SECRET_KEY`.

#### 8. Sekret zaufanego proxy

```env
TRUSTED_PROXY_SECRET=drugi_wygenerowany_sekret
```

Te sama wartosc musisz wpisac w Nginx Proxy Manager w zakladce Advanced:

```nginx
proxy_set_header X-Trusted-Proxy-Secret "drugi_wygenerowany_sekret";
```

#### 9. Szybka checklista

Przed uruchomieniem sprawdz:

- `APP_URL` i `ALLOWED_ORIGINS` maja Twoja prawdziwa domene z `https://`,
- `POSTGRES_PASSWORD` jest taki sam w `DATABASE_URL`,
- `SMTP_USER`, `SMTP_PASS` i `MAIL_FROM` pasuja do tej samej skrzynki,
- `DEFAULT_ADMIN_PASSWORD` nie jest wartoscia przykladowa,
- `TRUSTED_PROXY_SECRET` jest taki sam w `.env` i w Nginx Proxy Manager,
- istnieje folder `data/videos`.

Po zapisaniu `.env` przebuduj kontenery:

```bash
docker compose up -d --build
```

## 3. Start i migracje

Utworz katalog na filmy i pliki biblioteki:

```bash
cd /home/ubuntu/strona-filipa
mkdir -p data/videos backups
docker compose up -d --build
docker compose ps
```

Kontener aplikacji automatycznie wykonuje migracje SQL z katalogu
`database/migrations`, w tym migracje kursow, kodow dostepu, biblioteki i
usuniecia dawnego modulu platnosci. Migracja `013_contact_submissions.sql`
dodaje zgloszenia konsultacji widoczne w panelu admina.

Sprawdz:

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

Domyslne konto administratora jest tworzone automatycznie przy starcie
kontenera, po migracjach bazy. Dane ustawiasz w `.env`:

```env
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=tu_wpisz_haslo_admina
```

Uzupelnij `DEFAULT_ADMIN_PASSWORD` wlasnym haslem przed startem. Przy kazdym
`docker compose up` aplikacja ustawi konto z `DEFAULT_ADMIN_EMAIL` jako
aktywnego admina i nada mu haslo z `DEFAULT_ADMIN_PASSWORD`.

Administrator loguje sie przez `/logowanie` i ma dostep do `/panel/admin`.

Opcjonalny reczny reset admina:

```bash
read -s -p "Haslo administratora: " ADMIN_PASSWORD; echo
printf '%s' "$ADMIN_PASSWORD" | docker compose exec -T strona npm run db:create-admin -- --email admin@example.com --password-stdin
unset ADMIN_PASSWORD
```

Nowe konta tworzone przez `/rejestracja` nie dostaja dostepu do narzedzi
administracyjnych. Role admina nadaje i odbiera sie w `/panel/admin`, sekcja
`Użytkownicy`. Panel pokazuje liczbe aktywnych adminow i blokuje odebranie roli
ostatniemu administratorowi.

## 5. Kody dostepu

1. Zaloguj sie jako administrator.
2. Otworz `/panel/admin`.
3. W sekcji `Kody dostepu` wpisz opis, liczbe uzyc i opcjonalna date waznosci.
4. Kliknij `Wygeneruj kod`.
5. Skopiuj kod od razu. Po odswiezeniu panel pokazuje tylko hash/statystyki,
   a nie jawna wartosc kodu.

Uzytkownik:

1. tworzy konto na `/rejestracja` albo loguje sie na `/logowanie`,
2. otwiera `/dostep`,
3. wpisuje otrzymany kod,
4. po aktywacji widzi `/biblioteka` i materialy w `/panel`.

Kod moze zostac wylaczony w panelu admina. Wykorzystany kod nie zabiera
uzytkownikowi juz nadanego dostepu; to tylko blokuje kolejne aktywacje tym
kodem.

## 6. Materialy i upload

Materialy dodaje sie w `/panel/admin`, sekcja `Dodaj film, instrukcje albo
notatke`.

Dozwolone pliki:

- MP4,
- WebM,
- PDF,
- DOCX,
- JPG,
- PNG.

Limit pojedynczego uploadu w kodzie: 600 MB.

Domyslnie pliki sa zapisywane w kontenerze pod `/data/videos`, czyli na hoście
pod `VIDEO_STORAGE_HOST_PATH` (`./data/videos`). Mount w `docker-compose.yml`
musi byc zapisywalny, bo panel admina zapisuje tam nowe pliki.

Opcjonalnie mozna ustawic osobny katalog:

```env
LIBRARY_STORAGE_PATH=/data/library
```

Wtedy trzeba dodac odpowiedni mount do `docker-compose.yml`. Przy domyslnej
konfiguracji nie trzeba tego robic.

Material mozna:

- dodac,
- opublikowac jako szkic lub material widoczny,
- edytowac tytul, opis, tresc i status,
- podmienic plik,
- usunac z widocznej biblioteki.

Pliki nie sa serwowane z `public`. Endpoint sprawdza sesje i aktywny dostep
uzytkownika przed wydaniem pliku.

## 7. Nginx Proxy Manager

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

## 8. Backup przed aktualizacja

Wykonaj backup przed kazda wersja z nowa migracja:

```bash
cd /home/ubuntu/strona-filipa
mkdir -p backups
docker compose exec -T postgres sh -c \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  > "backups/strona-$(date +%Y%m%d-%H%M%S).dump"
tar -czf "backups/storage-$(date +%Y%m%d-%H%M%S).tar.gz" data/videos
ls -lh backups
```

Skopiuj pliki `.dump` i `.tar.gz` poza VPS. Backup na tym samym dysku nie
chroni przed awaria serwera.

### Przywrocenie backupu bazy

Przywracanie nadpisuje aktualna baze. Najpierw zatrzymaj aplikacje, zostawiajac
baze wlaczona:

```bash
cd /home/ubuntu/strona-filipa
docker compose stop strona
```

Przywroc wybrany plik `.dump`:

```bash
docker compose exec -T postgres sh -c \
  'pg_restore --clean --if-exists -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
  < backups/strona-TU_WPISZ_DATE.dump
```

Uruchom aplikacje ponownie:

```bash
docker compose up -d --build
docker compose exec strona node scripts/db-status.mjs
curl http://127.0.0.1:3010/api/health
```

### Przywrocenie plikow storage

Pliki wideo, PDF, DOCX i obrazy sa w `data/videos`. Przywracaj je tylko z
backupu pasujacego do tej samej bazy:

```bash
cd /home/ubuntu/strona-filipa
docker compose stop strona
rm -rf data/videos
tar -xzf backups/storage-TU_WPISZ_DATE.tar.gz
docker compose up -d --build
```

## 9. Reset danych pod produkcje

Uzyj tego, gdy chcesz wyczyscic testowe konta, kursy, materialy, kody,
zgloszenia i postepy przed prawdziwym startem produkcji.

Najpierw zrob backup, nawet jesli myslisz, ze danych testowych nie potrzebujesz:

```bash
cd /home/ubuntu/strona-filipa
mkdir -p backups
docker compose exec -T postgres sh -c \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  > "backups/przed-resetem-$(date +%Y%m%d-%H%M%S).dump"
tar -czf "backups/storage-przed-resetem-$(date +%Y%m%d-%H%M%S).tar.gz" data/videos
ls -lh backups
```

### Opcja A: wyczysc dane, zostaw strukture bazy

To jest zalecana opcja. Nie rusza migracji ani schematu, usuwa tylko dane
aplikacji:

```bash
cd /home/ubuntu/strona-filipa
docker compose stop strona
docker compose exec -T postgres sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' <<'SQL'
TRUNCATE TABLE
  access_code_redemptions,
  access_codes,
  library_item_user_grants,
  access_grants,
  lesson_progress,
  user_notes,
  user_sessions,
  password_reset_tokens,
  contact_submissions,
  admin_audit_events,
  lessons,
  course_modules,
  courses,
  library_items,
  users
RESTART IDENTITY CASCADE;
SQL
docker compose up -d --build
docker compose exec strona node scripts/ensure-default-admin.mjs
docker compose exec strona node scripts/db-status.mjs
curl http://127.0.0.1:3010/api/health
```

Po tym:

- baza ma aktualny schemat,
- lista kursow i materialow jest pusta,
- kody dostepu sa usuniete,
- zgloszenia konsultacji sa usuniete,
- konta uzytkownikow sa usuniete,
- konto admina wraca z `DEFAULT_ADMIN_EMAIL` i `DEFAULT_ADMIN_PASSWORD` w
  `.env`.

### Opcja B: pelny reset wolumenu bazy

To usuwa cala baze razem ze schematem i historia migracji. Po starcie aplikacja
utworzy wszystko od nowa z migracji. Uzywaj tylko, jesli na pewno chcesz
zaczac od pustego wolumenu PostgreSQL.

```bash
cd /home/ubuntu/strona-filipa
docker compose down -v
docker compose up -d --build
docker compose exec strona node scripts/db-status.mjs
curl http://127.0.0.1:3010/api/health
```

`docker compose down -v` usuwa wolumen bazy dla tego projektu. Nie usuwa
folderu `data/videos`, bo to zwykly folder na dysku hosta.

### Wyczyszczenie przeslanych plikow

Jesli chcesz usunac rowniez testowe filmy, PDF, DOCX i obrazy z uploadu:

```bash
cd /home/ubuntu/strona-filipa
docker compose stop strona
rm -rf data/videos/*
docker compose up -d
```

Nie rob tego, jesli w bazie zostaja materialy wskazujace na te pliki. Najlepiej
czyscic storage razem z resetem bazy.

### Checklista po resecie

1. Zaloguj sie na konto admina z `.env`.
2. Otworz `/panel/admin`.
3. Dodaj pierwsze produkcyjne kursy i materialy.
4. Wygeneruj nowy kod testowy.
5. Utworz zwykle konto uzytkownika.
6. Aktywuj kod na `/dostep`.
7. Sprawdz `/panel` i `/biblioteka`.
8. Wyslij testowe zgloszenie z `/umow-konsultacje`.
9. Sprawdz, czy zgloszenie widac w `/panel/admin/zgloszenia`.
10. Usun albo zamknij testowe dane, jesli nie maja zostac.

## 10. Zmiana hasla bazy PostgreSQL

Haslo bazy wystepuje w dwoch miejscach w `.env`:

```env
POSTGRES_PASSWORD=nowe_haslo
DATABASE_URL=postgresql://strona_user:nowe_haslo@postgres:5432/strona_db
```

Te dwie wartosci musza byc zgodne.

### Najprosciej przed produkcja: nowa pusta baza

Jesli i tak resetujesz dane przed startem, najlatwiej:

```bash
cd /home/ubuntu/strona-filipa
nano .env
```

Zmien `POSTGRES_PASSWORD` i haslo w `DATABASE_URL`, zapisz plik, a potem:

```bash
docker compose down -v
docker compose up -d --build
docker compose exec strona node scripts/db-status.mjs
curl http://127.0.0.1:3010/api/health
```

To tworzy nowy wolumen bazy z nowym haslem, odpala migracje i odtwarza admina z
`.env`.

### Zmiana hasla bez kasowania danych

Jesli chcesz zachowac dane, zmien haslo uzytkownika w dzialajacej bazie:

```bash
cd /home/ubuntu/strona-filipa
docker compose exec postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

W konsoli `psql` wpisz, podstawiajac nowe mocne haslo:

```sql
ALTER USER strona_user WITH PASSWORD 'tu_wpisz_nowe_mocne_haslo';
\q
```

Potem edytuj `.env`:

```bash
nano .env
```

Wpisz to samo nowe haslo w:

```env
POSTGRES_PASSWORD=...
DATABASE_URL=postgresql://strona_user:...@postgres:5432/strona_db
```

Na koniec przebuduj aplikacje:

```bash
docker compose up -d --build
docker compose exec strona node scripts/db-status.mjs
curl http://127.0.0.1:3010/api/health
```

Jesli po zmianie hasla aplikacja nie laczy sie z baza, prawie zawsze oznacza
to, ze `POSTGRES_PASSWORD` i haslo w `DATABASE_URL` roznia sie od siebie albo
haslo w samej bazie zostalo ustawione na inna wartosc.

## 11. Aktualizacja z GitHuba

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

## 12. Szybki test po wdrozeniu

1. Otworz strone publiczna i `/kursy`.
2. Zaloguj sie jako administrator.
3. Otworz `/panel/admin`.
4. Wygeneruj kod jednorazowy.
5. Dodaj testowy material tekstowy albo maly PDF.
6. Utworz zwykle konto uzytkownika.
7. Wpisz kod na `/dostep`.
8. Otworz `/biblioteka` i sprawdz, czy material jest widoczny oraz czy
   szczegoly otwieraja sie na osobnej stronie materialu.
9. Wyslij testowe zgloszenie z `/umow-konsultacje`.
10. Otworz `/panel/admin/zgloszenia` i oznacz zgloszenie jako zamkniete.
11. W `/panel/admin/dostepy` cofnij testowy dostep.

## 13. Diagnostyka

```bash
docker compose ps
docker compose logs --tail=200 strona
docker compose logs --tail=100 postgres
docker compose exec strona node scripts/db-status.mjs
curl http://127.0.0.1:3010/api/health
curl -I https://profil-ciala.jtk.ovh
docker ps --format "table {{.Names}}\t{{.Networks}}\t{{.Ports}}"
ls -lah data/videos
```

Najczestsze przyczyny problemow:

- `403 Host nie jest dozwolony` - popraw `ALLOWED_ORIGINS`,
- formularze odrzucane za proxy - sprawdz `X-Trusted-Proxy-Secret`,
- upload nie dziala - sprawdz, czy `VIDEO_STORAGE_HOST_PATH` istnieje i jest
  zapisywalny dla kontenera,
- brak materialu w bibliotece - sprawdz, czy material ma status
  `Opublikowany`,
- brak dostepu u uzytkownika - sprawdz kod, limit uzyc i aktywne granty w
  bazie.
