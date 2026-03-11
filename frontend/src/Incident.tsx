import { useEffect, useState } from "react";
import "../styles/Incident.css";
import { useNavigate } from "react-router-dom";

interface Category {
  id: number;
  name: string;
  description: string;
}

export default function Incident() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [date, setDate] = useState("");
  const [email, setEmail] = useState("");
  const [time, setTime] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [optionCategory, setOptionCategory] = useState<Category[]>([]);
  const [details, setDetails] = useState("");
  const [suspectDetails, setSuspectDetails] = useState("");
  const [sapsNumber, setSapsNumber] = useState("");
  const [location, setLocation] = useState("");
  const [sessionMessage, setSessionMessage] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const userData = {
    name,
    contact,
    date,
    time,
    location,
    email,
    selectedCategory,
    details,
    suspectDetails,
    sapsNumber,
  };

  // --- Secure verification ---
  const verifyAccess = async (): Promise<boolean> => {
    if (!token) {
      navigate("/login"); // logout only if no token
      return false;
    }

    try {
      // Verify role + token in backend
      const res = await fetch(
        "http://localhost:3000/api/incidents/auth",
        {
          method: "POST",
          headers: { 
            'Content-type' : 'application/json',
            Authorization: `Bearer ${token}`},
        },
      );

      const data = await res.json();

      if (res.status === 200 && data.message === "access granted") {
        setHasAccess(true);
        return true;
      }

      // Role denied (white screen)
      setHasAccess(false);
      return false;
    } catch (err) {
      console.error(err);
      setSessionMessage("Server error during verification");
      return false;
    }
  };

  // --- Handle submit ---
  const handleSubmit = async () => {
    const access = await verifyAccess();
    if (!access) return;

    try {
      const res = await fetch(
        "http://localhost:3000/api/incidents",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(userData),
        },
      );
      const data = await res.json();

      if (data.message === "Incident created") {
        setSessionMessage("Incident Created Successfully");
        setTimeout(() => setSessionMessage(""), 2000);

        // Clear all fields
        setName("");
        setEmail("");
        setContact("");
        setDate("");
        setTime("");
        setLocation("");
        setDetails("");
        setSapsNumber("");
        setSuspectDetails("");
        setPreviewOpen(false);
      } else {
        alert("Error creating incident");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit incident");
    }
  };

  // --- On mount: verify access & fetch categories ---
  useEffect(() => {
    const init = async () => {
      const access = await verifyAccess();
      if (!access) return;

      try {
        const res = await fetch("http://localhost:3000/api/categories/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const categories = await res.json();
        setOptionCategory(categories);
      } catch (err) {
        console.error(err);
      }
    };

    init();
  }, [token]);

  // --- White screen if role denied ---
  if (hasAccess === false) return null;
  return (
    <><h2 className="dashboard-title">Create Incident</h2>
      <div className="form-contianer" style={{ marginTop: "8px" }}>
        {sessionMessage && <p className="sessionMessage">{sessionMessage}</p>}
         
        <div className="form-grid">
          
          <h2>Complainant Details</h2>

          {/* LEFT COLUMN - Complainant Details */}
          <div className="form-section">
            <input
              placeholder="Full names *"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              placeholder="Email address *"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              placeholder="Contact number *"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>

          {/* RIGHT COLUMN - Incident Details */}
          <div className="form-section">
            <h2>Incident Details</h2>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Select Category</option>
              {optionCategory.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* BOTTOM FULL WIDTH SECTION */}
          <div className="full-width">
            <input
              className="details"
              type="text"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Incident Details *"
            />
            <input
              className="details"
              type="text"
              value={suspectDetails}
              onChange={(e) => setSuspectDetails(e.target.value)}
              placeholder="Suspect Details"
            />
            <input
              type="text"
              value={sapsNumber}
              onChange={(e) => setSapsNumber(e.target.value)}
              placeholder="SAPS case number (Optional)"
            />
          </div>

          {/* BUTTONS */}
          <div className="button-container">
            <button onClick={() => setPreviewOpen(true)}>Preview Report</button>
            <button onClick={handleSubmit}>Create Incident</button>
          </div>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {previewOpen && (
        <div className="preview-modal">
          <div className="preview-content">
            <h2>Incident Preview</h2>
            <p>
              <strong>Name:</strong> {name}
            </p>
            <p>
              <strong>Email:</strong> {email}
            </p>
            <p>
              <strong>Contact:</strong> {contact}
            </p>
            <p>
              <strong>Date:</strong> {date}
            </p>
            <p>
              <strong>Time:</strong> {time}
            </p>
            <p>
              <strong>Location:</strong> {location}
            </p>
            <p>
              <strong>Category:</strong>{" "}
              {
                optionCategory.find((c) => String(c.id) === selectedCategory)
                  ?.name
              }
            </p>
            <p>
              <strong>Details:</strong> {details}
            </p>
            <p>
              <strong>Suspect Details:</strong> {suspectDetails}
            </p>
            <p>
              <strong>SAPS Number:</strong> {sapsNumber}
            </p>

            <div className="modal-buttons">
              <button
                className="review-button"
                onClick={() => setPreviewOpen(false)}
              >
                Close
              </button>
              <button className="review-button" onClick={handleSubmit}>
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
