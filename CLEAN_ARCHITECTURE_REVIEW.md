# Clean Architecture Review

## Overview

This review evaluates the codebase against Clean Architecture principles, focusing on dependency direction, layer separation, and responsibility boundaries.

## Architecture Layers

### ✅ Domain Layer (src/domain/)
**Status: Well-structured**

- **Entities**: `Annotation`, `AudioBuffer`, `Spectrogram`
- **Interfaces**: `IAudioInput`, `IRenderer`, `ISTFTProcessor`
- **Dependencies**: None (pure TypeScript, no external dependencies)
- **Business Logic**: Entities contain domain logic (e.g., `Spectrogram.getValue()`, `Annotation.withPosition()`)

**Strengths:**
- ✅ No dependencies on other layers
- ✅ Pure domain entities with business logic
- ✅ Interfaces properly defined for abstraction
- ✅ Value objects and entities are well-separated

**Issues:**
- ⚠️ `ISTFTProcessor` interface imports `IAudioInput` unnecessarily (line 1 of ISTFTProcessor.ts)
  - This creates an unnecessary coupling between interfaces

### ⚠️ Application Layer (src/application/)
**Status: Mostly good, but has dependency violations**

- **Services**: `AnnotationService`, `AudioProcessingService`, `ExportService`, `SpectrogramRenderService`
- **Dependencies**: Domain interfaces and entities ✅
- **Dependencies**: Infrastructure implementations ❌ (violation)

**Strengths:**
- ✅ Services orchestrate use cases
- ✅ Use domain interfaces for abstraction
- ✅ Business logic is separated from infrastructure

**Critical Issues:**

1. **Dependency Inversion Violation in AudioProcessingService**
   ```typescript
   // src/application/services/AudioProcessingService.ts:5
   import { WasmSTFTProcessor } from '@infrastructure/wasm/WasmSTFTProcessor';
   ```
   - **Problem**: Application layer directly depends on Infrastructure layer
   - **Impact**: Violates Dependency Inversion Principle
   - **Solution**: Use dependency injection or factory pattern with interface

2. **AnnotationService Location**
   - Currently in Application layer
   - Consider: Should this be a Domain service or Application service?
   - Current implementation is fine as it manages application state

**Recommendations:**
- Use dependency injection for `ISTFTProcessor` instead of hard-coding `WasmSTFTProcessor`
- Consider a factory or service locator pattern

### ⚠️ Infrastructure Layer (src/infrastructure/)
**Status: Good, but some improvements needed**

- **Implementations**: `FileAudioInput`, `CanvasSpectrogramRenderer`, `WasmSTFTProcessor`, `SVGAnnotationLayer`
- **Dependencies**: Domain interfaces ✅
- **Dependencies**: Application services ❌ (some violations)

**Strengths:**
- ✅ Implements domain interfaces correctly
- ✅ No business logic leakage
- ✅ Proper separation of concerns

**Issues:**

1. **SVGAnnotationLayer**
   - Not implementing a domain interface
   - Consider: Should there be an `IAnnotationLayer` interface in Domain?

2. **ExportService Dependency**
   - `ExportService` (Application) depends on `SVGAnnotationLayer` (Infrastructure)
   - This is acceptable as Application can depend on Infrastructure for concrete implementations

### ⚠️ Presentation Layer (src/presentation/)
**Status: Has dependency violations**

- **Components**: React components and hooks
- **Dependencies**: Domain entities/interfaces ✅, Application services ✅
- **Dependencies**: Infrastructure implementations ❌ (violations)

**Critical Issues:**

1. **Direct Infrastructure Dependencies**
   ```typescript
   // src/presentation/App.tsx:7
   import { FileAudioInput } from '@infrastructure/audio/FileAudioInput';
   
   // src/presentation/hooks/useSpectrogram.ts:5-6
   import { CanvasSpectrogramRenderer } from '@infrastructure/renderer/CanvasSpectrogramRenderer';
   import { SVGAnnotationLayer } from '@infrastructure/annotation/SVGAnnotationLayer';
   ```
   - **Problem**: Presentation layer directly depends on Infrastructure
   - **Impact**: Tight coupling, difficult to test, violates Clean Architecture
   - **Solution**: Use dependency injection or factory pattern

2. **Service Instantiation in Hooks**
   - `useSpectrogram` creates infrastructure instances directly
   - Should be injected or provided via context

**Recommendations:**
- Create a dependency injection container or use React Context
- Pass infrastructure implementations as props or via context
- Consider using a service locator pattern

## Dependency Graph Analysis

