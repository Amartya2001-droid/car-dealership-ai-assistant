# Dealership end-to-end tests

Java 21, Maven, Selenium WebDriver and JUnit 5 drive the actual React interface and Node/SQLite API in headless Chrome. No API keys or hosted services are required. Use **sample data only**: tests create, update, export and delete sample inquiries.

## Run with an isolated local demo

Install JDK 21, Maven, Chrome/Chromium and a matching ChromeDriver (or let Selenium Manager locate/download it). From the repository root:

```bash
npm ci
npm run demo:setup
bash e2e/run-local.sh
```

The script starts the app on port 3198 with a temporary database and randomly generated local credentials. It stops the app and removes its database and private logs on exit. Set `E2E_PORT` to use another available port. The suite runs headlessly in the App checks workflow using a matching Chrome/ChromeDriver pair. JUnit XML reports are in `e2e/target/surefire-reports/` and uploaded by CI; credentials and server logs are not uploaded.

## Run against an existing sample instance

```bash
APP_BASE_URL=http://localhost:3000 mvn -f e2e/pom.xml test
```

`APP_BASE_URL` defaults to `http://localhost:3000` and must be an HTTP(S) origin, without a path. The existing instance must have the standard sample inventory, demo mode enabled, and staff access. This command uses the existing instance's data; prefer the isolated script. Never target production or customer data.

Staff credentials are read privately from `.demo/access.json` by default. To use another demo directory, set `E2E_ACCESS_FILE` to its access file. Alternatively provide **both** `E2E_STAFF_EMAIL` and `E2E_STAFF_PASSWORD` through your environment or CI secret settings. Do not put passwords on command lines, in this README or in reports. The isolated script deliberately ignores existing credential overrides and uses its temporary demo credentials.

Optional `CHROME_BIN` and `CHROMEDRIVER_BIN` select local executables. Maven's `-Dtest=DealershipTest#comparisonErrorAndRepeatedRetryRecoverRealComparison` can select a single test.

## Coverage and failure injection

- Inventory search and empty results, shortlist persistence, vehicle details, payment estimator and similar vehicles.
- Staff inventory creation, price editing and removal from the public showroom by marking unavailable.
- Shopper booking, staff confirmation, shopper status/cancellation, and deletion of the sample request.
- Shopper inquiry submission, staff UI sign-in, lead stage/notes persistence and activity, filtered CSV download, and lead deletion.
- Staff workspace initial failure, second retry failure, recovery to real records, and inventory/appointments navigation.
- Insights failure, seven-day period selection, second failure, retry recovery to real metrics, and return to 30 days.
- Comparison of real inventory, highlight rows, remove/clear controls, initial failure, repeated failure and retry recovery.

Each test gets a fresh browser and a loopback-only Java reverse proxy. The proxy returns HTTP 503 only for the exact API path selected by that test. Everything else, including successful retry responses, is forwarded to the real app. Retry tests check that another request actually failed before clearing the fault. The proxy rewrites the forwarded Origin to the configured app origin so normal same-origin validation remains enabled. No test-only endpoints or failure switches are added to the app.

Assertions use explicit waits rather than fixed sleeps. These tests exercise the browser and local API; they do not validate production hosting, external AI/phone services, or physical Android devices.
