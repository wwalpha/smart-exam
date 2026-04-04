//
//  smart_examApp.swift
//  smart_exam
//
//  Created by macmini on 2026/04/04.
//

import SwiftUI

@main
struct smart_examApp: App {
    @StateObject private var authService = AuthService()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authService)
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
