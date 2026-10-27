import AppIntents
import UIKit

// Added to the main app target by plugins/with-shortcuts.js. App Shortcuts must live in the
// app itself (not a widget or library) for Siri to find them, and need no setup by the user.

/// "Log a shift": opens Tipbook on the Log shift screen. Available to Siri, Spotlight and Shortcuts.
@available(iOS 16.0, *)
struct LogShiftIntent: AppIntent {
  static let title: LocalizedStringResource = "Log a shift"
  static let description = IntentDescription("Opens Tipbook to log your tips and hours.")
  static let openAppWhenRun = true

  @MainActor
  func perform() async throws -> some IntentResult {
    if let url = URL(string: "tipbook://log-shift") {
      _ = await UIApplication.shared.open(url)
    }
    return .result()
  }
}

@available(iOS 16.0, *)
struct TipbookShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: LogShiftIntent(),
      phrases: [
        "Log my tips in \(.applicationName)",
        "Log a shift in \(.applicationName)",
        "Log tips with \(.applicationName)",
      ]
    )
  }
}
