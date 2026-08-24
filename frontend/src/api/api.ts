

/**
 * API wrapper with auto-refresh on token expiry
 * @param url - API endpoint
 * @param options - Fetch options (method, body, headers)
 * @returns Response
 */

export async function apiCall(url: string, options = {}) {
  // Get token
  const token = localStorage.getItem("token");

  // Make request
  let res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });

  // If token expired, refresh and retry
  if (res.status === 401) {
    const refreshRes = await fetch("http://localhost:3000/api/auth/refresh", {
      method: "POST",
      credentials: "include"
    });
    const data = await refreshRes.json();
    localStorage.setItem("token", data.token);

    // Retry with new token
    res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${data.token}`
      },
    });
  }

  return res;
}

export const apiBackend = 'http://localhost:3000/api'