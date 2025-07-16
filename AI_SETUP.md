# AI Setup Instructions

## Configurarea API Key-ului pentru Gemini

Pentru a folosi funcționalitatea AI în JSON Explorer, urmează acești pași:

### 1. Obține API Key-ul Gemini (GRATUIT!)

1. Vizitează [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Loghează-te cu contul tău Google
3. Apasă pe "Create API key"
4. Copiază API key-ul generat (va arăta ca: `AIzaSyD...`)

### 2. Configurează API Key-ul în aplicație

Deschide fișierul `src/App.tsx` și găsește linia:

```typescript
const apiKey = "YOUR_GEMINI_API_KEY_HERE"; // Înlocuiește cu API key-ul tău
```

Înlocuiește `"YOUR_GEMINI_API_KEY_HERE"` cu API key-ul tău Gemini.

**Exemplu:**
```typescript
const apiKey = "AIzaSyD_your_actual_key_here"; // Înlocuiește cu API key-ul tău
```

### 3. Limitele gratuite pentru Gemini

- **15 requests per minute** (pe minut)
- **1,500 requests per day** (pe zi)  
- **1 million tokens per minute** (foarte generos!)

### 4. Testarea conexiunii

După ce ai pus API key-ul, pornește aplicația:

```bash
npm run dev
```

Deschide un fișier JSON și încearcă să scrii ceva în panoul AI Assistant (dreapta). Dacă totul funcționează, vei vedea un răspuns de la Gemini.

### 5. Cum funcționează AI Assistant-ul

- **Modifică JSON-ul**: Poți cere AI-ului să modifice structura JSON-ului
- **Analizează datele**: AI-ul poate explica structura datelor
- **Optimizează**: Poate sugera îmbunătățiri ale structurii
- **Validează**: Poate verifica consistența datelor

### 6. Exemple de comenzi

```
"Adaugă un nou câmp 'createdAt' cu timestamp-ul curent"
"Convertește toate valorile numerice la string"
"Redenumește câmpul 'name' în 'fullName'"
"Creează un array cu toate valorile din obiect"
"Explică-mi structura acestui JSON"
"Optimizează această structură JSON"
"Validează dacă acest JSON este corect"
```

### 7. Securitate

**⚠️ Important**: Nu pune API key-ul în repository public! Păstrează-l local sau folosește variabile de mediu.

## Fără API Key?

Dacă nu vrei să folosești AI-ul, aplicația funcționează perfect și fără el - toate celelalte funcții (editare, salvare, istoric) sunt disponibile.

## Troubleshooting

### Problema: "Failed to communicate with AI"
- Verifică dacă API key-ul este corect
- Asigură-te că ai limita de requests disponibilă
- Verifică conexiunea la internet

### Problema: "Invalid API key"
- API key-ul pentru Gemini începe cu `AIzaSy...`
- Verifică dacă nu ai spații în plus
- Regenerează API key-ul din Google AI Studio
