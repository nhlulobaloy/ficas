/* ForensicReview.tsx */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "../../styles/PreliminaryReview.css";
import { apiBackend, apiCall } from "../api/api.ts";

interface ForensicComment {
  id: number;
  forensic_id: number;
  user_id: number;
  user_name: string;
  comment: string;
  created_at: string;
}

interface DistributionRow {
  id?: number;
  forensic_id?: number;
  no: number;
  name_and_designation: string;
  action: boolean | number;
  action_support: boolean | number;
  information: boolean | number;
}

interface KeyValueRow {
  id?: number;
  forensic_id?: number;
  no: number;
  label: string;
  description: string;
}

interface IndividualRow {
  id?: number;
  forensic_id?: number;
  no: number;
  name: string;
  position: string;
}

interface ForensicInvestigation {
  id: number;
  incident_id: number;
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
  recommendations: string;
  general: string;
  status: "draft" | "review" | "approved" | "closed";
  conducted_by: string;
  updated_at: string;
  referred_department: number | null;
  created_at: string;
  comments?: ForensicComment[];
  // new row-based tables
  distribution_list_rows?: DistributionRow[];
  abbreviations_rows?: KeyValueRow[];
  phrases_rows?: KeyValueRow[];
  individuals_rows?: IndividualRow[];
  annexures_rows?: KeyValueRow[];
}

interface Investigator {
  id: number;
  name: string;
  email: string;
}

interface Department {
  id: number;
  name: string;
}

