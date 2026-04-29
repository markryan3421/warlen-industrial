<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payroll Summary – {{ $payroll->employee->user->name }}</title>
</head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b;">

@php
    // Categorize earnings and deductions
    $earningsArray = $earnings->toArray();
    $deductionsArray = $deductions->toArray();

    $incentiveKeywords = ['incentive', 'bonus', 'reward', 'extra', 'commission', 'allowance', 'gift', 'prize'];
    $incentives = [];
    $otherEarnings = [];
    foreach ($earningsArray as $item) {
        $desc = strtolower($item['description'] ?? '');
        $isIncentive = false;
        foreach ($incentiveKeywords as $kw) {
            if (str_contains($desc, $kw)) { $isIncentive = true; break; }
        }
        if ($isIncentive) $incentives[] = $item;
        else $otherEarnings[] = $item;
    }

    $contributionKeywords = ['sss', 'philhealth', 'pag-ibig', 'pagibig', 'contribution', 'gsis', 'tax', 'withholding', 'provident', 'health', 'pension'];
    $contributions = [];
    $otherDeductions = [];
    foreach ($deductionsArray as $item) {
        $desc = strtolower($item['description'] ?? '');
        $isContribution = false;
        foreach ($contributionKeywords as $kw) {
            if (str_contains($desc, $kw)) { $isContribution = true; break; }
        }
        if ($isContribution) $contributions[] = $item;
        else $otherDeductions[] = $item;
    }

    // Combine for side‑by‑side table
    $allEarnings = array_merge($otherEarnings, $incentives);
    $allDeductions = array_merge($contributions, $otherDeductions);
    $maxRows = max(count($allEarnings), count($allDeductions));

    $totalEarnings = 0;
    $totalDeductions = 0;
@endphp

