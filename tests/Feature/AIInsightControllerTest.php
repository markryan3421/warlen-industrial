<?php

use App\Models\AIInsight;
use App\Models\User;
use App\Services\AdvancedAIInsightService;
use App\Services\AIInsightService;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\get;
use function Pest\Laravel\postJson;

beforeEach(function () {
    $this->withoutVite();

    $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $hrHeadRole = Role::firstOrCreate(['name' => 'hr_head', 'guard_name' => 'web']);
    $employeeRole = Role::firstOrCreate(['name' => 'employee', 'guard_name' => 'web']);

    $this->admin = User::factory()->create(['name' => 'Admin User']);
    $this->admin->assignRole($adminRole);

    $this->hrHead = User::factory()->create(['name' => 'HR Head']);
    $this->hrHead->assignRole($hrHeadRole);

    $this->unauthorizedUser = User::factory()->create(['name' => 'Regular User']);
    $this->unauthorizedUser->assignRole($employeeRole);

    // Create sample AI insights
    AIInsight::create([
        'type' => 'payroll',
        'title' => 'Payroll Insight',
        'description' => 'Test payroll insight',
        'impact' => 'medium',
        'actionable' => true,
        'analyzed_at' => now(),
    ]);
    AIInsight::create([
        'type' => 'attendance',
        'title' => 'Attendance Insight',
        'description' => 'Test attendance insight',
        'impact' => 'high',
        'actionable' => false,
        'analyzed_at' => now(),
    ]);
    AIInsight::create([
        'type' => 'summary',
        'title' => 'Executive Summary',
        'description' => 'Test summary',
        'impact' => 'high',
        'actionable' => false,
        'analyzed_at' => now(),
    ]);
    AIInsight::create([
        'type' => 'anomaly',
        'title' => 'Anomaly',
        'description' => 'Test anomaly',
        'impact' => 'critical',
        'actionable' => true,
        'analyzed_at' => now(),
    ]);

    // Mock AI services
    $this->mockAiService = Mockery::mock(AIInsightService::class);
    $this->app->instance(AIInsightService::class, $this->mockAiService);

    $this->mockAdvancedAiService = Mockery::mock(AdvancedAIInsightService::class);
    $this->app->instance(AdvancedAIInsightService::class, $this->mockAdvancedAiService);
});

afterEach(function () {
    Mockery::close();
});

// -----------------------------------------------------------------------------
// Authorization tests – note: route group uses 'admin' middleware,
// so hr_head is NOT allowed (expect 403).
// -----------------------------------------------------------------------------
describe('Authorization', function () {
    it('allows admin to access dashboard', function () {
        actingAs($this->admin);
        get('/ai/dashboard')->assertOk();
    });

    it('denies hr_head access to dashboard (admin middleware)', function () {
        actingAs($this->hrHead);
        get('/ai/dashboard')->assertForbidden();
    });

    it('denies unauthorized user from accessing dashboard', function () {
        actingAs($this->unauthorizedUser);
        get('/ai/dashboard')->assertForbidden();
    });

    it('allows admin to generate insights', function () {
        actingAs($this->admin);
        $this->mockAiService->shouldReceive('generateAndStoreAllInsights')
            ->once()
            ->andReturn(['payroll' => true, 'attendance' => true]);

        postJson('/ai/generate-insights')->assertOk();
    });

    it('denies hr_head from generating insights', function () {
        actingAs($this->hrHead);
        postJson('/ai/generate-insights')->assertForbidden();
    });

    it('denies unauthorized user from generating insights', function () {
        actingAs($this->unauthorizedUser);
        postJson('/ai/generate-insights')->assertForbidden();
    });

    it('allows admin to get insights', function () {
        actingAs($this->admin);
        get('/ai/insights')->assertOk();
    });

    it('denies hr_head from getting insights', function () {
        actingAs($this->hrHead);
        get('/ai/insights')->assertForbidden();
    });

    it('denies unauthorized user from getting insights', function () {
        actingAs($this->unauthorizedUser);
        get('/ai/insights')->assertForbidden();
    });

    it('allows admin to deep analysis', function () {
        actingAs($this->admin);
        $this->mockAiService->shouldReceive('getPayrollInsights')
            ->once()
            ->andReturn([
                'recommendations' => ['Reduce overtime'],
                'trends' => ['Costs rising'],
                'forecast' => ['Next month stable'],
                'anomalies' => ['Payroll spike in March'],
            ]);
        $this->mockAiService->shouldReceive('storeInsights')
            ->once()
            ->with(Mockery::any(), 'deep_analysis');

        postJson('/ai/deep-analysis')->assertOk();
    });

    it('denies hr_head from deep analysis', function () {
        actingAs($this->hrHead);
        postJson('/ai/deep-analysis')->assertForbidden();
    });

    it('denies unauthorized user from deep analysis', function () {
        actingAs($this->unauthorizedUser);
        postJson('/ai/deep-analysis')->assertForbidden();
    });

    it('allows admin to analyze attendance', function () {
        actingAs($this->admin);
        $this->mockAiService->shouldReceive('getAttendanceInsights')
            ->once()
            ->andReturn(['insights' => []]);
        get('/ai/attendance')->assertOk();
    });

    it('denies hr_head from analyze attendance', function () {
        actingAs($this->hrHead);
        get('/ai/attendance')->assertForbidden();
    });

    it('denies unauthorized user from analyze attendance', function () {
        actingAs($this->unauthorizedUser);
        get('/ai/attendance')->assertForbidden();
    });
});

