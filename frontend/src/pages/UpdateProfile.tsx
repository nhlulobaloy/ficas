import { useEffect, useState } from "react";
import{ apiBackend,apiCall }from '../api/api.ts';

interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  newPassword: string;
}

export default function UpdateProfile() {
  const token = localStorage.getItem("token");
  const [userData, setUserData] = useState<User>();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");


//get the user data
  const getUser = async () => {
    const res = await apiCall(`${apiBackend}/profile`);
    const data = await res.json();
    setUserData(data);
  };
//send the request to the backend
  const updateUser = async () => {
    const data = {name, email}
   const res = await apiCall(`${apiBackend}/profile/update`, {
    method: 'POST',
    body: JSON.stringify(data)
   })
  await getUser();
  }

  useEffect(() => {
    getUser();
  }, [token, setUserData]);

useEffect(() => {
  if (userData) {
    setName(userData.name);
    setEmail(userData.email);
  }
}, [userData]);
  //getUser()
  if (!userData) return <div>Loading...</div>;
  return (
    <>
      <h1>Update your details</h1>
  
        <div key={userData.id}>
          ID: {userData.id}<br></br>
          <input
          value={name}

          onChange={(e) => setName(e.target.value)}
          ></input><br></br>
          <input
          value={email}
          onChange={(e) => setEmail(e.target.value)} readOnly
          ></input>
          <h3>Role: {userData.role}</h3>
           <button onClick={updateUser}>Save</button>
        </div>
    </>
  );
}
