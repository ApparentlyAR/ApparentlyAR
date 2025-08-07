# ApparentlyAR — 22R Studio 3 Project

ApparentlyAR is a web-based educational platform designed for students in grades 8–10 to explore and visualise data using a block-based programming interface combined with Augmented Reality (AR). The platform encourages hands-on, creative learning by allowing students to interact with data through fiducial markers and spatial visualisation.

---

## Project Overview

### Objective

To improve data literacy among younger students by enabling them to:
- Upload and transform datasets through drag-and-drop programming blocks
- Manipulate and interact with data visualisations using AR markers
- Understand foundational data science concepts such as filtering, grouping, averages, and trends

### Core Features

- Block-based programming interface using Blockly
- Browser-based AR visualisations powered by MindAR / AR.js
- Use of fiducial markers to control visualisation types, filters, and data operations
- Runs entirely in-browser, compatible with low-powered devices such as Chromebooks
- Teacher mode for lesson planning, walkthroughs, and curriculum integration

---

## Tech Stack

| Category          | Tools / Languages                     |
|------------------|----------------------------------------|
| Frontend         | HTML, CSS, JavaScript                  |
| Block Programming| Blockly (custom blocks)                |
| AR Integration   | MindAR, AR.js, Three.js                |
| Data Handling    | JavaScript (CSV upload and transforms) |
| Version Control  | Git, GitHub                            |
| Development Tools| VS Code, npm, browser development tools|

---

## Folder Structure (proposed)

```
ApparentlyAR/
├── public/                # Static assets, index.html
├── src/
│   ├── ar/                # AR marker logic and rendering
│   ├── blocks/            # Blockly block definitions and config
│   ├── data/              # Example CSV datasets
│   ├── components/        # UI components
│   ├── utils/             # Helper functions
├── LICENSE
├── README.md
├── .gitignore
├── package.json
```

---

## Example Interaction Flow

1. A dataset is uploaded via the block-based interface.
2. Fiducial markers are placed on the physical workspace (e.g. a desk).
3. Markers are detected via webcam to trigger functions such as chart selection or filtering.
4. Visualisations are displayed over the physical environment using AR.

---

## Team Members

| Name        | GitHub Username     |
|-------------|---------------------|
| Pascal      | *(please add yours)* |
| Faraihan    | *(please add yours)* |
| Yugansh     | *(please add yours)* |
| Benjamin    | `@BenGhahramani`     |
| Najla       | *(please add yours)* |
| Christophe  | *(please add yours)* |

Team members, please edit this section to include your GitHub usernames.

---

## Getting Started

### Clone the repository

```
git clone https://github.com/BenGhahramani/ApparentlyAR.git
cd ApparentlyAR
```

### Install dependencies

```
npm install
```

### Start development server (if applicable)

```
npm start
```

### Open in browser

Navigate to `http://localhost:3000` or the port indicated in the terminal.

### Run tests

```
npm test
```

This will run all tests using Jest. Test files should be named with `.test.js` or `.spec.js` and placed alongside the code they test or in a `__tests__` folder.

---

## Example Dataset

Use the following sample data to test visualisation features:

```
Name,Grade,Score
Alice,9,85
Bob,10,72
Charlie,8,90
```

- Place this in the `src/data/` folder or use the upload interface once implemented.

---

## Project Structure

- `src/` — Main source code
  - `__tests__/` — (Optional) Test files can go here or alongside modules
  - Example: `src/example.test.js` for a sample test
  - `tests/` — All test files (e.g., `tests/sum.test.js`)
  - Example: `const sum = require('../src/sum');` in test files

---

## License

This project is licensed under the [MIT License](./LICENSE).

---

## Contact

Please reach out to any team member via GitHub for questions or feedback.
