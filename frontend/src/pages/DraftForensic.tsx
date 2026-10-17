import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../../styles/PreliminaryInvestigation.css";
import { apiBackend, apiCall } from "../api/api.ts";
import { EditableTable } from "../components/EditableTable";

interface Category {
  id: number;
  name: string;
}

interface DistributionRow {
  no: number;
  name_and_designation: string;
  action: boolean;
  action_support: boolean;
  information: boolean;
}

interface KeyValueRow {
  no: number;
  label: string;
  description: string;
}

interface IndividualRow {
  no: number;
  name: string;
  position: string;
}

interface ForensicInvestigationData {
  id?: number;
  preliminary_id: number;
  background: string;
  mandate: string;
  purpose_and_objective: string;
  scope_of_investigation: string;
  approach_and_procedures_performed: string;
  restrictions_and_limitations: string;
  legislative_policy_framework: string;
  investigation: string;
  findings: string;
  recommendations: string;
  general: string;
  report_approval: string;
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

  const [forensicReportId, setForensicReportId] = useState<number | null>(null);

  // Table states
  const [distributionRows, setDistributionRows] = useState<DistributionRow[]>([]);
  const [abbreviations, setAbbreviations] = useState<KeyValueRow[]>([]);
  const [phrases, setPhrases] = useState<KeyValueRow[]>([]);
  const [individuals, setIndividuals] = useState<IndividualRow[]>([]);
  const [annexures, setAnnexures] = useState<KeyValueRow[]>([]);

  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("name") || "";

  const [formData, setFormData] = useState<ForensicInvestigationData>({
    preliminary_id: Number(id),
    background: "",
    mandate: "",
    purpose_and_objective: "",
    scope_of_investigation: "",
    approach_and_procedures_performed: "",
    restrictions_and_limitations: "",
    legislative_policy_framework: "",
    investigation: "",
    findings: "",
    recommendations: "",
    general: "",
    report_approval: "",
    conducted_by: userName,
    reviewed_by: "",
    approved_by: "",
    status: "draft",
  });

  const updateForm = (field: keyof ForensicInvestigationData, value: any) =>
      setFormData((prev) => ({ ...prev, [field]: value || "" }));

  // ---------------- LOAD ----------------
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const deptRes = await apiCall(`${apiBackend}/preli/departments`);
        setPreliDepartments(await deptRes.json());

        const forensicRes = await apiCall(`${apiBackend}/forensic/${id}`);

