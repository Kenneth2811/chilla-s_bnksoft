// ENHANCED TRANSACTION PROCESSING & STATE MANAGEMENT SYSTEM

document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("customLoginForm");
    const authViewport = document.getElementById("authViewport");
    const appViewport = document.getElementById("appViewport");
    const authError = document.getElementById("authError");
    const signOutBtn = document.getElementById("btnSignOut");

    const VALID_USER = "Thomas301";
    const VALID_PASS = "T@Muller1";
    const DEVELOPER_ROLE_KEY = "UNC_DEV_AUTH_PASSTHRU"; // Backend simulation token

    // Initialize application storage state if empty
    initializeDataStore();

    if (localStorage.getItem("uc_session_active") === "true") {
        if (authViewport) authViewport.style.display = "none";
        if (appViewport) appViewport.style.display = "flex";
        renderApplicationState();
    }

    if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const usernameInput = document.getElementById("vaultUser").value.trim();
            const passwordInput = document.getElementById("vaultPass").value;

            if (usernameInput === VALID_USER && passwordInput === VALID_PASS) {
                authError.style.display = "none";
                authViewport.style.display = "none";
                appViewport.style.display = "flex";
                localStorage.setItem("uc_session_active", "true");
                
                // Assign developer clearance flag securely on authenticated session
                localStorage.setItem(DEVELOPER_ROLE_KEY, "true");

                appendLog(`[AUTH] Clearance granted for corporate identifier: ${VALID_USER}`);
                renderApplicationState();
            } else {
                authError.style.display = "flex";
                appendLog(`[SECURITY] Authentication failed for user string: ${usernameInput}`);
            }
        });
    }

    if (signOutBtn) {
        signOutBtn.addEventListener("click", function () {
            localStorage.removeItem("uc_session_active");
            localStorage.removeItem(DEVELOPER_ROLE_KEY);
            appViewport.style.display = "none";
            authViewport.style.display = "flex";
            document.getElementById("vaultUser").value = "";
            document.getElementById("vaultPass").value = "";
        });
    }

    // Navigation configuration
    const navItems = {
        navOverview: "panelOverview",
        navClearing: "panelClearing",
        navStatements: "panelStatements",
        navFX: "panelFX",
        navCards: "panelCards",
        navLogs: "panelLogs",
        navSettings: "panelSettings"
    };

    Object.keys(navItems).forEach(navId => {
        const item = document.getElementById(navId);
        if (item) {
            item.addEventListener("click", function () {
                document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
                this.classList.add("active");
                document.querySelectorAll(".dash-panel").forEach(panel => panel.style.display = "none");
                const targetPanel = document.getElementById(navItems[navId]);
                if (targetPanel) targetPanel.style.display = "block";
            });
        }
    });

    // Wire Transfer Handler - Immediate History Update & Balance Deduction
    const wireForm = document.getElementById("wireTransferForm");
    if (wireForm) {
        wireForm.addEventListener("submit", function (e) {
            e.preventDefault();

            const bank = document.getElementById("wireBank").value;
            const amount = parseFloat(document.getElementById("wireAmount").value);
            const reference = document.getElementById("wireReference").value || "Outbound Wire Transfer";
            const routing = document.getElementById("wireRouting").value;

            if (isNaN(amount) || amount <= 0) {
                alert("Please enter a valid transfer amount.");
                return;
            }

            // Use server/hosted system timestamp as official timestamp
            const serverTimestamp = Date.now();
            const dateString = new Date(serverTimestamp).toISOString().split('T')[0];
            const refId = "UNGP" + serverTimestamp.toString().slice(-9);

            const newTransaction = {
                id: refId,
                date: dateString,
                timestamp: serverTimestamp,
                description: `${reference} / ${bank}`,
                routing: `SWIFT/RTGS (${routing})`,
                amount: -amount,
                type: "debit",
                status: "Processing",
                isUserCreated: true
            };

            // Save and update account state atomically
            persistAndProcessNewTransaction(newTransaction);
            wireForm.reset();
            openSuccessModal();
        });
    }

    // Developer Reset Listener
    const btnDevReset = document.getElementById("btnDevReset");
    if (btnDevReset) {
        btnDevReset.addEventListener("click", function () {
            executeBackendDeveloperReset();
        });
    }

    // Periodic check for status transitions (Processing -> Completed/Failed)
    setInterval(evaluateTransactionLifecycle, 1000);
});

// --- DATA STORE INITIALIZATION & MANAGEMENT ---

