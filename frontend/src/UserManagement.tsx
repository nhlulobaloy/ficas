import { useEffect, useState } from "react";
import "../styles/UserManagement.css";
import axios from "axios";



interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  create_incident: string;
  assign_incident: string;
  update_preliminary: string;
  review_preliminary: string;
  review_forensic: string;
  fraud_prevention_draft: string;
  fraud_prevention_review: string;
  fraud_detection_draft: string;
  fraud_detection_review: string;
}

export default function UserManagement() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [addUser, setAddUser] = useState(false);
  const [userManagement, setUserManagement] = useState(false);
  const token = localStorage.getItem("token");
  //these are for the update user details
  const [userData, setUserData] = useState<[]>([]);
  const [showUserData, setShowUserData] = useState(false);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  //for the popup if the user was selected man
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPopUp, setShowPopUp] = useState(false);

  const handleSubmit = async () => {
    if (!name || !email || !password) {
      setMessage("All fields are required");
      return;
    }

    const userData = { name, email, password };
    try {
      const res = await fetch(`http://localhost:3000/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("User created successfully");
        setName("");
        setEmail("");
        setPassword("");
      } else {
        setMessage(data.error || "Failed to create user");
      }
    } catch (error) {
      setMessage("Server error");
    }
  };

  const updateUser = async () => {
  
   const res = await axios.post(`http://localhost:3000/api/user/management/update`,{
  selectedUser},
    {headers: {
      Authorization: `Bearer ${token}`
    }
   })
  }

  const getUsers = async () => {
    const res = await axios.get(`http://localhost:3000/api/user/management`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setUserData(res.data.results);
  };
  useEffect(() => {
    getUsers();
  }, [token]);

  return (
    <>
      <button
        className="create-user"
        onClick={() => {
          setAddUser(!addUser);
          setShowUserData(false);
        }}
      >
        Add new user
      </button>
      <button
        className="create-user"
        onClick={() => {
          setShowUserData(!showUserData);
          setAddUser(false);
        }}
      >
        User Management
      </button>

      {showUserData && (
        <div className="user-management">
          <table>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {userData.map((user: User) => (
                <tr key={user.id}>
                  <td>{user?.id}</td>
                  <td>{user?.name}</td>
                  <td>{user?.email}</td>
                  <td>{user?.role}</td>
                  <td>
                    <button
                      className="save-button"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowPopUp(true);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {showPopUp && selectedUser && (
            <div className="popup-overlay">
              <div className="popup-content">
                <h3>User Details</h3>
                <p>ID: {selectedUser.id}</p>
                <p>Name: {selectedUser.name}</p>
                
                <div>
                  <div>
                    <label>Role</label>
                    <select
                    value={selectedUser.role}
                    onChange={(e) => setSelectedUser({
                      ...selectedUser,
                      role: (e.target.value)
                    })}
                    >
                      <option value={"user"}>user</option>
                      <option value={"fraud_prevention_investigator"}>Fraud Prevention Investigator</option>
                      <option value={"forensic_investigator"}>Forensic Investigator</option>
                      <option value={"preliminary_investigator"}>Preliminary Investigator</option>
                      <option></option>
                      <option></option>
                      <option></option>
                      <option></option>

                    </select>
                  </div>
                  <label>Create Incident: </label>
                  <select
                    value={selectedUser.create_incident}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        create_incident: (e.target.value),
                      })
                    }
                  >
                    <option value={0}>No</option>
                    <option value={1}>Yes</option>
                  </select>
                  <div>
                    <label>Assign Create:</label>
                    <select
                      value={selectedUser.assign_incident}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          assign_incident: (e.target.value),
                        })
                      }
                    >
                    <option value={0}>No</option>
                    <option value={1}>Yes</option>
                    </select>
                  </div>
                  <div>
                    <label>Update Preliminary:</label>
                    <select
                      value={selectedUser.update_preliminary}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          update_preliminary: (e.target.value),
                        })
                      }
                    >
                    <option value={0}>No</option>
                    <option value={1}>Yes</option>
                    </select>
                  </div>
                  <div>
                    <label>Review Preliminary:</label>
                    <select
                      value={selectedUser.review_preliminary}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          review_preliminary: (e.target.value),
                        })
                      }
                    >
                      <option value={0}>No</option>
                      <option value={1}>Yes</option>
                    </select>
                  </div>
                  <div>
                    <label>Review Forensic:</label>
                    <select
                      value={selectedUser.review_forensic}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          review_forensic: (e.target.value),
                        })
                      }
                    >
                      <option value={0}>No</option>
                      <option value={1}>Yes</option>
                    </select>
                  </div>
                  <div>
                    <label>Fraud Prevention Draft:</label>
                    <select
                      value={selectedUser.fraud_prevention_draft}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          fraud_prevention_draft: (e.target.value),
                        })
                      }
                    >
                      <option value={0}>No</option>
                      <option value={1}>Yes</option>
                    </select>
                  </div>
                  <div>
                    <label>Fraud Prevention Review:</label>
                    <select
                      value={selectedUser.fraud_prevention_review}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          fraud_prevention_review: (e.target.value),
                        })
                      }
                    >
                      <option value={0}>No</option>
                      <option value={1}>Yes</option>
                    </select>
                  </div>
                  <div>
                    <label>Fraud Detection Draft:</label>
                    <select
                      value={selectedUser.fraud_detection_draft}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          fraud_detection_draft: (e.target.value),
                        })
                      }
                    >
                      <option value={0}>No</option>
                      <option value={1}>Yes</option>
                    </select>
                  </div>
                  <div>
                    <label>Fraud Detection Review:</label>
                    <select
                      value={selectedUser.fraud_detection_review}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          fraud_detection_review: (e.target.value),
                        })
                      }
                    >
                      <option value={0}>No</option>
                      <option value={1}>Yes</option>
                    </select>
                  </div>
                </div>
                <button
                  className="popup-close-button"
                  onClick={() => {
                    setShowPopUp(false);
                  }}
                >
                  Close
                </button>
                <button className="popup-save-button" onClick={()=> {updateUser()

                setShowPopUp(false)}
                }>Save</button>
              </div>
            </div>
          )}
        </div>
      )}
      {addUser && (
        <div className="user-page">
          <div className="user-card">
            <h1 className="user-title">User Management</h1>
            <p className="user-subtitle">Create a new user account</p>

            {message && (
              <div
                className={`alert ${
                  message.includes("success") ? "alert-success" : "alert-error"
                }`}
              >
                {message}
              </div>
            )}

            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value) }
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="button-group">
              <button className="btn-primary" onClick={handleSubmit}>
                Create User
              </button>

              <button
                className="btn-secondary"
                onClick={() => {
                  setName("");
                  setEmail("");
                  setPassword("");
                  setMessage("");
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {userManagement && <div className="user-management"></div>}
    </>
  );
}
