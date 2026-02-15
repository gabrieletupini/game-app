# Game - Static Web App Architecture

## Updated Architecture for Static Deployment

Based on your feedback to make this similar to tradle-app as a static webpage, here's the revised architecture:

## Technology Stack (Simplified)

### Frontend Only
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand (lightweight, perfect for client-side)
- **UI Library**: Tailwind CSS + Headless UI
- **Drag & Drop**: @dnd-kit/core (modern, accessible)
- **Charts**: Chart.js or Recharts for pie charts
- **Storage**: localStorage / IndexedDB for persistence
- **Icons**: Lucide React or Heroicons
- **Routing**: React Router (if multi-page needed)

### No Backend Required
- **Authentication**: Simple localStorage session
- **Data Storage**: Browser localStorage with JSON
- **File Storage**: Base64 encoding for photos in localStorage
- **Deployment**: Static hosting (Netlify, Vercel, GitHub Pages)

## Simplified System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Environment                      │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   React App     │    │  localStorage   │                │
│  │                 │◄──►│                 │                │
│  │ • Funnel UI     │    │ • User Data     │                │
│  │ • Lead Cards    │    │ • Leads JSON    │                │
│  │ • Drag & Drop   │    │ • Photos Base64 │                │
│  │ • Charts        │    │ • Settings      │                │
│  └─────────────────┘    └─────────────────┘                │
│                                                             │
│  Static Files: index.html, bundle.js, styles.css           │
└─────────────────────────────────────────────────────────────┘
```

## Data Storage Strategy

### localStorage Structure
```javascript
// User preferences and settings
gameApp_settings: {
  theme: "light",
  user: {
    name: "User Name",
    email: "user@example.com"
  },
  lastBackup: "2024-01-15T10:00:00Z"
}

// All leads data
gameApp_leads: [
  {
    id: "uuid-1",
    name: "Sarah Johnson",
    photoBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    platformOrigin: "Tinder",
    countryOrigin: "United States",
    personalityTraits: "Outgoing, coffee lover...",
    notes: "Met at coffee shop...",
    qualificationScore: 8,
    funnelStage: "Stage2",
    originDetails: "Coffee shop downtown",
    temperature: "Warm",
    lastInteractionDate: "2024-01-15T14:30:00Z",
    stageEnteredAt: "2024-01-10T09:00:00Z",
    createdAt: "2024-01-05T10:00:00Z",
    updatedAt: "2024-01-15T14:30:00Z"
  }
]

// Interaction history
gameApp_interactions: [
  {
    id: "uuid-int-1",
    leadId: "uuid-1",
    type: "Message",
    direction: "Outgoing",
    notes: "Asked about weekend plans",
    occurredAt: "2024-01-15T14:30:00Z",
    createdAt: "2024-01-15T14:32:00Z"
  }
]
```

## Project Structure

```
game-app/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx
│   │   │   ├── Loading.tsx
│   │   │   └── Modal.tsx
│   │   ├── funnel/
│   │   │   ├── FunnelBoard.tsx
│   │   │   ├── FunnelStage.tsx
│   │   │   ├── LeadCard.tsx
│   │   │   └── LeadModal.tsx
│   │   ├── analytics/
│   │   │   ├── OriginChart.tsx
│   │   │   └── FunnelStats.tsx
│   │   └── tables/
│   │       ├── LoversTable.tsx
│   │       └── DeadLeadsTable.tsx
│   ├── hooks/
│   │   ├── useLocalStorage.ts
│   │   ├── useLeads.ts
│   │   └── useDragDrop.ts
│   ├── services/
│   │   ├── localStorage.ts
│   │   ├── dataService.ts
│   │   └── imageService.ts
│   ├── store/
│   │   └── useGameStore.ts (Zustand store)
│   ├── types/
│   │   ├── Lead.ts
│   │   ├── Interaction.ts
│   │   └── Settings.ts
│   ├── utils/
│   │   ├── dateHelpers.ts
│   │   ├── temperatureCalculator.ts
│   │   └── constants.ts
│   ├── styles/
│   │   └── globals.css
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Core Features Implementation