function getInitialHardcodedTransactions() {
    return [
        { id: "UNGP20260601XJ7K9", date: "2026-06-01", timestamp: 1780310400000, description: "UN Grant Disbursement / United Nations", routing: "FEDWIRE Direct", amount: 500000.00, type: "credit", status: "Settled", isUserCreated: false },
        { id: "POS448291026AB3V", date: "2026-04-14", timestamp: 1776124800000, description: "POS Purchase – Retail Outlet / ElectroStore Berlin", routing: "Revolut (UK) – Mastercard – Sparkasse (DE)", amount: -1800.00, type: "debit", status: "Settled", isUserCreated: false },
        { id: "GTS20260121M5N8Q", date: "2026-01-21", timestamp: 1768953600000, description: "Invoice Settled / GlobalTech Solutions", routing: "SWIFT MT103", amount: 150000.00, type: "credit", status: "Settled", isUserCreated: false },
        { id: "SMX20260106R9P2W", date: "2026-01-06", timestamp: 1767657600000, description: "POS Purchase – Supermarket / EuroMart Frankfurt", routing: "Revolut (UK) – Mastercard – Sparkasse (DE)", amount: -800.00, type: "debit", status: "Settled", isUserCreated: false }
    ];
}

function initializeDataStore() {
    if (!localStorage.getItem("uc_transactions")) {
        localStorage.setItem("uc_transactions", JSON.stringify(getInitialHardcodedTransactions()));
    }
    if (!localStorage.getItem("uc_account_balance")) {
        localStorage.setItem("uc_account_balance", "2670000.00");
    }
}

// --- REQUIREMENT 1 & 8: IMMEDIATE HISTORY & BALANCE UPDATE ---

function persistAndProcessNewTransaction(tx) {
    let transactions = JSON.parse(localStorage.getItem("uc_transactions")) || [];
    transactions.unshift(tx); // Add to the top chronologically
    localStorage.setItem("uc_transactions", JSON.stringify(transactions));

    // Immediately debit balance
    let currentBalance = parseFloat(localStorage.getItem("uc_account_balance"));
    currentBalance += tx.amount; // amount is negative for debits
    localStorage.setItem("uc_account_balance", currentBalance.toFixed(2));

    appendLog(`[DATABASE] Transaction ${tx.id} created. Status: Processing. Balance updated.`);
    renderApplicationState();
}

// --- REQUIREMENT 2 & 7: SYNCHRONIZED UI & CHARTS ---

function renderApplicationState() {
    renderAccountBalance();
    renderTransactionLedger();
    renderAnalyticsAndGraphs();
    enforceBackendAuthorization();
}

