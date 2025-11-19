# Pokemon Tools

A comprehensive web application for Pokemon team building, analysis, and lookup. Build competitive teams, analyze type coverage, compare stats, and get detailed information about any Pokemon across all generations.

![Pokemon Tools](https://img.shields.io/badge/Pokemon-Tools-red?style=flat-square) ![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square) ![PokeAPI](https://img.shields.io/badge/PokeAPI-v2-green?style=flat-square)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [API Integrations](#api-integrations)
- [Architecture](#architecture)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Overview

Pokemon Tools is a feature-rich web application designed for Pokemon trainers and competitive players. It provides three main functionalities:

1. **Team Builder** - Create and manage Pokemon teams with real-time type coverage analysis
2. **Pokemon Lookup** - Comprehensive Pokemon database with detailed information
3. **Profile Management** - Save and manage multiple teams with cloud storage

The application supports all Pokemon generations (I-IX) and dynamically adjusts type effectiveness based on the selected generation, accounting for type introductions and Pokemon typing changes across generations.

## Features

### Team Builder
- **6-Slot Team Management** - Build teams with up to 6 Pokemon
- **Real-Time Type Coverage Analysis** - Visual representation of offensive and defensive type coverage
- **Stat Comparison** - Compare Pokemon stats (HP, Attack, Defense, Sp. Atk, Sp. Def, Speed)
- **Battle Analysis** - Get recommendations for battling specific opponent Pokemon
- **Generation Support** - Switch between all 9 Pokemon generations
- **Local Storage** - Teams persist in browser localStorage
- **Cloud Storage** - Save teams to Firebase for cross-device access
- **Type Effectiveness Calculator** - Accurate type matchups based on generation

### Pokemon Lookup
- **Comprehensive Pokemon Database** - Access to 1000+ Pokemon
- **Detailed Information Display**:
  - Base stats with visual charts
  - Type effectiveness (offensive and defensive)
  - Evolution chains
  - Abilities
  - Moves (Level-up and TM/HM)
  - Location data
- **Random Pokemon Generator** - Discover new Pokemon randomly
- **Bulbapedia Integration** - Quick links to detailed wiki pages
- **Generation-Aware Typing** - Correct type information for each generation

### Profile & Authentication
- **Multiple Authentication Methods**:
  - Email/Password authentication
  - Google Sign-In
  - GitHub Sign-In
- **Team Management**:
  - Save unlimited teams
  - Load saved teams
  - Delete teams
  - Team previews with Pokemon sprites
- **Account Management**:
  - Profile information display
  - Account deletion with email confirmation
  - Secure logout

## Technologies Used

### Frontend Technologies

#### Core Web Technologies
- **HTML5** - Semantic markup, modern HTML features
- **CSS3** - Advanced styling with:
  - CSS Custom Properties (CSS Variables)
  - Flexbox and Grid layouts
  - Animations and transitions
  - Responsive design patterns
  - Media queries
- **JavaScript (ES6+)** - Modern JavaScript features:
  - ES6 Modules (`import`/`export`)
  - Arrow functions
  - Template literals
  - Destructuring
  - Async/await
  - Promises
  - Classes
  - Map and Set data structures
  - Spread operator
  - Optional chaining

#### JavaScript APIs & Web Standards
- **Fetch API** - HTTP requests to external APIs
- **LocalStorage API** - Client-side data persistence
- **SessionStorage API** - Temporary session data
- **DOM API** - Document Object Model manipulation
- **URLSearchParams API** - URL parameter parsing
- **History API** - Browser history management

### Backend & Cloud Services

#### Firebase (Google Cloud Platform)
- **Firebase Authentication** (v12.6.0)
  - Email/Password authentication
  - Google OAuth provider
  - GitHub OAuth provider
  - Auth state management
  - User session management
- **Cloud Firestore** (NoSQL Database)
  - User document storage
  - Team data persistence
  - Real-time data synchronization
  - Timestamp management
- **Firebase Analytics**
  - User behavior tracking
  - Application analytics
  - Performance monitoring

### External APIs & Services

#### PokeAPI
- **RESTful API** for Pokemon data
- Endpoints used:
  - `/api/v2/pokemon` - Pokemon species data
  - `/api/v2/pokemon/{id}` - Individual Pokemon details
  - `/api/v2/type/{type}` - Type effectiveness data
  - `/api/v2/pokemon-species/{id}` - Species and evolution data
  - `/api/v2/pokemon/{id}/encounters` - Location data
  - `/api/v2/evolution-chain/{id}` - Evolution chain data
- Features:
  - Comprehensive Pokemon database (1000+ Pokemon)
  - Type effectiveness charts
  - Evolution chain data
  - Move data
  - Location information
  - Sprite images

#### Bulbapedia
- **External Wiki Integration**
- Direct links to Pokemon wiki pages
- URL formatting for special Pokemon (regional forms, paradox Pokemon)

### UI Libraries & Assets

#### Font Awesome
- **Version 6.4.0** (via CDN)
- Icon library for UI elements:
  - Navigation icons
  - Action buttons
  - Status indicators
  - Social media icons
  - Pokemon-themed icons

#### Custom Assets
- SVG illustrations (undraw_cat_lqdj.svg for profile placeholders)
- Type icons from Bulbagarden Archives

### Development & Build Tools

#### Version Control
- **Git** - Version control system
- **GitHub** - Repository hosting

#### Deployment
- **GitHub Pages** - Static site hosting
- **CNAME** configuration for custom domain (pokemontools.app)

### Browser Technologies

#### Browser APIs
- **Web Storage APIs**:
  - localStorage - Persistent client-side storage
  - sessionStorage - Session-based storage
- **Fetch API** - Modern HTTP client
- **DOM APIs**:
  - Event handling
  - Element manipulation
  - Dynamic content generation
- **History API** - Navigation management

#### Browser Features
- **ES6 Module Support** - Native JavaScript modules
- **Async/Await** - Asynchronous programming
- **Promise API** - Promise-based async operations
- **Debouncing** - Performance optimization for search inputs

### Data Management

#### Caching Strategies
- **In-Memory Caching**:
  - Pokemon data cache (Map)
  - Species data cache
  - Evolution chain cache
  - Move data cache
  - Location area cache
  - Type chart cache
- **Local Storage** - Persistent team data
- **Session Storage** - Temporary team loading

### Design Patterns & Architecture

#### JavaScript Patterns
- **Module Pattern** - ES6 modules for code organization
- **Class-Based Architecture** - OOP with ES6 classes
- **Event-Driven Programming** - DOM event handling
- **Observer Pattern** - Auth state listeners
- **Singleton Pattern** - Firebase app initialization
- **Factory Pattern** - Pokemon data creation

#### Code Organization
- **Separation of Concerns**:
  - Authentication module (`auth.js`)
  - Team storage module (`team-storage.js`)
  - UI management (`auth-ui.js`, `profile.js`)
  - Main application logic (`main.js`, `lookup.js`)
  - Configuration (`firebase-config.js`)

## Project Structure

```
pokeTools/
├── assets/
│   └── undraw_cat_lqdj.svg          # Profile placeholder image
├── scripts/
│   ├── auth.js                       # Authentication logic
│   ├── auth-ui.js                    # Authentication UI handlers
│   ├── firebase-config.js            # Firebase configuration
│   ├── lookup.js                     # Pokemon lookup functionality
│   ├── main.js                       # Team builder main logic
│   ├── profile.js                     # Profile page logic
│   └── team-storage.js               # Firestore team operations
├── styles/
│   ├── lookup.css                    # Lookup page styles
│   ├── main.css                      # Main application styles
│   └── profile.css                   # Profile page styles
├── CNAME                             # Custom domain configuration
├── index.html                        # Team builder page
├── lookup.html                       # Pokemon lookup page
├── profile.html                      # User profile page
└── README.md                         # This file
```

## Getting Started

### Prerequisites

- Modern web browser with ES6+ support (Chrome, Firefox, Safari, Edge)
- Internet connection (for API calls and CDN resources)
- Firebase project (for authentication and data storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/pokeTools.git
   cd pokeTools
   ```

2. **Set up Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication:
     - Email/Password provider
     - Google provider
     - GitHub provider
   - Create a Firestore database
   - Copy your Firebase configuration

3. **Configure Firebase**
   - Open `scripts/firebase-config.js`
   - Replace the `firebaseConfig` object with your Firebase project configuration:
   ```javascript
   const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_AUTH_DOMAIN",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_STORAGE_BUCKET",
       messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
       appId: "YOUR_APP_ID",
       measurementId: "YOUR_MEASUREMENT_ID"
   };
   ```

4. **Deploy**
   - For local development: Use a local web server (e.g., `python -m http.server` or `npx serve`)
   - For production: Deploy to GitHub Pages or your preferred hosting service

### Local Development

```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js (with npx)
npx serve

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## Usage

### Team Builder

1. **Select Generation**: Choose the Pokemon generation from the dropdown
2. **Add Pokemon**: 
   - Type a Pokemon name in the search box
   - Click on a Pokemon from the results to add it to your team
3. **View Type Coverage**: The type coverage section shows your team's offensive and defensive capabilities
4. **Compare Stats**: Select a stat from the dropdown to compare your team members
5. **Battle Analysis**: Search for an opponent Pokemon to see matchup recommendations
6. **Save Team**: Sign in to save your team to the cloud

### Pokemon Lookup

1. **Search Pokemon**: Type a Pokemon name or use the random button
2. **View Details**: 
   - Base stats with visual charts
   - Type effectiveness (defense and offense)
   - Evolution chain
   - Abilities
   - Moves (Level-up and TM/HM)
   - Location information
3. **External Links**: Click the Bulbapedia button to view detailed wiki information

### Profile Management

1. **Sign In**: Click the profile icon and choose an authentication method
2. **View Teams**: See all your saved teams with previews
3. **Load Team**: Click "Open" on a team to load it in the team builder
4. **Delete Team**: Remove teams you no longer need
5. **Account Management**: Sign out or delete your account

## API Integrations

### PokeAPI

The application extensively uses the [PokeAPI](https://pokeapi.co/) for Pokemon data:

- **Base URL**: `https://pokeapi.co/api/v2/`
- **Rate Limiting**: No official rate limits, but respectful usage is recommended
- **Data Caching**: Implemented to reduce API calls and improve performance
- **Error Handling**: Graceful fallbacks for failed requests

### Firebase Services

- **Authentication**: User management and session handling
- **Firestore**: NoSQL database for team storage
- **Analytics**: Usage tracking and performance monitoring

### Bulbapedia

- **Integration**: Direct links to Pokemon wiki pages
- **URL Formatting**: Handles special cases (regional forms, paradox Pokemon)

## Architecture

### Application Flow

1. **Initialization**: 
   - Load type chart from PokeAPI
   - Load Pokemon list
   - Restore team from localStorage
   - Initialize Firebase services

2. **User Interaction**:
   - Search triggers debounced API calls
   - Team changes update displays and storage
   - Generation changes recalculate type effectiveness

3. **Data Flow**:
   - API responses cached in memory
   - Team data persisted to localStorage
   - Authenticated users can save to Firestore

### Key Classes & Modules

#### `PokemonTeamBuilder` (main.js)
- Main application class for team building
- Manages team state, type coverage, and battle analysis
- Handles generation-specific type adjustments

#### `PokemonLookup` (lookup.js)
- Pokemon information display
- Handles evolution chains, moves, and location data
- Generation-aware type effectiveness

#### Authentication Module (auth.js)
- Firebase Authentication wrapper
- Supports multiple auth providers
- Error handling and user feedback

#### Team Storage Module (team-storage.js)
- Firestore operations for team persistence
- CRUD operations for user teams
- Account management functions

### Data Structures

- **Team Array**: Fixed 6-slot array (null for empty slots)
- **Pokemon Cache**: Map structure for efficient lookups
- **Type Chart**: Nested object structure for effectiveness calculations
- **Generation Data**: Object mapping for type introductions and Pokemon typing changes

## Deployment

### GitHub Pages

1. Push code to GitHub repository
2. Enable GitHub Pages in repository settings
3. Select branch (usually `main`)
4. Configure custom domain in `CNAME` file if needed

### Custom Domain

The project includes a `CNAME` file for custom domain configuration:
- Domain: `pokemontools.app`
- Configure DNS settings to point to GitHub Pages

### Environment Considerations

- **CDN Resources**: Font Awesome and Firebase SDKs loaded from CDN
- **API Dependencies**: Requires internet connection for PokeAPI
- **Firebase Configuration**: Must be configured before deployment
- **HTTPS Required**: Firebase services require HTTPS (GitHub Pages provides this)

## Security Considerations

- **Firebase Security Rules**: Configure Firestore security rules to protect user data
- **API Keys**: Firebase API keys are safe to expose in client-side code (they're restricted by domain)
- **Authentication**: All authentication handled securely by Firebase
- **Input Validation**: User inputs validated before API calls
- **XSS Prevention**: Content sanitization for user-generated content

## Customization

### Styling
- Modify CSS files in `styles/` directory
- CSS variables defined in `main.css` for easy theming
- Responsive breakpoints can be adjusted

### Features
- Add new Pokemon data sources
- Extend type coverage analysis
- Add new stat comparisons
- Implement additional authentication providers

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [PokeAPI](https://pokeapi.co/) - Comprehensive Pokemon data API
- [Bulbapedia](https://bulbapedia.bulbagarden.net/) - Pokemon wiki and resource
- [Firebase](https://firebase.google.com/) - Backend infrastructure
- [Font Awesome](https://fontawesome.com/) - Icon library
- [Bulbagarden Archives](https://archives.bulbagarden.net/) - Type icons

## Contact

For questions, suggestions, or issues, please open an issue on GitHub.

---

**Note**: This application is a fan-made tool and is not affiliated with, endorsed by, or associated with The Pokemon Company, Nintendo, or Game Freak.

