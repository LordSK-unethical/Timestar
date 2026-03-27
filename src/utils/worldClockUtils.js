const CITIES = [
  { name: 'New York', timezone: 'America/New_York', country: 'USA' },
  { name: 'Los Angeles', timezone: 'America/Los_Angeles', country: 'USA' },
  { name: 'Chicago', timezone: 'America/Chicago', country: 'USA' },
  { name: 'London', timezone: 'Europe/London', country: 'UK' },
  { name: 'Paris', timezone: 'Europe/Paris', country: 'France' },
  { name: 'Berlin', timezone: 'Europe/Berlin', country: 'Germany' },
  { name: 'Tokyo', timezone: 'Asia/Tokyo', country: 'Japan' },
  { name: 'Sydney', timezone: 'Australia/Sydney', country: 'Australia' },
  { name: 'Dubai', timezone: 'Asia/Dubai', country: 'UAE' },
  { name: 'Singapore', timezone: 'Asia/Singapore', country: 'Singapore' },
  { name: 'Hong Kong', timezone: 'Asia/Hong_Kong', country: 'China' },
  { name: 'Mumbai', timezone: 'Asia/Kolkata', country: 'India' },
  { name: 'Toronto', timezone: 'America/Toronto', country: 'Canada' },
  { name: 'Moscow', timezone: 'Europe/Moscow', country: 'Russia' },
  { name: 'Seoul', timezone: 'Asia/Seoul', country: 'South Korea' },
  { name: 'Bangkok', timezone: 'Asia/Bangkok', country: 'Thailand' },
  { name: 'Jakarta', timezone: 'Asia/Jakarta', country: 'Indonesia' },
  { name: 'Manila', timezone: 'Asia/Manila', country: 'Philippines' },
  { name: 'Kuala Lumpur', timezone: 'Asia/Kuala_Lumpur', country: 'Malaysia' },
  { name: 'Abu Dhabi', timezone: 'Asia/Dubai', country: 'UAE' },
];

const WORLD_CLOCK_KEY = 'timestar_world_clock';

function getTimeInTimezone(timezone) {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const timeStr = formatter.format(now);
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const dateStr = dateFormatter.format(now);
    
    return { time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`, date: dateStr };
  } catch (e) {
    const now = new Date();
    return {
      time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      date: now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    };
  }
}

function getTimeDifference(timezone) {
  try {
    const now = new Date();
    const localTime = now.getTime();
    const localOffset = now.getTimezoneOffset() * 60000;
    
    const targetDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const targetOffset = targetDate.getTimezoneOffset() * 60000;
    const targetTime = localTime + localOffset + targetDate.getTime() - now.getTime();
    
    const diffHours = Math.round((targetTime - localTime) / 3600000);
    
    if (diffHours === 0) return 'Same time';
    if (diffHours > 0) return `+${diffHours}h`;
    return `${diffHours}h`;
  } catch (e) {
    return '';
  }
}

function searchCities(query) {
  if (!query) return [];
  const q = query.toLowerCase();
  return CITIES.filter(city => 
    city.name.toLowerCase().includes(q) || 
    city.country.toLowerCase().includes(q)
  ).slice(0, 8);
}

export { 
  CITIES, 
  WORLD_CLOCK_KEY, 
  getTimeInTimezone, 
  getTimeDifference, 
  searchCities 
};