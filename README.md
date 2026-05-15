# KPI Card Extension for Qlik Sense

> A modern, feature-rich KPI card extension for Qlik Sense with sparkline trends, forecasting, time-aware comparisons, smart selection handling, and portable configuration presets.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Qlik Sense](https://img.shields.io/badge/Qlik%20Sense-Enterprise%20%7C%20Cloud-009845)
![Status](https://img.shields.io/badge/status-stable-brightgreen)

## 📸 Screenshots

![KPI Card](https://imagedelivery.net/BdpL1pNKEf9FjxHkN-wXKg/b83d46ec-3e6c-4a30-039d-07183a7ca600/public)
![KPI Card](https://imagedelivery.net/BdpL1pNKEf9FjxHkN-wXKg/b1e3c69d-7beb-48cb-3652-8762c9110600/public)
![KPI Card](https://imagedelivery.net/BdpL1pNKEf9FjxHkN-wXKg/dae0ddf1-6570-416c-ecdf-eef885423600/public)
![KPI Card](https://imagedelivery.net/BdpL1pNKEf9FjxHkN-wXKg/459b324d-5933-4d6a-2e28-585c2d5d7000/public)

## ✨ Highlights

- **Dual KPI**: primary measure + optional secondary (auto previous-period, 2nd measure, or both)
- **Sparkline trend** with 5 modes (line, area, bar, dot plot, stepped)
- **Forecasting**: Holt, Polynomial, Auto-Regressive, Weighted MA, Linear — with confidence intervals and configurable training window
- **Smart KPI scopes**: Full / Trend Window / Today / WTD / MTD / QTD / YTD / Last 7-30-90 Days / **Selection Range** (auto-switches on date selection)
- **Calendar-aware delta**: Match KPI Scope (auto), Previous Calendar Period (day/week/month/quarter/year), Previous N points
- **Period start marker** on the trend so you can see where the current scope begins
- **Range comparison hints**: chips aligned with KPI rows, subtitle, delta tooltip, or modern hover tooltip — pick one or stack them
- **Scope quick buttons** (Today / MTD / YTD style) — compact chip dropdown or expanded buttons, optional auto-zoom on trend
- **Themes & gradient backgrounds**, glass morphism, dark mode, neumorphic shadows
- **Conditional background** with thresholds (`>`, `≥`, `<`, `≤`, `=`, between)
- **Selection indicators**: tapered neon bar, side accent, full / partial border, glow halo, background tint
- **Click actions**: select a field value, change a variable, or clear selections
- **Modern icons**: emoji set, line icons, or paste your own SVG
- **Responsive typography** (em-based) or static (px) modes
- **Config presets**: capture/apply visual settings as portable JSON across cards

## 📋 Requirements

- Qlik Sense Enterprise or Qlik Cloud
- **1 Date Dimension** (required)
- **1–2 Measures** (1st required, 2nd optional for paired KPI / previous-period display)

## 🔧 Installation

### Qlik Cloud
1. **Administration → Extensions** → **Import**
2. Select the downloaded folder (or zip)
3. The extension appears under **Custom Objects** on any sheet

### Qlik Sense Enterprise (Windows / Client-Managed)
1. Open **Qlik Management Console (QMC)**
2. Go to **Extensions** → **Import**
3. Select the folder/zip and confirm

### Usage
1. Drag **KPI Card** from **Custom Objects** onto a sheet
2. Add **1 date dimension** and **1 (or 2) measure(s)**
3. Configure look & behaviour via the **Properties** panel

## ⚙️ Configuration Quick Reference

### Content
- **Title / Measure Label / Alignment**
- **KPI Aggregation**: Last, Sum, Average, Min, Max
- **KPI Scope**: Full data, Trend Window, Selection Range, Today, WTD, MTD, QTD, YTD, Last 7d, Last 30d, Last 90d
- **Number Format** per KPI (auto / number / percent) with prefix, suffix, decimals, thousand separator

### Scope Quick Buttons
- **Show / Hide** + **Compact chip** or **Expanded buttons** display style
- 3 user-configurable buttons (any of the predefined scopes)
- **Link Trend Window to Scope** — auto-zooms the trend to cover current + previous period
- **Auto-switch to Selection Range** — when the user makes a date selection the card automatically uses that range; stored scope returns when cleared

### Delta & Status
- **Delta Mode**:
  - *Match KPI Scope* — compares current vs previous of the same scope (MTD → previous MTD, etc.)
  - *Previous N points* with offset (manual)
  - *Previous Calendar Period* — Day / Week / Month / Quarter / Year
- **Compared Date Ranges Hint**: chips, subtitle, delta tooltip, modern hover tooltip, or any combination
- Display type: percentage or absolute (with optional K/M/B short format)
- Status badge (▲ / ▼ / ■) with theme-aware colours

### Trend
- Mode: line, area, bar, dot plot, stepped
- Corners: sharp or smooth
- Quick range buttons (12P / 60P / 1Y by default, fully configurable)
- Area gradient fill (vertical/horizontal)
- Min/max pulse markers, glow filter, tooltip on hover

### Forecast
- Method: Holt Exponential Smoothing (default), Polynomial Regression, Auto-Regressive, Weighted Moving Average, Linear Regression
- 1–60 forecast periods
- **Training Data window**: Current Trend Window / Last 30-90-180-365 days / Last 12-30-60-120 points / All data
- Confidence interval shading (80% / 90% / 95%)
- Line style (dashed/dotted/solid), opacity, custom color

### Appearance
- Theme presets (Custom, Slate, Ocean, Sunset, Emerald, Violet, Glass morphism)
- Background opacity, gradient backgrounds (8 presets + custom)
- Card elevation: subtle / medium / strong / neumorphic
- Border, border radius, padding
- Conditional background by threshold

### Interaction
- **Click action**: select field value, change variable value, clear selections
- **Selected indicator**: Neon Bar, Side Accent, Border, Bottom Border, Top Border, Glow Effect, Background Tint

### Effects
- Hover scale on KPI value
- Hover line-thickness multiplier
- Counter animation, line draw animation, area fade-in, delta slide-in
- Min/max pulse animation
- Glow filter on trend

### Config Presets
- **Capture** — serialises all visual properties as JSON
- **Apply** — paste JSON into another card and apply for instant theme propagation

## 📊 Data Structure

```
Date         | Revenue   | (Optional 2nd Measure)
-------------|-----------|------------------------
2026-01-01   | 1500      | ...
2026-01-02   | 1800      | ...
2026-01-03   | 1200      | ...
```

### 💡 Pro Tip — Cumulative Measure Pattern

To unlock **comparison features even with date selections** (the engine otherwise filters to selected dates only), use a cumulative measure:

```qlik
sum({<Date={"<=$(vMaxDate)"}>} Revenue)
```

…with a variable:

```qlik
vMaxDate = =Max(Date)
```

This expands the hypercube so previous-period calculations have access to all history. The extension's `Auto-switch to Selection Range` then takes over and uses the user's selected range as the current period.

## 🎨 Use Cases

- Sales / Revenue KPIs with month-over-month, year-over-year comparison
- Operational dashboards with trend forecasting
- Executive scorecards with smart scope toggling
- Multi-card dashboards with consistent styling via Config Presets

## 🐛 Troubleshooting

**Extension not visible**: restart Qlik Sense or re-import the extension.
**No data shown**: ensure exactly one date dimension and at least one measure are added.
**Forecast not rendering**: requires at least 4 data points and trend mode line / area / stepped (not bar / dots).
**Chips overlapping value**: chips are absolutely positioned on the right and may overlap very long numbers — widen the card or pick a shorter format.

## 📝 Version History

### v2.0
- Selection-aware KPI scope (auto-switch on date selection)
- Calendar-aware delta with day/week/month/quarter/year units
- Match KPI Scope delta mode for natural MTD-vs-Previous-MTD comparisons
- Period start marker on trend
- Range comparison chips, subtitle, delta tooltip, modern hover tooltip
- Forecast training window decoupled from trend window
- Side Accent selection indicator
- Linked trend window to KPI scope
- 'Today' scope and quick-button presets
- Comprehensive Config Presets (capture / apply)

### v1.0
- Initial release with KPI + sparkline trend
- Theme presets, gradient backgrounds, dark mode
- Click interactions, selection indicators
- Quick trend buttons, animation suite

## 🤝 Contributing

PRs welcome — fork the repo, branch from `main`, and open a pull request describing the change. For bug reports, please use **GitHub Issues** with a clear repro (Qlik version, screenshots, expected vs actual).

## 📄 License

[MIT License](LICENSE) — feel free to use, modify, and distribute.

## 👨‍💻 Author

**f.arslan** — Qlik Sense Extension Developer
[LinkedIn](https://www.linkedin.com/in/mfarsln/)

---

⭐ If this extension helped you, please star the repo — it makes a real difference for discoverability.
