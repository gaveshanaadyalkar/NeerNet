/* ==========================================
   NEERNET — COMMUNITY WATER INTELLIGENCE
   Standalone version: works with index.html
   No server or API required.
========================================== */

document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    // Connect to the existing HTML elements.
    const form = document.getElementById("reportForm");
    const button = document.getElementById("submitBtn");
    const message = document.getElementById("formMessage");
    const result = document.getElementById("analysisResult");
    const reportsList = document.getElementById("reportsList");

    const totalStat = document.getElementById("totalStat");
    const urgentStat = document.getElementById("urgentStat");
    const reviewStat = document.getElementById("reviewStat");
    const resolvedStat = document.getElementById("resolvedStat");

    const modeLabel = document.getElementById("modeLabel");
    const modeText = document.getElementById("modeText");

    // Use a new storage key so old duplicate data does not
    // interfere with the corrected dashboard.
    const STORAGE_KEY = "neernetReportsFixedV1";

    let reports = [];
    let submitting = false;

    // ------------------------------------------
    // 1. LOAD SAVED REPORTS
    // ------------------------------------------

    function loadReports() {
        try {
            const saved = JSON.parse(
                localStorage.getItem(STORAGE_KEY) || "[]"
            );

            reports = Array.isArray(saved) ? saved : [];
        } catch (error) {
            console.error("Could not load saved reports:", error);
            reports = [];
        }
    }

    function saveReports(updatedReports) {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(updatedReports)
            );

            return true;
        } catch (error) {
            console.error("Could not save reports:", error);
            return false;
        }
    }

    // ------------------------------------------
    // 2. DISPLAY SUCCESS AND ERROR MESSAGES
    // ------------------------------------------

    function showMessage(text, type) {
        if (!message) return;

        message.textContent = text;
        message.className = type;
        message.style.display = "block";
        message.style.padding = "12px";
        message.style.marginTop = "12px";
        message.style.borderRadius = "10px";

        if (type === "success") {
            message.style.color = "#087443";
            message.style.backgroundColor = "#e7f8ee";
            message.style.border = "1px solid #a9e7c1";
        } else {
            message.style.color = "#b42318";
            message.style.backgroundColor = "#fff0ef";
            message.style.border = "1px solid #ffc9c5";
        }
    }

    // ------------------------------------------
    // 3. ANALYZE A WATER ISSUE
    // ------------------------------------------

    function analyzeReport(report) {
        const urgencyPoints = {
            "Water shortage": 3,
            "Broken hand pump": 2,
            "Leak or damaged pipe": 2,
            "Water quality concern": 3,
            "Flooding or overflow": 3,
            "Other": 1
        };

        const urgency = urgencyPoints[report.category] || 2;

        // Score components:
        // Urgency: up to 40 points
        // People affected: up to 30 points
        // Duration: up to 30 points

        const urgencyScore = (urgency / 3) * 40;

        const peopleScore =
            (Math.min(report.peopleAffected, 500) / 500) * 30;

        const durationScore =
            (Math.min(report.durationDays, 30) / 30) * 30;

        const score = Math.round(
            urgencyScore + peopleScore + durationScore
        );

        let priority;

        if (score >= 70) {
            priority = "Urgent";
        } else if (score >= 40) {
            priority = "Needs review";
        } else {
            priority = "Monitor";
        }

        const reasons = [];

        if (urgency === 3) {
            reasons.push(
                "The selected issue category may require prompt attention."
            );
        } else {
            reasons.push(
                "The selected issue category should be checked."
            );
        }

        reasons.push(
            `Estimated people affected: ${report.peopleAffected}.`
        );

        reasons.push(
            `Reported duration: ${report.durationDays} day(s).`
        );

        let recommendedAction;

        if (priority === "Urgent") {
            recommendedAction =
                "Arrange prompt human review and verify the reported conditions.";
        } else if (priority === "Needs review") {
            recommendedAction =
                "Check the report details and assess the issue.";
        } else {
            recommendedAction =
                "Review the report and monitor for changes.";
        }

        return {
            score: score,
            priority: priority,
            reasons: reasons,
            recommendedAction: recommendedAction,
            method: "rule-based",
            disclaimer:
                "This is an illustrative priority score, not a verified assessment. A person must review the report."
        };
    }

    // ------------------------------------------
    // 4. SAFE HTML DISPLAY HELPERS
    // ------------------------------------------

    function createElement(tag, className, text) {
        const element = document.createElement(tag);

        if (className) {
            element.className = className;
        }

        if (text !== undefined && text !== null) {
            element.textContent = String(text);
        }

        return element;
    }

    function priorityClass(priority) {
        if (priority === "Urgent") return "urgent";
        if (priority === "Needs review") return "review";
        return "monitor";
    }

    // ------------------------------------------
    // 5. UPDATE DASHBOARD COUNTERS
    // ------------------------------------------

    function updateStats() {
        if (totalStat) {
            totalStat.textContent = reports.length;
        }

        if (urgentStat) {
            urgentStat.textContent = reports.filter(
                report =>
                    report.analysis &&
                    report.analysis.priority === "Urgent"
            ).length;
        }

        if (reviewStat) {
            reviewStat.textContent = reports.filter(
                report =>
                    report.analysis &&
                    report.analysis.priority === "Needs review"
            ).length;
        }

        if (resolvedStat) {
            resolvedStat.textContent = reports.filter(
                report => report.status === "Resolved"
            ).length;
        }
    }

    // ------------------------------------------
    // 6. DISPLAY REPORTS WITHOUT DUPLICATING THEM
    // ------------------------------------------
