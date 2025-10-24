# Parkchain Design System

Kompletny system designu dla aplikacji Parkchain z reużywalnymi komponentami React.

## 📦 Komponenty

### Core Components

#### Button
Wszechstronny komponent przycisku z wieloma wariantami.

```jsx
import { Button } from './components/ui';

// Podstawowe użycie
<Button onClick={handleClick}>Kliknij mnie</Button>

// Z wariantami
<Button variant="primary">Główny</Button>
<Button variant="secondary">Drugorzędny</Button>
<Button variant="outline">Obramowanie</Button>
<Button variant="ghost">Przezroczysty</Button>
<Button variant="danger">Niebezpieczeństwo</Button>

// Z rozmiarami
<Button size="sm">Mały</Button>
<Button size="md">Średni</Button>
<Button size="lg">Duży</Button>

// Ze stanami
<Button loading={true}>Ładowanie...</Button>
<Button disabled={true}>Wyłączony</Button>

// Z ikonami
<Button leftIcon={<IconComponent />}>Z lewą ikoną</Button>
<Button rightIcon={<IconComponent />}>Z prawą ikoną</Button>

// Pełna szerokość
<Button fullWidth>Pełna szerokość</Button>
```

**Dostępne propsy:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
- `size`: 'sm' | 'md' | 'lg'
- `loading`: boolean
- `disabled`: boolean
- `fullWidth`: boolean
- `leftIcon`, `rightIcon`: ReactNode
- `onClick`, `type`, `className`

---

#### Input
Komponent pola tekstowego z walidacją i stanami.

```jsx
import { Input } from './components/ui';

// Podstawowe użycie
<Input
  label="Email"
  type="email"
  name="email"
  value={email}
  onChange={handleChange}
  placeholder="twoj@email.com"
/>

// Z błędem
<Input
  label="Hasło"
  type="password"
  error="Hasło musi mieć minimum 6 znaków"
/>

// Z pomocniczym tekstem
<Input
  label="Telefon"
  helperText="Opcjonalne"
/>

// Z ikonami
<Input
  leftIcon={<EmailIcon />}
  rightIcon={<CheckIcon />}
/>

// Wymagane pole
<Input label="Imię" required />
```

**Dostępne propsy:**
- `label`: string
- `type`: 'text' | 'email' | 'password' | 'number' | 'tel' | ...
- `error`: string (komunikat błędu)
- `helperText`: string
- `leftIcon`, `rightIcon`: ReactNode
- `required`, `disabled`, `fullWidth`: boolean

---

#### Card
Uniwersalny komponent karty dla spójnych layoutów.

```jsx
import { Card } from './components/ui';

// Podstawowe użycie
<Card>
  <h3>Tytuł</h3>
  <p>Treść karty</p>
</Card>

// Z wariantami
<Card variant="default">Domyślna</Card>
<Card variant="glass">Glassmorphism</Card>
<Card variant="gradient">Z gradientem</Card>

// Z paddingiem
<Card padding="none">Bez paddingu</Card>
<Card padding="sm">Mały</Card>
<Card padding="md">Średni (domyślnie)</Card>
<Card padding="lg">Duży</Card>

// Interaktywna
<Card hoverable>Z hover efektem</Card>
<Card clickable onClick={handleClick}>Klikalna</Card>

// Z kompozycją
<Card>
  <Card.Header>
    <Card.Title>Tytuł karty</Card.Title>
  </Card.Header>
  <Card.Body>
    Treść karty
  </Card.Body>
  <Card.Footer>
    <Button>Akcja</Button>
  </Card.Footer>
</Card>
```

---

#### Modal
Dostępny modal z zarządzaniem focusem i klawiaturą.