        if (forensicRes.ok) {
          const forensicData = await forensicRes.json();
          if (forensicData.data && forensicData.data.length > 0) {
            const existingData = forensicData.data[0];
            setComments(existingData.comments || []);
            setForensicReportId(existingData.id ?? null);

            const sanitizedData: ForensicInvestigationData = {
              ...formData,
              ...existingData,
              background: existingData.background || "",
              mandate: existingData.mandate || "",
              purpose_and_objective: existingData.purpose_and_objective || "",
              scope_of_investigation: existingData.scope_of_investigation || "",
              approach_and_procedures_performed:
                  existingData.approach_and_procedures_performed || "",
              restrictions_and_limitations:
                  existingData.restrictions_and_limitations || "",
              legislative_policy_framework:
                  existingData.legislative_policy_framework || "",
              investigation: existingData.investigation || "",
              findings: existingData.findings || "",
              recommendations: existingData.recommendations || "",
              general: existingData.general || "",
              report_approval: existingData.report_approval || "",
              conducted_by: existingData.conducted_by || userName,
              reviewed_by: existingData.reviewed_by || "",
              approved_by: existingData.approved_by || "",
              status: existingData.status || "draft",
            };
            setFormData(sanitizedData);

            // Load all table rows
            const fid = existingData.id;
            if (fid) {
              const [dist, abbr, phr, ind, ann] = await Promise.all([
                apiCall(`${apiBackend}/forensic/distribution/${fid}`),
                apiCall(`${apiBackend}/forensic/abbreviations/${fid}`),
                apiCall(`${apiBackend}/forensic/phrases/${fid}`),
                apiCall(`${apiBackend}/forensic/individuals/${fid}`),
                apiCall(`${apiBackend}/forensic/annexures/${fid}`),
              ]);

              setDistributionRows(dist.ok ? (await dist.json()).data || [] : []);
              setAbbreviations(abbr.ok ? (await abbr.json()).data || [] : []);
              setPhrases(phr.ok ? (await phr.json()).data || [] : []);
              setIndividuals(ind.ok ? (await ind.json()).data || [] : []);
              setAnnexures(ann.ok ? (await ann.json()).data || [] : []);
            }
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

  // ---------------- SAVE ----------------
  const executeAction = async () => {
    try {
      const dataToSend = {
        ...formData,
        status: actionType === "submit" ? "review" : "draft",
        conducted_by: userName || formData.conducted_by,
      };

      const res = await apiCall(`${apiBackend}/forensic/update/${id}`, {
        method: "PUT",
        body: JSON.stringify(dataToSend),
      });

      if (res.ok) {
        // Save all table rows in parallel
        const fid = forensicReportId;
        if (fid) {
          await Promise.all([
            apiCall(`${apiBackend}/forensic/distribution/${fid}`, {
              method: "PUT",
              body: JSON.stringify({ rows: distributionRows }),
            }),
            apiCall(`${apiBackend}/forensic/abbreviations/${fid}`, {
              method: "PUT",
              body: JSON.stringify({ rows: abbreviations }),
            }),
            apiCall(`${apiBackend}/forensic/phrases/${fid}`, {
              method: "PUT",
              body: JSON.stringify({ rows: phrases }),
            }),
            apiCall(`${apiBackend}/forensic/individuals/${fid}`, {
              method: "PUT",
              body: JSON.stringify({ rows: individuals }),
            }),
            apiCall(`${apiBackend}/forensic/annexures/${fid}`, {
              method: "PUT",
              body: JSON.stringify({ rows: annexures }),
            }),
          ]);
        }

        setSessionMessage(
            actionType === "save"
                ? "Saved as draft successfully"
                : "Submitted for review successfully"
        );
        setTimeout(() => {
          setSessionMessage("");
          if (actionType === "submit") navigate("/Forensic");
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
                <button
                    className="comment-btn"
                    onClick={() => setShowComments(true)}
                >
                  Read Comments
                </button>
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
            {/* A. DISTRIBUTION LIST */}
            <div className="form-section full-width">
              <h2>A. DISTRIBUTION LIST</h2>
              <p className="dist-note">
                Distribution is restricted to the following persons subject to
                clause 4 of the covering letter (applies to all parties below),
                and further distribution is prohibited:
              </p>

              <table className="distribution-table">
                <thead>
                <tr>
                  <th rowSpan={2}>NO</th>
                  <th rowSpan={2}>NAME &amp; DESIGNATION</th>
                  <th colSpan={3}>DISTRIBUTION REASON</th>
                  <th rowSpan={2}></th>
                </tr>
                <tr>
                  <th>ACTION</th>
                  <th>ACTION SUPPORT</th>
                  <th>INFORMATION</th>
                </tr>
                </thead>
                <tbody>
                {distributionRows.map((row, i) => (
                    <tr key={i}>
                      <td>
                        <input
                            type="number"
                            value={row.no}
                            onChange={(e) =>
                                setDistributionRows((prev) =>
                                    prev.map((r, idx) =>
                                        idx === i
                                            ? { ...r, no: Number(e.target.value) }
                                            : r
                                    )
                                )
                            }
                            className="dist-no"
                        />
                      </td>
                      <td>
                      <textarea
                          value={row.name_and_designation}
                          onChange={(e) =>
                              setDistributionRows((prev) =>
                                  prev.map((r, idx) =>
                                      idx === i
                                          ? { ...r, name_and_designation: e.target.value }
                                          : r
                                  )
                              )
                          }
                          rows={2}
                          placeholder="Name & Designation"
                      />
                      </td>
                      <td className="dist-check">
                        <input
                            type="checkbox"
                            checked={row.action}
                            onChange={(e) =>
                                setDistributionRows((prev) =>
                                    prev.map((r, idx) =>
                                        idx === i
                                            ? { ...r, action: e.target.checked }
                                            : r
                                    )
                                )
                            }
                        />
                      </td>
                      <td className="dist-check">
                        <input
                            type="checkbox"
                            checked={row.action_support}
                            onChange={(e) =>
                                setDistributionRows((prev) =>
                                    prev.map((r, idx) =>
                                        idx === i
                                            ? { ...r, action_support: e.target.checked }
                                            : r
                                    )
                                )
                            }
                        />
                      </td>
                      <td className="dist-check">
                        <input
                            type="checkbox"
                            checked={row.information}
                            onChange={(e) =>
                                setDistributionRows((prev) =>
                                    prev.map((r, idx) =>
                                        idx === i
                                            ? { ...r, information: e.target.checked }
                                            : r
                                    )
                                )
                            }
                        />
                      </td>
                      <td>
                        <button
                            type="button"
                            className="dist-remove"
                            onClick={() => {
                              setDistributionRows((prev) =>
                                  prev
                                      .filter((_, idx) => idx !== i)
                                      .map((r, idx) => ({ ...r, no: idx + 1 }))
                              );
                            }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                ))}
                </tbody>
              </table>

              <button
                  type="button"
                  className="dist-add"
                  onClick={() =>
                      setDistributionRows((prev) => [
                        ...prev,
                        {
                          no: prev.length + 1,
                          name_and_designation: "",
                          action: false,
                          action_support: false,
                          information: false,
                        },
                      ])
                  }
              >
                + Add Row
              </button>
            </div>

            {/* B. ABBREVIATIONS */}
            <EditableTable<KeyValueRow>
                title="B. ABBREVIATIONS"
                columns={[
                  { key: "label", label: "ABBREVIATION", width: "200px" },
                  { key: "description", label: "DESCRIPTION" },
                ]}
                rows={abbreviations}
                onChange={setAbbreviations}
            />

            {/* C. PHRASES */}
            <EditableTable<KeyValueRow>
                title="C. PHRASES"
                columns={[
                  { key: "label", label: "PHRASE", width: "200px" },
                  { key: "description", label: "DESCRIPTION" },
                ]}
                rows={phrases}
                onChange={setPhrases}
            />

            {/* D. NAMES OF INDIVIDUALS */}
            <EditableTable<IndividualRow>
                title="D. NAMES OF INDIVIDUALS"
                columns={[
                  { key: "name", label: "NAME", width: "260px" },
                  { key: "position", label: "POSITION" },
                ]}
                rows={individuals}
                onChange={setIndividuals}
            />

            {/* E. ANNEXURES */}
            <EditableTable<KeyValueRow>
                title="E. ANNEXURES"
                columns={[
                  { key: "label", label: "ANNEXURE NO", width: "160px" },
                  { key: "description", label: "DESCRIPTION" },
                ]}
                rows={annexures}
                onChange={setAnnexures}
            />

            {/* F. BACKGROUND */}
            <div className="form-section">
              <h2>F. BACKGROUND</h2>
              <textarea
                  value={formData.background || ""}
                  onChange={(e) => updateForm("background", e.target.value)}
                  placeholder="Background"
                  rows={4}
              />
            </div>

            {/* G. MANDATE */}
            <div className="form-section">
              <h2>G. MANDATE</h2>
              <textarea
                  value={formData.mandate || ""}
                  onChange={(e) => updateForm("mandate", e.target.value)}
                  placeholder="Mandate"
                  rows={4}
              />
            </div>

            {/* H. PURPOSE AND OBJECTIVES */}
            <div className="form-section">
              <h2>H. PURPOSE AND OBJECTIVES</h2>
              <textarea
                  value={formData.purpose_and_objective || ""}
                  onChange={(e) =>
                      updateForm("purpose_and_objective", e.target.value)
                  }
                  placeholder="Purpose and Objectives"
                  rows={4}
              />
            </div>

            {/* I. SCOPE OF THE INVESTIGATION */}
            <div className="form-section">
              <h2>I. SCOPE OF THE INVESTIGATION</h2>
              <textarea
                  value={formData.scope_of_investigation || ""}
                  onChange={(e) =>
                      updateForm("scope_of_investigation", e.target.value)
                  }
                  placeholder="Scope of the Investigation"
                  rows={4}
              />
            </div>

            {/* J. APPROACH AND PROCEDURES PERFORMED */}
            <div className="form-section">
              <h2>J. APPROACH AND PROCEDURES PERFORMED</h2>
              <textarea
                  value={formData.approach_and_procedures_performed || ""}
                  onChange={(e) =>
                      updateForm("approach_and_procedures_performed", e.target.value)
                  }
                  placeholder="Approach and Procedures Performed"
                  rows={5}
              />
            </div>

            {/* K. LIMITATIONS */}
            <div className="form-section">
              <h2>K. LIMITATIONS</h2>
              <textarea
                  value={formData.restrictions_and_limitations || ""}
                  onChange={(e) =>
                      updateForm("restrictions_and_limitations", e.target.value)
                  }
                  placeholder="Limitations"
                  rows={4}
              />
            </div>

            {/* L. APPLICABLE LEGISLATION AND POLICIES */}
            <div className="form-section">
              <h2>L. APPLICABLE LEGISLATION AND POLICIES</h2>
              <textarea
                  value={formData.legislative_policy_framework || ""}
                  onChange={(e) =>
                      updateForm("legislative_policy_framework", e.target.value)
                  }
                  placeholder="Applicable Legislation and Policies"
                  rows={5}
              />
            </div>

            {/* M. INVESTIGATIONS */}
            <div className="form-section">
              <h2>M. INVESTIGATIONS</h2>
              <textarea
                  value={formData.investigation || ""}
                  onChange={(e) => updateForm("investigation", e.target.value)}
                  placeholder="Investigations"
                  rows={6}
              />
            </div>

            {/* N. ANALYSIS */}
            <div className="form-section">
              <h2>N. ANALYSIS</h2>
              <textarea
                  value={formData.findings || ""}
                  onChange={(e) => updateForm("findings", e.target.value)}
                  placeholder="Analysis"
                  rows={6}
              />
            </div>

            {/* O. RECOMMENDATIONS */}
            <div className="form-section">
              <h2>O. RECOMMENDATIONS</h2>
              <textarea
                  value={formData.recommendations || ""}
                  onChange={(e) => updateForm("recommendations", e.target.value)}
                  placeholder="Recommendations"
                  rows={5}
              />
            </div>

            {/* P. GENERAL */}
            <div className="form-section">
              <h2>P. GENERAL</h2>
              <textarea
                  value={formData.general || ""}
                  onChange={(e) => updateForm("general", e.target.value)}
                  placeholder="General"
                  rows={4}
              />
            </div>

            {/* Q. REPORT APPROVAL */}
            <div className="form-section">
              <h2>Q. REPORT APPROVAL</h2>
              <textarea
                  value={formData.report_approval || ""}
                  onChange={(e) => updateForm("report_approval", e.target.value)}
                  placeholder="Report Approval"
                  rows={4}
              />
            </div>
          </div>

          <div className="submit-container">
            <button onClick={() => handleAction("save")} className="save-btn">
              Save
            </button>
            <button onClick={() => handleAction("submit")} className="submit-btn">
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