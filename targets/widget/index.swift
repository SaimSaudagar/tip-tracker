import SwiftUI
import WidgetKit

// Must match APP_GROUP and LOG_SHIFT_URL in src/constants/app.ts.
private let appGroup = "group.com.saimsaudagar.tipbook"
private let logShiftURL = URL(string: "tipbook://log-shift")!

@main
struct TipbookWidgets: WidgetBundle {
  var body: some Widget {
    WeekWidget()
  }
}

struct WeekWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "WeekWidget", provider: WeekProvider()) { entry in
      WeekWidgetView(entry: entry)
    }
    .configurationDisplayName("This week")
    .description("Your tips and real hourly this week. Tap to log a shift.")
    .supportedFamilies([.systemSmall, .systemMedium, .accessoryRectangular, .accessoryInline])
  }
}

/// This week's numbers as the app last wrote them (src/widgets/update.ios.ts), already formatted.
struct WeekEntry: TimelineEntry {
  let date: Date
  var weekLabel = "This week"
  var weekEnd = ""
  var tips = "$0.00"
  var earned = "$0.00"
  var hourly = "—"
  var shifts = 0
  var goalPercent = -1

  static func preview(at date: Date) -> WeekEntry {
    WeekEntry(date: date, weekLabel: "Oct 25 – 31", tips: "$447.55", earned: "$475.25", hourly: "$36.56/hr", shifts: 3, goalPercent: 40)
  }

  /// True once the week shown has ended: those totals belong to last week.
  var isStale: Bool {
    guard !weekEnd.isEmpty else { return false }
    let formatter = DateFormatter()
    formatter.calendar = Calendar(identifier: .gregorian)
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.dateFormat = "yyyy-MM-dd"
    return formatter.string(from: date) > weekEnd
  }
}

struct WeekProvider: TimelineProvider {
  func placeholder(in context: Context) -> WeekEntry {
    .preview(at: .now)
  }

  func getSnapshot(in context: Context, completion: @escaping (WeekEntry) -> Void) {
    completion(context.isPreview ? .preview(at: .now) : load(at: .now))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<WeekEntry>) -> Void) {
    // The app reloads the widget whenever a shift changes. A second entry at midnight lets an
    // untouched widget notice that a new week has started.
    let now = Date.now
    let midnight = Calendar.current.startOfDay(for: now.addingTimeInterval(86_400))
    completion(Timeline(entries: [load(at: now), load(at: midnight)], policy: .after(midnight)))
  }

  private func load(at date: Date) -> WeekEntry {
    guard let week = UserDefaults(suiteName: appGroup)?.dictionary(forKey: "week") else {
      return WeekEntry(date: date)
    }
    func text(_ key: String) -> String? { week[key] as? String }
    func number(_ key: String) -> Int? { (week[key] as? NSNumber)?.intValue }
    var entry = WeekEntry(date: date)
    entry.weekLabel = text("weekLabel") ?? entry.weekLabel
    entry.weekEnd = text("weekEnd") ?? entry.weekEnd
    entry.tips = text("tips") ?? entry.tips
    entry.earned = text("earned") ?? entry.earned
    entry.hourly = text("hourly") ?? entry.hourly
    entry.shifts = number("shifts") ?? entry.shifts
    entry.goalPercent = number("goalPercent") ?? entry.goalPercent
    return entry
  }
}

struct WeekWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: WeekEntry

  private var stale: Bool { entry.isStale }
  private var tips: String { stale ? "$0.00" : entry.tips }

  var body: some View {
    content
      .widgetURL(logShiftURL)
      .containerBackground(for: .widget) { Color("brandBackground") }
  }

  @ViewBuilder private var content: some View {
    switch family {
    case .accessoryInline:
      Text("\(tips) in tips this week")
    case .accessoryRectangular:
      VStack(alignment: .leading, spacing: 1) {
        Text("Tips this week").font(.caption2).foregroundStyle(.secondary)
        Text(tips).font(.system(.title3, design: .rounded, weight: .bold)).monospacedDigit()
        Text(stale ? "Open Tipbook" : entry.hourly).font(.caption2)
      }
      .frame(maxWidth: .infinity, alignment: .leading)
    case .systemMedium:
      HStack(alignment: .top, spacing: 16) {
        VStack(alignment: .leading, spacing: 4) {
          header
          amount
          Spacer(minLength: 0)
          goalBar
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        VStack(alignment: .leading, spacing: 8) {
          stat("Earned", stale ? "—" : entry.earned)
          stat("Real hourly", stale ? "—" : entry.hourly)
          stat("Shifts", stale ? "0" : String(entry.shifts))
        }
      }
      .foregroundStyle(.white)
    default:
      VStack(alignment: .leading, spacing: 4) {
        header
        amount
        Spacer(minLength: 0)
        goalBar
        Text(stale ? "Open Tipbook to update" : "\(entry.earned) earned · \(entry.hourly)")
          .font(.caption2)
          .opacity(0.85)
          .lineLimit(2)
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .foregroundStyle(.white)
    }
  }

  private var header: some View {
    Text(stale ? "THIS WEEK" : entry.weekLabel.uppercased())
      .font(.caption2.weight(.semibold))
      .opacity(0.8)
      .lineLimit(1)
  }

  private var amount: some View {
    Text(tips)
      .font(.system(size: 30, weight: .bold, design: .rounded))
      .monospacedDigit()
      .minimumScaleFactor(0.6)
      .lineLimit(1)
  }

  @ViewBuilder private var goalBar: some View {
    if !stale && entry.goalPercent >= 0 {
      ProgressView(value: Double(min(entry.goalPercent, 100)), total: 100)
        .tint(.white)
        .accessibilityLabel("Weekly goal \(entry.goalPercent) percent")
    }
  }

  private func stat(_ label: String, _ value: String) -> some View {
    VStack(alignment: .leading, spacing: 0) {
      Text(label).font(.caption2).opacity(0.8)
      Text(value).font(.subheadline.weight(.semibold)).monospacedDigit().lineLimit(1).minimumScaleFactor(0.7)
    }
  }
}
