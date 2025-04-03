# Attendance Manager Pro 🚀

A sleek, modern attendance tracking application for students built with React Native (Expo). This app helps students manage their class attendance effectively with an intuitive interface and powerful features, keeping all data securely stored on the device.

<!-- Optional: Add a screenshot or GIF here -->
<!-- ![App Screenshot](link-to-your-screenshot.png) -->

## ✨ Core Features

### Smart Attendance Tracking

- **Course Management**: Add, edit, and organize courses with customizable details (name, professor, location, schedule, color coding).
- **Attendance Recording**: Quick one-tap attendance marking (Present, Absent, Late, Excused) directly from the daily schedule.
- **Schedule Integration**: Weekly timetable view and a daily schedule on the home screen.
- **Attendance Statistics**: Visual analytics showing attendance percentages per course and overall.
- **Attendance History**: Calendar view to track patterns and review past attendance.
- **Minimum Attendance Tracking**: Set course attendance requirements and monitor progress.

### Enhanced Student Experience

- **Note Taking**: Add quick notes to specific attendance entries.
- **Offline Support**: Full functionality without an internet connection, thanks to local data storage.
- **Data Export/Backup**: Options to export data and perform local backups (Verify implementation details).
- **Customizable Themes**: Light/dark mode support.

## 🛠️ Tech Stack

- **Framework**: React Native (Expo SDK)
- **Language**: TypeScript
- **Navigation**: Expo Router
- **Styling**: Tailwind CSS (likely via NativeWind)
- **State Management**: React Context API
- **Local Storage**: AsyncStorage
- **Icons**: Ionicons (Expo Vector Icons)
- **Charts**: (Potentially React Native SVG & Victory Charts - verify if used)

## 📁 Project Structure

AttendanceManager/
├── app/ # Expo Router screens and navigation setup (layout.tsx)
│ ├── layout.tsx # Main navigation layout
│ ├── index.tsx # Home screen
│ ├── courses.tsx # Courses list screen
│ ├── add-course.tsx # Add course screen
│ ├── calendar.tsx # Calendar view screen
│ ├── settings.tsx # Settings screen
│ ├── statistics.tsx # Statistics screen
│ └── ... # Other screens and components specific to routing
├── assets/ # Static assets (images, fonts)
├── src/ # Core application logic and UI components
│ ├── components/ # Reusable UI components (Card, Text, StatusBadge, etc.)
│ ├── context/ # React Context for global state (DataContext)
│ ├── data/ # Data types, initial data, or data helpers
│ ├── utils/ # Utility functions (theming, helpers)
│ └── ...
├── .expo/ # Expo generated files
├── node_modules/ # Project dependencies
├── .gitignore # Git ignore rules
├── app.json # Expo app configuration
├── babel.config.js # Babel configuration
├── package.json # Project dependencies and scripts
├── tailwind.config.js # Tailwind CSS configuration
├── tsconfig.json # TypeScript configuration
└── readme.md # This file

## 🚀 Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- npm or yarn
- Expo Go app on your physical device or an emulator/simulator setup

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/Code-name-HeaLer/RollCall-Pro
    cd AttendanceManager
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

### Running the App

1.  **Start the development server:**
    ```bash
    npx expo start
    ```
2.  **Run on your device/emulator:**
    - Scan the QR code displayed in the terminal using the Expo Go app on your iOS or Android device.
    - Or, press `a` to run on an Android emulator, `i` to run on an iOS simulator, or `w` to run in the web browser.

## ⚙️ Usage

1.  **Add Courses**: Navigate to the "Courses" tab/screen and add your courses, including schedule details.
2.  **Mark Attendance**: On the "Home" screen, view your schedule for the day and tap the icons (Present, Absent, Late, Excused) for each class.
3.  **View Stats & History**: Explore the "Statistics" and "Calendar" screens to monitor your attendance records over time.
4.  **Adjust Settings**: Customize the theme and other preferences in the "Settings" screen.

## 🤝 Contributing

Contributions are welcome! If you'd like to contribute, please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

<!-- Optional: Add License section -->
<!-- ## 📄 License -->
<!-- This project is licensed under the MIT License - see the LICENSE.md file for details. -->
