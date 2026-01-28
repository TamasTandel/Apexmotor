# Frontend Documentation

The frontend is a Next.js application using Tailwind CSS for styling.

## Key Directories

- `app/`: Next.js App Router pages and layouts.
- `components/`: Reusable UI components.
- `lib/`: Utility functions and hooks.

## Key Components

### Navbar (`components/Navbar.js`)
The main navigation bar. Handles:
- User role display (Admin/User).
- Navigation links.
- Mobile menu toggle.
- Inventory filters toggle (on `/cars` route).

### Filters (`app/cars/filters.js`)
The sidebar filters component for the inventory page. Manages state for:
- Make, Body Type, Category
- Price Range
- Search Query
- Sorting

### ListClient (`app/cars/ListClient.js`)
Client-side component for rendering the list of cars with infinite scroll support.

## Styling

- **Tailwind CSS**: Used for utility-first styling.
- **Global Styles**: Defined in `app/globals.css`.
- **Sidebar**: The inventory sidebar uses custom CSS in `globals.css` to handle visibility and transitions based on the `data-filters-open` attribute.

## State Management

- **URL Search Params**: Used for filtering and pagination to ensure shareable URLs.
- **Local Storage**: Used for persisting user preferences (like filters) and auth tokens.

## Development

Run `npm run dev` to start the development server.
