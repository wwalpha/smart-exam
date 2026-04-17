//
//  smart_examApp.swift
//  smart_exam
//
//  Created by macmini on 2026/04/04.
//

import SwiftUI
import UIKit

@main
struct smart_examApp: App {
    @StateObject private var authService = AuthService()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authService)
                .background(LandscapeLaunchOrientationRequester())
                .onOpenURL { url in
                    _ = authService.resumeExternalUserAgentFlow(with: url)
                }
                .onContinueUserActivity(NSUserActivityTypeBrowsingWeb) { userActivity in
                    guard let url = userActivity.webpageURL else { return }
                    _ = authService.resumeExternalUserAgentFlow(with: url)
                }
        }
    }
}

private struct LandscapeLaunchOrientationRequester: UIViewRepresentable {
    func makeUIView(context: Context) -> OrientationRequestingView {
        OrientationRequestingView()
    }

    func updateUIView(_ uiView: OrientationRequestingView, context: Context) {
        uiView.requestLandscapeIfPossible()
    }

    final class OrientationRequestingView: UIView {
        private var didRequestLandscape = false

        override func didMoveToWindow() {
            super.didMoveToWindow()
            requestLandscapeIfPossible()
        }

        func requestLandscapeIfPossible() {
            guard !didRequestLandscape, let windowScene = window?.windowScene else {
                return
            }

            didRequestLandscape = true
            windowScene.requestGeometryUpdate(.iOS(interfaceOrientations: .landscape))
        }
    }
}
