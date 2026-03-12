# API Examples

## Simulate a Caller

```bash
curl -X POST http://localhost:3000/simulate/call \
  -H "Content-Type: application/json" \
  -d '{
    "phone":"+19025551212",
    "callerName":"Taylor",
    "message":"I need a compact SUV under $40000 and call me in the afternoon",
    "persona":"concierge",
    "optInFollowUp":true
  }'
```

## Fetch Summary

```bash
curl http://localhost:3000/admin/summary
```

## Fetch Showroom Brochure Metadata

```bash
curl http://localhost:3000/showroom/2025-honda-cr-v/brochure
```

## Fetch Showroom Walkaround Metadata

```bash
curl http://localhost:3000/showroom/2025-honda-cr-v/walkaround
```

## Update a Lead Callback Window

```bash
curl -X POST http://localhost:3000/admin/leads/<leadId>/callback-window \
  -H "Content-Type: application/json" \
  -d '{
    "label":"afternoon",
    "startHour":12,
    "endHour":17
  }'
```
