# Xeno Copilot Walkthrough Transcript

Hi, I am going to walk you through Xeno Copilot, which is my submission for the engineering assignment.

I did not build a generic CRM. I focused on one deep AI-native workflow: a marketer speaks a business goal in natural language, and the system turns that goal into a segment, a campaign plan, launch actions, live callbacks, and a final summary.

I will start on the AI Copilot screen. This is the primary experience. On the left, I can type a goal such as, "Increase repeat purchases from customers who bought in the last 90 days but have not returned in 30 days." When I click build, the AI does more than generate copy. It understands the brief, identifies the right audience, recommends a channel, explains why that channel was selected, creates WhatsApp, SMS, and Email versions, and estimates the campaign impact.

That is the key product choice in this submission: the AI is making marketing decisions, not just writing text.

I also added quick prompt chips so the demo can move quickly. I can refresh the demo data first if I want a clean seeded workspace, then I can launch the campaign. Once I launch, the CRM stores the campaign, and the separate channel service starts simulating the delivery flow in the background.

That separation is intentional. The CRM never talks directly to itself for delivery events. The backend sends the audience to the channel service, and the channel service posts callbacks back into the webhook API. That lets me demonstrate a realistic event-driven architecture with idempotency keys, retries, duplicate events, and out-of-order callback handling.

Now I will show the live campaign panel. As the simulator runs, I can watch SENT, DELIVERED, OPENED, CLICKED, and PURCHASED events appear. If a callback arrives twice, the backend ignores the duplicate by checking the idempotency key. When the simulation completes, the campaign summary gets recomputed and the revenue impact is updated.

Next, I will open the Customers screen. This view is intentionally simple but useful. I can search customers by name, email, city, or tag, and I can filter by preferred channel and loyalty tier. I can also add a new customer, edit the active profile, or soft-delete it from the list without losing campaign history. When I click a customer, I get the full profile on the right, including lifetime spend, last order date, tags, and order history. This supports the marketing use case without turning the app into a sales CRM or a support tool.

Then I will open the Campaigns dashboard. Here I can see persisted campaign records with status, metrics, audience preview, generated copy, reasoning, and summary data. I can also filter campaigns by status and open a detailed campaign card to inspect the AI output. This makes it easy to explain what the system decided and what it chose not to do.

The final screen is the Communication Timeline. This is where the system design story becomes visible. I can choose a campaign and see the event stream in order, along with the customer who triggered each event, the event type, the timestamp, the idempotency key, and the source. The timeline is the cleanest way to show that the application is event-driven and that campaign state changes because of real callback events.

From an engineering perspective, I kept the architecture separated into three pieces: the frontend, the CRM backend, and the channel simulator. That gave me a cleaner mental model, clearer tradeoffs, and a more believable demo. I also kept authentication deliberately light because the assignment asked for depth over breadth, and the main value here is the AI workflow and the system design behind it.

For the user experience, I focused on motion, contrast, and clarity. The UI uses a dark, polished visual system, animated panels, live stats, and a conversation-first layout so the product feels like an intelligent operator rather than a dashboard full of forms.

To summarize the tradeoff: I chose one excellent AI marketing workflow over many shallow CRM features. I built the audience logic, campaign planning, message generation, launch flow, live callbacks, and result summary because that is what best matches the assignment and what I wanted the reviewer to remember.

That is Xeno Copilot. It turns business goals into campaigns.
