# Visual Style DNA (Xiaohei Technical Adaptation)

1. **Aspect Ratio & Canvas**: Default 16:9 (`1200x675` for SVG) with at least **35% open whitespace/negative space**. Never crowd the frame.
2. **Line Weight & Geometry**:
   - Primary structural strokes: `2.5px` solid (`#0F172A` in light mode, `#F8FAFC` in dark mode).
   - Secondary/connector strokes: `1.5px` dashed (`stroke-dasharray="6 4"`).
   - Corner radius: `8px` for modules, `999px` (pill) for actors/triggers.
3. **Strictly Controlled Semantic Palette (Max 3 Accents per Visual)**:
   - **Emerald (`#10B981`)**: Verified flow, completed state, valid boundary, core engine.
   - **Amber (`#F59E0B`)**: Queue, rate-limiter, human-in-the-loop approval gate, warning.
   - **Rose (`#F43F5E`)**: Architecture drift, blocked dependency, rejected payload, security boundary.
   - **Blue (`#3B82F6`)**: Read/write data stream, API contract, external integration.
4. **Zero Decorative Gradients**: Use flat, high-contrast fills (`opacity: 0.12` for background zones) and crisp typography (`Inter`, `JetBrains Mono`, or `Vazirmatn` for Persian).
5. **Metaphor Over Decoration**: Every arrow, container, or icon must explain a system behavior. If removing an element does not reduce technical understanding, delete it.
