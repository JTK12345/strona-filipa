# Wdrozenie na VPS

## 1. Pobierz projekt z GitHuba

Najwygodniej wdrazac projekt przez GitHuba, a nie przez reczne wrzucanie ZIP-a.

Na VPS przejdz do katalogu, w ktorym ma dzialac projekt, na przyklad:

```bash
cd /home/ubuntu
```

Sklonuj repozytorium:

```bash
git clone https://github.com/JTK12345/strona-filipa.git
cd strona-filipa
```

Przy kolejnych aktualizacjach nie musisz wrzucac projektu od nowa. Wystarczy:

```bash
git pull
docker-compose up -d --build
```

Jesli serwer ma nowszego Dockera, mozesz zamiast tego uzyc:

```bash
git pull
docker compose up -d --build
```

## 2. Wybierz konkretna wersje

Jesli chcesz wdrozyc nie najnowszy kod z `main`, tylko konkretne wydanie, sprawdz dostepne tagi:

```bash
git fetch --tags
git tag
```

Aby przejsc na konkretna wersje, na przyklad `v0.1.1`:

```bash
git checkout v0.1.1
docker-compose up -d --build
```

Na nowszym Dockerze:

```bash
git checkout v0.1.1
docker compose up -d --build
```

Jesli chcesz wrocic z powrotem na najnowszy kod z galezi `main`:

```bash
git checkout main
git pull
docker-compose up -d --build
```

Na nowszym Dockerze:

```bash
git checkout main
git pull
docker compose up -d --build
```

## 3. Alternatywa: rozpakuj paczke ZIP

Na VPS wrzuc paczke ZIP do folderu, w ktorym ma dzialac strona, np.:

```bash
/var/www/profil-ciala
```

Rozpakuj ja tak, zeby w folderze byly pliki `Dockerfile`, `docker-compose.yml`, `package.json`, katalog `app` itd.

## 4. Utworz plik .env

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

Wazne:

- Na VPS trzymaj zmienne w pliku `.env`.
- Klucz `NEXT_PUBLIC_TURNSTILE_SITE_KEY` musi byc dostepny przy budowaniu i uruchamianiu kontenera.
- Po zmianie zmiennych uruchom pelny rebuild obrazu, a nie sam restart kontenera.

## 5. Uruchom strone

```bash
docker compose up -d --build
```

Jesli serwer uzywa starego Dockera:

```bash
docker-compose up -d --build
```

## 6. Sprawdz status

```bash
docker compose ps
docker compose logs -f
```

Lokalnie na VPS aplikacja dziala na:

```txt
http://127.0.0.1:3000
```

Jesli formularze dalej nie wysylaja:

```bash
docker compose logs -f
docker compose exec strona printenv | grep TURNSTILE
docker compose exec strona printenv | grep SMTP
```

Jesli serwer uzywa starego Dockera, zamiast `docker compose` uzyj `docker-compose`.

## 7. Reverse Proxy i sieci Dockera

Jesli strona dziala lokalnie w kontenerze, ale nie otwiera sie przez domene, czestym powodem jest brak wspolnej sieci Dockera z reverse proxy, np. Nginx Proxy Managerem.

Objaw:

- aplikacja dziala w kontenerze,
- proxy jest uruchomione,
- ale proxy nie moze polaczyc sie z Twoim kontenerem po nazwie.

Tymczasowe obejscie:

```bash
docker network connect proxy_default strona-filipa_strona_1
```

To rozwiazanie jest tylko chwilowe. Po `docker compose down` i ponownym uruchomieniu kontenera polaczenie z ta siecia moze zniknac.

Trwale rozwiazanie:

W `docker-compose.yml` dodaj aplikacje do tej samej sieci co proxy. Przykladowo:

```yml
services:
  strona:
    networks:
      - default
      - proxy_default

networks:
  proxy_default:
    external: true
```

Po takiej zmianie Docker sam podlaczy kontener do zewnetrznej sieci proxy przy starcie.

Jesli uzywasz Nginx Proxy Managera, zwykle ustawiasz tam:

- `Forward Hostname`: nazwe kontenera, np. `strona-filipa_strona_1`
- `Forward Port`: `3000`

Po zmianach uruchom ponownie:

```bash
docker compose up -d --build
```

Na starszym Dockerze:

```bash
docker-compose up -d --build
```

## 8. Sprawdz naglowki po wdrozeniu

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
