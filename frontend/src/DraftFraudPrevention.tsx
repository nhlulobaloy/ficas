import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/PreliminaryInvestigation.css";

interface Category {
  id: number;
  name: string;
}

// Interface matching table fields
interface FraudPreventionData {
  id?: number;
  executive_summary: string;
  abbreviations: string;
  annexures: string;
  individuals_featured: string;
  mandate: string;
  purpose_and_objective: string;
  scope_of_investigation: string;
  restrictions_and_limitations: string;
  legislative_policy_framework: string;
  review_methodology: string;
  tone_at_the_top: string;
  review_details: string;
  sequence_of_events: string;
  findings: string;
  conclusions: string;
  recommendations: "pending" | "close" | "full_investigation" | "refer" | "";
  general: string;
  fraud_prevention: string;
  status: "draft" | "review" | "approved" | "";
  conducted_by: string;
  reviewed_by: string;
  approved_by: string;
  referred_department: string;
}

export default function DraftFraudDetection() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [sessionMessage, setSessionMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionType, setActionType] = useState<"save" | "submit">("save");

  const [comments, setComments] = useState<any[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [preliDepartments, setPreliDepartments] = useState<Category[]>([]);

  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("name") || "";

  const [formData, setFormData] = useState<FraudPreventionData>({
    executive_summary: "",
    abbreviations: "",
    annexures: "",
    individuals_featured: "",
    mandate: "",
    purpose_and_objective: "",
    scope_of_investigation: "",
    restrictions_and_limitations: "",
    legislative_policy_framework: "",
    review_methodology: "",
    tone_at_the_top: "",
    review_details: "",
    sequence_of_events: "",
    findings: "",
    conclusions: "",
    recommendations: "pending",
    general: "",
    fraud_prevention: "",
    conducted_by: userName,
    reviewed_by: "",
    approved_by: "",
    referred_department: "",
    status: "draft",
  });

  const updateForm = (field: any, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value || "" }));

  // ✅ Access verification function
  const verifyAccess = async () => {
    try {
      const res = await fetch(
        "http://localhost:3000/api/fraud/prevention/auth/access/draft",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.status === 401) {
        navigate("/login");
        return false;
      }
      if (res.status === 403) {
        setLoading(false);
        return false;
      }
      return true;
    } catch (err) {
      console.error(err);
      setLoading(false);
      return false;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const allowed = await verifyAccess();
        if (!allowed) return;

        const deptRes = await fetch("http://localhost:3000/api/preli/departments");
        setPreliDepartments(await deptRes.json());

        const fraudRes = await fetch(
          `http://localhost:3000/api/fraud/prevention/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (fraudRes.ok) {
          const fraudData = await fraudRes.json();
          if (fraudData.results && fraudData.results.length > 0) {
            const existingData = fraudData.results[0];
            setComments(fraudData.comments || []);

            const sanitizedData = {
              ...existingData, 
              executive_summary: existingData.executive_summary || "",
              abbreviations: existingData.abbreviations || "",
              annexures: existingData.annexures || "",
              individuals_featured: existingData.individuals_featured || "",
              mandate: existingData.mandate || "",
              purpose_and_objective: existingData.purpose_and_objective || "",
              scope_of_investigation: existingData.scope_of_investigation || "",
              restrictions_and_limitations: existingData.restrictions_and_limitations || "",
              legislative_policy_framework: existingData.legislative_policy_framework || "",
              review_methodology: existingData.review_methodology || "",
              tone_at_the_top: existingData.tone_at_the_top || "",
              review_details: existingData.review_details || "",
              sequence_of_events: existingData.sequence_of_events || "",
              findings: existingData.findings || "",
              conclusions: existingData.conclusions || "",
              recommendations: existingData.recommendations || "pending",
              general: existingData.general || "",
              fraud_prevention: existingData.fraud_prevention || "",
              conducted_by: existingData.conducted_by || userName,
              reviewed_by: existingData.reviewed_by || "",
              approved_by: existingData.approved_by || "",
              referred_department: existingData.referred_department || "",
              status: existingData.status || "draft",
            };
            setFormData(sanitizedData);
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
  }, [id, token, userName, navigate]);

  const handleAction = (type: "save" | "submit") => {
    setActionType(type);
    setShowConfirm(true);
  };

  const executeAction = async () => {
    try {
      const dataToSend = {
        ...formData,
        status: actionType === "submit" ? "review" : "draft",
        conducted_by: userName || formData.conducted_by,
      };

      const res = await fetch(
        `http://localhost:3000/api/fraud/prevention/case/update/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(dataToSend),
        }
      );

      if (res.ok) {
        setSessionMessage(
          actionType === "save"
            ? "Saved as draft successfully"
            : "Submitted for review successfully"
        );
        setTimeout(() => {
          setSessionMessage("");
          if (actionType === "submit") {
            navigate("/fraud/prevention");
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
    return <div className="loading">Loading fraud prevention investigation...</div>;

  return (
    <>
      <div className="preliminary-one-page" style={{ marginTop: "12px" }}>
        {sessionMessage && <p className="session-message">{sessionMessage}</p>}

        <div className="preliminary-header">
          <h1>Fraud Prevention Investigation</h1>
          {comments.length > 0 && (
            <button className="comment-btn" onClick={() => setShowComments(true)}>
              Read Comments
            </button>
          )}
          {showComments && (
            <div className="comments-overlay">
              <div className="comments-modal">
                <div className="comments-header">
                  <h3>Review Comments</h3>
                  <button className="comments-close" onClick={() => setShowComments(false)}>✕</button>
                </div>
                <div className="comments-list">
                  {comments.map((c) => (
                    <div key={c.id} className="comment-card">
                      <div className="comment-meta">
                        <span className="comment-author">{c.user_name}</span>
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
        </div>

        <div className="preliminary-form-grid">
          {/* Render all free-text fields except ID, preliminary_id, and assignment/status */}
          {Object.entries(formData).map(([key, value]) =>
            ![
              "id",
              "status",
              "conducted_by",
              "reviewed_by",
              "approved_by",
              "referred_department",
            ].includes(key) ? (
              <div className="form-section" key={key}>
                <h2>{key.replace(/_/g, " ").toUpperCase()}</h2>
                <textarea
                  value={value as string}
                  onChange={(e) => updateForm(key, e.target.value)}
                  placeholder={key.replace(/_/g, " ")}
                  rows={3}
                />
              </div>
            ) : null
          )}

          <div className="form-section">
            <h2>Recommendations</h2>
            <select
              value={formData.recommendations || "pending"}
              onChange={(e) => updateForm("recommendations", e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="close">Close</option>
              <option value="full_investigation">Full Investigation</option>
              <option value="refer">Refer to another Department</option>
            </select>
          </div>
        </div>

        <div className="submit-container">
          <button onClick={() => handleAction("save")} className="save-btn">Save</button>
          <button onClick={() => handleAction("submit")} className="submit-btn">Submit for Review</button>
        </div>
      </div>

      {showConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <h3>Confirm {actionType === "save" ? "Save" : "Submission"}</h3>
            <p>
              {actionType === "save"
                ? "Save this fraud prevention investigation as draft?"
                : "Submit this fraud prevention investigation for review? This action cannot be undone."}
            </p>
            <div className="confirm-buttons">
              <button className="confirm-cancel" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="confirm-proceed" onClick={executeAction}>{actionType === "save" ? "Save" : "Submit"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}