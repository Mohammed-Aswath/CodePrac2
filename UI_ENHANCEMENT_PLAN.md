# CODEPRAC 2.0: UI/UX Enhancement Strategy (Non-Functional Upgrade)

**Status**: Planning Phase Complete
**Target**: World-Class Professional SaaS Aesthetic
**Theme**: "Nebula Dark" (Professional Coding Environment)

---

## 1. UI/UX Strategy: "Invisible Interface, Visible Focus"
The new design will prioritize content (code and data) by receding the UI frame. We will shift from a "Bootstrap-style" documentation look to a "Modern App" feel.

**Key Design Pillars:**
1.  **Immersive Dark Mode**: Defaulting to a deep slate background (`#0f172a`) to reduce eye strain and look professional.
2.  **Glassmorphism**: Using translucent surfaces for navigation and panels to maintain context and visual hierarchy.
3.  **Micro-Interactions**: Every action (hover, click, focus) has immediate, smooth visual feedback.
4.  **Information Density**: Increasing data density in tables and dashboards while adding whitespace to prevent clutter (Bento Grid layouts).

---

## 2. Global Design System (The "Nebula" Theme)

### Color Palette (HSL)
*   **Canvas (Backgrounds)**:
    *   `--bg-app`: `hsl(222, 47%, 11%)` (Deep Slate)
    *   `--bg-panel`: `hsl(217, 33%, 17%)` (Lighter Slate)
    *   `--bg-glass`: `hsla(217, 33%, 17%, 0.7)` (Translucent)
*   **Brand (Primary)**:
    *   `--primary`: `hsl(243, 75%, 59%)` (Indigo/Violet)
    *   `--primary-glow`: `0 0 20px hsla(243, 75%, 59%, 0.3)`
*   **Semantics**:
    *   `--success`: `hsl(150, 100%, 33%)` (Neon Green)
    *   `--error`: `hsl(340, 80%, 55%)` (Rose Red)
*   **Text**:
    *   `--text-main`: `hsl(210, 40%, 98%)` (White-ish)
    *   `--text-muted`: `hsl(215, 20%, 65%)` (Blue-Grey)

### Typography
*   **Sans**: `Inter` (Google Fonts) - Clean, tight tracking.
    *   Headers: Bold, tight letter-spacing (`-0.025em`).
    *   Body: Regular, breathable line-height (`1.6`).
*   **Mono**: `JetBrains Mono` (Google Fonts) - Ligatures favored.
    *   Editor: Medium weight, slightly larger (`14px` -> `15px`).

### Animation System
*   **Standards**:
    *   `--ease-out`: `cubic-bezier(0.25, 0.46, 0.45, 0.94)`
    *   `--ease-elastic`: `cubic-bezier(0.68, -0.6, 0.32, 1.6)`
*   **Key Moves**:
    *   **Page Transition**: `fade-slide-up` (content slides up 10px and fades in).
    *   **Modal**: `scale-zoom` (95% -> 100% scale with backdrop blur).
    *   **Button**: `scale-down` on click (`0.97`).

---

## 3. Screen-wise Improvement Plan

### A. App Shell (Global)
*   **Header**: Float the nav bar 1rem from top (desktop), make it glassmorphic pill shape.
*   **Background**: Add subtle ambient gradients (mesh gradient) to the body background to prevent "flatness".

### B. Authentication (Login/Register)
*   **Transformation**: Replace split-screen with a centered, glowing "Portal Card".
*   **Interactions**: Smooth card flip or cross-fade between Login and Register.
*   **Inputs**: Floating label inputs with bottom-border animations.

### C. Admin & Staff Dashboards
*   **Layout**: Convert generic grids to **Bento Grids** (variable size cards).
*   **Tables**:
    *   Remove cell borders, leave row borders.
    *   Add "zebra-hover" (highlight row on hover).
    *   Status pills (small, rounded, pastel backgrounds).
*   **Actions**: Floating Action Buttons (FAB) for primary "Add" actions on mobile.

### D. Student Practice Area (The "IDE")
*   **Objective**: Simulate a VS Code environment.
*   **Layout**: `Grid: Auto 1fr` (Topics on left, Workspace on right).
*   **Code Editor**:
    *   **Visuals**: Dark background (`#1e1e1e`), "Mac-style" window dots on header.
    *   **Fake Gutter**: Add left padding and a border to simulate line number area.
    *   **Focus**: When typing, dim the "Problem Description" panel slightly.
*   **Console**: Terminal aesthetic (Black bg, green monospace font).

---

## 4. Code Editor Experience Upgrade
*Constraint: Must use existing `<textarea>` logic.*

1.  **Container**: Wrap current textarea in a `.ide-window` container.
2.  **Header**: Add a "Tab" strip (`Solution.py`, `Run`, `Submit`).
3.  **The Textarea**:
    *   Font: `JetBrains Mono`.
    *   Caret: Bright accent color.
    *   Scrollbar: Thin, dark custom scrollbar.
    *   Highlights: Since we can't use Monaco, we will style the textarea to look like a "Plain Text Mode" editor but with high polish (padding, distinct colored text color).

---

## 5. Execution Order

### Phase 2: Design System (Next Step)
1.  Create `css/design-system.css` (Variables & Tokens).
2.  Create `css/animations.css` (Keyframes).
3.  Create `css/base.css` (Reset & Typography).

### Phase 3: Layout Refactor
1.  Refactor `index.html` structure (add classes, remove inline styles).
2.  Update `styles.css` to import new system.
3.  Apply "App Shell" layout.

### Phase 4: Component Polish
1.  Style `input`, `button`, `select`.
2.  Style `card`, `modal`, `table`.

### Phase 5: Editor Upgrade
1.  Focus strictly on `#studentPage` visuals.
2.  Implement the IDE styling.

### Phase 6: Final Polish
1.  Apply animations to transitions.
2.  Verify no layout shifts.
