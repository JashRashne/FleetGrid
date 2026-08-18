const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export async function planTrip(tripData) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout

  try {
    const response = await fetch(`${API_BASE_URL}/api/plan-trip/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tripData),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData.message || (errorData.errors ? JSON.stringify(errorData.errors) : `Server responded with ${response.status}`);
      throw new Error(msg);
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. The server might be waking up; please try again in a few moments.');
    }
    throw err;
  }
}

export async function fetchQuickCities() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cities/`);
    if (response.ok) {
      const data = await response.json();
      return data.cities || [];
    }
  } catch (err) {
    // Fallback static list
  }
  return [
    { name: "Chicago, IL", display: "Chicago, IL" },
    { name: "Indianapolis, IN", display: "Indianapolis, IN" },
    { name: "Atlanta, GA", display: "Atlanta, GA" },
    { name: "Dallas, TX", display: "Dallas, TX" },
    { name: "Los Angeles, CA", display: "Los Angeles, CA" },
    { name: "New York, NY", display: "New York, NY" },
  ];
}
