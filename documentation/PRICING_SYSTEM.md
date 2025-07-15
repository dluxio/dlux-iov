# DLUX Dynamic Pricing System

The DLUX onboarding system now features a dynamic pricing mechanism that automatically calculates account creation costs based on current HIVE prices and network conditions.

## Overview

The pricing system automatically updates every hour and uses the following formula:

**Account Creation Cost = (3 × HIVE Price × 1.5) + (0.2 × Average Transfer Cost)**

This ensures that:
- Account creation costs scale with HIVE value
- Network transfer fees are factored into pricing
- Prices remain competitive and fair

## Architecture

### Core Components

1. **PricingService Class** - Handles all pricing logic and data fetching
2. **Database Tables** - Store pricing history and current rates
3. **API Endpoints** - Serve pricing data to frontend
4. **Scheduled Updates** - Hourly price refreshes

### Database Schema

#### `crypto_prices`
- Stores current and historical cryptocurrency prices
- Includes market data from CoinGecko API
- Tracks HIVE, SOL, ETH, MATIC, BNB prices

#### `transfer_costs`
- Network-specific transfer fee estimates
- Real-time gas price monitoring (ETH)
- Network congestion indicators

#### `account_creation_pricing`
- Final calculated pricing for account creation
- Complete crypto rate breakdowns
- Transfer cost inclusions

### Pricing Formula Breakdown

1. **Base Cost**: `3 × Current HIVE Price`
2. **Markup**: `Base Cost × 1.5` (50% markup)
3. **Transfer Fees**: `Average Transfer Cost × 0.2` (20% of avg fees)
4. **Final Cost**: `Markup + Transfer Fee Component`

### Supported Cryptocurrencies

| Symbol | Name | Network | Decimals | Avg Transfer Fee |
|--------|------|---------|----------|------------------|
| SOL | Solana | Solana | 9 | 0.000005 SOL |
| ETH | Ethereum | Ethereum | 18 | Dynamic Gas |
| MATIC | Polygon | Polygon | 18 | 0.01 MATIC |
| BNB | BNB | BSC | 18 | 0.0005 BNB |

## API Endpoints

### GET `/api/onboarding/pricing`
Returns current pricing data for all supported cryptocurrencies.

**Response:**
```json
{
  "success": true,
  "pricing": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "hive_price_usd": 0.3245,
    "account_creation_cost_usd": 1.4601,
    "base_cost_usd": 0.9735,
    "crypto_rates": {
      "SOL": {
        "price_usd": 98.45,
        "amount_needed": 0.014832,
        "transfer_fee": 0.000005,
        "total_amount": 0.014837
      },
      "ETH": {
        "price_usd": 2487.32,
        "amount_needed": 0.000587,
        "transfer_fee": 0.002145,
        "total_amount": 0.002732
      }
    },
    "transfer_costs": {
      "SOL": {
        "avg_fee_crypto": 0.000005,
        "avg_fee_usd": 0.000492,
        "network_congestion": "normal"
      }
    },
    "supported_currencies": ["SOL", "ETH", "MATIC", "BNB"]
  }
}
```

### POST `/api/onboarding/payment/initiate`
Initiates a cryptocurrency payment using current pricing.

**Request:**
```json
{
  "username": "newuser123",
  "cryptoType": "SOL"
}
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "pay_abc123",
    "username": "newuser123",
    "cryptoType": "SOL",
    "amount": 0.014837,
    "amountFormatted": "0.014837 SOL",
    "amountUSD": 1.46,
    "address": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    "memo": "HIVE-newuser123-pay_abc123",
    "expiresAt": "2024-01-15T11:00:00.000Z",
    "network": "Solana",
    "instructions": [
      "Send exactly 0.014837 SOL to the address above",
      "Include the memo: HIVE-newuser123-pay_abc123",
      "Payment expires in 30 minutes",
      "Account will be created automatically after payment confirmation"
    ]
  }
}
```

## Price Update Process

### 1. Data Fetching
- **HIVE Price**: CoinGecko API + Hive blockchain fallback
- **Crypto Prices**: CoinGecko API with fallback rates
- **Transfer Costs**: Network-specific APIs (e.g., Etherscan for gas)

### 2. Calculation
- Apply pricing formula to current HIVE price
- Factor in real-time transfer costs
- Calculate required amounts for each cryptocurrency

### 3. Storage
- Save pricing snapshot to database
- Include timestamp and metadata
- Clean up old data (7-day retention)