```jsx
import { Modal, ConfirmModal } from './components/ui';

// Podstawowy modal
const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Tytuł modalu"
  size="md"
>
  <p>Treść modalu</p>
</Modal>

// Z footerm
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Formularz"
  footer={
    <div className="flex gap-3">
      <Button onClick={handleClose} variant="ghost">Anuluj</Button>
      <Button onClick={handleSubmit}>Zapisz</Button>
    </div>
  }
>
  {/* Formularz */}
</Modal>

// Modal potwierdzenia
<ConfirmModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={handleDelete}
  title="Potwierdź usunięcie"
  message="Czy na pewno chcesz usunąć ten element?"
  confirmText="Usuń"
  cancelText="Anuluj"
  variant="danger"
/>
```

**Features:**
- ESC key zamyka modal
- Click poza modalem zamyka (opcjonalnie)
- Focus trap
- Blokowanie scrolla body

---

### Feedback Components

#### Toast Notifications
System powiadomień dla feedbacku użytkownika.

```jsx
import { useToast, ToastContainer } from './components/ui';

function MyComponent() {
  const { toasts, addToast, removeToast } = useToast();

  const handleSuccess = () => {
    addToast({
      message: 'Operacja zakończona sukcesem!',
      type: 'success'
    });
  };

  const handleError = () => {
    addToast({
      message: 'Wystąpił błąd',
      type: 'error',
      duration: 5000 // opcjonalnie
    });
  };

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <Button onClick={handleSuccess}>Pokaż sukces</Button>
    </>
  );
}
```

**Typy:**
- `success`: Zielony
- `error`: Czerwony
- `warning`: Żółty
- `info`: Niebieski

---

#### Empty States
Przyjazne komunikaty gdy brak danych.

```jsx
import {
  EmptyState,
  EmptyStateNoResults,
  EmptyStateNoReservations,
  EmptyStateNoParkingSpots,
  EmptyStateNoBadges,
  EmptyStateError
} from './components/ui';

// Custom empty state
<EmptyState
  icon={<MyIcon />}
  title="Brak danych"
  description="Nie znaleziono żadnych wyników"
  action={handleAction}
  actionLabel="Dodaj nowy"
/>

// Pre-built variants
<EmptyStateNoReservations onCreateNew={() => navigate('/map')} />
<EmptyStateNoResults searchTerm="parking" onClear={clearFilters} />
<EmptyStateError onRetry={fetchData} />
```

---

#### Skeleton Loaders
Placeholdery podczas ładowania.

```jsx
import { Skeleton, SkeletonCard, SkeletonList, SkeletonTable, SkeletonProfile } from './components/ui';

// Podstawowy skeleton
<Skeleton height="40px" width="200px" />
<Skeleton variant="text" />
<Skeleton circle height="60px" width="60px" />

// Pre-built layouts
<SkeletonCard />
<SkeletonList count={5} />
<SkeletonTable rows={10} columns={4} />
<SkeletonProfile />
```

---

### UI Primitives

#### Badge
Etykiety dla statusów i liczników.

```jsx
import { Badge } from './components/ui';

<Badge>Domyślny</Badge>
<Badge variant="primary">Główny</Badge>
<Badge variant="success">Sukces</Badge>
<Badge variant="warning">Ostrzeżenie</Badge>
<Badge variant="error">Błąd</Badge>
<Badge variant="info">Info</Badge>

<Badge size="sm">Mały</Badge>
<Badge size="md">Średni</Badge>
<Badge size="lg">Duży</Badge>

<Badge dot>Z kropką</Badge>
```

---

#### Avatar
Zdjęcia profilowe z fallbackiem.

```jsx
import { Avatar } from './components/ui';

// Z obrazkiem
<Avatar src="/path/to/image.jpg" alt="Jan Kowalski" />

// Z inicjałami (fallback)
<Avatar fallback="Jan Kowalski" />

// Rozmiary
<Avatar size="sm" />
<Avatar size="md" />
<Avatar size="lg" />
<Avatar size="xl" />
<Avatar size="2xl" />

// Ze statusem
<Avatar status="online" />
<Avatar status="offline" />
<Avatar status="busy" />
<Avatar status="away" />
```

