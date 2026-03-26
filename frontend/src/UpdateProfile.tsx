import axios from "axios";
import { useEffect, useState } from "react";

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
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");


//get the user data
  const getUser = async () => {
    const res = await axios.get(`http://localhost:3000/api/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setUserData(res.data.data);
  };
//send the request to the backend
  const updateUser = async () => {
    const data = {name, email}
   const res = await axios.post(`http://localhost:3000/api/profile/update`, data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
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
