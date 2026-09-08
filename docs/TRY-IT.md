# Take the five-minute demo tour

Start the demo using the Codespaces button or local instructions in the [README](../README.md). The demo uses sample listings and a real database isolated to your environment. Do not enter real customer details.

1. **Browse as a shopper.** Filter the showroom to SUVs, open the Toyota RAV4 and try its payment estimate. Estimates are illustrative, not financing offers.
2. **Save a vehicle.** Select its heart icon and open Shortlist. This list stays in that browser/device.
3. **Ask for help.** Open the assistant and ask “Which SUVs are under $40,000?” Guided answers use the sample inventory; no AI account is required.
4. **Request a test drive.** Choose a future time on an hour or half-hour. Enter a sample name, an email such as `visitor@example.test`, and a message. Submit and save the private request code shown on the receipt. No email is sent.
5. **Become the staff member.** Click Staff workspace. Use the email and random password printed by `npm run demo` (or retrieve them with `npm run demo:credentials`). Open Leads, inspect the request, and add a note.
6. **Confirm it.** In Test drives, confirm the requested appointment. Then return to the showroom, open My request, and paste the request code. The confirmation is now visible to the shopper.
7. **Explore operations.** Add a sample vehicle in Inventory, edit its price, export the leads, and inspect Settings. Staff changes persist when you restart your demo.
8. **Clean up.** Use My request to delete your sample inquiry and linked appointment. Sign out of Staff when finished. Stop the server with Ctrl+C and stop/delete your codespace if applicable.

## Troubleshooting

- **No page opens:** wait for setup to finish, run `npm run demo`, then use the Ports panel's browser button for port 3000.
- **Forgot the staff password:** run `npm run demo:credentials` inside the same checkout/codespace.
- **“Time has just been requested”:** choose another slot. The demo deliberately prevents simultaneous active appointments in the same slot.
- **“Too many requests”:** wait a minute; the demo retains the app's rate limits.
- **Build fails during download:** check your connection and rerun `npm run demo:setup`. Node 22.22+ is required.
- **Changed dealership mode/settings:** restarting preserves your changes. For a clean demo, stop it, delete only `.demo/`, and run `npm run demo` again.

A Codespaces session is your personal development environment, not a permanently hosted public app. [GitHub documents forwarded ports here](https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace).