---

#### Spinner
Wskaźnik ładowania.

```jsx
import { Spinner, LoadingOverlay } from './components/ui';

// Podstawowy spinner
<Spinner />
<Spinner size="sm" />
<Spinner size="lg" />
<Spinner color="white" />

// Full-page overlay
{loading && <LoadingOverlay message="Ładowanie danych..." />}
```

---

#### Tooltip
Podpowiedzi przy hoverze.

```jsx
import { Tooltip } from './components/ui';

<Tooltip content="To jest podpowiedź" position="top">
  <Button>Najedź na mnie</Button>
</Tooltip>

<Tooltip content="Pomoc" position="right" delay={500}>
  <IconButton />
</Tooltip>
```

---

## 🎨 Kolory Brand

```js
// tailwind.config.js
colors: {
  'parkchain-500': '#6366F1',  // Główny kolor
  'parkchain-600': '#4F46E5',  // Ciemniejszy odcień
}
```

Użycie:
```jsx
<div className="bg-parkchain-500 text-white">
  Główny kolor Parkchain
</div>
```

---

## 🌙 Dark Theme

Wszystkie komponenty są zoptymalizowane pod dark theme:
- `slate-950`, `slate-900`, `slate-800` - tła
- `slate-700` - borders
- `slate-400`, `slate-300` - teksty
- Efekty glassmorphism (`backdrop-blur-xl`)

---

## ♿ Accessibility

Wszystkie komponenty wspierają:
- ✅ Keyboard navigation (Tab, Enter, ESC)
- ✅ Focus states (rings)
- ✅ ARIA labels
- ✅ Screen reader support
- ✅ Semantic HTML

---

## 🚀 Quick Start

```jsx
// 1. Import komponentów
import { Button, Input, Card, useToast, ToastContainer } from './components/ui';

// 2. Użycie w komponencie
function MyPage() {
  const { toasts, addToast, removeToast } = useToast();
  const [formData, setFormData] = useState({ email: '', name: '' });

  const handleSubmit = () => {
    // Logika
    addToast({ message: 'Zapisano!', type: 'success' });
  };

  return (
    <div className="p-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <Card>
        <Card.Header>
          <Card.Title>Formularz</Card.Title>
        </Card.Header>
        <Card.Body>
          <Input
            label="Imię"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </Card.Body>
        <Card.Footer>
          <Button onClick={handleSubmit}>Zapisz</Button>
        </Card.Footer>
      </Card>
    </div>
  );
}
```

---

## 📱 Mobile Responsive

Wszystkie komponenty są w pełni responsive:
- Breakpointy Tailwind: `sm`, `md`, `lg`, `xl`, `2xl`
- Touch-friendly (44px minimum touch targets)
- Mobile-first approach

---

## 🎭 Animacje

Powered by **Framer Motion**:
- Smooth transitions
- Hover/tap effects
- Page transitions
- Staggered animations

Przykład:
```jsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

---

## 💡 Best Practices

1. **Używaj design systemu**: Unikaj tworzenia custom komponentów, jeśli istnieje odpowiednik
2. **Consistency**: Trzymaj się brand colors i spacing
3. **Accessibility first**: Zawsze dodawaj labels, ARIA, keyboard support
4. **Performance**: Lazy load heavy components
5. **Mobile-first**: Testuj na małych ekranach

---

## 📚 Przykłady Implementacji

### Login/Register Pages
- ✅ Glassmorphism cards
- ✅ Real-time validation
- ✅ Loading states
- ✅ Error handling

### MyReservationsPage
- ✅ Stats cards z ikonami
- ✅ Filters z Button group
- ✅ Toast notifications
- ✅ Empty states
- ✅ Skeleton loaders

### ProfilePage
- ✅ Avatar component
- ✅ Badge dla roli
- ✅ Card layouts
- ✅ Sidebar navigation

---

Stworzono z ❤️ dla Parkchain
