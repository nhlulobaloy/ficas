import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/PreliminaryInvestigation.css";

interface Category {
  id: number;
  name: string;
}

interface ForensicInvestigationData {
  id?: number;
  preliminary_id: number;
  background: string;
  abbreviations: string;
  annexures: string;
  individuals_featured: string;
  mandate: string;
  purpose_and_objective: string;
  scope_of_investigation: string;
  restrictions_and_limitations: string;
  legislative_policy_framework: string;
  investigation: string;
  interviews: string;
  financial_exposure: string;
  findings: string;
  recommendations: "pending" | "close" | "full_investigation" | "refer" | "";
  referred_department: string;
  general: string;
  conducted_by: string;
  reviewed_by: string;
  approved_by: string;
  status: "draft" | "review" | "approved" | "";
}

export default function DraftForensic() {
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

  const [formData, setFormData] = useState<ForensicInvestigationData>({
    preliminary_id: Number(id),
    background: "",
    abbreviations: "",
    annexures: "",
    individuals_featured: "",
    mandate: "",
    purpose_and_objective: "",
    scope_of_investigation: "",
    restrictions_and_limitations: "",
    legislative_policy_framework: "",
    investigation: "",
    interviews: "",
    financial_exposure: "",
    findings: "",
    recommendations: "pending",
    referred_department: "",
    general: "",
    conducted_by: userName,
    reviewed_by: "",
    approved_by: "",
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

        const forensicRes = await fetch(
          `http://localhost:3000/api/forensic/${id}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (forensicRes.ok) {
          const forensicData = await forensicRes.json();
          if (forensicData.data && forensicData.data.length > 0) {
            const existingData = forensicData.data[0];
            setComments(existingData.comments || []);
            
            const sanitizedData = {
              ...existingData,
              background: existingData.background || "",
              abbreviations: existingData.abbreviations || "",
              annexures: existingData.annexures || "",
              individuals_featured: existingData.individuals_featured || "",
              mandate: existingData.mandate || "",
              purpose_and_objective: existingData.purpose_and_objective || "",
              scope_of_investigation: existingData.scope_of_investigation || "",
              restrictions_and_limitations: existingData.restrictions_and_limitations || "",
              legislative_policy_framework: existingData.legislative_policy_framework || "",
              investigation: existingData.investigation || "",
              interviews: existingData.interviews || "",
              financial_exposure: existingData.financial_exposure || "",
              findings: existingData.findings || "",
              recommendations: existingData.recommendations || "pending",
              referred_department: existingData.referred_department || null,
              general: existingData.general || "",
              conducted_by: existingData.conducted_by || userName,
              reviewed_by: existingData.reviewed_by || "",
              approved_by: existingData.approved_by || "",
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
        `http://localhost:3000/api/forensic/update/${id}`,
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
            : "Submitted for review successfully",
        );
        setTimeout(() => {
          setSessionMessage("");
          if (actionType === "submit") {
            navigate("/Forensic");
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
    return <div className="loading">Loading forensic investigation...</div>;

  return (
    <>
      <div className="preliminary-one-page" style={{ marginTop: "12px" }}>
        {sessionMessage && <p className="session-message">{sessionMessage}</p>}

        <div className="preliminary-header">
          <h1>Forensic Investigation</h1>
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
          <div className="form-section">
            <h2>Background & Mandate</h2>
            <textarea
              value={formData.background || ""}
              onChange={(e) => updateForm("background", e.target.value)}
              placeholder="Background"
              rows={3}
            />
            <textarea
              value={formData.abbreviations || ""}
              onChange={(e) => updateForm("abbreviations", e.target.value)}
              placeholder="Abbreviations"
              rows={2}
            />
            <textarea
              value={formData.mandate || ""}
              onChange={(e) => updateForm("mandate", e.target.value)}
              placeholder="Mandate"
              rows={3}
            />
            <textarea
              value={formData.purpose_and_objective || ""}
              onChange={(e) => updateForm("purpose_and_objective", e.target.value)}
              placeholder="Purpose and Objective"
              rows={3}
            />
          </div>

          <div className="form-section">
            <h2>Scope & Framework</h2>
            <textarea
              value={formData.scope_of_investigation || ""}
              onChange={(e) => updateForm("scope_of_investigation", e.target.value)}
              placeholder="Scope of Investigation"
              rows={3}
            />
            <textarea
              value={formData.restrictions_and_limitations || ""}
              onChange={(e) => updateForm("restrictions_and_limitations", e.target.value)}
              placeholder="Restrictions and Limitations"
              rows={3}
            />
            <textarea
              value={formData.legislative_policy_framework || ""}
              onChange={(e) => updateForm("legislative_policy_framework", e.target.value)}
              placeholder="Legislative/Policy Framework"
              rows={3}
            />
          </div>

          <div className="form-section">
            <h2>Investigation & Interviews</h2>
            <textarea
              value={formData.investigation || ""}
              onChange={(e) => updateForm("investigation", e.target.value)}
              placeholder="Investigation Details"
              rows={4}
            />
            <textarea
              value={formData.interviews || ""}
              onChange={(e) => updateForm("interviews", e.target.value)}
              placeholder="Interviews Conducted"
              rows={4}
            />
            <textarea
              value={formData.individuals_featured || ""}
              onChange={(e) => updateForm("individuals_featured", e.target.value)}
              placeholder="Individuals Featured"
              rows={3}
            />
          </div>

          <div className="form-section">
            <h2>Financial & Findings</h2>
            <textarea
              value={formData.financial_exposure || ""}
              onChange={(e) => updateForm("financial_exposure", e.target.value)}
              placeholder="Financial Exposure"
              rows={3}
            />
            <textarea
              value={formData.findings || ""}
              onChange={(e) => updateForm("findings", e.target.value)}
              placeholder="Findings"
              rows={4}
            />
            <textarea
              value={formData.general || ""}
              onChange={(e) => updateForm("general", e.target.value)}
              placeholder="General Notes"
              rows={3}
            />
          </div>

          <div className="form-section">
            <h2>Recommendations & Evidence</h2>
            <select
              value={formData.recommendations || "pending"}
              onChange={(e) => updateForm("recommendations", e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="close">Close</option>
              <option value="full_investigation">Full Investigation</option>
              <option value="refer">Refer to another Department</option>
            </select>
            {formData.recommendations === "refer" && (
              <select
                value={formData.referred_department || ""}
                onChange={(e) => updateForm("referred_department", e.target.value)}
              >
                <option value="">Select Department to Refer</option>
                {preliDepartments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            )}
            <textarea
              value={formData.annexures || ""}
              onChange={(e) => updateForm("annexures", e.target.value)}
              placeholder="Annexures / Evidence"
              rows={4}
            />
          </div>
        </div>

        <div className="submit-container">
          <button
            onClick={() => handleAction("save")}
            className="save-btn"
          >
            Save
          </button>

          <button
            onClick={() => handleAction("submit")}
            className="submit-btn"
          >
            Submit for Review
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <h3>Confirm {actionType === "save" ? "Save" : "Submission"}</h3>
            <p>
              {actionType === "save"
                ? "Save this forensic investigation as draft?"
                : "Submit this forensic investigation for review? This action cannot be undone."}
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