function displayReports() {
    if (!reportsList) return;
       
       reportsList.replaceChildren();

        if (reports.length === 0) {
            const empty = createElement("div", "empty");

            empty.appendChild(
                createElement("span", "", "💧")
            );

            empty.appendChild(
                createElement("b", "", "No reports yet")
            );

            empty.appendChild(
                createElement(
                    "p",
                    "",
                    "Submit a report to see it appear here."
                )
            );

            reportsList.appendChild(empty);
            return;
        }

        // Show newest reports first, up to eight reports.
        reports.slice().reverse().slice(0, 8).forEach(report => {
            const card = createElement("article", "report-item");

            const header = createElement("div", "report-head");
            const details = createElement("div", "");

            details.appendChild(
                createElement(
                    "b",
                    "",
                    `${report.category} · ${report.location}`
                )
            );

            details.appendChild(
                createElement(
                    "small",
                    "",
                    `${new Date(report.createdAt).toLocaleDateString()} · ${report.status}`
                )
            );

            const priority = createElement(
                "span",
                `priority ${priorityClass(report.analysis.priority)}`,
                report.analysis.priority
            );

            header.appendChild(details);
            header.appendChild(priority);

            card.appendChild(header);

            card.appendChild(
                createElement("p", "", report.description)
            );

            card.appendChild(
                createElement(
                    "small",
                    "",
                    `Priority score: ${report.analysis.score}/100`
                )
            );

            card.appendChild(
                createElement(
                    "p",
                    "",
                    `Impact: ${report.peopleAffected} people · ${report.durationDays} day(s)`
                )
            );

            card.appendChild(
                createElement(
                    "p",
                    "",
                    report.analysis.recommendedAction
                )
            );

            // Add controls for changing report status
const statusControls = createElement("div", "status-controls");

const statusLabel = createElement("label", "", "Update status: ");
const statusSelect = document.createElement("select");

statusSelect.appendChild(new Option("Awaiting verification", "Awaiting verification"));
statusSelect.appendChild(new Option("Work in Progress", "Work in Progress"));
statusSelect.appendChild(new Option("Resolved", "Resolved"));

statusSelect.value = report.status || "Awaiting verification";
statusSelect.setAttribute("aria-label", "Update report status");

statusSelect.addEventListener("change", function () {
    const updatedStatus = statusSelect.value;

    const updatedReports = reports.map(item =>
        item.id === report.id
            ? { ...item, status: updatedStatus }
            : item
    );

    if (saveReports(updatedReports)) {
        reports = updatedReports;
        refreshDashboard();

        showMessage(
            updatedStatus === "Resolved"
                ? "✅ Report marked as resolved successfully!"
                : updatedStatus === "Work in Progress"
                    ? "🔧 Report status updated to Work in Progress!"
                    : "Report status updated to Awaiting verification.",
            "success"
        );
    } else {
        showMessage("Unable to save the status. Please try again.", "error");
    }
});

statusControls.appendChild(statusLabel);
statusControls.appendChild(statusSelect);
card.appendChild(statusControls);

reportsList.appendChild(card);
        });
    }

    function refreshDashboard() {
        updateStats();
        displayReports();
    }

    // ------------------------------------------
    // 7. DISPLAY THE ANALYSIS RESULT
    // ------------------------------------------

    function displayAnalysis(analysis) {
        if (!result) return;

        result.replaceChildren();
        result.classList.remove("hidden");

        const header = createElement("div", "result-head");

        header.appendChild(
            createElement(
                "h4",
                "",
                `Suggested priority: ${analysis.priority}`
            )
        );

        header.appendChild(
            createElement(
                "span",
                `priority ${priorityClass(analysis.priority)}`,
                `${analysis.score}/100`
            )
        );

        result.appendChild(header);

        result.appendChild(
            createElement(
                "p",
                "",
                "Analysis method: Transparent rule-based assessment"
            )
        );

        result.appendChild(
            createElement("b", "", "Why this priority was suggested")
        );

        const list = createElement("ul", "");

        analysis.reasons.forEach(reason => {
            list.appendChild(
                createElement("li", "", reason)
            );
        });

        result.appendChild(list);

        result.appendChild(
            createElement(
                "p",
                "",
                `Suggested next step: ${analysis.recommendedAction}`
            )
        );

        result.appendChild(
            createElement("p", "tiny", analysis.disclaimer)
        );
    }

    // ------------------------------------------
    // 8. HANDLE FORM SUBMISSION
    // ------------------------------------------

    if (!form || !button || !message || !result || !reportsList) {
        console.error(
            "NeerNet setup error: one or more required HTML elements are missing."
        );

        return;
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        // Prevent double-clicks and repeated submissions
        // while the current submission is being processed.
        if (submitting) return;

        submitting = true;

        const originalButtonText = button.textContent;

        button.disabled = true;
        button.textContent = "Analyzing report...";

        message.textContent = "";
        message.style.display = "none";

        result.replaceChildren();
        result.classList.add("hidden");

        try {
            const formData = new FormData(form);

            const location = String(
                formData.get("location") || ""
            ).trim();

            const category = String(
                formData.get("category") || "Other"
            ).trim();

            const description = String(
                formData.get("description") || ""
            ).trim();

            const peopleAffected = Number(
                formData.get("peopleAffected") || 0
            );

            const durationDays = Number(
                formData.get("durationDays") || 0
            );

            // Validate required text fields.
            if (!location || !description) {
                showMessage(
                    "Please enter the location and describe the water issue.",
                    "error"
                );

                return;
            }

            // Validate numerical values.
            if (
                !Number.isFinite(peopleAffected) ||
                peopleAffected < 0 ||
                peopleAffected > 1000000 ||
                !Number.isFinite(durationDays) ||
                durationDays < 0 ||
                durationDays > 3650
            ) {
                showMessage(
                    "Please enter valid values for people affected and duration.",
                    "error"
                );

                return;
            }

            // Detect accidental duplicate submissions.
            const normalizedLocation = location.toLowerCase();
            const normalizedDescription = description.toLowerCase();

            const duplicate = reports.some(report =>
                report.location.toLowerCase() === normalizedLocation &&
                report.description.toLowerCase() === normalizedDescription &&
                report.category === category
            );

            if (duplicate) {
                showMessage(
                    "This report appears to have already been submitted. Please check Recent water reports before submitting it again.",
                    "error"
                );

                return;
            }

            // Create the report.
            const report = {
                id: (
                    window.crypto &&
                    typeof window.crypto.randomUUID === "function"
                )
                    ? window.crypto.randomUUID()
                    : `${Date.now()}-${Math.random()}`,

                location: location,
                category: category,
                description: description,
                peopleAffected: peopleAffected,
                durationDays: durationDays,
                status: "Awaiting verification",
                createdAt: new Date().toISOString()
            };

            // Analyze the report.
            report.analysis = analyzeReport(report);

            // Save to browser storage before updating the interface.
            const updatedReports = [...reports, report];

            if (!saveReports(updatedReports)) {
                showMessage(
                    "The report could not be saved in this browser. Check your browser storage settings.",
                    "error"
                );

                return;
            }

            // Update the in-memory list and dashboard.
            reports = updatedReports;

            refreshDashboard();
            displayAnalysis(report.analysis);

            // Show a clear success message.
            showMessage(
                `✅ Report submitted successfully! Your report has been saved. Priority: ${report.analysis.priority}. Score: ${report.analysis.score}/100.`,
                "success"
            );

            // Reset the form after successful submission.
            form.reset();

            // Return number fields to their original defaults.
            const peopleField = form.querySelector(
                '[name="peopleAffected"]'
            );

            const durationField = form.querySelector(
                '[name="durationDays"]'
            );

            if (peopleField) peopleField.value = 10;
            if (durationField) durationField.value = 1;

        } catch (error) {
            console.error("NeerNet submission error:", error);

            showMessage(
                "Something went wrong while submitting your report. Please refresh the page and try again.",
                "error"
            );

        } finally {
            submitting = false;
            button.disabled = false;
            button.textContent = originalButtonText;
        }
    });

    // ------------------------------------------
    // 9. UPDATE THE INTELLIGENCE PANEL
    // ------------------------------------------

    if (modeLabel) {
        modeLabel.textContent = "Rule-based mode";
    }

    if (modeText) {
        modeText.textContent =
            "NeerNet uses transparent rules to calculate a suggested priority. This standalone version does not call a live AI service.";
    }

    // ------------------------------------------
    // 10. INITIALIZE THE WEBSITE
    // ------------------------------------------

    loadReports();
    refreshDashboard();
});
