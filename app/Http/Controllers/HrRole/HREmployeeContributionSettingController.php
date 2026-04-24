<?php

namespace App\Http\Controllers\HrRole;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\EmployeeContributionSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class HREmployeeContributionSettingController extends Controller
{
    public function getSettingsByVersion(Request $request)
    {
        Gate::authorize('viewAny', EmployeeContributionSetting::class);

        $contributionVersionId = $request->get('contribution_version_id');

        $settings = EmployeeContributionSetting::where('contribution_version_id', $contributionVersionId)
            ->select([
                'employee_id',
                'contribution_version_id',
                'is_exempted',
                'fixed_amount',
                'monthly_cap',
            ])
            ->get();

        return response()->json($settings);
    }

    public function bulkStore(Request $request)
    {
        Gate::authorize('bulkStore', EmployeeContributionSetting::class);

        $validated = $request->validate([
            'contribution_version_id' => 'required|exists:contribution_versions,id',
            'settings' => 'required|array',
            'settings.*.employee_id' => 'required|exists:employees,id',
            'settings.*.is_exempted' => 'boolean',
            'settings.*.fixed_amount' => 'nullable|numeric|min:0',
            'settings.*.monthly_cap' => 'nullable|numeric|min:0',
        ]);

        if (empty($validated['settings'])) {
            return response()->json(['message' => 'No settings to save'], 200);
        }

        DB::beginTransaction();

        try {
            $totalCount = count($validated['settings']);
            $chunkSize = 500;

            foreach (array_chunk($validated['settings'], $chunkSize) as $chunk) {
                $upsertData = [];
                foreach ($chunk as $settingData) {
                    $upsertData[] = [
                        'employee_id' => $settingData['employee_id'],
                        'contribution_version_id' => $validated['contribution_version_id'],
                        'is_exempted' => $settingData['is_exempted'] ?? false,
                        'fixed_amount' => $settingData['fixed_amount'] ?? null,
                        'monthly_cap' => $settingData['monthly_cap'] ?? null,
                    ];
                }

                EmployeeContributionSetting::upsert(
                    $upsertData,
                    ['employee_id', 'contribution_version_id'],
                    ['is_exempted', 'fixed_amount', 'monthly_cap', 'updated_at']
                );

                $upsertData = null;
                unset($upsertData);
            }

            DB::commit();

            return response()->json([
                'message' => 'Settings saved successfully',
                'updated_count' => $totalCount
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Bulk store error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to save settings: ' . $e->getMessage()], 500);
        }
    }
    public function getEmployees()
    {
        Gate::authorize('viewAny', EmployeeContributionSetting::class);

        $employees = Employee::query()
            ->with('user:id,name')
            ->where('employee_status', 'active')
            ->select([
                'id',
                'user_id',
                'employee_status',
            ])
            ->get();

        return response()->json([
            'data' => $employees
        ]);
    }
}