### Current Dependency Flow:
```
Presentation → Application → Domain ✅
Presentation → Infrastructure → Domain ✅
Application → Infrastructure → Domain ❌ (should be inverted)
Presentation → Infrastructure (direct) ❌
```

### Ideal Dependency Flow:
```
Presentation → Application → Domain
Infrastructure → Domain (implements interfaces)
Application → Domain (uses interfaces)
Presentation → Application (uses services)
```

## Specific Violations

### 1. AudioProcessingService.create()
**File**: `src/application/services/AudioProcessingService.ts:14-16`
```typescript
static async create(): Promise<AudioProcessingService> {
  const processor = await WasmSTFTProcessor.create(); // ❌ Direct dependency
  return new AudioProcessingService(processor);
}
```

**Fix**: Use dependency injection
```typescript
static async create(processorFactory?: () => Promise<ISTFTProcessor>): Promise<AudioProcessingService> {
  const factory = processorFactory || (() => WasmSTFTProcessor.create());
  const processor = await factory();
  return new AudioProcessingService(processor);
}
```

### 2. useSpectrogram Hook
**File**: `src/presentation/hooks/useSpectrogram.ts:28-32`
```typescript
const renderer = new CanvasSpectrogramRenderer(canvasRef.current); // ❌ Direct instantiation
const annotationLayerInstance = new SVGAnnotationLayer(svgRef.current);
```

**Fix**: Inject dependencies
```typescript
interface UseSpectrogramDependencies {
  rendererFactory: (canvas: HTMLCanvasElement) => IRenderer;
  annotationLayerFactory: (svg: SVGSVGElement) => IAnnotationLayer;
}
```

### 3. App.tsx
**File**: `src/presentation/App.tsx:7`
```typescript
import { FileAudioInput } from '@infrastructure/audio/FileAudioInput'; // ❌ Direct import
```

**Fix**: Use factory or dependency injection
```typescript
// In a service or factory
const createAudioInput = (file: File): IAudioInput => {
  const input = new FileAudioInput();
  input.setFile(file);
  return input;
};
```

## Positive Aspects

1. ✅ **Clear Layer Separation**: Physical separation of layers is well-maintained
2. ✅ **Interface-Based Design**: Domain interfaces properly abstract infrastructure
3. ✅ **Entity Business Logic**: Domain entities contain appropriate business logic
4. ✅ **Type Safety**: Strong TypeScript typing throughout
5. ✅ **Path Aliases**: Good use of `@domain`, `@application`, etc. for clarity

## Recommendations

### High Priority

1. **Fix AudioProcessingService Dependency**
   - Remove direct `WasmSTFTProcessor` import
   - Use dependency injection or factory pattern
   - Create processor in Infrastructure layer and inject

2. **Fix Presentation Layer Dependencies**
   - Remove direct infrastructure imports from presentation
   - Use dependency injection container or React Context
   - Create factories in Infrastructure layer

3. **Create IAnnotationLayer Interface**
   - Add `IAnnotationLayer` to Domain layer
   - Make `SVGAnnotationLayer` implement it
   - Update `ExportService` to use interface

### Medium Priority

4. **Dependency Injection Container**
   - Consider using a DI container (e.g., InversifyJS, TSyringe)
   - Or use React Context for dependency injection
   - Centralize service creation

5. **Factory Pattern**
   - Create factories in Infrastructure layer
   - Presentation layer uses factories instead of direct instantiation
   - Factories return domain interfaces

### Low Priority

6. **Service Interfaces**
   - Consider creating interfaces for Application services
   - Makes testing and swapping implementations easier

7. **Use Cases**
   - Consider extracting use cases from services
   - Each use case is a single operation (e.g., `ProcessAudioUseCase`)

## Testing Implications

Current violations make testing difficult:
- Cannot easily mock infrastructure in Application layer
- Presentation layer tests require real infrastructure
- Tight coupling prevents unit testing in isolation

After fixes:
- Easy to mock interfaces in tests
- Each layer can be tested independently
- Better test coverage and maintainability

## Summary

**Overall Assessment**: Good foundation with Clean Architecture, but has critical dependency violations that need to be addressed.

**Score**: 7/10
- ✅ Layer structure: 9/10
- ❌ Dependency direction: 5/10
- ✅ Interface usage: 8/10
- ✅ Business logic placement: 9/10
- ❌ Testability: 6/10

**Priority Actions**:
1. Fix `AudioProcessingService` dependency violation
2. Remove direct infrastructure imports from Presentation layer
3. Implement dependency injection pattern

