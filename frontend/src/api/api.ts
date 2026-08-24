

/**
 * @description this function is for api calling to also consider or cater api call that fail due to expired token
 * @param url // apiBackend
 * @param method // method as per request
 * @param body // data sent in the request
 * @returns 
 */
export async function apiCall(url: Request, method: string, body = null) {
  // 1. Get token
  const token = localStorage.getItem("token");

  // 2. Make request
  let res = await fetch(url, {
    method: method,  // pass the method here
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: body ? JSON.stringify(body) : null
  });

  // 3. If token expired, refresh and retry
  if (res.status === 401) {
    const refreshRes = await fetch("http://localhost:3000/api/auth/refresh", {
      method: "POST",
      credentials: "include"
    });
    const data = await refreshRes.json();
    localStorage.setItem("token", data.token);

    // 4. Retry with new token
    res = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${data.token}`
      },
      body: body ? JSON.stringify(body) : null
    });
  }

  return res;
}


export const apiBackend = 'http://localhost:3000/api'