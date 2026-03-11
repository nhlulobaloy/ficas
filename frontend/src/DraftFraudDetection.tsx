import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/PreliminaryInvestigation.css";

interface Category {
  id: number;
  name: string;
}

// Interface matching fraud_detection table fields
interface FraudDetectionData {
  id?: number;
  fraud_prevention_id?: number;
  background: string;
  findings: string;
  conclusion: string;
  abbreviations_terms_definitions: string;
  annexures: string;
  mandate: string;
  review_objective: string;
  approach_and_procedures_performed: string;
  restrictions_and_limitations: string;
  data_analyst_methodology: string;
  applicable_legislation_policies: string;
  observations: string;
  recommendations: string;
  general: string;
  status: "draft" | "review" | "approved" | "returned" | "";
  conducted_by: string;
  referred_department: string;
  assigned_to?: number;
  created_at?: string;
  updated_at?: string;
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

  const [formData, setFormData] = useState<FraudDetectionData>({
    background: "",
    findings: "",
    conclusion: "",
    abbreviations_terms_definitions: "",
    annexures: "",
    mandate: "",
    review_objective: "",
    approach_and_procedures_performed: "",
    restrictions_and_limitations: "",
    data_analyst_methodology: "",
    applicable_legislation_policies: "",
    observations: "",
    recommendations: "",
    general: "",
    conducted_by: userName,
    referred_department: "",
    status: "draft",
  });

  const updateForm = (field: any, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value || "" }));

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const deptRes = await fetch("http://localhost:3000/api/preli/departments");
        setPreliDepartments(await deptRes.json());

        const fraudRes = await fetch(
          `http://localhost:3000/api/fraud/detection/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (fraudRes.ok) {
          const fraudData = await fraudRes.json();
          if (fraudData.results && fraudData.results.length > 0) {
            const existingData = fraudData.results[0];
            setComments(fraudData.comments || []);

            const sanitizedData = {
              ...existingData, 
              background: existingData.background || "",
              findings: existingData.findings || "",
              conclusion: existingData.conclusion || "",
              abbreviations_terms_definitions: existingData.abbreviations_terms_definitions || "",
              annexures: existingData.annexures || "",
              mandate: existingData.mandate || "",
              review_objective: existingData.review_objective || "",
              approach_and_procedures_performed: existingData.approach_and_procedures_performed || "",
              restrictions_and_limitations: existingData.restrictions_and_limitations || "",
              data_analyst_methodology: existingData.data_analyst_methodology || "",
              applicable_legislation_policies: existingData.applicable_legislation_policies || "",
              observations: existingData.observations || "",
              recommendations: existingData.recommendations || "",
              general: existingData.general || "",
              conducted_by: existingData.conducted_by || userName,
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
  }, [id, token, userName]);

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
        `http://localhost:3000/api/fraud/detection/case/update/${id}`,
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
            navigate("/fraud-detection");
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
    return <div className="loading">Loading fraud detection investigation...</div>;

  return (
    <>
      <div className="preliminary-one-page" style={{ marginTop: "12px" }}>
        {sessionMessage && <p className="session-message">{sessionMessage}</p>}

        <div className="preliminary-header">
          <h1>Fraud Detection Investigation</h1>
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
          {/* Render all fraud detection fields */}
          {Object.entries(formData).map(([key, value]) =>
            ![
              "id",
              "fraud_prevention_id",
              "status",
              "conducted_by",
              "referred_department",
              "assigned_to",
              "created_at",
              "updated_at",
            ].includes(key) ? (
              <div className="form-section" key={key}>
                <h2>{key.replace(/_/g, " ").toUpperCase()}</h2>
                <textarea
                  value={value as string}
                  onChange={(e) => updateForm(key, e.target.value)}
                  placeholder={key.replace(/_/g, " ")}
                  rows={4}
                />
              </div>
            ) : null
          )}
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
                ? "Save this fraud detection investigation as draft?"
                : "Submit this fraud detection investigation for review? This action cannot be undone."}
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