<?php

namespace App\Repository;

use App\Models\Branch;
use Illuminate\Database\Eloquent\Collection;

class BranchRepository
{
	/**
	 * Create a new class instance.
	 */
	public function __construct()
	{
		//
	}

	public function getBranches(): Collection
	{
		return Branch::query()
			->with([
				'sites' => fn($query) => $query->getSiteName()
			])
			->get([
				'id',
				'branch_name',
				'branch_address',
				'branch_slug'
			]);
	}

	public function getBranchesWithSitesAndEmployees()
	{
		return Branch::with([
			'sites' => function ($query) {
				$query->with([
					'employees' => function ($empQuery) {
						$empQuery
							->select('id', 'employee_number', 'user_id', 'site_id', 'avatar')
							->with('user:id,name,email');
					}
				]);
			}
		])->get();
	}
}
