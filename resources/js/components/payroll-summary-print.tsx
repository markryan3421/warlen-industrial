interface PayrollSummaryPrintProps {
    summaryPayrolls: any[];
    totalGrossPay: number;
    totalDeductions: number;
    totalNetPay: number;
    totalOvertimePay: number;
    totalOvertimeHours: number;
    totalHolidayOvertimePay: number;
    totalIncentives: number;
    totalContributions: number;
    totalOtherDeductions: number;
    totalLateDeduction: number;
    dateRange: string;
    filterText: string[];
    locationFilter: string;
    formatCurrency: (amount: number) => string;
    authorizedByName: string;
}

export const generateSummaryHTML = (props: PayrollSummaryPrintProps) => {
    const {
        summaryPayrolls,
        totalGrossPay,
        totalDeductions,
        totalNetPay,
        totalOvertimePay,
        totalOvertimeHours,
        totalHolidayOvertimePay,
        totalIncentives,
        totalContributions,
        totalOtherDeductions,
        totalLateDeduction,
        dateRange,
        filterText,
        locationFilter,
        formatCurrency,
        authorizedByName
    } = props;

    // Ensure all totals are valid numbers
    const safeTotalGrossPay = Number(totalGrossPay) || 0;
    const safeTotalDeductions = Number(totalDeductions) || 0;
    const safeTotalNetPay = Number(totalNetPay) || 0;
    const safeTotalOvertimePay = Number(totalOvertimePay) || 0;
    const safeTotalOvertimeHours = Number(totalOvertimeHours) || 0;
    const safeTotalHolidayOvertimePay = Number(totalHolidayOvertimePay) || 0;
    const safeTotalIncentives = Number(totalIncentives) || 0;
    const safeTotalContributions = Number(totalContributions) || 0;
    const safeTotalOtherDeductions = Number(totalOtherDeductions) || 0;
    const safeTotalLateDeduction = Number(totalLateDeduction) || 0;

    // Build table rows
    let tableRowsHtml = '';

    if (summaryPayrolls && summaryPayrolls.length > 0) {
        summaryPayrolls.forEach((p: any) => {
            const avatarUrl = p.employee_avatar
                ? (p.employee_avatar.startsWith('/storage/') || p.employee_avatar.startsWith('http')
                    ? p.employee_avatar
                    : `/storage/${p.employee_avatar}`)
                : null;
            const initial = p.employee_name?.charAt(0).toUpperCase() || '?';

            // Earnings Breakdown HTML
            let earningsListHtml = '';
            let totalEarningsAmount = 0;

            if (p.earnings && p.earnings.length > 0) {
                p.earnings.forEach((earning: any) => {
                    const amount = Number(earning.amount) || 0;
                    totalEarningsAmount += amount;
                    let earningDesc = earning.description || 'Earning';
                    if (earningDesc.toLowerCase().includes('incentive')) {
                        earningDesc = earningDesc.replace(/^(INCENTIVE|INCENTIVES)\s*-\s*/i, '').trim();
                    }
                    earningsListHtml += `
                        <div style="display: flex; justify-content: space-between; padding: 2px 0; border-bottom: 1px dotted #e5e7eb;">
                            <span style="font-size: 0.75rem;">${earningDesc}</span>
                            <span style="font-size: 0.75rem;">${formatCurrency(amount)}</span>
                        </div>
                    `;
                });
            } else {
                earningsListHtml = '<div style="display: flex; justify-content: space-between; padding: 2px 0;"><span style="font-size: 0.75rem;">No earnings data</span><span style="font-size: 0.75rem;">₱0.00</span></div>';
            }

            earningsListHtml += `
                <div style="display: flex; justify-content: space-between; padding: 4px 0; margin-top: 4px; border-top: 1px solid #000; font-weight: 800;">
                    <span style="font-size: 0.75rem;">TOTAL</span>
                    <span style="font-size: 0.75rem; color: #059669;">${formatCurrency(totalEarningsAmount)}</span>
                </div>
            `;

            // Deductions Breakdown HTML
            let deductionsListHtml = '';
            let totalDeductionsAmount = 0;

            if (p.deductions && p.deductions.length > 0) {
                p.deductions.forEach((deduction: any) => {
                    const amount = Number(deduction.amount) || 0;
                    totalDeductionsAmount += amount;
                    let deductionDesc = deduction.description || 'Deduction';
                    deductionDesc = deductionDesc.replace(/^(DEDUCTION|DEDUCTIONS)\s*-\s*/i, '').trim();
                    deductionDesc = deductionDesc.replace(/\bLATE\b/i, 'Late');
                    deductionsListHtml += `
                        <div style="display: flex; justify-content: space-between; padding: 2px 0; border-bottom: 1px dotted #e5e7eb;">
                            <span style="font-size: 0.75rem;">${deductionDesc}</span>
                            <span style="font-size: 0.75rem;">${formatCurrency(amount)}</span>
                        </div>
                    `;
                });
            } else {
                deductionsListHtml = '<div style="display: flex; justify-content: space-between; padding: 2px 0;"><span style="font-size: 0.75rem;">No deductions data</span><span style="font-size: 0.75rem;">₱0.00</span></div>';
            }

            deductionsListHtml += `
                <div style="display: flex; justify-content: space-between; padding: 4px 0; margin-top: 4px; border-top: 1px solid #000; font-weight: 800;">
                    <span style="font-size: 0.75rem;">TOTAL</span>
                    <span style="font-size: 0.75rem; color: #dc2626;">${formatCurrency(totalDeductionsAmount)}</span>
                </div>
            `;

            tableRowsHtml += `
                <tr style="border-bottom: 1px solid #ccc;">
                    <td style="padding: 6px 4px; text-align: center; vertical-align: middle;">
                        ${avatarUrl ?
                            `<img src="${avatarUrl}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 1px solid #ddd;" onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);display:inline-flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;color:white;\\'>${initial}</div>'" />` :
                            `<div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);display:inline-flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;color:white;">${initial}</div>`
                        }
                    </td>
                    <td style="padding: 6px 4px; vertical-align: middle;">
                        <div style="font-weight: 600; font-size: 0.75rem; margin-left:13px;">${p.employee_name}</div>
                        <div style="font-size: 0.65rem; color: #6b72800; margin-left:13px;">EMP-${p.emp_code}</div>
                        <div style="font-size: 0.65rem; color: #6b7280; margin-left:13px;">${p.position_name}</div>
                    </td>
                    <td style="padding: 6px 4px; vertical-align: middle; font-size: 0.70rem; text-align:center;">
                        ${p.branch_name}
                    </td>
                    <td style="padding: 6px 4px; vertical-align: middle; text-align:center; font-size: 0.70rem;">
                       ${p.site_name}
                    </td>
                    <td style="padding: 6px 4px; vertical-align: top; width: 22%;">
                        ${earningsListHtml}
                    </td>
                    <td style="padding: 6px 4px; vertical-align: top; width: 22%;">
                        ${deductionsListHtml}
                    </td>
                    <td style="padding: 6px 4px; text-align: center; vertical-align: middle; color: #059669; font-weight: 600; font-size: 0.75rem;">${formatCurrency(p.gross_pay)}</td>
                    <td style="padding: 6px 4px; text-align: center; vertical-align: middle; color: #dc2626; font-weight: 600; font-size: 0.75rem;">${formatCurrency(p.total_deduction)}</td>
                    <td style="padding: 6px 4px; text-align: center; vertical-align: middle; color: #075985; font-weight: 800; font-size: 0.75rem;">${formatCurrency(p.net_pay)}</td>
                </tr>
            `;
        });
    }

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Payroll Summary Report</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    background: white; 
                    padding: 10px; 
                }
                .report-container {
                    max-width: 100%;
                    background: white;
                    padding: 10px;
                    position: relative;
                }
                .company-header {
                    text-align: center;
                    border-bottom: 2px solid #333;
                    margin-bottom: 10px;
                    padding-bottom: 6px;
                }
                .company-name {
                    font-size: 18px;
                    font-weight: 800;
                    text-transform: uppercase;
                    color: #05469D;
                }
                .deka-sales {
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: #FD0C0B;
                }
                .specialty-contractor {
                    font-size: 0.70rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: #555;
                }
                .report-title {
                    font-size: 0.75rem;
                    font-weight: 700;
                    margin-top: 6px;
                }
                .info-section {
                    margin: 10px 0;
                    border: 1px solid #ddd;
                    padding: 6px;
                    background: #f9f9f0;
                    font-size: 0.6rem;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 3px;
                    font-size:13px;
                }
                .summary-cards {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 6px;
                    margin: 10px 0;
                }
                .card {
                    border: 1px solid #ddd;
                    padding: 5px;
                    text-align: center;
                    background: #f0ede0;
                }
                .card-label {
                    font-size: 0.55rem;
                    font-weight: 600;
                }
                .card-value {
                    font-size: 0.75rem;
                    font-weight: 800;
                }
                .card-value.gross { color: #059669; }
                .card-value.deductions { color: #dc2626; }
                .card-value.net { color: #075985; }
                .card-value.overtime { color: #d97706; }
                .summary-cards-secondary {
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 6px;
                    margin: 10px 0;
                }
                .main-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 10px 0;
                    font-size: 0.6rem;
                    border: 1px solid #000;
                }
                .main-table th {
                    background: #f0ede0;
                    border: 1px solid #000;
                    padding: 5px 3px;
                    text-align: center;
                    font-weight: 700;
                    font-size: 0.6rem;
                }
                .main-table td {
                    border: 1px solid #ccc;
                    padding: 4px 3px;
                    vertical-align: top;
                }
                .grand-total-row {
                    background: #faf7ec;
                    font-weight: 800;
                }
                .grand-total-row td {
                    border-top: 2px solid #000;
                    border-bottom: 2px solid #000;
                }
                .footer {
                    margin-top: 10px;
                    font-size: 0.5rem;
                    border-top: 1px dashed #aaa;
                    padding-top: 6px;
                    display: flex;
                    justify-content: space-between;
                }
                @media print {
                    body { padding: 0; margin: 0; }
                    .report-container { 
                        border: 1px solid #000;
                        padding: 0.15cm;
                        margin: 0;
                    }
                    @page { 
                        size: Legal portrait;
                        margin: 0.2cm;
                    }
                }
            </style>
        </head>
        <body>
            <div class="report-container">
                <div class="company-header">
                    <img src="/images/dekalogo.webp" alt="Deka Sales Logo" style="height: 60px; width: 60px; margin-bottom: 3px;" />
                    <div class="company-name">WARLEN INDUSTRIAL SALES CORPORATION</div>
                    <div class="deka-sales">DEKA SALES</div>
                    <div class="specialty-contractor">GENERAL ENGINEERING & SPECIALTY CONTRACTOR</div>
                    <div class="report-title">PAYROLL SUMMARY REPORT</div>
                </div>

                <div class="info-section">
                    <div class="info-row">
                        <span><strong>Date Period:</strong> ${dateRange}</span>
                        <span><strong>Total Employees:</strong> ${summaryPayrolls.length}</span>
                    </div>
                    <div class="info-row">
                        <span><strong>Date Printed:</strong> ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</span>
                        <span><strong>Pay Frequency:</strong> ${summaryPayrolls[0]?.pay_frequency || 'N/A'}</span>
                    </div>
                    ${locationFilter ? `<div class="info-row"><span><strong>Location:</strong> ${locationFilter}</span></div>` : ''}
                    ${filterText.length > 0 ? `
                    <div class="info-row" style="margin-top: 5px; padding-top: 5px; border-top: 1px dotted #ccc;">
                        <span><strong>Applied Filters:</strong> ${filterText.join(' | ')}</span>
                    </div>
                    ` : ''}
                </div>

                <table class="main-table">
                    <thead>
                        <tr>
                            <th style="width: 11%">Profile</th>
                            <th style="width: 12%">Employee</th>
                            <th style="width: 6%">Branch</th>
                            <th style="width: 6%">Site</th>
                            <th style="width: 25%">Earnings</th>
                            <th style="width: 25%">Deductions</th>
                            <th style="width: 5%">Gross Pay</th>
                            <th style="width: 5%">Deductions</th>
                            <th style="width: 5%">Net Pay</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHtml}
                        <tr class="grand-total-row">
                            <td colspan="4" style="text-align: right; font-weight: 800; font-size: 0.7rem;">GRAND TOTAL</td>
                            <td style="text-align: right; font-weight: 800; color: #059669;">${formatCurrency(safeTotalGrossPay)}</td>
                            <td style="text-align: right; font-weight: 800; color: #dc2626;">${formatCurrency(safeTotalDeductions)}</td>
                            <td style="text-align: right; font-weight: 800; color: #059669;">${formatCurrency(safeTotalGrossPay)}</td>
                            <td style="text-align: right; font-weight: 800; color: #dc2626;">${formatCurrency(safeTotalDeductions)}</td>
                            <td style="text-align: right; font-weight: 800; color: #075985;">${formatCurrency(safeTotalNetPay)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <script>
                window.onload = function() {
                    window.print();
                    window.onafterprint = function() {
                        window.close();
                    };
                };
            <\/script>
        </body>
        </html>
    `;
};

export const printPayrollSummary = (htmlContent: string) => {
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.top = '-9999px';
    printFrame.style.left = '-9999px';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document;
    if (doc) {
        doc.open();
        doc.write(htmlContent);
        doc.close();
    }
};