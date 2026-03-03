export default async function handler(req, res) {
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    return res.status(200).json({ source: 'no-key', data: null });
  }

  try {
    const response = await fetch('https://cricket-api-free-data.p.rapidapi.com/fixtures', {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'cricket-api-free-data.p.rapidapi.com'
      }
    });
    
    if (!response.ok) {
      return res.status(200).json({ source: 'error', data: null, error: `API responded with status ${response.status}` });
    }

    const data = await response.json();
    return res.status(200).json({ source: 'api', data });
  } catch (error) {
    return res.status(200).json({ source: 'error', data: null, error: error.message });
  }
}
