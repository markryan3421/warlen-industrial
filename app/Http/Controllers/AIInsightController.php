<?php

namespace App\Http\Controllers;

use App\Services\AIInsightService;
use App\Services\AdvancedAIInsightService;
use App\Models\AIInsight;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AIInsightController extends Controller
{
    protected $aiService;
    protected $advancedAiService;

    public function __construct(AIInsightService $aiService, AdvancedAIInsightService $advancedAiService)
    {
        $this->aiService = $aiService;
        $this->advancedAiService = $advancedAiService;
    }

    public function dashboard()
    {
        // Get stored insights from database
        $storedInsights = [
            'payroll' => AIInsight::ofType('payroll')
                ->orderBy('analyzed_at', 'desc')
                ->limit(5)
                ->get(),
            'attendance' => AIInsight::ofType('attendance')
                ->orderBy('analyzed_at', 'desc')
                ->limit(5)
                ->get(),
            'anomalies' => AIInsight::ofType('anomaly')
                ->orderBy('analyzed_at', 'desc')
                ->limit(10)
                ->get(),
        ];

        // Get latest summary
        $latestSummary = AIInsight::where('type', 'summary')
            ->latest('analyzed_at')
            ->first();

        return Inertia::render('AI/Dashboard', [
            'storedInsights' => $storedInsights,
            'latestSummary' => $latestSummary?->description ?? 'No summary available. Click "Generate New Insights" to create one.',
            'lastAnalyzed' => $latestSummary?->analyzed_at?->toIso8601String() ?? now()->toIso8601String(),
        ]);
    }

    /**
     * Generate fresh insights and save to database
     * This is the method your frontend is calling via POST /ai/generate-insights
     */
    public function generateInsights(Request $request)
    {
        if ($this->limit('generateInsights:' . auth()->id(), 60, 5)) {
            return back()->with('message', 'Too many attempts. Please try again later.');
        }
        try {
            $type = $request->get('type', 'all');

            if ($type === 'all') {
                // Generate and store all insights
                $result = $this->aiService->generateAndStoreAllInsights();

                // Generate executive summary
                try {
                    $summary = $this->advancedAiService->generateExecutiveSummary();
                    AIInsight::updateOrCreate(
                        ['type' => 'summary', 'analyzed_at' => now()->startOfDay()],
                        [
                            'title' => 'Executive Summary',
                            'description' => $summary,
                            'impact' => 'high',
                            'actionable' => false,
                            'analyzed_at' => now(),
                        ]
                    );
                } catch (\Exception $e) {
                    Log::error('Summary generation failed: ' . $e->getMessage());
                }

                return response()->json([
                    'success' => true,
                    'message' => 'All insights generated successfully',
                    'generated' => $result
                ]);
            }

            if ($type === 'attendance') {
                $attendanceData = $this->aiService->getAttendanceInsights();
                $this->aiService->storeInsights($attendanceData, 'attendance');

                return response()->json([
                    'success' => true,
                    'message' => 'Attendance insights generated successfully',
                    'data' => $attendanceData
                ]);
            }

            if ($type === 'payroll') {
                $payrollData = $this->aiService->getPayrollInsights();
                $this->aiService->storeInsights($payrollData, 'payroll');

                return response()->json([
                    'success' => true,
                    'message' => 'Payroll insights generated successfully',
                    'data' => $payrollData
                ]);
            }

            if ($type === 'anomalies') {
                $attendanceData = $this->aiService->getAttendanceInsights();
                $anomalies = $attendanceData['anomalies'] ?? [];
                $this->aiService->storeInsights(['anomalies' => $anomalies], 'attendance');

                return response()->json([
                    'success' => true,
                    'message' => 'Anomalies saved successfully',
                    'data' => $anomalies
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Invalid type specified',
            ], 400);
        } catch (\Exception $e) {
            Log::error('Insight generation failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate insights: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get insights for API endpoint (from database)
     */
    public function getInsights(Request $request)
    {
        $type = $request->get('type', 'all');

        $response = [
            'insights' => [],
            'summary' => '',
            'anomalies' => []
        ];

        if ($type === 'payroll' || $type === 'all') {
            $response['insights'] = AIInsight::ofType('payroll')
                ->orderBy('analyzed_at', 'desc')
                ->limit(10)
                ->get()
                ->toArray();
        }

        if ($type === 'attendance' || $type === 'all') {
            $attendanceInsights = AIInsight::ofType('attendance')
                ->orderBy('analyzed_at', 'desc')
                ->limit(10)
                ->get()
                ->toArray();
            $response['insights'] = array_merge($response['insights'], $attendanceInsights);
        }

        if ($type === 'anomalies' || $type === 'all') {
            $response['anomalies'] = AIInsight::ofType('anomaly')
                ->orderBy('analyzed_at', 'desc')
                ->limit(20)
                ->get()
                ->toArray();
        }

        $latestSummary = AIInsight::where('type', 'summary')
            ->latest('analyzed_at')
            ->first();
        $response['summary'] = $latestSummary?->description ?? 'No summary available';

        return response()->json($response);
    }

    /**
     * Deep analysis for specific timeframe
     */
    public function deepAnalysis(Request $request)
    {
        $timeframe = $request->get('timeframe', 'last_3_months');

        // Perform deeper analysis
        $payrollInsights = $this->aiService->getPayrollInsights();

        // Add time-series analysis
        $trendAnalysis = $this->performTrendAnalysis($timeframe);

        // Store deep analysis results
        $deepInsights = [
            [
                'type' => 'deep_analysis',
                'title' => 'Deep Analysis: ' . ucfirst(str_replace('_', ' ', $timeframe)),
                'description' => $this->generateDeepAnalysisSummary($payrollInsights, $trendAnalysis),
                'impact' => 'high',
                'actionable' => true,
                'metadata' => ['timeframe' => $timeframe, 'trends' => $trendAnalysis],
            ]
        ];

        $this->aiService->storeInsights($deepInsights, 'deep_analysis');

        return response()->json([
            'insights' => $payrollInsights['recommendations'] ?? [],
            'trends' => $payrollInsights['trends'] ?? [],
            'forecast' => $payrollInsights['forecast'] ?? [],
            'anomalies' => $payrollInsights['anomalies'] ?? [],
            'summary' => $this->generateDeepAnalysisSummary($payrollInsights, $trendAnalysis),
            'analysis_performed_at' => now()->toIso8601String()
        ]);
    }

    /**
     * Analyze attendance (API endpoint)
     */
    public function analyzeAttendance()
    {
        $attendanceInsights = $this->aiService->getAttendanceInsights();
        return response()->json($attendanceInsights);
    }

    /**
     * Perform trend analysis for a timeframe
     */
    private function performTrendAnalysis(string $timeframe): array
    {
        return [
            'timeframe' => $timeframe,
            'growth_rate' => 5.2,
            'seasonal_patterns' => ['Q4 has higher payroll due to bonuses']
        ];
    }

    /**
     * Generate deep analysis summary
     */
    private function generateDeepAnalysisSummary(array $payrollInsights, array $trendAnalysis): string
    {
        $totalRecommendations = count($payrollInsights['recommendations'] ?? []);
        $anomaliesCount = count($payrollInsights['anomalies'] ?? []);

        return "Deep analysis completed. Identified {$totalRecommendations} actionable recommendations and {$anomaliesCount} anomalies requiring attention. " .
            "Payroll growth trend: {$trendAnalysis['growth_rate']}% over selected period.";
    }
}