<div style="max-width: 800px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">

    {{-- Company Header --}}
    <div style="text-align: center; padding: 20px; border-bottom: 1px solid #e2e8f0;">
        <img src="{{ asset('images/dekalogo.webp') }}" alt="Deka Sales Logo" style="height: 50px; width: auto; margin-bottom: 8px;">
        <div style="font-size: 18px; font-weight: 800; color: #05469D; text-transform: uppercase;">WARLEN INDUSTRIAL SALES CORPORATION</div>
        <div style="font-size: 13px; font-weight: 700; color: #FD0C0B;">DEKA SALES</div>
        <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #555;">GENERAL ENGINEERING &amp; SPECIALTY CONTRACTOR</div>
    </div>

    {{-- Employee Info --}}
    <div style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
        <table style="width: 100%; font-size: 13px;">
            <tr>
                <td style="padding: 4px 0;"><strong>EMPLOYEE NAME:</strong> {{ $payroll->employee->user->name }}</td>
                <td style="padding: 4px 0; text-align: right;"><strong>EMPLOYEE CODE:</strong> EMP-{{ $payroll->employee->emp_code }}</td>
            </tr>
            <tr>
                <td style="padding: 4px 0;"><strong>POSITION:</strong> {{ $payroll->employee->position->pos_name ?? 'N/A' }}</td>
                <td style="padding: 4px 0; text-align: right;"><strong>DATE PERIOD:</strong> {{ \Carbon\Carbon::parse($payroll->payrollPeriod->start_date)->format('F j, Y') }} – {{ \Carbon\Carbon::parse($payroll->payrollPeriod->end_date)->format('F j, Y') }}</td>
            </tr>
        </table>
    </div>

    {{-- Main Earnings/Deductions Table --}}
    <div style="padding: 0 20px;">
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; border: 1px solid #000;">
            <thead>
                <tr>
                    <th style="width: 40%; text-align: left; padding: 8px 4px; border-bottom: 1px solid #000;">EARNINGS</th>
                    <th style="width: 20%; text-align: right; padding: 8px 4px; border-bottom: 1px solid #000; border-right: 1px solid #000;">AMOUNT</th>
                    <th style="width: 40%; text-align: left; padding: 8px 4px; border-bottom: 1px solid #000;">
                        <div style="display: flex; justify-content: space-between;">
                            <span>DEDUCTIONS</span>
                            <span>AMOUNT</span>
                        </div>
                    </th>
                </tr>
            </thead>
            <tbody>
                @for ($i = 0; $i < $maxRows; $i++)
                    @php
                        $earning = $allEarnings[$i] ?? null;
                        $deduction = $allDeductions[$i] ?? null;

                        $earningDesc = '';
                        $earningAmount = 0;
                        if ($earning) {
                            $earningDesc = $earning['description'] ?? '';
                            if (str_contains(strtolower($earningDesc), 'incentive')) {
                                $earningDesc = preg_replace('/^(INCENTIVE|INCENTIVES)\s*-\s*/i', '', $earningDesc);
                            }
                            $earningAmount = (float)($earning['amount'] ?? 0);
                            $totalEarnings += $earningAmount;
                        }

                        $deductionDesc = '';
                        $deductionAmount = 0;
                        if ($deduction) {
                            $deductionDesc = $deduction['description'] ?? '';
                            $deductionDesc = preg_replace('/^(DEDUCTION|DEDUCTIONS)\s*-\s*/i', '', $deductionDesc);
                            $deductionDesc = preg_replace('/\bLATE\b/i', 'Late', $deductionDesc);
                            $deductionAmount = (float)($deduction['amount'] ?? 0);
                            $totalDeductions += $deductionAmount;
                        }
                    @endphp
                    <tr>
                        <td style="padding: 6px 4px;">{{ $earningDesc }}</td>
                        <td style="padding: 6px 4px; text-align: right; border-right: 1px solid #000;">
                            {{ $earningAmount > 0 ? '₱' . number_format($earningAmount, 2) : '' }}
                        </td>
                        <td style="padding: 6px 4px;">
                            @if($deductionDesc)
                                <div style="display: flex; justify-content: space-between; width: 100%;">
                                    <span>{{ $deductionDesc }}</span>
                                    <span>{{ '₱' . number_format($deductionAmount, 2) }}</span>
                                </div>
                            @elseif($deductionAmount > 0)
                                {{ '₱' . number_format($deductionAmount, 2) }}
                            @endif
                        </td>
                    </tr>
                @endfor
                <tr style="border-top: 2px solid #000;">
                    <td style="font-weight: 800; padding: 8px 4px;"><strong>TOTAL</strong></td>
                    <td style="text-align: right; font-weight: 800; padding: 8px 4px; border-right: 1px solid #000;">{{ '₱' . number_format($totalEarnings, 2) }}</td>
                    <td style="text-align: right; font-weight: 800; padding: 8px 4px;">{{ '₱' . number_format($totalDeductions, 2) }}</td>
                </tr>
            </tbody>
        </table>
    </div>

    {{-- Summary --}}
    <div style="padding: 0 20px 16px 20px; border-bottom: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Gross Pay</span>
            <span>{{ '₱' . number_format($totalEarnings, 2) }}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Total Deductions</span>
            <span>{{ '₱' . number_format($totalDeductions, 2) }}</span>
        </div>
        <div style="font-size: 16px; font-weight: 800; color: #075985; border-top: 1px solid #aaa; margin-top: 8px; padding-top: 8px; display: flex; justify-content: space-between;">
            <span>NET PAY</span>
            <span>{{ '₱' . number_format($payroll->net_pay, 2) }} PHP</span>
        </div>
    </div>

    {{-- Printed date and release date --}}
    <div style="padding: 12px 20px; font-size: 10px; display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0;">
        <div>PRINTED DATE: {{ now()->format('F j, Y') }}</div>
        <div>RELEASE DATE: {{ $payroll->payrollPeriod->pay_date ? \Carbon\Carbon::parse($payroll->payrollPeriod->pay_date)->format('M j, Y') : 'N/A' }}</div>
    </div>

    {{-- Authorized signature --}}
    <div style="padding: 16px 20px; font-size: 11px; border-bottom: 1px solid #e2e8f0;">
        <strong>AUTHORIZED SIGNATURE:</strong>
        <span style="border-bottom: 1px solid #000; padding: 0 4px;">{{ $authorizedName ?? 'System Administrator' }}</span>
    </div>

    {{-- Footer note --}}
    <div style="padding: 12px 20px; text-align: center; font-size: 9px; color: #999;">
        * This is a system-generated salary slip. For any discrepancy, please contact the HR Department.
    </div>
</div>
</body>
</html>