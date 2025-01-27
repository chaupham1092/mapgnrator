// Initialize the map
let map = L.map('map').setView([0, 0], 2); // Default to world view

// Load OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: 'Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
}).addTo(map);

// Geocoding function using Nominatim
async function geocodeLocation(location) {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&polygon_geojson=1`);
    const data = await response.json();
    if (data.length > 0) {
        return {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon),
            displayName: data[0].display_name,
            geojson: data[0].geojson, // For highlighting areas
        };
    }
    return null;
}

// Generate the map based on the selected mode
async function generateMap() {
    const locationsInput = document.getElementById('locations').value;
    const locations = locationsInput.split('\n').map(loc => loc.trim()).filter(Boolean);

    if (locations.length === 0) {
        alert('Please enter at least one location.');
        return;
    }

    // Clear the map
    map.eachLayer(layer => {
        if (layer instanceof L.TileLayer === false) {
            map.removeLayer(layer);
        }
    });

    const bounds = L.latLngBounds();

    // Get the selected mode
    const mode = document.querySelector('input[name="mode"]:checked').value;

    for (const location of locations) {
        try {
            const result = await geocodeLocation(location);
            if (result) {
                if (mode === 'pin') {
                    // Pin Mode: Add a marker
                    const marker = L.marker([result.lat, result.lon]).addTo(map);
                    marker.bindPopup(`<p>${result.displayName}</p>`).openPopup();
                    bounds.extend([result.lat, result.lon]);
                } else if (mode === 'highlight') {
                    // Highlight Mode: Add a colored polygon
                    if (result.geojson) {
                        const polygon = L.geoJSON(result.geojson, {
                            style: {
                                color: 'blue',
                                weight: 2,
                                fillColor: 'blue',
                                fillOpacity: 0.4,
                            },
                        }).addTo(map);
                        bounds.extend(polygon.getBounds());
                    }
                }
            } else {
                console.warn(`Could not geocode location: ${location}`);
            }
        } catch (error) {
            console.error(`Error geocoding location "${location}":`, error);
        }
    }

    // Adjust the map to fit all markers or highlighted areas
    if (bounds.isValid()) {
        map.fitBounds(bounds);
    }
}