// -----------------------------------------------------------------------------
// Dashboard page (Inertia)
// -----------------------------------------------------------------------------
describe('Dashboard Page', function () {
    beforeEach(function () {
        actingAs($this->admin);
    });

    it('renders dashboard with stored insights and summary', function () {
        get('/ai/dashboard')
            ->assertInertia(fn (Assert $page) => $page
                ->component('AI/Dashboard')
                ->has('storedInsights')
                ->has('latestSummary')
                ->has('lastAnalyzed')
            );
    });

    it('shows default message when no summary exists', function () {
        AIInsight::where('type', 'summary')->delete();
        get('/ai/dashboard')
            ->assertInertia(fn (Assert $page) => $page
                ->where('latestSummary', 'No summary available. Click "Generate New Insights" to create one.')
            );
    });
});

// -----------------------------------------------------------------------------
// Generate Insights API
// -----------------------------------------------------------------------------
describe('Generate Insights', function () {
    beforeEach(function () {
        actingAs($this->admin);
    });

    it('generates all insights when type=all', function () {
        $this->mockAiService->shouldReceive('generateAndStoreAllInsights')
            ->once()
            ->andReturn(['payroll' => true, 'attendance' => true]);

        $this->mockAdvancedAiService->shouldReceive('generateExecutiveSummary')
            ->once()
            ->andReturn('Test executive summary');

        $response = postJson('/ai/generate-insights', ['type' => 'all']);

        $response->assertOk()
            ->assertJson(['success' => true, 'message' => 'All insights generated successfully']);

        assertDatabaseHas('ai_insights', [
            'type' => 'summary',
            'description' => 'Test executive summary',
        ]);
    });

    it('generates attendance insights only', function () {
        $attendanceData = [
            'insights' => ['Late arrivals increased'],
            'recommendations' => ['Implement reminders'],
        ];
        $this->mockAiService->shouldReceive('getAttendanceInsights')
            ->once()
            ->andReturn($attendanceData);
        $this->mockAiService->shouldReceive('storeInsights')
            ->once()
            ->with($attendanceData, 'attendance');

        $response = postJson('/ai/generate-insights', ['type' => 'attendance']);

        $response->assertOk()
            ->assertJson(['success' => true, 'message' => 'Attendance insights generated successfully']);
    });

    it('generates payroll insights only', function () {
        $payrollData = [
            'insights' => ['Overtime costs high'],
            'recommendations' => ['Optimize shifts'],
        ];
        $this->mockAiService->shouldReceive('getPayrollInsights')
            ->once()
            ->andReturn($payrollData);
        $this->mockAiService->shouldReceive('storeInsights')
            ->once()
            ->with($payrollData, 'payroll');

        $response = postJson('/ai/generate-insights', ['type' => 'payroll']);

        $response->assertOk()
            ->assertJson(['success' => true, 'message' => 'Payroll insights generated successfully']);
    });

    it('handles anomalies type', function () {
        $attendanceData = [
            'anomalies' => ['Unusual absence pattern'],
        ];
        $this->mockAiService->shouldReceive('getAttendanceInsights')
            ->once()
            ->andReturn($attendanceData);
        $this->mockAiService->shouldReceive('storeInsights')
            ->once()
            ->with(['anomalies' => $attendanceData['anomalies']], 'attendance');

        $response = postJson('/ai/generate-insights', ['type' => 'anomalies']);

        $response->assertOk()
            ->assertJson(['success' => true, 'message' => 'Anomalies saved successfully']);
    });

    it('returns error for invalid type', function () {
        $response = postJson('/ai/generate-insights', ['type' => 'invalid']);
        $response->assertStatus(400)
            ->assertJson(['success' => false, 'message' => 'Invalid type specified']);
    });

    it('handles exception during generation', function () {
        $this->mockAiService->shouldReceive('generateAndStoreAllInsights')
            ->once()
            ->andThrow(new \Exception('Something went wrong'));

        $response = postJson('/ai/generate-insights', ['type' => 'all']);
        $response->assertStatus(500);
    });

    it('respects rate limiting (max 5 attempts per minute)', function () {
        // Only the first 5 requests should reach the service; the 6th hits rate limit.
        for ($i = 0; $i < 5; $i++) {
            $this->mockAiService->shouldReceive('generateAndStoreAllInsights')
                ->once()
                ->andReturn(['payroll' => true, 'attendance' => true]);
        }
        // No expectation for the 6th call (it will return 429 without calling service).

        for ($i = 0; $i < 6; $i++) {
            $response = postJson('/ai/generate-insights', ['type' => 'all']);
            if ($i >= 5) {
                $response->assertStatus(429)
                    ->assertJson(['rate_limited' => true, 'message' => 'Too many attempts. Please try again later.']);
            } else {
                $response->assertOk();
            }
        }
    });
});

