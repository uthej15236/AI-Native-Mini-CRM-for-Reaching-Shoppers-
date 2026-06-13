# Xeno Copilot API

Base URL in local development:

```text
http://localhost:5000/api
```

The backend speaks JSON and uses a simple envelope:

```json
{
  "success": true,
  "message": "Optional message",
  "data": {},
  "meta": {}
}
```

## Health

### `GET /api/health`

Checks whether the backend is up.

Example response:

```json
{
  "success": true,
  "message": "Xeno Copilot API is healthy"
}
```

## Demo Data

### `POST /api/demo/seed`

Resets and reseeds the workspace with customers, orders, campaigns, and communication events.

Useful for the walkthrough and for starting with a known state.

## AI Copilot

### `POST /api/copilot/plan`

Builds an AI campaign plan from a natural-language objective.

Request body:

```json
{
  "objective": "Increase repeat purchases from customers who bought in the last 90 days but have not returned in 30 days."
}
```

The response includes:

- Audience definition
- Segment rule text
- Audience preview
- Recommended channel
- Channel reasoning
- Offer
- Reasoning chain
- WhatsApp, SMS, and Email copy
- Estimated metrics
- Workflow steps

## Customers

### `GET /api/customers`

Returns customer records.

Query params:

- `search`
- `preferredChannel`
- `loyaltyTier`

Example:

```text
/customers?search=ananya&preferredChannel=WhatsApp&loyaltyTier=Platinum
```

### `POST /api/customers`

Creates a customer profile.

Request body:

```json
{
  "name": "Ananya Rao",
  "email": "ananya.rao@northstar.in",
  "phone": "+91 98765 12001",
  "preferredChannel": "WhatsApp",
  "totalSpend": 9200,
  "lastOrderDate": "2026-06-13",
  "city": "Bengaluru",
  "loyaltyTier": "Platinum",
  "tags": ["vip", "mobile-first"]
}
```

### `PATCH /api/customers/:customerId`

Updates an existing customer profile.

Request body accepts any of the same fields as create. The frontend uses this for the `Edit customer` action.

### `DELETE /api/customers/:customerId`

Soft-deletes a customer from the active audience.

The profile is removed from the customers list, but campaign history stays intact.

### `GET /api/customers/:customerId`

Returns one customer plus their order history.

## Campaigns

### `GET /api/campaigns`

Returns all campaign records.

### `GET /api/campaigns/:campaignId`

Returns one campaign by campaign id.

### `GET /api/campaigns/:campaignId/events`

Returns the event stream for a single campaign.

The response includes populated customer information so the timeline can show who each event belongs to.

### `POST /api/campaigns/launch`

Launches a campaign from an AI objective.

Request body:

```json
{
  "objective": "Increase repeat purchases from customers who bought in the last 90 days but have not returned in 30 days."
}
```

This endpoint:

1. Builds the plan
2. Stores the campaign
3. Sends the audience to the channel service
4. Returns the campaign and the plan

## Dashboard

### `GET /api/dashboard/overview`

Returns the workspace overview.

This includes:

- Customer count
- Order count
- Campaign count
- Active and completed campaigns
- Estimated revenue
- Open, click, and purchase rates
- Recent campaigns
- Recent events
- Channel performance

## Webhooks

### `POST /api/webhooks/channel-event`

Receives event callbacks from the channel service.

Headers:

```text
x-xeno-webhook-secret: <secret>
```

### `POST /api/webhooks/channel-finished`

Receives the finish callback once the channel service finishes the simulation.

## Channel Service

The channel simulator runs as a separate service on port `5100`.

### `GET /api/health`

Health check for the simulator.

### `POST /api/simulations`

Starts a campaign simulation.

The backend sends this request after a campaign is launched.

The simulator emits:

- `SENT`
- `DELIVERED`
- `FAILED`
- `OPENED`
- `READ`
- `CLICKED`
- `PURCHASED`

It also tests:

- Duplicate events
- Retry behavior
- Out-of-order callbacks
- Partial failures
- Idempotency keys
