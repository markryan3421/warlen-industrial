<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeContributionSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EmployeeContributionSettingsController extends Controller
{
    public function getSettingsByVersion(Request $request)
    {
        $contributionVersionId = $request->get('contribution_version_id');

        $settings = EmployeeContributionSetting::where('contribution_version_id', $contributionVersionId)
            ->get();

        return response()->json($settings);
    }

    public function bulkStore(Request $request)
    {
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
            // Prepare data for upsert
            $upsertData = [];
            foreach ($validated['settings'] as $settingData) {
                $upsertData[] = [
                    'employee_id' => $settingData['employee_id'],
                    'contribution_version_id' => $validated['contribution_version_id'],
                    'is_exempted' => $settingData['is_exempted'] ?? false,
                    'fixed_amount' => $settingData['fixed_amount'] ?? null,
                    'monthly_cap' => $settingData['monthly_cap'] ?? null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            // Use upsert for better performance (update or insert in single query)
            EmployeeContributionSetting::upsert(
                $upsertData,
                ['employee_id', 'contribution_version_id'], // Unique constraint columns
                ['is_exempted', 'fixed_amount', 'monthly_cap', 'updated_at'] // Columns to update
            );

            DB::commit();

            return response()->json([
                'message' => 'Settings saved successfully',
                'updated_count' => count($upsertData)
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Bulk store error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to save settings: ' . $e->getMessage()], 500);
        }
    }

    public function getEmployees()
    {
        $employees = Employee::query()
            ->with('user:id,name')
            ->where('employee_status', 'active')->get();

        return response()->json([
            'data' => $employees
        ]);
    }
}