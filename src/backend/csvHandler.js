const fs = require('fs');
const path = require('path');

// Helper function to parse CSV text into JSON format
function parseCSV(csvText) {
    const rows = csvText.split('\n').filter(row => row.trim() !== '');
    const headers = rows[0].split(','); // First row is the header
    const data = rows.slice(1).map(row => {
        const values = row.split(',');
        return headers.reduce((obj, header, index) => {
            obj[header.trim()] = values[index].trim();
            return obj;
        }, {});
    });
    return { headers, data };
}

// Helper function to save parsed CSV data to JSON file
function saveCSVDataToFile(projectId, csvData) {
    const filePath = path.join(__dirname, 'projects.json');
    const projects = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const projectIndex = projects.findIndex(project => project.id === projectId);
    if (projectIndex !== -1) {
        projects[projectIndex].csvData = csvData;
        fs.writeFileSync(filePath, JSON.stringify(projects, null, 2), 'utf8');
    }
}

module.exports = { parseCSV, saveCSVDataToFile };