export default function ReviewForensic() {
  const [investigations, setInvestigations] = useState<ForensicInvestigation[]>([]);
  const [filteredInvestigations, setFilteredInvestigations] = useState<ForensicInvestigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionMessage, setSessionMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInvestigation, setSelectedInvestigation] = useState<ForensicInvestigation | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnComments, setReturnComments] = useState("");
  const [managementAction, setManagementAction] = useState<"assign_investigator" | "close_case" | "refer_department" | "return" | "">("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [investigators, setInvestigators] = useState<Investigator[]>([]);
  const [selectedInvestigator, setSelectedInvestigator] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [exporting, setExporting] = useState<"word" | "pdf" | null>(null);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const verifyAccess = async () => {
    try {
      const res = await apiCall(`${apiBackend}/forensic/auth/access`);
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

  const fetchInvestigators = async () => {
    try {
      const res = await apiCall(`${apiBackend}/forensic/case/investigators`);
      const data = await res.json();
      setInvestigators(data.data || data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInvestigations = async () => {
    setLoading(true);
    try {
      const allowed = await verifyAccess();
      if (!allowed) return;

      const res = await apiCall(
          `${apiBackend}/forensic/case/review?page=${currentPage}&limit=${itemsPerPage}`
      );
      const data = await res.json();
      setInvestigations(data.data || []);
      setFilteredInvestigations(data.data || []);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const depRes = await apiCall(`${apiBackend}/preli/departments`);
      const departmentsData = await depRes.json();
      setDepartments(departmentsData.data || departmentsData || []);
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  useEffect(() => {
    fetchInvestigations();
    fetchDepartments();
    fetchInvestigators();
  }, [token, currentPage]);

  useEffect(() => {
    let filtered = investigations;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(
          (item) =>
              item.background?.toLowerCase().includes(s) ||
              item.mandate?.toLowerCase().includes(s) ||
              item.id?.toString().includes(searchTerm) ||
              item.preliminary_id?.toString().includes(searchTerm)
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }
    setFilteredInvestigations(filtered);
  }, [searchTerm, statusFilter, investigations]);

  useEffect(() => {
    if (managementAction !== "refer_department") {
      setSelectedDepartment("");
    }
  }, [managementAction]);

  const handleCloseCase = async (id: number) => {
    const userName = localStorage.getItem("name") || "User";
    try {
      const res = await apiCall(`${apiBackend}/forensic/close/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "closed", conducted_by: userName }),
      });
      if (res.ok) {
        setInvestigations((prev) =>
            prev.map((i) =>
                i.id === id ? { ...i, status: "closed", conducted_by: userName } : i
            )
        );
        setSelectedInvestigation(null);
        setManagementAction("");
        setSessionMessage("Case closed successfully");
        setTimeout(() => setSessionMessage(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setSessionMessage("Server error");
    }
  };

  const handleReferDepartment = async (id: number) => {
    if (!selectedDepartment) {
      setSessionMessage("Please select a department");
      setTimeout(() => setSessionMessage(""), 3000);
      return;
    }
    try {
      const selectedDept = departments.find(
          (dept) => dept.id === parseInt(selectedDepartment)
      );
      const res = await apiCall(`${apiBackend}/forensic/refer/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          referred_department: selectedDept?.id || selectedDepartment,
          status: "approved",
          recommendations: "refer",
        }),
      });
      if (res.ok) {
        setInvestigations((prev) =>
            prev.map((i) =>
                i.id === id
                    ? {
                      ...i,
                      status: "approved",
                      referred_department:
                          selectedDept?.id || parseInt(selectedDepartment),
                    }
                    : i
            )
        );
        setSelectedInvestigation(null);
        setManagementAction("");
        setSelectedDepartment("");
        setSessionMessage("Case referred successfully");
        setTimeout(() => setSessionMessage(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setSessionMessage("Server error");
    }
  };

  const handleAssignInvestigator = async (investigationId: number) => {
    const selectedInv = investigators.find(
        (inv) => inv.id.toString() === selectedInvestigator
    );

    if (!selectedInv) {
      setSessionMessage("Please select a valid investigator");
      setTimeout(() => setSessionMessage(""), 3000);
      return;
    }

    try {
      const res = await apiCall(
          `${apiBackend}/forensic/case/assign${investigationId}`,
          {
            method: "PUT",
            body: JSON.stringify({
              assigned_to: selectedInv.id,
              assigned_investigator_name: selectedInv.name,
              status: "review",
            }),
          }
      );

      if (!res.ok) {
        const errorData = await res.json();
        setSessionMessage(errorData.message || "Failed to assign investigator");
        return;
      }

      setInvestigations((prev) =>
          prev.map((i) =>
              i.id === investigationId
                  ? { ...i, conducted_by: selectedInv.name, status: "approved" }
                  : i
          )
      );

      setSelectedInvestigation(null);
      setManagementAction("");
      setSelectedInvestigator("");
      setSessionMessage("Investigator assigned successfully");
      setTimeout(() => setSessionMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setSessionMessage("Server error");
    }
  };

  const handleReturnToInvestigator = async () => {
    if (!selectedInvestigation || !returnComments.trim()) {
      setSessionMessage("Please provide comments for return");
      return;
    }
    try {
      const res = await apiCall(
          `${apiBackend}/forensic/return/${selectedInvestigation.id}`,
          {
            method: "POST",
            body: JSON.stringify({
              comments: returnComments,
              status: "returned",
            }),
          }
      );
      if (res.ok) {
        setInvestigations((prev) =>
            prev.map((i) =>
                i.id === selectedInvestigation.id
                    ? {
                      ...i,
                      status: "review",
                      comments: [
                        ...(i.comments || []),
                        {
                          comment: returnComments,
                          user_name: localStorage.getItem("name") || "User",
                          id: Date.now(),
                          forensic_id: i.id,
                          user_id: 0,
                          created_at: new Date().toISOString(),
                        },
                      ],
                    }
                    : i
            )
        );
        setSelectedInvestigation(null);
        setShowReturnModal(false);
        setReturnComments("");
        setManagementAction("");
        setSessionMessage("Case returned successfully");
        setTimeout(() => setSessionMessage(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setSessionMessage("Server error");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "status-draft";
      case "review":
        return "status-review";
      case "approved":
        return "status-approved";
      case "closed":
        return "status-closed";
      default:
        return "";
    }
  };

  // Fetch full forensic report + all new row-based tables
  const handleView = async (id: number) => {
    try {
      const res = await fetch(`${apiBackend}/forensic/review/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return;

      const forensic: ForensicInvestigation = data.data;

      // Fetch all 5 row tables in parallel
      const [dist, abbr, phr, ind, ann] = await Promise.all([
        apiCall(`${apiBackend}/forensic/distribution/${id}`),
        apiCall(`${apiBackend}/forensic/abbreviations/${id}`),
        apiCall(`${apiBackend}/forensic/phrases/${id}`),
        apiCall(`${apiBackend}/forensic/individuals/${id}`),
        apiCall(`${apiBackend}/forensic/annexures/${id}`),
      ]);

      const safeJson = async (r: Response) => (r.ok ? (await r.json()).data || [] : []);

      forensic.distribution_list_rows = await safeJson(dist);
      forensic.abbreviations_rows = await safeJson(abbr);
      forensic.phrases_rows = await safeJson(phr);
      forensic.individuals_rows = await safeJson(ind);
      forensic.annexures_rows = await safeJson(ann);

      setSelectedInvestigation(forensic);
      setManagementAction("");
      setSelectedDepartment("");
    } catch (err) {
      console.error("Error fetching investigation:", err);
    }
  };

  const handleApplyAction = () => {
    if (!selectedInvestigation || !managementAction) return;
    switch (managementAction) {
      case "close_case":
        handleCloseCase(selectedInvestigation.id);
        break;
      case "refer_department":
        handleReferDepartment(selectedInvestigation.id);
        break;
      case "return":
        setShowReturnModal(true);
        break;
      case "assign_investigator":
        handleAssignInvestigator(selectedInvestigation.id);
        break;
      default:
        break;
    }
  };

  /* ========== EXPORT HELPERS ========== */

  const yesNo = (v: any) => (v ? "X" : "");

  // Word export
  const buildDetailsHTML = (inc: ForensicInvestigation): string => {
    const commentsHTML = (inc.comments || [])
        .map(
            (c) =>
                `<li><strong>${c.user_name}:</strong> ${c.comment} <em>(${new Date(
                    c.created_at
                ).toLocaleString()})</em></li>`
        )
        .join("");

    const distributionHTML = (inc.distribution_list_rows || [])
        .map(
            (r) => `
          <tr>
            <td style="border:1px solid #333; padding:4px; text-align:center;">${r.no}</td>
            <td style="border:1px solid #333; padding:4px;">${r.name_and_designation || ""}</td>
            <td style="border:1px solid #333; padding:4px; text-align:center;">${yesNo(r.action)}</td>
            <td style="border:1px solid #333; padding:4px; text-align:center;">${yesNo(r.action_support)}</td>
            <td style="border:1px solid #333; padding:4px; text-align:center;">${yesNo(r.information)}</td>
          </tr>`
        )
        .join("");

    const kv = (rows?: KeyValueRow[]) =>
        (rows || [])
            .map(
                (r) => `
            <tr>
              <td style="border:1px solid #333; padding:4px; text-align:center;">${r.no}</td>
              <td style="border:1px solid #333; padding:4px;">${r.label || ""}</td>
              <td style="border:1px solid #333; padding:4px;">${r.description || ""}</td>
            </tr>`
            )
            .join("");

    const individualsHTML = (inc.individuals_rows || [])
        .map(
            (r) => `
          <tr>
            <td style="border:1px solid #333; padding:4px; text-align:center;">${r.no}</td>
            <td style="border:1px solid #333; padding:4px;">${r.name || ""}</td>
            <td style="border:1px solid #333; padding:4px;">${r.position || ""}</td>
          </tr>`
        )
        .join("");

    return `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset="utf-8">
          <title>Forensic Investigation Report</title>
          <style>
            @page { size: A4; margin: 2cm; }
            body { font-family: Arial, sans-serif; font-size: 11pt; color: #222; line-height: 1.5; }
            h1 { font-size: 18pt; text-align: center; margin-bottom: 4pt; }
            h2 { font-size: 13pt; color: #1a3e72; border-bottom: 1px solid #1a3e72; padding-bottom: 3pt; margin-top: 16pt; }
            .meta { text-align: center; color: #555; font-size: 10pt; margin-bottom: 16pt; }
            .section { margin-bottom: 10pt; }
            .label { font-weight: bold; color: #1a3e72; display: block; margin-top: 8pt; }
            .value { white-space: pre-wrap; }
            table { width: 100%; border-collapse: collapse; margin: 6pt 0 12pt 0; }
            th { background: #d9d9d9; border: 1px solid #333; padding: 4pt; font-size: 10pt; }
            .comments ul { list-style: none; padding: 0; }
            .comments li { background: #f5f5f5; margin: 5pt 0; padding: 6pt; border-left: 3px solid #1a3e72; }
            .footer { text-align: center; font-size: 9pt; color: #777; margin-top: 24pt; border-top: 1px solid #ccc; padding-top: 6pt; }
          </style>
        </head>
        <body>
          <h1>Forensic Investigation Report</h1>
          <div class="meta">
            Forensic ID: ${inc.id} &nbsp;|&nbsp; Preliminary ID: ${inc.preliminary_id} &nbsp;|&nbsp; Status: ${inc.status}
          </div>

          <h2>A. Distribution List</h2>
          <table>
            <thead>
              <tr>
                <th rowspan="2">NO</th>
                <th rowspan="2">NAME &amp; DESIGNATION</th>
                <th colspan="3">DISTRIBUTION REASON</th>
              </tr>
              <tr>
                <th>ACTION</th>
                <th>ACTION SUPPORT</th>
                <th>INFORMATION</th>
              </tr>
            </thead>
            <tbody>${distributionHTML || `<tr><td colspan="5" style="text-align:center; padding:6pt;">No rows</td></tr>`}</tbody>
          </table>

          <h2>B. Abbreviations</h2>
          <table>
            <thead><tr><th style="width:60px;">NO</th><th style="width:180px;">ABBREVIATION</th><th>DESCRIPTION</th></tr></thead>
            <tbody>${kv(inc.abbreviations_rows) || `<tr><td colspan="3" style="text-align:center; padding:6pt;">No rows</td></tr>`}</tbody>
          </table>

          <h2>C. Phrases</h2>
          <table>
            <thead><tr><th style="width:60px;">NO</th><th style="width:180px;">PHRASE</th><th>DESCRIPTION</th></tr></thead>
            <tbody>${kv(inc.phrases_rows) || `<tr><td colspan="3" style="text-align:center; padding:6pt;">No rows</td></tr>`}</tbody>
          </table>

          <h2>D. Names of Individuals</h2>
          <table>
            <thead><tr><th style="width:60px;">NO</th><th style="width:250px;">NAME</th><th>POSITION</th></tr></thead>
            <tbody>${individualsHTML || `<tr><td colspan="3" style="text-align:center; padding:6pt;">No rows</td></tr>`}</tbody>
          </table>

          <h2>E. Annexures</h2>
          <table>
            <thead><tr><th style="width:60px;">NO</th><th style="width:150px;">ANNEXURE NO</th><th>DESCRIPTION</th></tr></thead>
            <tbody>${kv(inc.annexures_rows) || `<tr><td colspan="3" style="text-align:center; padding:6pt;">No rows</td></tr>`}</tbody>
          </table>

          <h2>Case Information</h2>
          <div class="section"><span class="label">Conducted By:</span>${inc.conducted_by || "N/A"}</div>
          <div class="section"><span class="label">Created At:</span>${inc.created_at ? new Date(inc.created_at).toLocaleString() : "N/A"}</div>
          <div class="section"><span class="label">Updated At:</span>${inc.updated_at ? new Date(inc.updated_at).toLocaleString() : "N/A"}</div>
          ${inc.referred_department ? `<div class="section"><span class="label">Referred Department ID:</span>${inc.referred_department}</div>` : ""}

          <h2>F. Background</h2><div class="value">${inc.background || "Not provided"}</div>
          <h2>G. Mandate</h2><div class="value">${inc.mandate || "Not provided"}</div>
          <h2>H. Purpose &amp; Objectives</h2><div class="value">${inc.purpose_and_objective || "Not provided"}</div>
          <h2>I. Scope of the Investigation</h2><div class="value">${inc.scope_of_investigation || "Not provided"}</div>
          <h2>J. Approach and Procedures Performed</h2><div class="value">${(inc as any).approach_and_procedures_performed || "Not provided"}</div>
          <h2>K. Limitations</h2><div class="value">${inc.restrictions_and_limitations || "Not provided"}</div>
          <h2>L. Applicable Legislation and Policies</h2><div class="value">${inc.legislative_policy_framework || "Not provided"}</div>
          <h2>M. Investigations</h2><div class="value">${inc.investigation || "Not provided"}</div>
          <h2>N. Analysis</h2><div class="value">${inc.findings || "Not provided"}</div>
          <h2>O. Recommendations</h2><div class="value">${inc.recommendations || "Not provided"}</div>
          <h2>P. General</h2><div class="value">${inc.general || "Not provided"}</div>
          <h2>Q. Report Approval</h2><div class="value">${(inc as any).report_approval || "Not provided"}</div>

          ${
        inc.comments?.length
            ? `<h2>Review Comments</h2><div class="comments"><ul>${commentsHTML}</ul></div>`
            : ""
    }

          <div class="footer">
            Generated on ${new Date().toLocaleString()} &nbsp;|&nbsp; Forensic Investigation Report
          </div>
        </body>
      </html>
    `;
  };

  const exportToWord = () => {
    if (!selectedInvestigation) return;
    setExporting("word");
    try {
      const htmlContent = buildDetailsHTML(selectedInvestigation);
      const blob = new Blob([htmlContent], { type: "application/msword" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Forensic_Report_${selectedInvestigation.id}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Word export failed:", error);
      alert("Failed to export Word document.");
    } finally {
      setExporting(null);
    }
  };

  const exportToPDF = async () => {
    if (!selectedInvestigation) return;
    setExporting("pdf");
    const inc = selectedInvestigation;
    try {
      const container = document.createElement("div");
      container.style.width = "794px";
      container.style.padding = "40px";
      container.style.fontFamily = "Arial, sans-serif";
      container.style.fontSize = "12px";
      container.style.color = "#222";
      container.style.backgroundColor = "#fff";
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.lineHeight = "1.5";
      document.body.appendChild(container);

      const yesNo = (v: any) => (v ? "X" : "");

      const commentsHTML = (inc.comments || [])
          .map(
              (c) => `
            <li style="background:#f5f5f5; margin:5px 0; padding:8px; border-left:3px solid #1a3e72; list-style:none;">
              <strong>${c.user_name}:</strong> ${c.comment}
              <em style="color:#666;">(${new Date(c.created_at).toLocaleString()})</em>
            </li>`
          )
          .join("");

      const section = (title: string, value: string) => `
        <h2 style="font-size:14px; color:#1a3e72; border-bottom:1px solid #1a3e72; padding-bottom:3px; margin-top:16px;">${title}</h2>
        <p style="white-space:pre-wrap; margin:6px 0;">${value || "Not provided"}</p>
      `;

      const tableStyle = "width:100%; border-collapse:collapse; margin:8px 0 12px 0;";
      const th = "background:#d9d9d9; border:1px solid #333; padding:4px; font-size:11px; text-align:center;";
      const td = "border:1px solid #333; padding:4px; font-size:11px;";
      const tdC = "border:1px solid #333; padding:4px; font-size:11px; text-align:center;";

      const distributionHTML = (inc.distribution_list_rows || [])
          .map(
              (r) => `
            <tr>
              <td style="${tdC}">${r.no}</td>
              <td style="${td}">${r.name_and_designation || ""}</td>
              <td style="${tdC}">${yesNo(r.action)}</td>
              <td style="${tdC}">${yesNo(r.action_support)}</td>
              <td style="${tdC}">${yesNo(r.information)}</td>
            </tr>`
          )
          .join("") || `<tr><td colspan="5" style="${tdC}">No rows</td></tr>`;

      const kv = (rows?: KeyValueRow[]) =>
          (rows || [])
              .map(
                  (r) => `
              <tr>
                <td style="${tdC}">${r.no}</td>
                <td style="${td}">${r.label || ""}</td>
                <td style="${td}">${r.description || ""}</td>
              </tr>`
              )
              .join("") || `<tr><td colspan="3" style="${tdC}">No rows</td></tr>`;

      const individualsHTML = (inc.individuals_rows || [])
          .map(
              (r) => `
            <tr>
              <td style="${tdC}">${r.no}</td>
              <td style="${td}">${r.name || ""}</td>
              <td style="${td}">${r.position || ""}</td>
            </tr>`
          )
          .join("") || `<tr><td colspan="3" style="${tdC}">No rows</td></tr>`;

      container.innerHTML = `
        <h1 style="text-align:center; font-size:20px; margin:0 0 4px 0;">Forensic Investigation Report</h1>
        <p style="text-align:center; color:#555; font-size:11px; margin:0 0 20px 0;">
          Forensic ID: ${inc.id} &nbsp;|&nbsp; Preliminary ID: ${inc.preliminary_id} &nbsp;|&nbsp; Status: ${inc.status}
        </p>

        <h2 style="font-size:14px; color:#1a3e72; border-bottom:1px solid #1a3e72; padding-bottom:3px;">A. Distribution List</h2>
        <table style="${tableStyle}">
          <thead>
            <tr>
              <th style="${th}" rowspan="2">NO</th>
              <th style="${th}" rowspan="2">NAME &amp; DESIGNATION</th>
              <th style="${th}" colspan="3">DISTRIBUTION REASON</th>
            </tr>
            <tr>
              <th style="${th}">ACTION</th>
              <th style="${th}">ACTION SUPPORT</th>
              <th style="${th}">INFORMATION</th>
            </tr>
          </thead>
          <tbody>${distributionHTML}</tbody>
        </table>

        <h2 style="font-size:14px; color:#1a3e72; border-bottom:1px solid #1a3e72; padding-bottom:3px;">B. Abbreviations</h2>
        <table style="${tableStyle}">
          <thead><tr><th style="${th}">NO</th><th style="${th}">ABBREVIATION</th><th style="${th}">DESCRIPTION</th></tr></thead>
          <tbody>${kv(inc.abbreviations_rows)}</tbody>
        </table>

        <h2 style="font-size:14px; color:#1a3e72; border-bottom:1px solid #1a3e72; padding-bottom:3px;">C. Phrases</h2>
        <table style="${tableStyle}">
          <thead><tr><th style="${th}">NO</th><th style="${th}">PHRASE</th><th style="${th}">DESCRIPTION</th></tr></thead>
          <tbody>${kv(inc.phrases_rows)}</tbody>
        </table>

        <h2 style="font-size:14px; color:#1a3e72; border-bottom:1px solid #1a3e72; padding-bottom:3px;">D. Names of Individuals</h2>
        <table style="${tableStyle}">
          <thead><tr><th style="${th}">NO</th><th style="${th}">NAME</th><th style="${th}">POSITION</th></tr></thead>
          <tbody>${individualsHTML}</tbody>
        </table>

        <h2 style="font-size:14px; color:#1a3e72; border-bottom:1px solid #1a3e72; padding-bottom:3px;">E. Annexures</h2>
        <table style="${tableStyle}">
          <thead><tr><th style="${th}">NO</th><th style="${th}">ANNEXURE NO</th><th style="${th}">DESCRIPTION</th></tr></thead>
          <tbody>${kv(inc.annexures_rows)}</tbody>
        </table>

        ${section("Case Information", `
          <strong>Conducted By:</strong> ${inc.conducted_by || "N/A"}<br/>
          <strong>Created At:</strong> ${inc.created_at ? new Date(inc.created_at).toLocaleString() : "N/A"}<br/>
          <strong>Updated At:</strong> ${inc.updated_at ? new Date(inc.updated_at).toLocaleString() : "N/A"}
          ${inc.referred_department ? `<br/><strong>Referred Department ID:</strong> ${inc.referred_department}` : ""}
        `)}

        ${section("F. Background", inc.background)}
        ${section("G. Mandate", inc.mandate)}
        ${section("H. Purpose & Objective", inc.purpose_and_objective)}
        ${section("I. Scope of Investigation", inc.scope_of_investigation)}
        ${section("J. Approach and Procedures Performed", (inc as any).approach_and_procedures_performed || "")}
        ${section("K. Limitations", inc.restrictions_and_limitations)}
        ${section("L. Applicable Legislation and Policies", inc.legislative_policy_framework)}
        ${section("M. Investigations", inc.investigation)}
        ${section("N. Analysis", inc.findings)}
        ${section("O. Recommendations", inc.recommendations)}
        ${section("P. General", inc.general)}
        ${section("Q. Report Approval", (inc as any).report_approval || "")}

        ${inc.comments?.length
          ? `<h2 style="font-size:14px; color:#1a3e72; border-bottom:1px solid #1a3e72; padding-bottom:3px; margin-top:16px;">Review Comments</h2>
             <ul style="padding:0;">${commentsHTML}</ul>`
          : ""
      }

        <p style="text-align:center; font-size:10px; color:#777; margin-top:30px; border-top:1px solid #ccc; padding-top:8px;">
          Generated on ${new Date().toLocaleString()} &nbsp;|&nbsp; Forensic Investigation Report
        </p>
      `;

      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      document.body.removeChild(container);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setTextColor(120);
        pdf.text(
            `Page ${i} of ${pageCount}  |  Forensic Investigation Report  |  ID: ${inc.id}`,
            pageWidth / 2,
            pageHeight - 20,
            { align: "center" }
        );
      }

      pdf.save(`Forensic_Report_${inc.id}.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Failed to export PDF.");
    } finally {
      setExporting(null);
    }
  };

  /* ========== END EXPORT HELPERS ========== */

  if (loading) return <div className="loading">Loading...</div>;
  if (!investigations.length)
    return <div className="no-data">No forensic investigations found</div>;

  return (
      <div className="preliminary-review-container">
        {sessionMessage && <div className="session-message">{sessionMessage}</div>}
        <h2 className="dashboard-title">Forensic Review</h2>

        <div className="filter-controls">
          <input
              type="text"
              placeholder="Search by ID, preliminary ID, background..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <>
          <table>
            <thead>
            <tr>
              <th>Preliminary ID</th>
              <th>Recommendations</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
            </thead>
            <tbody>
            {filteredInvestigations.map((i) => (
                <tr key={i.id}>
                  <td>{i.preliminary_id}</td>
                  <td>{i.recommendations || "N/A"}</td>
                  <td>
                  <span className={`status-badge ${getStatusColor(i.status)}`}>
                    {i.status}
                  </span>
                  </td>
                  <td>
                    <button onClick={() => handleView(i.id)}>View</button>
                  </td>
                </tr>
            ))}
            </tbody>
          </table>

          {totalPages > 1 && (
              <div className="pagination">
                <button onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1}>
                  Previous
                </button>
                <span>
              Page {currentPage} of {totalPages}
            </span>
                <button onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage === totalPages}>
                  Next
                </button>
              </div>
          )}
        </>

        {selectedInvestigation && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3>Forensic Investigation Details</h3>
                <button
                    className="close-btn"
                    onClick={() => {
                      setSelectedInvestigation(null);
                      setManagementAction("");
                      setSelectedDepartment("");
                    }}
                >
                  ×
                </button>

                <div className="details-grid">
                  <div><strong>ID:</strong> {selectedInvestigation.id}</div>
                  <div><strong>Preliminary ID:</strong> {selectedInvestigation.preliminary_id}</div>
                  <div><strong>Status:</strong> {selectedInvestigation.status}</div>
                  <div><strong>Conducted By:</strong> {selectedInvestigation.conducted_by || "N/A"}</div>
                  <div><strong>Created At:</strong> {new Date(selectedInvestigation.created_at).toLocaleString()}</div>
                  <div><strong>Updated At:</strong> {new Date(selectedInvestigation.updated_at).toLocaleString()}</div>

                  {/* A. Distribution list table */}
                  <div className="full-width" style={{ marginTop: 8 }}>
                    <strong>A. Distribution List</strong>
                    <table className="distribution-table" style={{ marginTop: 6 }}>
                      <thead>
                      <tr>
                        <th rowSpan={2} style={{ width: 50 }}>NO</th>
                        <th rowSpan={2}>NAME &amp; DESIGNATION</th>
                        <th colSpan={3}>DISTRIBUTION REASON</th>
                      </tr>
                      <tr>
                        <th>ACTION</th>
                        <th>ACTION SUPPORT</th>
                        <th>INFORMATION</th>
                      </tr>
                      </thead>
                      <tbody>
                      {(selectedInvestigation.distribution_list_rows || []).map((r, i) => (
                          <tr key={i}>
                            <td style={{ textAlign: "center" }}>{r.no}</td>
                            <td>{r.name_and_designation}</td>
                            <td style={{ textAlign: "center" }}>{r.action ? "X" : ""}</td>
                            <td style={{ textAlign: "center" }}>{r.action_support ? "X" : ""}</td>
                            <td style={{ textAlign: "center" }}>{r.information ? "X" : ""}</td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>

                  {/* B. Abbreviations */}
                  <div className="full-width" style={{ marginTop: 8 }}>
                    <strong>B. Abbreviations</strong>
                    <table className="distribution-table" style={{ marginTop: 6 }}>
                      <thead>
                      <tr>
                        <th style={{ width: 50 }}>NO</th>
                        <th style={{ width: 180 }}>ABBREVIATION</th>
                        <th>DESCRIPTION</th>
                      </tr>
                      </thead>
                      <tbody>
                      {(selectedInvestigation.abbreviations_rows || []).map((r, i) => (
                          <tr key={i}>
                            <td style={{ textAlign: "center" }}>{r.no}</td>
                            <td>{r.label}</td>
                            <td>{r.description}</td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>

                  {/* C. Phrases */}
                  <div className="full-width" style={{ marginTop: 8 }}>
                    <strong>C. Phrases</strong>
                    <table className="distribution-table" style={{ marginTop: 6 }}>
                      <thead>
                      <tr>
                        <th style={{ width: 50 }}>NO</th>
                        <th style={{ width: 180 }}>PHRASE</th>
                        <th>DESCRIPTION</th>
                      </tr>
                      </thead>
                      <tbody>
                      {(selectedInvestigation.phrases_rows || []).map((r, i) => (
                          <tr key={i}>
                            <td style={{ textAlign: "center" }}>{r.no}</td>
                            <td>{r.label}</td>
                            <td>{r.description}</td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>

                  {/* D. Names of Individuals */}
                  <div className="full-width" style={{ marginTop: 8 }}>
                    <strong>D. Names of Individuals</strong>
                    <table className="distribution-table" style={{ marginTop: 6 }}>
                      <thead>
                      <tr>
                        <th style={{ width: 50 }}>NO</th>
                        <th style={{ width: 260 }}>NAME</th>
                        <th>POSITION</th>
                      </tr>
                      </thead>
                      <tbody>
                      {(selectedInvestigation.individuals_rows || []).map((r, i) => (
                          <tr key={i}>
                            <td style={{ textAlign: "center" }}>{r.no}</td>
                            <td>{r.name}</td>
                            <td>{r.position}</td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>

                  {/* E. Annexures */}
                  <div className="full-width" style={{ marginTop: 8 }}>
                    <strong>E. Annexures</strong>
                    <table className="distribution-table" style={{ marginTop: 6 }}>
                      <thead>
                      <tr>
                        <th style={{ width: 50 }}>NO</th>
                        <th style={{ width: 160 }}>ANNEXURE NO</th>
                        <th>DESCRIPTION</th>
                      </tr>
                      </thead>
                      <tbody>
                      {(selectedInvestigation.annexures_rows || []).map((r, i) => (
                          <tr key={i}>
                            <td style={{ textAlign: "center" }}>{r.no}</td>
                            <td>{r.label}</td>
                            <td>{r.description}</td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>

                  {/* F-Q text fields */}
                  <div className="full-width"><strong>F. Background:</strong> {selectedInvestigation.background || "Not provided"}</div>
                  <div className="full-width"><strong>G. Mandate:</strong> {selectedInvestigation.mandate || "Not provided"}</div>
                  <div className="full-width"><strong>H. Purpose &amp; Objectives:</strong> {selectedInvestigation.purpose_and_objective || "Not provided"}</div>
                  <div className="full-width"><strong>I. Scope of the Investigation:</strong> {selectedInvestigation.scope_of_investigation || "Not provided"}</div>
                  <div className="full-width"><strong>J. Approach and Procedures Performed:</strong> {(selectedInvestigation as any).approach_and_procedures_performed || "Not provided"}</div>
                  <div className="full-width"><strong>K. Limitations:</strong> {selectedInvestigation.restrictions_and_limitations || "Not provided"}</div>
                  <div className="full-width"><strong>L. Applicable Legislation and Policies:</strong> {selectedInvestigation.legislative_policy_framework || "Not provided"}</div>
                  <div className="full-width"><strong>M. Investigations:</strong> {selectedInvestigation.investigation || "Not provided"}</div>
                  <div className="full-width"><strong>N. Analysis:</strong> {selectedInvestigation.findings || "Not provided"}</div>
                  <div className="full-width"><strong>O. Recommendations:</strong> {selectedInvestigation.recommendations || "Not provided"}</div>
                  <div className="full-width"><strong>P. General:</strong> {selectedInvestigation.general || "Not provided"}</div>
                  <div className="full-width"><strong>Q. Report Approval:</strong> {(selectedInvestigation as any).report_approval || "Not provided"}</div>

                  {selectedInvestigation.referred_department && (
                      <div><strong>Referred Department ID:</strong> {selectedInvestigation.referred_department}</div>
                  )}

                  {(selectedInvestigation.comments || []).length > 0 && (
                      <div className="comments-section">
                        <strong>Comments:</strong>
                        <ul>
                          {(selectedInvestigation.comments || []).map((c) => (
                              <li key={c.id}>
                                <strong>{c.user_name}:</strong> {c.comment}
                              </li>
                          ))}
                        </ul>
                      </div>
                  )}
                </div>

                {selectedInvestigation.status === "review" && (
                    <div className="action-section">
                      <div className="assignment-grid">
                        <div className="assignment-item">
                          <label htmlFor="managementAction">Management Action:</label>
                          <select
                              id="managementAction"
                              value={managementAction}
                              onChange={(e) => setManagementAction(e.target.value as any)}
                          >
                            <option value="">-- Select Action --</option>
                            <option value="close_case">Close Case</option>
                            <option value="refer_department">Refer to Department</option>
                            <option value="return">Return to Investigator</option>
                            <option value="assign_investigator">Assign Investigator</option>
                          </select>
                        </div>

                        {managementAction === "refer_department" && (
                            <div className="assignment-item">
                              <label htmlFor="department">Select Department:</label>
                              <select
                                  id="department"
                                  value={selectedDepartment}
                                  onChange={(e) => setSelectedDepartment(e.target.value)}
                              >
                                <option value="">-- Select Department --</option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                      {dept.name}
                                    </option>
                                ))}
                              </select>
                            </div>
                        )}

                        {managementAction === "assign_investigator" && (
                            <div className="assignment-item">
                              <label>Select Investigator:</label>
                              <select
                                  value={selectedInvestigator}
                                  onChange={(e) => setSelectedInvestigator(e.target.value)}
                              >
                                <option value="">-- Select Investigator --</option>
                                {investigators.map((inv) => (
                                    <option key={inv.id} value={inv.id}>
                                      {inv.name} ({inv.email})
                                    </option>
                                ))}
                              </select>
                            </div>
                        )}
                      </div>

                      <div className="modal-buttons">
                        <button
                            className="cancel-btn"
                            onClick={() => {
                              setSelectedInvestigation(null);
                              setManagementAction("");
                              setSelectedDepartment("");
                            }}
                        >
                          Close
                        </button>
                        <button
                            className="update-btn"
                            onClick={handleApplyAction}
                            disabled={
                                !managementAction ||
                                (managementAction === "refer_department" && !selectedDepartment)
                            }
                        >
                          Apply Action
                        </button>
                        <button className="update-btn" onClick={exportToWord} disabled={exporting === "word"}>
                          {exporting === "word" ? "Generating Word..." : "Download Word"}
                        </button>
                        <button className="update-btn" onClick={exportToPDF} disabled={exporting === "pdf"}>
                          {exporting === "pdf" ? "Generating PDF..." : "Download PDF"}
                        </button>
                      </div>
                    </div>
                )}

                {selectedInvestigation.status !== "review" && (
                    <div className="modal-buttons">
                      <button
                          className="cancel-btn"
                          onClick={() => {
                            setSelectedInvestigation(null);
                            setManagementAction("");
                            setSelectedDepartment("");
                          }}
                      >
                        Close
                      </button>
                      <button className="update-btn" onClick={exportToWord} disabled={exporting === "word"}>
                        {exporting === "word" ? "Generating Word..." : "Download Word"}
                      </button>
                      <button className="update-btn" onClick={exportToPDF} disabled={exporting === "pdf"}>
                        {exporting === "pdf" ? "Generating PDF..." : "Download PDF"}
                      </button>
                    </div>
                )}
              </div>
            </div>
        )}

        {showReturnModal && selectedInvestigation && (
            <div className="modal-overlay">
              <div className="modal-content return-modal">
                <h3>Return Case to Investigator</h3>
                <p>Please provide comments for the investigator:</p>
                <textarea
                    value={returnComments}
                    onChange={(e) => setReturnComments(e.target.value)}
                    placeholder="Enter comments explaining why the case is being returned..."
                    rows={5}
                />
                <div className="modal-buttons">
                  <button
                      className="cancel-btn"
                      onClick={() => {
                        setShowReturnModal(false);
                        setReturnComments("");
                      }}
                  >
                    Cancel
                  </button>
                  <button
                      className="update-btn"
                      onClick={handleReturnToInvestigator}
                      disabled={!returnComments.trim()}
                  >
                    Submit Return
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}