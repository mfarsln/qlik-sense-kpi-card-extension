

# KPI Card Extension for Qlik Sense

Modern KPI cards with dual measures, responsive typography, tapered selection effects, gradient/glass themes, and portable configuration presets.

## 📸 Screenshots

### KPI Card
![Basic KPI Card](https://imagedelivery.net/BdpL1pNKEf9FjxHkN-wXKg/b83d46ec-3e6c-4a30-039d-07183a7ca600/public).

![Basic KPI Card](https://imagedelivery.net/BdpL1pNKEf9FjxHkN-wXKg/b1e3c69d-7beb-48cb-3652-8762c9110600/public)

![Basic KPI Card](https://imagedelivery.net/BdpL1pNKEf9FjxHkN-wXKg/dae0ddf1-6570-416c-ecdf-eef885423600/public)

![Basic KPI Card](https://imagedelivery.net/BdpL1pNKEf9FjxHkN-wXKg/459b324d-5933-4d6a-2e28-585c2d5d7000/public)


*Basic KPI card with sparkline trend*



## 🚀 Features

- **Single/Dual Measure KPI**: Works with one measure and one date dimension. Add secondary measure for period changes.
- **Sparkline Trend**: Line/area, smooth or sharp, gradient fill, tooltip + min/max markers
- **Responsive Design**: Adapts to different screen sizes
- **Animations**: Value and trend animations
- **Color Palettes**: Pre-built color themes and custom color options
- **Quick Trend Buttons**: Fast trend options like 12P, 60P, 1Y
- **Interaction Options**: Select field value, clear selection, or change variable
- **Selection Effects**: Tapered neon bar, glow/border styles, background tint
- **Icons**: Emoji pack, modern line icons, or sanitized custom SVG/HTML
- **Theme Presets**: Gradient/glass schemes, custom colors, border/shadow/elevation controls
- **Conditional Background**: Expression-enabled thresholds for background color
- **Delta Display**: Comparison with previous periods
- **Tooltip**: Detailed information on hover
- **Config Presets**: Capture/apply visual/layout JSON to replicate cards
- **Dark Mode**: Dark theme support

## 📋 Requirements

- Qlik Sense Enterprise, Qlik Cloud
- 1 Date Dimension
- 1 or 2 Measure

## 🔧 Installation

### 1. Download Files
Download this repository as ZIP or clone it with `git clone`.

*Click "Code" → "Download ZIP" to get the extension files*

### 2. Install to Qlik Sense

#### For Qlik Cloud:
1. Go to **Administration** → **Extensions**
2. Click the **Import** button
3. Select the downloaded folder
4. Extension will be installed and ready to use


#### For Qlik Sense Server:
1. Log in to Qlik Management Console
2. Go to **Extensions** section
3. Click **Import** button
4. Select the downloaded folder
5. Import the extension


### 3. Usage
1. Create a new sheet
2. Select **KPI Card** from **Custom Objects** panel
3. Add one date dimension and one measure
4. Customize appearance from Properties panel


## ⚙️ Configuration

### Basic Settings
- **Title**: KPI title
- **Measure Label**: Measure label
- **Alignment**: Alignment (Left, Center, Right)

### Font Settings
- **Font Mode**: Static (px) or Responsive (em)
- Font sizes and families
- Automatic sizing in responsive mode

### Color Settings
- **Color Palette**: Pre-built themes (Slate, Ocean, Sunset, Emerald, Violet)
- **Custom Colors**: Custom color options
- **Trend Palette**: Separate color palette for trend charts

### Trend Settings
- **Trend Mode**: Line or Area
- **Trend Corners**: Sharp or Smooth
- **Trend Window**: All data, Last N points, Last N days
- **Quick Buttons**: 12P, 60P, 1Y quick options

### Animations
- **Animate Draw**: Line drawing animation
- **Animate Value**: KPI value animation
- **Animate Delta**: Delta change animation
- **Animate Pulse**: Min/Max point animation

### Effects
- **Glow Effect**: Light effect
- **Tooltip**: Hover information box
- **Min/Max Markers**: Lowest/highest value markers
- **Hover Effects**: Mouse hover effects

## 📊 Data Structure

The extension expects the following data structure:
- **1 Date Dimension**: Date/time data
- **1 Measure**: Numeric value

Example data:
```
Date         | Sales
-------------|-------
2024-01-01   | 1500
2024-01-02   | 1800
2024-01-03   | 1200
```

## 🎨 Example Use Cases

- **Sales KPI**: Daily sales and trends
- **Customer Count**: Active customer count and growth
- **Revenue**: Monthly revenue and trend analysis
- **Performance**: System performance metrics

## 🔧 Advanced Features

### Responsive Font Sizing
In responsive mode, font sizes are automatically adjusted based on container size:
- Smaller fonts on small screens
- Larger fonts on large screens

### Session Storage
Quick button selections are stored in browser session and preserved on page refresh.

### Delta Calculation
Flexible settings for comparison with previous periods:
- **Delta Mode**: Points-based
- **Delta Points**: Number of points to compare
- **Delta Offset**: How many periods back to look
- **Delta Aggregation**: Sum, Average, Last

## 🐛 Troubleshooting

### Common Issues

**Extension not visible:**
- Restart Qlik Sense
- Re-import the extension

**No data visible:**
- Make sure you added 1 date dimension and 1 measure
- Check that date format is correct in your data model

**Animations not working:**
- Check if browser supports JavaScript
- Make sure you're using an up-to-date version of Qlik Sense

## 📝 Version History

### v1.0.0
- Initial release
- Basic KPI card features
- Sparkline trend charts
- Responsive design
- Animations and effects

## 🤝 Contributing

This extension is open source. We welcome your contributions!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## 👨‍💻 Developer

**f.arslan** - Qlik Sense Extension Developer

## 📞 Contact

You can use GitHub Issues for your questions.

---

⭐ If you liked this extension, don't forget to give it a star!





