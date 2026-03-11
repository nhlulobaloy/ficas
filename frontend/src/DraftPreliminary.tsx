import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/PreliminaryInvestigation.css";

interface Category {
  id: number;
  name: string;
}

interface PreliminaryInvestigationData {
  id?: number;
  incident_id: number;
  mandate: string;
  allegations: string;
  acknowledgement_details: string;
  case_category: string;
  case_subcategory: string;
  domicile_department: string;
  key_stakeholders: string;
  incident_scene: string;
  amount_involved: string;
  persons_to_notify: string;
  persons_featured: string;
  legal_framework: string;
  preliminary_findings: string;
  annexures: string;
  recommendations: "pending" | "close" | "full_investigation" | "refer" | "";
  referred_department: string;
  conducted_by: string;
  reviewed_by: string;
  approved_by: string;
  status: "draft" | "review" | "approved" | "";
}

export default function PreliminaryInvestigation() {
  const { incident_id } = useParams<{ incident_id: string }>();
  const navigate = useNavigate();

  const [sessionMessage, setSessionMessage] = useState("");
  const [incidentDetails, setIncidentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionType, setActionType] = useState<"save" | "submit">("save");

  const [preliCategories, setPreliCategories] = useState<Category[]>([]);
  const [preliSubcategories, setPreliSubcategories] = useState<Category[]>([]);
  const [preliDepartments, setPreliDepartments] = useState<Category[]>([]);
  const [dbRecommendations, setDbRecommendations] = useState<string>("pending");
  const isReadOnly = dbRecommendations !== "pending";
  const [comments, setComments] = useState<any[]>([]);
  const [showComments, setShowComments] = useState(false);

  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("name") || "";

  const [formData, setFormData] = useState<PreliminaryInvestigationData>({
    incident_id: Number(incident_id),
    mandate: "",
    allegations: "",
    acknowledgement_details: "",
    case_category: "",
    case_subcategory: "",
    domicile_department: "",
    key_stakeholders: "",
    incident_scene: "",
    amount_involved: "",
    persons_to_notify: "",
    persons_featured: "",
    legal_framework: "",
    preliminary_findings: "",
    annexures: "",
    recommendations: "pending",
    referred_department: "",
    conducted_by: userName,
    reviewed_by: "",
    approved_by: "",
    status: "draft",
  });

  const updateForm = (field: any, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value || "" }));

  // FETCH DATA
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // Incident details
        const incidentRes = await fetch(
          `http://localhost:3000/api/incidents/${incident_id}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (incidentRes.ok) {
          const incidentData = await incidentRes.json();
          setIncidentDetails(incidentData.data);
        }

        // Categories and departments
        const [catRes, deptRes] = await Promise.all([
          fetch("http://localhost:3000/api/preli/categories"),
          fetch("http://localhost:3000/api/preli/departments"),
        ]);
        setPreliCategories(await catRes.json());
        setPreliDepartments(await deptRes.json());

        // Preliminary investigation data
        const preliRes = await fetch(
          `http://localhost:3000/api/preliminary/case/${incident_id}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (preliRes.ok) {
          const preliData = await preliRes.json();
          if (preliData.data) {
            setComments(preliData.data.comments || []);
          }

          if (preliData.data) {
            const sanitizedData = {
              ...preliData.data,
              mandate: preliData.data.mandate || "",
              allegations: preliData.data.allegations || "",
              acknowledgement_details:
                preliData.data.acknowledgement_details || "",
              case_category: preliData.data.case_category || "",
              case_subcategory: preliData.data.case_subcategory || "",
              domicile_department: preliData.data.domicile_department || "",
              key_stakeholders: preliData.data.key_stakeholders || "",
              incident_scene: preliData.data.incident_scene || "",
              amount_involved: preliData.data.amount_involved || "",
              persons_to_notify: preliData.data.persons_to_notify || "",
              persons_featured: preliData.data.persons_featured || "",
              legal_framework: preliData.data.legal_framework || "",
              preliminary_findings: preliData.data.preliminary_findings || "",
              annexures: preliData.data.annexures || "",
              recommendations: preliData.data.recommendations || "pending",
              referred_department: preliData.data.referred_department || "",
              conducted_by: preliData.data.conducted_by || userName,
              reviewed_by: preliData.data.reviewed_by || "",
              approved_by: preliData.data.approved_by || "",
              status: preliData.data.status || "draft",
            };
            setFormData(sanitizedData);
            setDbRecommendations(sanitizedData.recommendations || "pending");
          }
        }
      } catch (error) {
        console.error("Fetch error:", error);
        setSessionMessage("Error loading data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [incident_id, token, userName]);

  // Fetch subcategories when category changes
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!formData.case_category) return setPreliSubcategories([]);
      const res = await fetch(
        `http://localhost:3000/api/preli/subcategories?category=${formData.case_category}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      setPreliSubcategories(data || []);
    };
    fetchSubcategories();
  }, [formData.case_category, token]);

  const handleAction = (type: "save" | "submit") => {
    setActionType(type);
    setShowConfirm(true);
  };

  const executeAction = async () => {
    if (isReadOnly) return;

    try {
      const dataToSend = {
        ...formData,
        status: actionType === "submit" ? "review" : "draft",
        conducted_by: userName || formData.conducted_by,
      };

      const method = formData.id ? "PUT" : "POST";
      const url = formData.id
        ? `http://localhost:3000/api/preliminary/${incident_id}`
        : `http://localhost:3000/api/preliminary/`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      if (res.ok) {
        setSessionMessage(
          actionType === "save"
            ? "Saved as draft successfully"
            : "Submitted for review successfully",
        );
        setTimeout(() => {
          setSessionMessage("");
          if (actionType === "submit") {
            navigate("/Preliminary");
          }
        }, 2000);
      } else {
        const errorData = await res.json();
        setSessionMessage(errorData.error || `${actionType} failed`);
      }
    } catch (error) {
      setSessionMessage("Server error");
    } finally {
      setShowConfirm(false);
    }
  };

  if (loading)
    return <div className="loading">Loading preliminary investigation...</div>;

  return (
    <>
      <div className="preliminary-one-page" style={{ marginTop: "12px" }}>
        {sessionMessage && <p className="session-message">{sessionMessage}</p>}

        <div className="preliminary-header">
          <h1>Preliminary Investigation</h1>
          {comments.length > 0 && (
            <button className="comment-btn" onClick={() => setShowComments(true)}>Read Comments</button>
          )}
          {showComments && (
            <div className="comments-overlay">
              <div className="comments-modal">
                <div className="comments-header">
                  <h3>Review Comments</h3>
                  <button
                    className="comments-close"
                    onClick={() => setShowComments(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className="comments-list">
                  {comments.map((c) => (
                    <div key={c.id} className="comment-card">
                      <div className="comment-meta">
                        <span className="comment-author">{ <h1> </h1>}{c.user_name}</span>
                        <span className="comment-date">
                          {new Date(c.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="comment-body">{c.comment}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {incidentDetails && (
            <div className="incident-info">
              <span className="incident-number">
                Incident #
                {incidentDetails.incident_number || `INC-${incidentDetails.id}`}
              </span>
              <span className="complainant-name">
                Complainant: {incidentDetails.complainant_name}
              </span>
            </div>
          )}
        </div>

        {/* FORM GRID */}
        <div className="preliminary-form-grid">
          {/* Section 1: Mandate & Allegations */}
          <div className="form-section">
            <h2>Mandate & Allegations</h2>
            <textarea
              value={formData.mandate || ""}
              onChange={(e) => updateForm("mandate", e.target.value)}
              disabled={isReadOnly}
              placeholder="Mandate"
              rows={3}
            />
            <textarea
              value={formData.allegations || ""}
              onChange={(e) => updateForm("allegations", e.target.value)}
              disabled={isReadOnly}
              placeholder="Allegations"
              rows={3}
            />
            <textarea
              value={formData.acknowledgement_details || ""}
              onChange={(e) =>
                updateForm("acknowledgement_details", e.target.value)
              }
              disabled={isReadOnly}
              placeholder="Acknowledgement Details"
              rows={3}
            />
          </div>

          {/* Section 2: Classification */}
          <div className="form-section">
            <h2>Classification & Stakeholders</h2>
            <select
              value={formData.case_category || ""}
              onChange={(e) => updateForm("case_category", e.target.value)}
              disabled={isReadOnly}
            >
              <option value="">Select Category</option>
              {preliCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <select
              value={formData.case_subcategory || ""}
              onChange={(e) => updateForm("case_subcategory", e.target.value)}
              disabled={isReadOnly || !formData.case_category}
            >
              <option value="">Select Subcategory</option>
              {preliSubcategories.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>

            <select
              value={formData.domicile_department || ""}
              onChange={(e) =>
                updateForm("domicile_department", e.target.value)
              }
              disabled={isReadOnly}
            >
              <option value="">Select Department</option>
              {preliDepartments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>

            <textarea
              value={formData.key_stakeholders || ""}
              onChange={(e) => updateForm("key_stakeholders", e.target.value)}
              placeholder="Key Stakeholders"
              rows={3}
              disabled={isReadOnly}
            />
          </div>

          {/* Section 3: Scene & Persons */}
          <div className="form-section">
            <h2>Scene & Persons</h2>
            <textarea
              value={formData.incident_scene || ""}
              onChange={(e) => updateForm("incident_scene", e.target.value)}
              placeholder="Incident Scene"
              rows={3}
              disabled={isReadOnly}
            />
            <textarea
              value={formData.amount_involved || ""}
              onChange={(e) => updateForm("amount_involved", e.target.value)}
              placeholder="Amount Involved"
              rows={2}
              disabled={isReadOnly}
            />
            <textarea
              value={formData.persons_to_notify || ""}
              onChange={(e) => updateForm("persons_to_notify", e.target.value)}
              placeholder="Persons to Notify"
              rows={3}
              disabled={isReadOnly}
            />
            <textarea
              value={formData.persons_featured || ""}
              onChange={(e) => updateForm("persons_featured", e.target.value)}
              placeholder="Persons Featured"
              rows={3}
              disabled={isReadOnly}
            />
          </div>

          {/* Section 4: Findings & Evidence */}
          <div className="form-section">
            <h2>Findings & Evidence</h2>
            <textarea
              value={formData.legal_framework || ""}
              onChange={(e) => updateForm("legal_framework", e.target.value)}
              placeholder="Legal Framework"
              rows={3}
              disabled={isReadOnly}
            />
            <textarea
              value={formData.preliminary_findings || ""}
              onChange={(e) =>
                updateForm("preliminary_findings", e.target.value)
              }
              placeholder="Preliminary Findings"
              rows={4}
              disabled={isReadOnly}
            />
            <textarea
              value={formData.annexures || ""}
              onChange={(e) => updateForm("annexures", e.target.value)}
              placeholder="Annexures"
              rows={3}
              disabled={isReadOnly}
            />
          </div>

          {/* Section 5: Recommendations & Sign-off */}
          <div className="form-section">
            <h2>Recommendations</h2>
            <select
              value={formData.recommendations || "pending"}
              onChange={(e) => updateForm("recommendations", e.target.value)}
              disabled={isReadOnly}
            >
              <option value="pending">Pending</option>
              <option value="close">Close</option>
              <option value="full_investigation">Full Investigation</option>
              <option value="refer">Refer to another Department</option>
            </select>
            {formData.recommendations === "refer" && (
              <select
                value={formData.referred_department || ""}
                onChange={(e) =>
                  updateForm("referred_department", e.target.value)
                }
                disabled={isReadOnly}
              >
                <option value="">Select Department to Refer</option>
                {preliDepartments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="submit-container">
          <button
            onClick={() => handleAction("save")}
            disabled={isReadOnly}
            className="save-btn"
          >
            Save
          </button>

          <button
            onClick={() => handleAction("submit")}
            disabled={isReadOnly}
            className="submit-btn"
          >
            Submit for Review
          </button>
        </div>
      </div>

      {/* Confirmation Popup */}
      {showConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <h3>Confirm {actionType === "save" ? "Save" : "Submission"}</h3>
            <p>
              {actionType === "save"
                ? "Save this preliminary investigation as draft?"
                : "Submit this preliminary investigation for review? This action cannot be undone."}
            </p>
            <div className="confirm-buttons">
              <button
                className="confirm-cancel"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button className="confirm-proceed" onClick={executeAction}>
                {actionType === "save" ? "Save" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

//button to the draft

/**              <button
                onClick={() => {
                  setSelectedIncident(null);
                  navigate(`/PreliminaryInvestigation/${selectedIncident.id}`);
                }}
              >
                Draft
              </button> */