// -----------------------------------------------------------------------------
// Get Insights API
// -----------------------------------------------------------------------------
describe('Get Insights API', function () {
    beforeEach(function () {
        actingAs($this->admin);
    });

    it('returns all insights when type=all', function () {
        $response = get('/ai/insights');
        $response->assertOk();
        $data = $response->json();

        expect($data)->toHaveKey('insights');
        expect($data)->toHaveKey('summary');
        expect($data)->toHaveKey('anomalies');
    });

    it('filters by payroll type', function () {
        $response = get('/ai/insights?type=payroll');
        $response->assertOk();
        $data = $response->json();

        foreach ($data['insights'] as $insight) {
            expect($insight['type'])->toBe('payroll');
        }
    });

    it('filters by attendance type', function () {
        $response = get('/ai/insights?type=attendance');
        $response->assertOk();
        $data = $response->json();

        foreach ($data['insights'] as $insight) {
            expect($insight['type'])->toBe('attendance');
        }
    });

    it('filters by anomalies type', function () {
        $response = get('/ai/insights?type=anomalies');
        $response->assertOk();
        $data = $response->json();

        expect($data)->toHaveKey('anomalies');
        foreach ($data['anomalies'] as $anomaly) {
            expect($anomaly['type'])->toBe('anomaly');
        }
    });
});

// -----------------------------------------------------------------------------
// Deep Analysis (POST)
// -----------------------------------------------------------------------------
describe('Deep Analysis', function () {
    beforeEach(function () {
        actingAs($this->admin);
        $this->mockAiService->shouldReceive('getPayrollInsights')
            ->andReturn([
                'recommendations' => ['Reduce overtime'],
                'trends' => ['Costs rising'],
                'forecast' => ['Next month stable'],
                'anomalies' => ['Payroll spike in March'],
            ]);
        $this->mockAiService->shouldReceive('storeInsights')
            ->once()
            ->with(Mockery::any(), 'deep_analysis');
    });

    it('performs deep analysis with default timeframe', function () {
        $response = postJson('/ai/deep-analysis');
        $response->assertOk();
        $data = $response->json();

        expect($data)->toHaveKeys(['insights', 'trends', 'forecast', 'anomalies', 'summary', 'analysis_performed_at']);
        expect($data['summary'])->toContain('actionable recommendations');
    });

    it('accepts custom timeframe parameter', function () {
        $response = postJson('/ai/deep-analysis', ['timeframe' => 'last_6_months']);
        $response->assertOk();
        // The summary returned by the controller always starts with "Deep analysis completed"
        expect($response->json('summary'))->toContain('Deep analysis');
    });
});

// -----------------------------------------------------------------------------
// Analyze Attendance (GET /ai/attendance)
// -----------------------------------------------------------------------------
describe('Analyze Attendance', function () {
    beforeEach(function () {
        actingAs($this->admin);
        $this->mockAiService->shouldReceive('getAttendanceInsights')
            ->andReturn(['insights' => ['High absenteeism']]);
    });

    it('returns attendance insights as JSON', function () {
        $response = get('/ai/attendance');
        $response->assertOk();
        expect($response->json())->toHaveKey('insights');
    });
});