<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Payroll Summary</title>
    <style>
        body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #1e293b; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1d4791; color: white; padding: 20px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; }
        .filters { background: #f8fafc; padding: 16px; border-radius: 10px; margin-bottom: 24px; border-left: 4px solid #1d4791; }
        .filters h4 { margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1d4791; }
        .filters ul { margin: 0; padding-left: 20px; font-size: 13px; color: #334155; }
        .summary-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .summary-table th, .summary-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        .summary-table th { background: #f1f5f9; font-weight: 600; color: #0f172a; }
        .summary-table td { color: #334155; }
        .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
        .amount { font-weight: 600; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>📊 Payroll Summary Report</h2>
        </div>
        <div class="content">
            @if(count(array_filter($filters)) > 0)
            <div class="filters">
                <h4>Applied Filters</h4>
                <ul>
                    @foreach($filters as $key => $value)
                        @if($value)
                            <li><strong>{{ ucfirst(str_replace('_', ' ', $key)) }}:</strong> {{ $value }}</li>
                        @endif
                    @endforeach
                </ul>
            </div>
            @endif

            <table class="summary-table">
                <thead>
                    <tr><th>Metric</th><th>Value</th></tr>
                </thead>
                <tbody>
                    <tr><td>Total Gross Pay</td><td class="amount">₱{{ number_format($totals['totalGrossPay'], 2) }}</td></tr>
                    <tr><td>Total Deductions</td><td class="amount">₱{{ number_format($totals['totalDeductions'], 2) }}</td></tr>
                    <tr><td>Total Net Pay</td><td class="amount">₱{{ number_format($totals['totalNetPay'], 2) }}</td></tr>
                    <tr><td>Total Overtime Pay</td><td class="amount">₱{{ number_format($totals['totalOvertimePay'], 2) }}</td></tr>
                    <tr><td>Total Overtime Hours</td><td class="amount">{{ number_format($totals['totalOvertimeHours'], 2) }} hrs</td></tr>
                    <tr><td>Active Employees (filtered)</td><td>{{ number_format($totals['activeEmployee']) }}</td></tr>
                    <tr><td>Total Payroll Records (filtered)</td><td>{{ number_format($totals['filteredCount']) }}</td></tr>
                </tbody>
            </table>

            <p style="font-size: 12px; color: #475569; margin-top: 16px;">
                This summary includes all payroll records that match your current filters.<br>
                Generated on {{ now()->format('F j, Y \a\t g:i A') }}
            </p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} Payroll System. All rights reserved.
        </div>
    </div>
</body>
</html>