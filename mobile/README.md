# smart_exam mobile architecture

## Layer rules

- `App/` is the composition root. It builds concrete dependencies in `AppContainer` and injects ViewModels into SwiftUI screens.
- `Presentation/` owns SwiftUI-facing state, ViewModels, presentation labels, colors, and navigation actions.
- `Domain/` owns app entities, repository protocols, and use cases. It must not import SwiftUI, UIKit, AppAuth, Alamofire, or UserDefaults.
- `Data/` owns DTOs, mappers, remote data sources, and repository implementations.
- `Infrastructure/` owns SDK and platform integrations such as Cognito/AppAuth and persistence stores.
- `SharedUI/` owns reusable visual components and design tokens.
- `PreviewSupport/` owns preview-only mocks or fixtures.
- `smart_examTests/` owns unit tests for use cases, ViewModels, and mapper conversion logic.

## Dependency direction

The intended dependency direction is:

`Presentation -> Domain <- Data/Infrastructure`

`AppContainer` wires the concrete graph. Views should render state and emit user actions; they should not call `APIClient`, fetch auth tokens, or decode backend DTOs directly.

## Verification

Use the app build as the acceptance check:

```sh
xcodebuild -project smart_exam.xcodeproj -scheme smart_exam -configuration Debug -destination 'generic/platform=iOS' CODE_SIGNING_ALLOWED=NO build
```

Run the unit tests on an available iPad simulator:

```sh
xcodebuild test -project smart_exam.xcodeproj -scheme smart_exam -configuration Debug -destination 'platform=iOS Simulator,name=iPad Pro 13-inch (M5),OS=26.4.1' CODE_SIGNING_ALLOWED=NO
```
