// REPLACE THE URL BELOW WITH YOUR SPECIFIC GOOGLE SHEET CSV URL FROM STEP 1
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQCrVbu8yeirQ22dEWvc3jEYKURyehJZJnZd96OZweB7NgAOCr0RFoZwSCe_tF7_JcKl5n_pc5oc6AD/pub?gid=474045884&single=true&output=csv';

const tableBody = document.getElementById('table-body');
let tableData = []; // Store data globally for sorting later

// 1. Fetch and process the data
async function loadData() {
    try {
        const response = await fetch(SHEET_URL);
        const data = await response.text();
        tableData = parseCSV(data);
        renderTable(tableData);
    } catch (error) {
        console.error('Error loading data:', error);
        tableBody.innerHTML = '<tr><td colspan="3">Error loading data. Check console.</td></tr>';
    }
}

// 2. Parse CSV Text into an Array of Objects
function parseCSV(csvText) {
    const lines = csvText.split('\n'); // Split by new line
    const headers = lines[0].split(',').map(header => header.trim().replace(/^"|"$/g, '')); // Clean headers
    const results = [];

    // Start loop from 1 to skip the header row
    for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].trim();
        if (!currentLine) continue; // Skip empty lines

        // Complex regex to handle commas inside quotes (standard CSV parsing)
        const regex = /(?:^|,)(\"(?:[^\"]+|\"\")*\"|[^,]*)/g;
        let match;
        const values = [];
        
        while ((match = regex.exec(currentLine)) !== null) {
            // Remove leading comma and surrounding quotes
            let val = match[1].replace(/^,/, '').replace(/^"|"$/g, '');
            values.push(val.trim());
        }

        // Map values to headers to create an object
        let obj = {};
        // We look for specific headers we defined in Step 1: URL, Used for, Name
        // Note: Google Forms might add a "Timestamp" column automatically, usually at index 0.
        // We map based on index assuming the order: Timestamp, URL, Used for, Name OR URL, Used for, Name
        // To be safe, we will grab data by finding the index of the header name.
        
        const urlIndex = headers.findIndex(h => h.includes('URL'));
        const usedForIndex = headers.findIndex(h => h.includes('Used for'));
        const nameIndex = headers.findIndex(h => h.includes('Name'));

        if (nameIndex > -1) obj.name = values[nameIndex];
        if (urlIndex > -1) obj.url = values[urlIndex];
        if (usedForIndex > -1) obj.used_for = values[usedForIndex];

        results.push(obj);
    }
    return results;
}

// 3. Render the table rows
function renderTable(data) {
    tableBody.innerHTML = ''; // Clear existing rows

    data.forEach(item => {
        const row = document.createElement('tr');

        // Create cells. The order here must match your HTML <thead>: Name, URL, Used For
        
        // Name Cell
        const nameCell = document.createElement('td');
        nameCell.textContent = item.name || 'N/A';
        row.appendChild(nameCell);

        // URL Cell (clickable link)
        const urlCell = document.createElement('td');
        const link = document.createElement('a');
        link.href = item.url;
        link.textContent = item.url;
        link.target = '_blank'; // Open in new tab
        urlCell.appendChild(link);
        row.appendChild(urlCell);

        // Used For Cell
        const usedForCell = document.createElement('td');
        usedForCell.textContent = item.used_for || 'N/A';
        row.appendChild(usedForCell);

        tableBody.appendChild(row);
    });
}

// Initialize
loadData();

// --- SORTING LOGIC ---

const tableHeaders = document.querySelectorAll('th');
let sortDirection = 1; // 1 = Ascending, -1 = Descending
let lastSortedColumn = '';

// Add click event to every header
tableHeaders.forEach(header => {
    header.addEventListener('click', () => {
        const column = header.getAttribute('data-column');
        
        // If the header doesn't have a data-column attribute, do nothing
        if (!column) return;

        // Toggle sort direction if clicking the same column
        if (lastSortedColumn === column) {
            sortDirection *= -1;
        } else {
            sortDirection = 1; // Reset to ascending for new column
            lastSortedColumn = column;
        }

        sortArray(column, sortDirection);
        updateHeaderStyles(column, sortDirection);
    });
});

function sortArray(column, direction) {
    tableData.sort((a, b) => {
        // Safe check for null values and convert to lowercase for comparison
        const valA = (a[column] || '').toString().toLowerCase();
        const valB = (b[column] || '').toString().toLowerCase();

        if (valA < valB) return -1 * direction;
        if (valA > valB) return 1 * direction;
        return 0;
    });

    // Re-draw the table with sorted data
    renderTable(tableData);
}

// Optional: Visual indicator (arrows) in the header
function updateHeaderStyles(column, direction) {
    tableHeaders.forEach(th => {
        // Remove existing arrows
        th.textContent = th.textContent.replace(' 🔼', '').replace(' 🔽', '');
        
        // Add arrow to current sorted header
        if (th.getAttribute('data-column') === column) {
            th.textContent += direction === 1 ? ' 🔼' : ' 🔽';
        }
    });
}
