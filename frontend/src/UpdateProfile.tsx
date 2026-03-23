import axios from "axios";
import { useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  newPassword: string;
}

export default function UpdateProfile() {
  const token = localStorage.getItem("token");
  const [userData, setUserData] = useState<User>();
  const [loading, setLoading] = useState(true);

  const getUser = async () => {
    const res = await axios.get(`http://localhost:3000/api/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setUserData(res.data.data);
  };

  useEffect(() => {
    getUser();
  }, [token, setUserData]);
  //getUser()
  if (!userData) return <div>Loading...</div>;
  return (
    <>
      <h1>Hello world</h1>
  
        <div key={userData.id}>
          ID: {userData.id}
          <h2>Name: {userData.name}</h2>
          <h2>Email: {userData.email}</h2>
          <h2></h2>
        </div>
  
    </>
  );
}