### 4. Serving
- API serves latest pricing data
- Fallback to cached data if API fails
- Background updates continue hourly

## Configuration

### Environment Variables

```bash
# Database connection
DATABASE_URL=postgresql://user:pass@localhost:5432/dlux_onboarding

# Alternative database settings
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dlux_onboarding
DB_USER=dlux
DB_PASSWORD=secure_password

# API Keys (optional, for enhanced data)
ETHERSCAN_API_KEY=your_etherscan_key
COINGECKO_API_KEY=your_coingecko_key
```

### Crypto Configuration

Modify `CRYPTO_CONFIG` in `api/onboarding.js` to:
- Add new supported cryptocurrencies
- Update RPC endpoints
- Adjust transfer fee estimates
- Change decimal precision

## Monitoring & Maintenance

### Health Checks
- Monitor pricing update success/failures
- Check database connection status
- Verify API endpoint availability

### Alerts
Set up monitoring for:
- Pricing update failures (>2 hours stale)
- Database connection issues
- Extreme price variations (>50% changes)
- API rate limiting

### Manual Operations

#### Force Price Update
```bash
curl -X POST http://localhost:3001/api/onboarding/update-pricing
```

#### Check Service Status
```bash
curl http://localhost:3001/health
```

#### View Current Pricing
```bash
curl http://localhost:3001/api/onboarding/pricing | jq .
```

## Frontend Integration

### Loading Pricing Data
```javascript
async loadCryptoPricing() {
  const response = await fetch('/api/onboarding/pricing');
  const data = await response.json();
  
  if (data.success) {
    this.hivePriceUSD = data.pricing.hive_price_usd;
    this.accountCreationCostUSD = data.pricing.account_creation_cost_usd;
    this.cryptoPricing = this.formatCryptoRates(data.pricing.crypto_rates);
  }
}
```

### Payment Initiation
```javascript
async initiateCryptoPayment(crypto) {
  const response = await fetch('/api/onboarding/payment/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: this.newUsername,
      cryptoType: crypto.symbol
    })
  });
  
  const data = await response.json();
  if (data.success) {
    this.paymentDetails = data.payment;
    this.monitorPaymentStatus(data.payment.id);
  }
}
```

## Testing

### Run Test Server
```bash
cd api
node test-pricing.js
```

### Test Pricing Endpoint
```bash
curl http://localhost:3001/api/onboarding/pricing
```

### Test Payment Initiation
```bash
curl -X POST http://localhost:3001/api/onboarding/payment/initiate \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","cryptoType":"SOL"}'
```

## Deployment

### Production Setup
1. Set up PostgreSQL database
2. Configure environment variables
3. Deploy API service with process manager (PM2, systemd)
4. Set up monitoring and alerting
5. Configure load balancer if needed

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY api/ ./api/
EXPOSE 3001
CMD ["node", "api/onboarding.js"]
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dlux-onboarding
spec:
  replicas: 3
  selector:
    matchLabels:
      app: dlux-onboarding
  template:
    metadata:
      labels:
        app: dlux-onboarding
    spec:
      containers:
      - name: dlux-onboarding
        image: dlux/onboarding:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
```

## Troubleshooting

### Common Issues

**Price updates failing**
- Check internet connectivity
- Verify CoinGecko API status
- Check database connectivity

**Database connection errors**
- Verify PostgreSQL is running
- Check connection credentials
- Ensure database exists

**Stale pricing data**
- Manual trigger update endpoint
- Check service logs for errors
- Verify scheduled tasks are running

### Debug Commands
```bash
# Check service logs
tail -f /var/log/dlux-onboarding.log

# Test database connectivity
psql $DATABASE_URL -c "SELECT * FROM account_creation_pricing ORDER BY updated_at DESC LIMIT 1;"

# Manual price update
node -e "const {initializeOnboardingService} = require('./api/onboarding.js'); initializeOnboardingService();"
```

## Security Considerations

- API rate limiting implemented
- Input validation on all endpoints
- SQL injection prevention with parameterized queries
- Environment variable protection
- Regular security updates for dependencies

## Performance

### Optimization
- Database indexing on frequently queried columns
- Connection pooling for database access
- Caching for repeated API calls
- Background processing for price updates

### Scaling
- Horizontal scaling supported
- Stateless design allows load balancing
- Database read replicas for high availability
- CDN integration for static assets

---

For additional support or questions, please refer to the [DLUX Documentation](/docs) or contact the development team. 