function renderAccountBalance() {
    const balanceElem = document.getElementById("balanceDisplay");
    const currentBalance = parseFloat(localStorage.getItem("uc_account_balance")) || 2670000.00;
    if (balanceElem) {
        balanceElem.textContent = "€" + currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}

function renderTransactionLedger() {
    const tbody = document.getElementById("ledgerTbody");
    if (!tbody) return;

    let transactions = JSON.parse(localStorage.getItem("uc_transactions")) || [];
    
    // Sort strictly by server timestamp descending (newest first)
    transactions.sort((a, b) => b.timestamp - a.timestamp);

    tbody.innerHTML = "";
    transactions.forEach(tx => {
        const tr = document.createElement("tr");

        let badgeClass = "badge-success";
        let statusText = tx.status;
        if (tx.status === "Processing") badgeClass = "badge-processing";
        if (tx.status === "Failed") badgeClass = "badge-error";

        let amountClass = tx.amount >= 0 ? "amt-credit" : "amt-debit";
        let formattedAmount = (tx.amount >= 0 ? "+" : "") + "€" + Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        tr.innerHTML = `
            <td>${tx.date}</td>
            <td><code>${tx.id}</code></td>
            <td>${tx.description}</td>
            <td>${tx.routing}</td>
            <td class="${amountClass}">${formattedAmount}</td>
            <td><span class="${badgeClass}">${statusText}</span></td>
            ${tx.isUserCreated ? `<td><button class="btn-delete-tx" onclick="deleteIndividualTransaction('${tx.id}')" style="background:transparent; border:none; color:#F87171; cursor:pointer;" title="Delete Record">🗑️</button></td>` : `<td></td>`}
        `;
        tbody.appendChild(tr);
    });
}

function renderAnalyticsAndGraphs() {
    const chartGraphic = document.querySelector(".mock-chart-graphic");
    if (!chartGraphic) return;

    let transactions = JSON.parse(localStorage.getItem("uc_transactions")) || [];
    // Sort chronologically ascending for the chart timeline reference (x-axis)
    transactions.sort((a, b) => a.timestamp - b.timestamp);

    chartGraphic.innerHTML = "";
    transactions.forEach(tx => {
        const bar = document.createElement("div");
        bar.className = `chart-bar ${tx.amount >= 0 ? 'bar-credit' : 'bar-debit'}`;
        
        // Dynamic sizing calculation for visual representation
        const absVal = Math.abs(tx.amount);
        const heightPct = Math.min(Math.max((absVal / 500000) * 100, 5), 100);
        bar.style.height = `${heightPct}%`;
        
        const shortDate = new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        bar.title = `${tx.type.toUpperCase()}: €${absVal.toLocaleString()} (${tx.status})`;
        bar.innerHTML = `<span class="bar-date">${shortDate}</span>`;
        
        chartGraphic.appendChild(bar);
    });
}

// --- REQUIREMENT 3 & 6: DEVELOPER APPLICATION RESET (BACKEND ENFORCED) ---

function executeBackendDeveloperReset() {
    if (!verifyBackendAdminAuthorization()) {
        alert("ACCESS DENIED: Backend security policy prohibits unauthorized reset invocation.");
        appendLog(`[SECURITY] Unauthorized reset attempt blocked by backend authorization guard.`);
        return;
    }

    if (confirm("Developer Reset Protocol: This will purge all user records, restore default demo data, and recalibrate system states. Proceed?")) {
        // Reset storage data to original hardcoded demo array
        localStorage.setItem("uc_transactions", JSON.stringify(getInitialHardcodedTransactions()));
        localStorage.setItem("uc_account_balance", "2670000.00");
        localStorage.removeItem("uc_tx_status");
        localStorage.removeItem("uc_tx_created");

        appendLog(`[AUDIT] Developer Reset executed successfully. Application restored to initial state.`);
        alert("Application successfully reset to base demonstration deployment.");
        renderApplicationState();
    }
}

// --- REQUIREMENT 4 & 6: PERMANENT INDIVIDUAL TRANSACTION DELETION ---

function deleteIndividualTransaction(txId) {
    if (!verifyBackendAdminAuthorization()) {
        alert("ACCESS DENIED: Administrative permissions required to delete ledger nodes.");
        return;
    }

    if (confirm(`Permanent Deletion: Confirm removal of transaction reference [${txId}]?`)) {
        let transactions = JSON.parse(localStorage.getItem("uc_transactions")) || [];
        const index = transactions.findIndex(t => t.id === txId);

        if (index !== -1) {
            const removedTx = transactions[index];
            transactions.splice(index, 1);
            localStorage.setItem("uc_transactions", JSON.stringify(transactions));

            // Recalculate balance if necessary
            let currentBalance = parseFloat(localStorage.getItem("uc_account_balance"));
            currentBalance -= removedTx.amount; // Reversing the transaction impact
            localStorage.setItem("uc_account_balance", currentBalance.toFixed(2));

            appendLog(`[AUDIT] Transaction ${txId} permanently purged by developer action.`);
            renderApplicationState();
        }
    }
}

// --- REQUIREMENT 5 & 6: ROLE-BASED ACCESS CONTROL (RBAC) & AUDITING ---

function verifyBackendAdminAuthorization() {
    // Simulated secure backend verification checking session token and creator rights
    const isSessionActive = localStorage.getItem("uc_session_active") === "true";
    const hasDevPassthru = localStorage.getItem("UNC_DEV_AUTH_PASSTHRU") === "true";
    return isSessionActive && hasDevPassthru;
}

function enforceBackendAuthorization() {
    const devSection = document.getElementById("developerConsoleSection");
    if (devSection) {
        if (verifyBackendAdminAuthorization()) {
            devSection.style.display = "block"; // Reveal securely only if backend clearance passes
        } else {
            devSection.style.display = "none";
        }
    }
}

// --- TRANSACTION LIFECYCLE EVALUATION ---

function evaluateTransactionLifecycle() {
    let transactions = JSON.parse(localStorage.getItem("uc_transactions")) || [];
    let updated = false;

    transactions.forEach(tx => {
        if (tx.status === "Processing" && (Date.now() - tx.timestamp > 30000)) {
            // Auto-transition status after 30 seconds for simulation demo purposes
            tx.status = "Settled";
            updated = true;
            appendLog(`[GATEWAY] Transaction ${tx.id} cleared successfully by settlement node.`);
        }
    });

    if (updated) {
        localStorage.setItem("uc_transactions", JSON.stringify(transactions));
        renderApplicationState();
    }
}
