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

| Zmienna | Co wpisac | Skad wziac |
| --- | --- | --- |
| `SMTP_HOST` | adres serwera poczty, np. `smtp.twojadomena.pl` | panel poczty/hostingu domeny |
| `SMTP_PORT` | zwykle `587` albo `465` | panel poczty; `587` dla STARTTLS, `465` dla SSL |
| `SMTP_SECURE` | `false` dla portu `587`, `true` dla portu `465` | zalezy od portu SMTP |
| `SMTP_USER` | login do skrzynki pocztowej | zwykle pelny adres e-mail, np. `kontakt@swiadomyprofilciala.pl` |
| `SMTP_PASS` | haslo do SMTP | haslo skrzynki albo haslo aplikacji z panelu poczty |
| `MAIL_TO` | adres odbiorcy wiadomosci kontaktowych | adres, na ktory maja przychodzic formularze |
| `MAIL_FROM` | widoczny nadawca maili, np. `"Swiadomy Profil Ciala <kontakt@swiadomyprofilciala.pl>"` | najlepiej ten sam adres co `SMTP_USER` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | publiczny klucz Cloudflare Turnstile | Cloudflare Turnstile, pole Site key |
| `TURNSTILE_SECRET_KEY` | prywatny klucz Cloudflare Turnstile | Cloudflare Turnstile, pole Secret key |
| `POSTGRES_DB` | nazwa bazy, np. `strona_db` | moze zostac wartosc z przykladu |
| `POSTGRES_USER` | uzytkownik bazy, np. `strona_user` | moze zostac wartosc z przykladu |
| `POSTGRES_PASSWORD` | mocne losowe haslo bazy | `openssl rand -hex 32` |
| `DATABASE_URL` | pelny adres bazy | sklada sie z `POSTGRES_USER`, `POSTGRES_PASSWORD`, hosta `postgres`, portu `5432` i `POSTGRES_DB` |
| `DATABASE_POOL_MAX` | maksymalna liczba polaczen aplikacji z baza | zwykle zostaw `10` |
| `DEFAULT_ADMIN_EMAIL` | e-mail glownego admina | adres, ktory ma logowac sie do panelu admina |
| `DEFAULT_ADMIN_PASSWORD` | haslo glownego admina | wymysl mocne haslo; nie uzywaj przykladu |
| `APP_URL` | publiczny adres strony z `https://` | domena z Nginx Proxy Manager, np. `https://profil-ciala.jtk.ovh` |
| `VIDEO_STORAGE_PATH` | sciezka w kontenerze na pliki | zostaw `/data/videos` |
| `VIDEO_STORAGE_HOST_PATH` | sciezka na VPS montowana do kontenera | zwykle `./data/videos` |
| `LIBRARY_STORAGE_PATH` | opcjonalna osobna sciezka w kontenerze dla biblioteki | zostaw puste, jesli biblioteka ma uzywac `VIDEO_STORAGE_PATH` |
| `ALLOWED_ORIGINS` | publiczny adres strony | zwykle ta sama wartosc co `APP_URL` |
| `TRUSTED_PROXY_SECRET` | sekret miedzy Nginx Proxy Manager i aplikacja | `openssl rand -hex 32`; te sama wartosc wpisz w naglowku `X-Trusted-Proxy-Secret` |
| `LOG_SALT` | sekret do bezpieczniejszego hashowania danych w logach | `openssl rand -hex 32` |

Najczesciej zmieniasz tylko: dane SMTP, klucze Turnstile, hasla, `APP_URL`,
`ALLOWED_ORIGINS` i dane admina. Wartosc `DATABASE_URL` musi zawierac to samo
haslo co `POSTGRES_PASSWORD`.

Przyklad dla resetu hasla:

```env
APP_URL=https://profil-ciala.jtk.ovh
SMTP_HOST=smtp.twojadomena.pl
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=kontakt@swiadomyprofilciala.pl
SMTP_PASS=haslo_smtp_albo_haslo_aplikacji
MAIL_FROM="Swiadomy Profil Ciala <kontakt@swiadomyprofilciala.pl>"
```

Jesli link resetu hasla zaczyna sie od `0.0.0.0:3000`, popraw `APP_URL`,
zapisz `.env` i przebuduj kontenery:

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
usuniecia dawnego modulu platnosci.

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

## 9. Aktualizacja z GitHuba

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

## 10. Szybki test po wdrozeniu

1. Otworz strone publiczna i `/kursy`.
2. Zaloguj sie jako administrator.
3. Otworz `/panel/admin`.
4. Wygeneruj kod jednorazowy.
5. Dodaj testowy material tekstowy albo maly PDF.
6. Utworz zwykle konto uzytkownika.
7. Wpisz kod na `/dostep`.
8. Otworz `/biblioteka` i sprawdz, czy material jest widoczny.

## 11. Diagnostyka

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
