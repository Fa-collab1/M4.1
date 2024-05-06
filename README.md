# Lösenordsserver

## Beskrivning

Denna server hanterar användarautentisering och sessioner för en webbapplikation. Den tillhandahåller endpoints för registrering, inloggning och åtkomst till skyddade resurser.

## Hur man använder servern

### Registrera en ny användare

För att registrera en ny användare, skicka en POST-förfrågan till endpointen `/register` med användarnamn och lösenord i JSON-format.

**Exempel på förfrågan:**
POST /register
Content-Type: application/json

{
  "firstname": "Nyanländ",
  "lastname": "Vandrare",
  "email": "nyanlandvandare@gmail.com",
  "username": "nyanladvandare",
  "password": "säkertlösenord"
}

**Svar:**

- `200 OK` om registreringen lyckades.
- `400 Bad Request` om användarnamnet redan finns eller om lösenordet inte uppfyller säkerhetskraven.

### Logga in

För att logga in, skicka en POST-förfrågan till endpointen `/login` med användarnamn och lösenord i JSON-format.

**Exempel på förfrågan:**
POST /login
Content-Type: application/json

{
  "username": "befintliganvandare",
  "password": "lösenord"
}
**Svar:**

- `200 OK` med en JWT-token i svaret om inloggningen lyckades.
- `401 Unauthorized` om användarnamnet inte finns eller lösenordet är felaktigt.

### Åtkomst till skyddade resurser

För att få åtkomst till skyddade resurser, skicka en GET-förfrågan till `/protected`, och inkludera den JWT-token som erhållits från inloggningen.

**Exempel på förfrågan:**
GET /protected
Authorization: Bearer din_jwt_token_här

**Svar:**

- `200 OK` om token är giltig och användaren är autentiserad.
- `401 Unauthorized` om token är ogiltig eller saknas.