### 1. Data Persistence with localStorage
```typescript
// services/localStorage.ts
class LocalStorageService {
  private static instance: LocalStorageService;
  
  static getInstance() {
    if (!this.instance) {
      this.instance = new LocalStorageService();
    }
    return this.instance;
  }

  saveLeads(leads: Lead[]) {
    localStorage.setItem('gameApp_leads', JSON.stringify(leads));
  }

  getLeads(): Lead[] {
    const data = localStorage.getItem('gameApp_leads');
    return data ? JSON.parse(data) : [];
  }

  saveInteractions(interactions: Interaction[]) {
    localStorage.setItem('gameApp_interactions', JSON.stringify(interactions));
  }

  getInteractions(): Interaction[] {
    const data = localStorage.getItem('gameApp_interactions');
    return data ? JSON.parse(data) : [];
  }

  // Export data for backup
  exportData() {
    return {
      leads: this.getLeads(),
      interactions: this.getInteractions(),
      settings: this.getSettings(),
      exportedAt: new Date().toISOString()
    };
  }

  // Import data from backup
  importData(data: any) {
    if (data.leads) this.saveLeads(data.leads);
    if (data.interactions) this.saveInteractions(data.interactions);
    if (data.settings) this.saveSettings(data.settings);
  }
}
```

### 2. Zustand Store for State Management
```typescript
// store/useGameStore.ts
import { create } from 'zustand';

interface GameStore {
  leads: Lead[];
  interactions: Interaction[];
  settings: Settings;
  
  // Actions
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  moveLeadToStage: (id: string, stage: FunnelStage) => void;
  
  addInteraction: (interaction: Omit<Interaction, 'id' | 'createdAt'>) => void;
  
  // Computed values
  getLeadsByStage: (stage: FunnelStage) => Lead[];
  getOriginDistribution: () => { platform: string; count: number; percentage: number }[];
  getFunnelStats: () => { stage: string; count: number }[];
  
  // Data management
  loadFromStorage: () => void;
  exportData: () => string;
  importData: (data: string) => void;
}
```

### 3. Photo Handling with Base64
```typescript
// services/imageService.ts
class ImageService {
  static async convertToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  static async resizeImage(base64: string, maxWidth: number = 300): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = base64;
    });
  }
}
```

### 4. Temperature Calculation
```typescript
// utils/temperatureCalculator.ts
export function calculateTemperature(lead: Lead, interactions: Interaction[]): Temperature {
  const now = new Date();
  const lastInteraction = lead.lastInteractionDate ? new Date(lead.lastInteractionDate) : null;
  
  if (!lastInteraction) return 'Cold';
  
  const daysSinceLastInteraction = Math.floor(
    (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const recentInteractions = interactions.filter(
    (interaction) => 
      interaction.leadId === lead.id &&
      new Date(interaction.occurredAt).getTime() > (now.getTime() - 7 * 24 * 60 * 60 * 1000)
  ).length;
  
  if (daysSinceLastInteraction <= 2 && recentInteractions >= 3) {
    return 'Hot';
  } else if (daysSinceLastInteraction <= 7 && recentInteractions >= 1) {
    return 'Warm';
  } else {
    return 'Cold';
  }
}
```

## Development Workflow

### Setup Commands
```bash
# Initialize project
npm create vite@latest game-app -- --template react-ts
cd game-app

# Install dependencies
npm install zustand @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install lucide-react chart.js react-chartjs-2
npm install tailwindcss @headlessui/react
npm install -D @types/node

# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Deployment Options
1. **Netlify**: Drag and drop `dist/` folder
2. **Vercel**: Connect GitHub repo
3. **GitHub Pages**: Push `dist/` to gh-pages branch
4. **Local Server**: Serve `dist/` folder with any static server

## Data Import/Export Features

### Backup System
- Export all data as JSON file
- Import data from JSON file
- Automatic localStorage backup before imports
- Data validation on import

### CSV Export for Analytics
- Export leads to CSV for external analysis
- Export interactions history
- Custom date ranges for exports

## Offline-First Approach

### Benefits
- ✅ Works completely offline
- ✅ No server costs or maintenance
- ✅ Instant load times
- ✅ Complete privacy (data never leaves browser)
- ✅ Easy to backup/restore
- ✅ Simple deployment

### Limitations
- ❌ No sync between devices
- ❌ Data lost if localStorage cleared
- ❌ Limited by browser storage quotas
- ❌ No real-time collaboration

### Mitigation Strategies
- Regular export reminders
- Cloud storage integration (Google Drive, Dropbox)
- Progressive Web App for better offline experience
- localStorage quota monitoring

## Performance Optimizations

### Bundle Optimization
- Code splitting with React.lazy
- Tree shaking with Vite
- Optimized images and assets
- Minimal bundle size

### Runtime Performance
- Virtual scrolling for large lead lists
- Memoized components and calculations
- Debounced search and filtering
- Efficient drag-and-drop operations

### Storage Efficiency
- Compressed JSON storage
- Image optimization and compression
- Cleanup of old interaction data
- Storage quota management

This simplified architecture maintains all the core functionality while being much easier to develop, test, and deploy as a static web application!