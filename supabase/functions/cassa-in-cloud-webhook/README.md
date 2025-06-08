# CassaInCloud Webhook - Supabase Edge Function

Questa Edge Function gestisce i webhook "Conto Chiuso" provenienti da CassaInCloud per automatizzare l'importazione delle vendite in BistroAI.

## 🔧 Configurazione

### Variabili d'Ambiente

Configura le seguenti variabili d'ambiente in Supabase:

```bash
# Secret per verifica HMAC-SHA1
supabase secrets set CASSA_IN_CLOUD_WEBHOOK_SECRET="your-webhook-secret"

# URL e chiavi Supabase (automatiche)
SUPABASE_URL=auto
SUPABASE_SERVICE_ROLE_KEY=auto
```

### Deploy

```bash
# Deploy della funzione
supabase functions deploy cassa-in-cloud-webhook

# Verifica deployment
supabase functions list
```

## 🔗 Endpoint

**URL**: `https://your-project.supabase.co/functions/v1/cassa-in-cloud-webhook`

**Metodo**: `POST`

**Headers richiesti**:
- `Content-Type: application/json`
- `x-cn-signature: sha1=<hmac-signature>`
- `x-cn-operation: BILL/UPDATE` (opzionale)

## 📋 Payload

```json
{
  "bill": {
    "id": "BILL-123",
    "salesPointId": "SP001",
    "closedAt": "2024-01-15T19:30:00Z",
    "totalAmount": 45.50,
    "billNumber": "BILL-123",
    "tableNumber": "15",
    "items": [
      {
        "id": "item1",
        "name": "Pizza Margherita",
        "quantity": 2,
        "unitPrice": 12.00,
        "totalPrice": 24.00,
        "productId": "PIZZA_MARG_001",
        "categoryId": "CAT_PIZZA"
      }
    ]
  },
  "operation": "BILL/UPDATE",
  "timestamp": "2024-01-15T19:30:00Z"
}
```

## 🔒 Sicurezza

### Verifica HMAC-SHA1

Ogni richiesta deve includere una firma HMAC-SHA1 nell'header `x-cn-signature`:

```
x-cn-signature: sha1=<hex-encoded-hmac>
```

La firma viene calcolata su tutto il payload JSON usando il secret configurato.

### CORS

La funzione gestisce automaticamente le richieste CORS con i seguenti header:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type, x-cn-signature, x-cn-operation
```

## 📊 Processamento

### Flusso di Elaborazione

1. **Verifica CORS** - Gestisce richieste OPTIONS
2. **Validazione metodo** - Solo POST accettato
3. **Verifica firma HMAC** - Autenticazione richiesta
4. **Parsing JSON** - Validazione payload
5. **Mapping ristorante** - Conversione salesPointId → restaurantId
6. **Controllo idempotenza** - Verifica se già processato
7. **Salvataggio dati** - Inserimento in database
8. **Trigger ricalcoli** - Aggiornamenti asincroni

### Mapping Dati

- **Punto Vendita → Ristorante**: Usa `cic_sales_point_id` in tabella `restaurants`
- **Prodotto → Piatto**: Usa `cic_product_id` in tabella `dishes`
- **Periodo pasto**: Automatico basato su orario chiusura

### Tabelle Coinvolte

- `sales_data` - Dati vendita aggregati
- `dish_sales_data` - Vendite per singolo piatto
- `cassa_in_cloud_bills_state` - Tracking elaborazione
- `restaurants` - Mapping punti vendita
- `dishes` - Mapping prodotti

## 📈 Monitoraggio

### Logs

```bash
# Visualizza logs in tempo reale
supabase functions logs cassa-in-cloud-webhook

# Filtra per errori
supabase functions logs cassa-in-cloud-webhook --filter="ERROR"
```

### Metriche

- **Webhook ricevuti**: Conteggio totale
- **Errori elaborazione**: Rate di fallimento
- **Tempo risposta**: Performance
- **Prodotti non mappati**: Qualità dati

## 🧪 Testing

### Test Locale

```bash
# Avvia funzione localmente
supabase functions serve cassa-in-cloud-webhook

# Test con script
npm run webhook:simple
```

### Test Produzione

```bash
# Test con cURL
curl -X POST https://your-project.supabase.co/functions/v1/cassa-in-cloud-webhook \
  -H "Content-Type: application/json" \
  -H "x-cn-signature: sha1=generated-signature" \
  -d '{"bill":{"id":"TEST-123"}}'
```

## ⚠️ Troubleshooting

### Errori Comuni

| Codice | Errore | Soluzione |
|--------|--------|----------|
| 401 | Firma mancante | Verifica header `x-cn-signature` |
| 403 | Firma invalida | Controlla secret HMAC |
| 400 | JSON invalido | Verifica formato payload |
| 404 | Ristorante non trovato | Configura mapping `cic_sales_point_id` |
| 409 | Già processato | Normale (idempotenza) |
| 500 | Errore interno | Controlla logs |

### Debug

```sql
-- Verifica configurazione ristorante
SELECT id, name, cic_sales_point_id, webhook_enabled 
FROM restaurants 
WHERE cic_sales_point_id = 'YOUR_SALES_POINT_ID';

-- Controlla stato elaborazione
SELECT * FROM cassa_in_cloud_bills_state 
WHERE bill_id = 'YOUR_BILL_ID';

-- Prodotti non mappati
SELECT * FROM get_unmapped_products_last_days(7);
```

## 🔄 Aggiornamenti

### Deploy Nuova Versione

```bash
# Deploy aggiornamenti
supabase functions deploy cassa-in-cloud-webhook

# Verifica versione
supabase functions list
```

### Rollback

```bash
# Lista versioni
supabase functions list --with-versions

# Rollback a versione precedente
supabase functions deploy cassa-in-cloud-webhook --version=previous
```

---

**Versione**: 1.0.0  
**Compatibilità**: Supabase Edge Functions, CassaInCloud API v2  
**Documentazione**: [README_WEBHOOK.md](../../../README_WEBHOOK.md)